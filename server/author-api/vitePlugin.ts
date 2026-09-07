import { createHash, randomUUID, timingSafeEqual } from 'node:crypto'
import type { IncomingMessage, ServerResponse } from 'node:http'
import type { Plugin } from 'vite'
import type { QuestionDraft, SimulationSpec } from '../../src/content/types.ts'
import { validateSimulationSpec } from '../../src/simulation/simulationValidator.ts'
import { AiUpstreamError, generateQuestionBatch, generateSimulation } from './openaiClient.ts'
import { QuestionGenerateRequestSchema, SimulationGenerateRequestSchema } from './schemas.ts'

type AuthorApiConfig = {
  apiKey?: string
  model?: string
  authorToken?: string
}

const bodyLimitBytes = 32 * 1024
const rateWindowMs = 10 * 60 * 1_000
const maxRequestsPerWindow = 5
const rateBuckets = new Map<string, number[]>()
let inFlight = false

function writeJson(response: ServerResponse, status: number, body: unknown, headers: Record<string, string> = {}) {
  response.statusCode = status
  response.setHeader('Content-Type', 'application/json; charset=utf-8')
  response.setHeader('Cache-Control', 'no-store')
  Object.entries(headers).forEach(([name, value]) => response.setHeader(name, value))
  response.end(JSON.stringify(body))
}

function isLoopback(address: string | undefined) {
  return address === '::1' || address === '127.0.0.1' || address?.startsWith('127.') || address?.startsWith('::ffff:127.')
}

function tokenMatches(actual: string | undefined, expected: string) {
  if (!actual) return false
  const actualBuffer = Buffer.from(actual)
  const expectedBuffer = Buffer.from(expected)
  return actualBuffer.length === expectedBuffer.length && timingSafeEqual(actualBuffer, expectedBuffer)
}

function hasSameOrigin(request: IncomingMessage) {
  const origin = request.headers.origin
  const host = request.headers.host
  if (!origin || !host) return false

  try {
    const parsed = new URL(origin)
    return parsed.protocol === 'http:' && parsed.host === host
  } catch {
    return false
  }
}

function rateLimitKey(request: IncomingMessage, token: string) {
  const tokenHash = createHash('sha256').update(token).digest('hex').slice(0, 16)
  return `${request.socket.remoteAddress ?? 'unknown'}:${tokenHash}`
}

function consumeRateLimit(key: string) {
  const now = Date.now()
  const active = (rateBuckets.get(key) ?? []).filter(timestamp => now - timestamp < rateWindowMs)
  if (active.length >= maxRequestsPerWindow) {
    const retryAfterSeconds = Math.max(1, Math.ceil((rateWindowMs - (now - active[0])) / 1_000))
    rateBuckets.set(key, active)
    return retryAfterSeconds
  }
  active.push(now)
  rateBuckets.set(key, active)
  return 0
}

async function readJsonBody(request: IncomingMessage) {
  const chunks: Buffer[] = []
  let total = 0

  for await (const rawChunk of request) {
    const chunk = Buffer.isBuffer(rawChunk) ? rawChunk : Buffer.from(rawChunk)
    total += chunk.length
    if (total > bodyLimitBytes) throw new Error('body_too_large')
    chunks.push(chunk)
  }

  try {
    return JSON.parse(Buffer.concat(chunks).toString('utf8')) as unknown
  } catch {
    throw new Error('invalid_json')
  }
}

function stableHash(value: unknown) {
  return createHash('sha256').update(JSON.stringify(value), 'utf8').digest('hex')
}

const unsafeGeneratedText = /(?:<\s*\/?\s*(?:script|iframe|object|embed|style|img|svg|link|meta|form|input|button|a)\b|javascript\s*:|\bon(?:error|load|click|focus|mouseover)\s*=)/iu

