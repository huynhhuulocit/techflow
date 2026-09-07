import type {
  InterviewLevel,
  Locale,
  QuestionDraft,
  SimulationKind,
  SimulationSpec,
} from '../content/types'
import { validateSimulationSpec } from '../simulation'
import { validateQuestionDraft } from './draftValidation'
import { questionContentHash, simulationGenerationInputHash } from './questionContentHash'

export const AUTHOR_TOKEN_SESSION_KEY = 'techflow.author.token.v1'
export const QUESTION_GENERATE_ROUTE = '/api/author/questions/generate'
export const SIMULATION_GENERATE_ROUTE = '/api/author/simulations/generate'
export const AUTHOR_REQUEST_TIMEOUT_MS = 30_000

export type SessionStorageAdapter = Pick<Storage, 'getItem' | 'setItem' | 'removeItem'>

export type GenerateQuestionsInput = {
  locale: Locale
  topicSlug: string
  level: InterviewLevel
  count: number
  brief: string
  sourceNotes: string
  avoidTitles: string[]
}

export type GenerateSimulationInput = {
  draft: Pick<QuestionDraft, 'id' | 'locale' | 'topicSlug' | 'level' | 'content' | 'sourceNotes'>
  kind: SimulationKind
  failureScenario: string
}

export type AuthorApiErrorDetails = {
  status?: number
  code: string
  requestId?: string
  retryAfterSeconds?: number
  issues?: string[]
}

export class AuthorApiError extends Error {
  readonly details: AuthorApiErrorDetails

  constructor(message: string, details: AuthorApiErrorDetails) {
    super(message)
    this.name = 'AuthorApiError'
    this.details = details
  }
}

type Fetcher = (input: RequestInfo | URL, init?: RequestInit) => Promise<Response>

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

export function readAuthorToken(storage: SessionStorageAdapter) {
  try {
    return storage.getItem(AUTHOR_TOKEN_SESSION_KEY) ?? ''
  } catch {
    return ''
  }
}

export function writeAuthorToken(storage: SessionStorageAdapter, token: string) {
  const normalized = token.trim()
  try {
    if (normalized) storage.setItem(AUTHOR_TOKEN_SESSION_KEY, normalized)
    else storage.removeItem(AUTHOR_TOKEN_SESSION_KEY)
    return { ok: true as const }
  } catch {
    return {
      ok: false as const,
      message: 'Browser đang chặn session storage. Token chỉ được giữ trong ô nhập của tab hiện tại.',
    }
  }
}

