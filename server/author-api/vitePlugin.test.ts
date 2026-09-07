import { randomUUID } from 'node:crypto'
import { createServer as createHttpServer, type Server as HttpServer } from 'node:http'
import type { AddressInfo } from 'node:net'
import { afterAll, afterEach, beforeAll, describe, expect, it, vi } from 'vitest'
import { createServer as createViteServer } from 'vite'
import { lessonClaimSourceHash, type LessonClaimSource } from '../../src/content/lessonValidation.ts'
import type { LessonSimulationSpec, QuestionSimulationSpec } from '../../src/content/types.ts'
import { generateLessonSimulation, generateQuestionBatch, generateSimulation } from './openaiClient.ts'
import { createAuthorApiPlugin } from './vitePlugin.ts'

vi.mock('./openaiClient.ts', async importOriginal => {
  const actual = await importOriginal<typeof import('./openaiClient.ts')>()
  const unexpectedProviderCall = () => Promise.reject(new Error('The provider must not be called by route rejection tests.'))

  return {
    ...actual,
    generateQuestionBatch: vi.fn(unexpectedProviderCall),
    generateSimulation: vi.fn(unexpectedProviderCall),
    generateLessonSimulation: vi.fn(unexpectedProviderCall),
  }
})

const apiKey = 'sk-test-route-secret-never-expose'
const authorToken = `test-author-token-never-expose-${randomUUID()}`
const questionRoute = '/api/author/questions/generate'
const simulationRoute = '/api/author/simulations/generate'
const lessonSimulationRoute = '/api/author/lesson-simulations/generate'

type RunningServer = {
  origin: string
  close: () => Promise<void>
}

const lessonSource: LessonClaimSource = {
  schemaVersion: 1,
  slug: 'queued-job-lifecycle',
  title: 'How does a queued job move through the system?',
  shortAnswer: 'The API accepts work before a worker completes it.',
  category: 'Backend',
  difficulty: 'Trung cấp',
  duration: 12,
  tags: ['Queue'],
  workflow: [],
  followUps: ['What happens when a worker fails?'],
  search: { aliases: ['job queue'], concepts: ['delivery'], relatedSlugs: [] },
  locale: 'en',
  content: {
    scope: 'A durable at-least-once job queue.',
    mentalModel: 'Acceptance and completion are different states.',
    conceptualExplanation: 'The API persists a job before a worker claims and processes it.',
    actors: [
      { id: 'api', label: 'API', responsibility: 'Accepts the command.' },
      { id: 'worker', label: 'Worker', responsibility: 'Processes the persisted job.' },
    ],
    mechanism: [
      { id: 'accept', actorId: 'api', title: 'Accept', detail: 'Validate and persist the job.' },
      { id: 'process', actorId: 'worker', title: 'Process', detail: 'Claim and complete the job.' },
    ],
    productionTradeOffs: [{
      title: 'Asynchronous completion',
      benefit: 'The API responds without waiting for slow work.',
      cost: 'Callers must observe a separate completion state.',
      decisionRule: 'Use a queue when work can complete later.',
    }],
    misconceptions: [{
      claim: 'Accepted means completed.',
      correction: 'Accepted only means the system owns the pending work.',
    }],
    appliedExample: {
      label: 'Email job',
      summary: 'An API queues an email for a worker.',
      steps: ['Persist the job.', 'Let the worker send the email.'],
    },
    evidence: [{ label: 'Queue guide', url: 'https://example.com/queue' }],
  },
}

const generatedQuestionSimulation = {
  learningObjective: 'Observe how accepted work moves through a durable queue before completion.',
  misconception: 'A queued job has not necessarily completed its work yet.',
  takeaway: 'Track accepted and completed states independently in production.',
  actors: [
    { id: 'api', label: 'API', role: 'Accepts commands', iconToken: 'server' as const },
    { id: 'worker', label: 'Worker', role: 'Processes jobs', iconToken: 'service' as const },
  ],
  scenarios: [{
    id: 'happy-path',
    label: 'Happy path',
    kind: 'happy-path' as const,
    initialState: [{ key: 'status', value: 'idle' }],
    transitions: [
      { id: 'accept', actorId: 'api', event: 'Accept', explanation: 'The API accepts the command after validation.', state: [{ key: 'status', value: 'accepted' }], highlights: ['api'] },
      { id: 'enqueue', actorId: 'api', event: 'Enqueue', explanation: 'The API persists the job for delivery.', state: [{ key: 'status', value: 'queued' }], highlights: ['api'] },
      { id: 'process', actorId: 'worker', event: 'Process', explanation: 'The worker completes the background job.', state: [{ key: 'status', value: 'processed' }], highlights: ['worker'] },
    ],
    terminalState: 'success' as const,
    terminalSummary: 'The job completed successfully.',
  }],
  invariants: [{ id: 'processed', label: 'Job reaches processed', stateKey: 'status', operator: 'eq' as const, expected: 'processed' }],
}