function assertSafeGeneratedText(value: unknown) {
  if (typeof value === 'string' && unsafeGeneratedText.test(value)) {
    throw new AiUpstreamError('The AI response contained unsupported markup.', 'invalid_output')
  }
  if (Array.isArray(value)) {
    value.forEach(assertSafeGeneratedText)
    return
  }
  if (value && typeof value === 'object') {
    Object.values(value).forEach(assertSafeGeneratedText)
  }
}

function normalizeQuestionTitle(value: string) {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/gu, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/gu, ' ')
    .trim()
}

function createQuestionDrafts(
  parsedInput: ReturnType<typeof QuestionGenerateRequestSchema.parse>,
  generated: Awaited<ReturnType<typeof generateQuestionBatch>>,
  model: string,
): QuestionDraft[] {
  const generatedAt = new Date().toISOString()
  const inputHash = stableHash(parsedInput)
  assertSafeGeneratedText(generated.output)

  if (generated.output.drafts.length !== parsedInput.count) {
    throw new AiUpstreamError('The AI response returned a different number of drafts than requested.', 'invalid_output')
  }

  const existingTitles = new Set(parsedInput.avoidTitles.map(normalizeQuestionTitle))
  const generatedTitles = new Set<string>()
  for (const draft of generated.output.drafts) {
    const title = normalizeQuestionTitle(draft.question)
    if (!title || existingTitles.has(title) || generatedTitles.has(title)) {
      throw new AiUpstreamError('The AI response contained a duplicate question.', 'invalid_output')
    }
    generatedTitles.add(title)
    if (!parsedInput.sourceNotes && /gamestream/iu.test(draft.appliedExample.label)) {
      throw new AiUpstreamError('The AI response attributed an example to GameStream without source notes.', 'invalid_output')
    }
  }

  return generated.output.drafts.map(content => ({
    schemaVersion: 1,
    id: `draft-${randomUUID()}`,
    locale: parsedInput.locale,
    topicSlug: parsedInput.topicSlug,
    level: parsedInput.level,
    content,
    sourceNotes: parsedInput.sourceNotes,
    lifecycle: 'draft',
    reviewStatus: 'generated-needs-review',
    provenance: {
      kind: 'ai-generated',
      createdAt: generatedAt,
      model,
      promptVersion: 'question-v1',
      responseId: generated.responseId,
      inputHash,
    },
  }))
}

function createSimulationSpec(
  parsedInput: ReturnType<typeof SimulationGenerateRequestSchema.parse>,
  generated: Awaited<ReturnType<typeof generateSimulation>>,
  model: string,
): SimulationSpec {
  const generatedAt = new Date().toISOString()
  const sourceContentHash = stableHash(parsedInput.draft.content)

  const simulation: SimulationSpec = {
    schemaVersion: 1,
    id: `simulation-${randomUUID()}`,
    sourceQuestionId: parsedInput.draft.id,
    sourceContentHash,
    locale: parsedInput.draft.locale,
    kind: parsedInput.kind,
    ...generated.output,
    status: 'generated-needs-review',
    generation: {
      model,
      promptVersion: 'simulation-v1',
      generatedAt,
      responseId: generated.responseId,
      inputHash: stableHash(parsedInput),
    },
  }

  const validation = validateSimulationSpec(simulation)
  if (!validation.success) {
    throw new AiUpstreamError('The AI response did not describe a valid deterministic simulation.', 'invalid_output')
  }
  if (
    parsedInput.failureScenario.trim()
    && !validation.data.scenarios.some(scenario => scenario.kind === 'failure' || scenario.kind === 'what-if')
  ) {
    throw new AiUpstreamError('The AI response omitted the requested failure scenario.', 'invalid_output')
  }
  return validation.data
}