function friendlyMessage(code: string, status?: number, locale: Locale = 'vi') {
  if (locale === 'en') {
    switch (code) {
      case 'missing_author_token': return 'Enter the Author Token before using AI.'
      case 'ai_not_configured': return 'Local AI authoring is not configured. Check OPENAI_API_KEY, OPENAI_MODEL, and TECHFLOW_AUTHOR_TOKEN, then restart the dev server.'
      case 'author_token_rejected': return 'The Author Token is incorrect. It must match TECHFLOW_AUTHOR_TOKEN on the local server.'
      case 'origin_rejected':
      case 'local_author_only': return 'The Author API only accepts same-origin requests from local TechFlow.'
      case 'author_rate_limited': return 'The authoring rate limit was reached. Wait for the retry period, then try again.'
      case 'author_generation_busy': return 'Another AI generation is running. Wait a few seconds, then try again.'
      case 'timeout': return 'The AI request timed out. Your current draft is unchanged.'
      case 'rate_limited': return 'The AI provider is rate limiting requests. Your current draft is unchanged.'
      case 'invalid_request': return 'The Author API request is invalid.'
      case 'invalid_response': return 'The Author API returned data outside the expected schema. No drafts were changed.'
      case 'network_error': return 'Could not reach the local Author API. Check the dev server, then try again.'
      default: return status ? `The Author API returned HTTP ${status}. Your current draft is unchanged.` : 'Could not call the Author API.'
    }
  }
  switch (code) {
    case 'missing_author_token':
      return 'Hãy nhập Author Token trước khi gọi AI.'
    case 'ai_not_configured':
      return 'Local AI authoring chưa được cấu hình. Kiểm tra OPENAI_API_KEY, OPENAI_MODEL và TECHFLOW_AUTHOR_TOKEN rồi restart dev server.'
    case 'author_token_rejected':
      return 'Author Token không đúng. Token phải khớp TECHFLOW_AUTHOR_TOKEN của local server.'
    case 'origin_rejected':
    case 'local_author_only':
      return 'Author API chỉ chấp nhận request same-origin từ local TechFlow.'
    case 'author_rate_limited':
      return 'Đã chạm giới hạn tạo nội dung. Hãy chờ theo thời gian retry rồi thử lại.'
    case 'author_generation_busy':
      return 'Một lượt AI generation khác đang chạy. Hãy đợi vài giây rồi thử lại.'
    case 'timeout':
      return 'AI upstream hết thời gian chờ. Draft hiện tại vẫn được giữ nguyên.'
    case 'rate_limited':
      return 'AI provider đang giới hạn request. Draft hiện tại vẫn được giữ nguyên.'
    case 'invalid_request':
      return 'Dữ liệu gửi tới Author API chưa hợp lệ.'
    case 'invalid_response':
      return 'Author API trả về dữ liệu không đúng schema. Không có draft nào bị thay đổi.'
    case 'network_error':
      return 'Không kết nối được local Author API. Kiểm tra dev server rồi thử lại.'
    default:
      return status ? `Author API trả về lỗi HTTP ${status}. Draft hiện tại vẫn được giữ nguyên.` : 'Không thể gọi Author API.'
  }
}

async function parseResponseBody(response: Response) {
  const text = await response.text()
  if (!text) return null
  try {
    return JSON.parse(text) as unknown
  } catch {
    throw new AuthorApiError(friendlyMessage('invalid_response'), {
      status: response.status,
      code: 'invalid_response',
    })
  }
}

function responseIssues(body: Record<string, unknown>) {
  if (!Array.isArray(body.issues)) return undefined
  return body.issues.slice(0, 8).map(entry => {
    if (!isRecord(entry)) return String(entry)
    const path = Array.isArray(entry.path) ? entry.path.join('.') : String(entry.path ?? '')
    return `${path ? `${path}: ` : ''}${String(entry.message ?? 'Invalid value')}`
  })
}

async function postAuthorJson(
  route: typeof QUESTION_GENERATE_ROUTE | typeof SIMULATION_GENERATE_ROUTE,
  payload: unknown,
  authorToken: string,
  fetcher: Fetcher,
) {
  const token = authorToken.trim()
  if (!token) {
    throw new AuthorApiError(friendlyMessage('missing_author_token'), { code: 'missing_author_token' })
  }

  let response: Response
  const controller = new AbortController()
  const timeout = globalThis.setTimeout(() => controller.abort(), AUTHOR_REQUEST_TIMEOUT_MS)
  try {
    response = await fetcher(route, {
      method: 'POST',
      credentials: 'same-origin',
      redirect: 'error',
      cache: 'no-store',
      signal: controller.signal,
      headers: {
        'Content-Type': 'application/json',
        'X-TechFlow-Author-Token': token,
      },
      body: JSON.stringify(payload),
    })
  } catch (error) {
    if (error instanceof AuthorApiError) throw error
    if (controller.signal.aborted) {
      throw new AuthorApiError(friendlyMessage('timeout'), { code: 'timeout' })
    }
    throw new AuthorApiError(friendlyMessage('network_error'), { code: 'network_error' })
  } finally {
    globalThis.clearTimeout(timeout)
  }

  const body = await parseResponseBody(response)
  if (!response.ok) {
    const record = isRecord(body) ? body : {}
    const code = typeof record.error === 'string' ? record.error : 'author_api_error'
    const retryAfterValue = Number(response.headers.get('Retry-After'))
    throw new AuthorApiError(friendlyMessage(code, response.status), {
      status: response.status,
      code,
      requestId: typeof record.requestId === 'string' ? record.requestId : undefined,
      retryAfterSeconds: Number.isFinite(retryAfterValue) && retryAfterValue > 0 ? retryAfterValue : undefined,
      issues: responseIssues(record),
    })
  }
  if (!isRecord(body)) {
    throw new AuthorApiError(friendlyMessage('invalid_response'), {
      status: response.status,
      code: 'invalid_response',
    })
  }
  return body
}