function questionSimulationRequest() {
  return {
    draft: {
      id: 'draft-safe-test',
      locale: 'en',
      topicSlug: 'backend',
      level: 'middle',
      content: {
        question: 'How does a queued job move through the system?',
        quickAnswer: 'The API accepts work before a worker completes it.',
        conceptualExplanation: 'The API persists the job for a worker to process asynchronously.',
        productionTradeOff: 'The caller must observe completion separately from acceptance.',
        appliedExample: { label: 'Illustrative example', detail: 'An API queues an email delivery job.' },
      },
      sourceNotes: '',
    },
    kind: 'sequence',
    failureScenario: '',
  }
}

async function closeHttpServer(server: HttpServer) {
  await new Promise<void>((resolve, reject) => {
    server.close(error => error ? reject(error) : resolve())
  })
}

async function startAuthorServer(config: Parameters<typeof createAuthorApiPlugin>[0]): Promise<RunningServer> {
  const vite = await createViteServer({
    appType: 'custom',
    configFile: false,
    logLevel: 'silent',
    plugins: [createAuthorApiPlugin(config)],
    server: { middlewareMode: true },
  })
  const http = createHttpServer(vite.middlewares)

  try {
    await new Promise<void>((resolve, reject) => {
      const onError = (error: Error) => reject(error)
      http.once('error', onError)
      http.listen(0, '127.0.0.1', () => {
        http.off('error', onError)
        resolve()
      })
    })
  } catch (error) {
    await vite.close()
    throw error
  }

  const address = http.address() as AddressInfo
  return {
    origin: `http://127.0.0.1:${address.port}`,
    close: async () => {
      try {
        await closeHttpServer(http)
      } finally {
        await vite.close()
      }
    },
  }
}

async function expectSafeError(response: Response, status: number, errorCode: string) {
  const responseText = await response.text()
  const responseHeaders = JSON.stringify([...response.headers.entries()])

  expect(response.status).toBe(status)
  expect(response.headers.get('content-type')).toContain('application/json')
  expect(response.headers.get('cache-control')).toBe('no-store')
  expect(`${responseHeaders}\n${responseText}`).not.toContain(apiKey)
  expect(`${responseHeaders}\n${responseText}`).not.toContain(authorToken)
  const body = JSON.parse(responseText) as Record<string, unknown>
  expect(body).toMatchObject({ error: errorCode })
  return body
}