async function handleAuthorRequest(request: IncomingMessage, response: ServerResponse, config: AuthorApiConfig) {
  const pathname = new URL(request.url ?? '/', 'http://127.0.0.1').pathname
  const isQuestionRoute = pathname === '/api/author/questions/generate'
  const isSimulationRoute = pathname === '/api/author/simulations/generate'
  if (!isQuestionRoute && !isSimulationRoute) return false

  if (!config.apiKey || !config.model || !config.authorToken) {
    writeJson(response, 503, { error: 'ai_not_configured', message: 'Local AI authoring is not configured.' })
    return true
  }
  if (!isLoopback(request.socket.remoteAddress)) {
    writeJson(response, 403, { error: 'local_author_only', message: 'This endpoint is restricted to the local author environment.' })
    return true
  }
  if (request.method !== 'POST') {
    writeJson(response, 405, { error: 'method_not_allowed' }, { Allow: 'POST' })
    return true
  }
  if (!request.headers['content-type']?.toLowerCase().startsWith('application/json')) {
    writeJson(response, 415, { error: 'json_required' })
    return true
  }
  if (!hasSameOrigin(request)) {
    writeJson(response, 403, { error: 'origin_rejected' })
    return true
  }
  const suppliedToken = request.headers['x-techflow-author-token']
  const token = Array.isArray(suppliedToken) ? suppliedToken[0] : suppliedToken
  if (!token || !tokenMatches(token, config.authorToken)) {
    writeJson(response, 401, { error: 'author_token_rejected' })
    return true
  }

  const retryAfter = consumeRateLimit(rateLimitKey(request, token))
  if (retryAfter) {
    writeJson(response, 429, { error: 'author_rate_limited' }, { 'Retry-After': String(retryAfter) })
    return true
  }
  if (inFlight) {
    writeJson(response, 429, { error: 'author_generation_busy' }, { 'Retry-After': '3' })
    return true
  }

  let rawBody: unknown
  try {
    rawBody = await readJsonBody(request)
  } catch (error) {
    const tooLarge = error instanceof Error && error.message === 'body_too_large'
    writeJson(response, tooLarge ? 413 : 400, { error: tooLarge ? 'body_too_large' : 'invalid_json' })
    return true
  }

  inFlight = true
  const requestId = randomUUID()
  const startedAt = Date.now()
  try {
    if (isQuestionRoute) {
      const parsed = QuestionGenerateRequestSchema.safeParse(rawBody)
      if (!parsed.success) {
        writeJson(response, 400, { error: 'invalid_request', issues: parsed.error.issues.map(issue => ({ path: issue.path, message: issue.message })) })
        return true
      }
      const generated = await generateQuestionBatch({ apiKey: config.apiKey, model: config.model }, parsed.data)
      writeJson(response, 200, { drafts: createQuestionDrafts(parsed.data, generated, config.model), requestId })
      return true
    }

    const parsed = SimulationGenerateRequestSchema.safeParse(rawBody)
    if (!parsed.success) {
      writeJson(response, 400, { error: 'invalid_request', issues: parsed.error.issues.map(issue => ({ path: issue.path, message: issue.message })) })
      return true
    }
    const generated = await generateSimulation({ apiKey: config.apiKey, model: config.model }, parsed.data)
    writeJson(response, 200, { simulation: createSimulationSpec(parsed.data, generated, config.model), requestId })
    return true
  } catch (error) {
    if (error instanceof AiUpstreamError) {
      const status = error.code === 'timeout' ? 504 : error.code === 'rate_limited' ? 503 : 502
      const headers: Record<string, string> = error.retryAfterSeconds
        ? { 'Retry-After': String(error.retryAfterSeconds) }
        : {}
      writeJson(response, status, { error: error.code, message: error.message, requestId }, headers)
      return true
    }
    writeJson(response, 500, { error: 'author_api_error', message: 'The local author API failed.', requestId })
    return true
  } finally {
    inFlight = false
    const elapsedMs = Date.now() - startedAt
    console.info(`[techflow-author-api] request=${requestId} route=${pathname} elapsedMs=${elapsedMs}`)
  }
}

export function createAuthorApiPlugin(config: AuthorApiConfig): Plugin {
  return {
    name: 'techflow-local-author-api',
    apply: 'serve',
    configureServer(server) {
      server.middlewares.use(async (request, response, next) => {
        const handled = await handleAuthorRequest(request, response, config)
        if (!handled) next()
      })
    },
  }
}
