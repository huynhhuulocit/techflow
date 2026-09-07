import { afterEach, describe, expect, it, vi } from 'vitest'
import {
  AUTHOR_REQUEST_TIMEOUT_MS,
  AUTHOR_TOKEN_SESSION_KEY,
  generateDraftSimulation,
  generateQuestionDrafts,
  readAuthorToken,
  writeAuthorToken,
  type SessionStorageAdapter,
  type GenerateSimulationInput,
} from './aiClient'
import { createTestDraft, createTestSimulation } from './testFixtures'
import { simulationGenerationInputHash } from './questionContentHash'

class MemorySessionStorage implements SessionStorageAdapter {
  values = new Map<string, string>()
  getItem(key: string) { return this.values.get(key) ?? null }
  setItem(key: string, value: string) { this.values.set(key, value) }
  removeItem(key: string) { this.values.delete(key) }
}

const questionInput = {
  locale: 'vi' as const,
  topicSlug: 'redis',
  level: 'junior' as const,
  count: 1,
  brief: 'Create a cache question.',
  sourceNotes: 'Official documentation only.',
  avoidTitles: [],
}

function simulationInputFor(draft = createTestDraft()): GenerateSimulationInput {
  return {
    draft: {
      id: draft.id,
      locale: draft.locale,
      topicSlug: draft.topicSlug,
      level: draft.level,
      content: draft.content,
      sourceNotes: draft.sourceNotes,
    },
    kind: 'sequence',
    failureScenario: '',
  }
}

afterEach(() => {
  vi.useRealTimers()
})

describe('author token storage', () => {
  it('uses only the dedicated session storage adapter', () => {
    const storage = new MemorySessionStorage()
    expect(writeAuthorToken(storage, '  session-token  ')).toEqual({ ok: true })
    expect(storage.values.get(AUTHOR_TOKEN_SESSION_KEY)).toBe('session-token')
    expect(readAuthorToken(storage)).toBe('session-token')
    writeAuthorToken(storage, '')
    expect(readAuthorToken(storage)).toBe('')
  })
})

describe('author API client', () => {
  it('posts to the relative same-origin question route with the author header', async () => {
    const generated = createTestDraft({
      id: 'draft-generated-1',
      reviewStatus: 'generated-needs-review',
      provenance: {
        kind: 'ai-generated',
        createdAt: '2026-09-07T00:00:00.000Z',
        model: 'test-model',
        promptVersion: 'question-v1',
      },
    })
    const fetcher = vi.fn(async (_input: RequestInfo | URL, _init?: RequestInit) => new Response(JSON.stringify({ drafts: [generated], requestId: 'request-1' }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    }))

    await expect(generateQuestionDrafts(questionInput, 'author-token', fetcher)).resolves.toMatchObject({
      drafts: [{ id: 'draft-generated-1' }],
      requestId: 'request-1',
    })
    expect(fetcher).toHaveBeenCalledOnce()
    const [route, init] = fetcher.mock.calls[0]
    expect(route).toBe('/api/author/questions/generate')
    expect(init).toMatchObject({ method: 'POST', credentials: 'same-origin', redirect: 'error' })
    expect((init?.headers as Record<string, string>)['X-TechFlow-Author-Token']).toBe('author-token')
    expect(String(init?.body)).not.toContain('author-token')
  })

  it('rejects a simulation response that points to another draft', async () => {
    const input = simulationInputFor()
    const mismatched = createTestSimulation('another-draft')
    mismatched.generation.inputHash = simulationGenerationInputHash(input)
    const fetcher = vi.fn(async () => new Response(JSON.stringify({ simulation: mismatched }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    }))
    await expect(generateDraftSimulation(input, 'author-token', fetcher)).rejects.toMatchObject({ details: { code: 'invalid_response' } })
  })

  it('accepts only a simulation bound to the complete submitted input', async () => {
    const input = simulationInputFor()
    const matching = createTestSimulation()
    matching.generation.inputHash = simulationGenerationInputHash(input)
    const fetcher = vi.fn(async () => new Response(JSON.stringify({ simulation: matching, requestId: 'request-2' }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    }))

    await expect(generateDraftSimulation(input, 'author-token', fetcher)).resolves.toMatchObject({
      simulation: { id: matching.id },
      requestId: 'request-2',
    })

    matching.generation.inputHash = 'f'.repeat(64)
    await expect(generateDraftSimulation(input, 'author-token', fetcher)).rejects.toMatchObject({
      details: { code: 'invalid_response' },
    })
  })

  it('aborts an unresponsive request after the bounded timeout', async () => {
    vi.useFakeTimers()
    const fetcher = vi.fn((_input: RequestInfo | URL, init?: RequestInit) => new Promise<Response>((_resolve, reject) => {
      init?.signal?.addEventListener('abort', () => reject(new DOMException('aborted', 'AbortError')))
    }))
    const pending = generateQuestionDrafts(questionInput, 'author-token', fetcher)
    const assertion = expect(pending).rejects.toMatchObject({ details: { code: 'timeout' } })
    await vi.advanceTimersByTimeAsync(AUTHOR_REQUEST_TIMEOUT_MS)
    await assertion
  })
})