describe('local Author API Vite middleware', { concurrent: false }, () => {
  let configuredServer: RunningServer
  let incompleteConfigServer: RunningServer

  beforeAll(async () => {
    configuredServer = await startAuthorServer({ apiKey, model: 'test-model', authorToken })
    try {
      incompleteConfigServer = await startAuthorServer({ apiKey, authorToken })
    } catch (error) {
      await configuredServer.close()
      throw error
    }
  })

  afterEach(() => {
    expect(generateQuestionBatch).not.toHaveBeenCalled()
    expect(generateSimulation).not.toHaveBeenCalled()
    expect(generateLessonSimulation).not.toHaveBeenCalled()
    vi.clearAllMocks()
  })

  afterAll(async () => {
    await Promise.all([
      configuredServer.close(),
      incompleteConfigServer.close(),
    ])
  })

  it.each([questionRoute, simulationRoute, lessonSimulationRoute])('returns 503 for incomplete server configuration on %s', async route => {
    const response = await fetch(`${incompleteConfigServer.origin}${route}`, { method: 'POST' })

    await expectSafeError(response, 503, 'ai_not_configured')
  })

  it('rejects unsupported methods before processing the request', async () => {
    const response = await fetch(`${configuredServer.origin}${questionRoute}`, { method: 'GET' })

    await expectSafeError(response, 405, 'method_not_allowed')
    expect(response.headers.get('allow')).toBe('POST')
  })

  it('requires an application/json content type', async () => {
    const response = await fetch(`${configuredServer.origin}${questionRoute}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'text/plain',
        Origin: configuredServer.origin,
        'X-TechFlow-Author-Token': authorToken,
      },
      body: '{}',
    })

    await expectSafeError(response, 415, 'json_required')
  })

  it.each([
    ['missing', undefined],
    ['cross-origin', 'http://attacker.example'],
  ])('rejects a %s Origin header', async (_case, origin) => {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'X-TechFlow-Author-Token': authorToken,
    }
    if (origin) headers.Origin = origin

    const response = await fetch(`${configuredServer.origin}${questionRoute}`, {
      method: 'POST',
      headers,
      body: '{}',
    })

    await expectSafeError(response, 403, 'origin_rejected')
  })

  it.each([
    ['missing', undefined],
    ['incorrect', 'incorrect-author-token'],
  ])('rejects the author token when it is %s', async (_case, suppliedToken) => {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      Origin: configuredServer.origin,
    }
    if (suppliedToken) headers['X-TechFlow-Author-Token'] = suppliedToken

    const response = await fetch(`${configuredServer.origin}${questionRoute}`, {
      method: 'POST',
      headers,
      body: '{}',
    })

    await expectSafeError(response, 401, 'author_token_rejected')
  })

  it('rejects request bodies larger than the route limit', async () => {
    const response = await fetch(`${configuredServer.origin}${questionRoute}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Origin: configuredServer.origin,
        'X-TechFlow-Author-Token': authorToken,
      },
      body: JSON.stringify({ padding: 'x'.repeat(33 * 1024) }),
    })

    await expectSafeError(response, 413, 'body_too_large')
  })

  it('rejects malformed JSON', async () => {
    const response = await fetch(`${configuredServer.origin}${questionRoute}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Origin: configuredServer.origin,
        'X-TechFlow-Author-Token': authorToken,
      },
      body: '{',
    })

    await expectSafeError(response, 400, 'invalid_json')
  })

  it('rejects a schema-invalid request before calling the provider', async () => {
    const response = await fetch(`${configuredServer.origin}${simulationRoute}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Origin: configuredServer.origin,
        'X-TechFlow-Author-Token': authorToken,
      },
      body: '{}',
    })

    await expectSafeError(response, 400, 'invalid_request')
  })

  it('rejects a lesson source hash mismatch before calling the provider', async () => {
    const response = await fetch(`${configuredServer.origin}${lessonSimulationRoute}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Origin: configuredServer.origin,
        'X-TechFlow-Author-Token': authorToken,
      },
      body: JSON.stringify({
        source: lessonSource,
        sourceContentHash: '0'.repeat(64),
        kind: 'sequence',
        failureScenario: '',
      }),
    })

    const body = await expectSafeError(response, 400, 'source_hash_mismatch')
    expect(body.requestId).toMatch(/^[a-f0-9-]{36}$/u)
  })

  it('rejects an unrepresentable lesson actor ID before calling the provider', async () => {
    const invalidSource = {
      ...lessonSource,
      content: {
        ...lessonSource.content,
        actors: [
          { ...lessonSource.content.actors[0], id: 'api actor' },
          lessonSource.content.actors[1],
        ],
        mechanism: [
          { ...lessonSource.content.mechanism[0], actorId: 'api actor' },
          lessonSource.content.mechanism[1],
        ],
      },
    }
    const response = await fetch(`${configuredServer.origin}${lessonSimulationRoute}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Origin: configuredServer.origin,
        'X-TechFlow-Author-Token': authorToken,
      },
      body: JSON.stringify({
        source: invalidSource,
        sourceContentHash: lessonClaimSourceHash(invalidSource),
        kind: 'sequence',
        failureScenario: '',
      }),
    })

    await expectSafeError(response, 400, 'invalid_request')
  })

  it('rejects an unrepresentable lesson slug before calling the provider', async () => {
    const routeToken = `invalid-slug-${randomUUID()}`
    const server = await startAuthorServer({ apiKey, model: 'test-model', authorToken: routeToken })
    const invalidSource = { ...lessonSource, slug: 'queued job/lifecycle' }
    try {
      const response = await fetch(`${server.origin}${lessonSimulationRoute}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Origin: server.origin,
          'X-TechFlow-Author-Token': routeToken,
        },
        body: JSON.stringify({
          source: invalidSource,
          sourceContentHash: lessonClaimSourceHash(invalidSource),
          kind: 'sequence',
          failureScenario: '',
        }),
      })

      await expectSafeError(response, 400, 'invalid_request')
    } finally {
      await server.close()
    }
  })
})

describe('lesson simulation generation route', { concurrent: false }, () => {
  afterEach(() => {
    vi.clearAllMocks()
  })

  it('adds server-owned source, status, and provenance to a valid provider payload', async () => {
    const routeToken = `lesson-success-${randomUUID()}`
    const server = await startAuthorServer({ apiKey, model: 'test-model', authorToken: routeToken })
    vi.mocked(generateLessonSimulation).mockResolvedValueOnce({
      responseId: 'response-lesson-1',
      output: {
        learningObjective: 'Observe how accepted work becomes processed work through a durable queue.',
        misconception: 'An accepted asynchronous command has not necessarily completed yet.',
        takeaway: 'Model acceptance and completion as distinct observable states.',
        actors: [
          { id: 'api', label: 'API', role: 'Accepts the command', iconToken: 'server' },
          { id: 'worker', label: 'Worker', role: 'Processes the job', iconToken: 'service' },
        ],
        stateFields: [
          { key: 'status', label: 'Status', description: 'Current lifecycle state of the job.' },
        ],
        scenarios: [{
          id: 'happy-path',
          label: 'Happy path',
          kind: 'happy-path',
          initialState: [{ key: 'status', value: 'idle' }],
          transitions: [
            { id: 'accept', actorId: 'api', event: 'Accept', explanation: 'The API accepts the command after validation.', state: [{ key: 'status', value: 'accepted' }], highlights: ['api', 'status'] },
            { id: 'enqueue', actorId: 'api', event: 'Enqueue', explanation: 'The API persists the job for later delivery.', state: [{ key: 'status', value: 'queued' }], highlights: ['api', 'status'] },
            { id: 'process', actorId: 'worker', event: 'Process', explanation: 'The worker completes the durable queued job.', state: [{ key: 'status', value: 'processed' }], highlights: ['worker', 'status'] },
          ],
          terminalState: 'success',
          terminalSummary: 'The durable job completed successfully.',
        }],
        invariants: [{ id: 'processed', label: 'Job reaches processed', stateKey: 'status', operator: 'eq', expected: 'processed' }],
      },
    })

    try {
      const sourceContentHash = lessonClaimSourceHash(lessonSource)
      const response = await fetch(`${server.origin}${lessonSimulationRoute}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Origin: server.origin,
          'X-TechFlow-Author-Token': routeToken,
        },
        body: JSON.stringify({
          source: lessonSource,
          sourceContentHash,
          kind: 'sequence',
          failureScenario: '',
        }),
      })
      const body = await response.json() as { simulation: LessonSimulationSpec }

      expect(response.status).toBe(200)
      expect(response.headers.get('cache-control')).toBe('no-store')
      expect(body.simulation).toMatchObject({
        schemaVersion: 2,
        source: { kind: 'lesson', slug: lessonSource.slug, contentHash: sourceContentHash },
        locale: lessonSource.locale,
        kind: 'sequence',
        status: 'generated-needs-review',
        provenance: {
          kind: 'ai-generated',
          model: 'test-model',
          promptVersion: 'lesson-simulation-v2',
          responseId: 'response-lesson-1',
        },
      })
      expect(body.simulation.id).toMatch(/^lesson-simulation-/u)
      expect(body.simulation.provenance.kind).toBe('ai-generated')
      if (body.simulation.provenance.kind !== 'ai-generated') throw new Error('Expected AI provenance.')
      expect(body.simulation.provenance.inputHash).toMatch(/^[a-f0-9]{64}$/u)
      expect(body.simulation).not.toHaveProperty('review')
    } finally {
      await server.close()
    }
  })

  it('converts the v1 provider state-entry DTO without changing the public schema-v1 response', async () => {
    const routeToken = `v1-conversion-${randomUUID()}`
    const server = await startAuthorServer({ apiKey, model: 'test-model', authorToken: routeToken })
    vi.mocked(generateSimulation).mockResolvedValueOnce({
      responseId: 'response-v1-conversion',
      output: generatedQuestionSimulation,
    })

    try {
      const response = await fetch(`${server.origin}${simulationRoute}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Origin: server.origin,
          'X-TechFlow-Author-Token': routeToken,
        },
        body: JSON.stringify(questionSimulationRequest()),
      })
      const body = await response.json() as { simulation: QuestionSimulationSpec }

      expect(response.status).toBe(200)
      expect(body.simulation.schemaVersion).toBe(1)
      expect(body.simulation.scenarios[0].initialSnapshot).toEqual({ status: 'idle' })
      expect(body.simulation.scenarios[0].transitions[2].snapshot).toEqual({ status: 'processed' })
      expect(body.simulation.scenarios[0]).not.toHaveProperty('initialState')
      expect(body.simulation.scenarios[0].transitions[0]).not.toHaveProperty('state')
    } finally {
      await server.close()
    }
  })

  it('rejects unsafe generated text on the retained v1 simulation route', async () => {
    const routeToken = `v1-safety-${randomUUID()}`
    const server = await startAuthorServer({ apiKey, model: 'test-model', authorToken: routeToken })
    vi.mocked(generateSimulation).mockResolvedValueOnce({
      responseId: 'response-v1-unsafe',
      output: {
        ...generatedQuestionSimulation,
        learningObjective: '<script>alert(1)</script> Explain the queued lifecycle safely.',
      },
    })

    try {
      const response = await fetch(`${server.origin}${simulationRoute}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Origin: server.origin,
          'X-TechFlow-Author-Token': routeToken,
        },
        body: JSON.stringify(questionSimulationRequest()),
      })

      await expectSafeError(response, 502, 'invalid_output')
    } finally {
      await server.close()
    }
  })
})