export function formatAuthorApiError(error: unknown, locale: Locale) {
  if (!(error instanceof AuthorApiError)) {
    return friendlyMessage('network_error', undefined, locale)
  }
  const base = friendlyMessage(error.details.code, error.details.status, locale)
  const retry = error.details.retryAfterSeconds
    ? locale === 'vi'
      ? ` Có thể thử lại sau khoảng ${error.details.retryAfterSeconds} giây.`
      : ` You can retry in about ${error.details.retryAfterSeconds} seconds.`
    : ''
  const request = error.details.requestId ? ` Request ID: ${error.details.requestId}.` : ''
  const issues = error.details.issues?.length ? ` ${error.details.issues.join(' ')}` : ''
  return `${base}${retry}${request}${issues}`
}

export async function generateQuestionDrafts(
  input: GenerateQuestionsInput,
  authorToken: string,
  fetcher: Fetcher = globalThis.fetch.bind(globalThis),
) {
  const body = await postAuthorJson(QUESTION_GENERATE_ROUTE, input, authorToken, fetcher)
  if (!Array.isArray(body.drafts) || body.drafts.length === 0) {
    throw new AuthorApiError(friendlyMessage('invalid_response'), { code: 'invalid_response' })
  }

  const drafts: QuestionDraft[] = []
  const ids = new Set<string>()
  for (const entry of body.drafts) {
    const validation = validateQuestionDraft(entry)
    if (!validation.success || ids.has(validation.success ? validation.data.id : '')) {
      throw new AuthorApiError(friendlyMessage('invalid_response'), {
        code: 'invalid_response',
        issues: validation.success
          ? ['Author API trả về draft ID bị trùng.']
          : validation.issues.slice(0, 6).map(issue => `${issue.path}: ${issue.message}`),
      })
    }
    ids.add(validation.data.id)
    drafts.push(validation.data)
  }

  return {
    drafts,
    requestId: typeof body.requestId === 'string' ? body.requestId : undefined,
  }
}

export async function generateDraftSimulation(
  input: GenerateSimulationInput,
  authorToken: string,
  fetcher: Fetcher = globalThis.fetch.bind(globalThis),
): Promise<{ simulation: SimulationSpec; requestId?: string }> {
  const body = await postAuthorJson(SIMULATION_GENERATE_ROUTE, input, authorToken, fetcher)
  const validation = validateSimulationSpec(body.simulation)
  if (!validation.success) {
    throw new AuthorApiError(friendlyMessage('invalid_response'), {
      code: 'invalid_response',
      issues: validation.issues.slice(0, 6).map(issue => `${issue.path}: ${issue.message}`),
    })
  }
  if (
    validation.data.sourceQuestionId !== input.draft.id
    || validation.data.locale !== input.draft.locale
    || validation.data.sourceContentHash !== questionContentHash(input.draft.content)
    || validation.data.generation.inputHash !== simulationGenerationInputHash(input)
  ) {
    throw new AuthorApiError(friendlyMessage('invalid_response'), {
      code: 'invalid_response',
      issues: ['Simulation source identity, content hash, or generation input hash does not match the requested draft.'],
    })
  }

  return {
    simulation: validation.data,
    requestId: typeof body.requestId === 'string' ? body.requestId : undefined,
  }
}
