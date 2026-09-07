import { afterEach, describe, expect, it, vi } from 'vitest'
import {
  AUTHOR_REQUEST_TIMEOUT_MS,
  AUTHOR_TOKEN_SESSION_KEY,
  generateDraftSimulation,
  generateLessonSimulation,
  generateQuestionDrafts,
  readAuthorToken,
  writeAuthorToken,
  type SessionStorageAdapter,
  type GenerateSimulationInput,
} from './aiClient'
import { getLessons } from '../content/lessons'
import type { LessonSimulationSpec, RichLesson } from '../content/types'
import { createTestDraft, createTestSimulation } from './testFixtures'
import {
  createLessonSimulationGenerateRequest,
  lessonSimulationGenerationInputHash,
} from './lessonSimulationGeneration'
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

function lessonSimulationInput() {
  const lesson = getLessons('vi').find(entry => entry.slug === 'pwa-kit-architecture')
  if (!lesson?.content || !lesson.simulation) throw new Error('Missing rich PWA lesson simulation')
  return {
    lesson: lesson as RichLesson,
    kind: 'flow' as const,
    failureScenario: '',
  }
}

function generatedLessonSimulation(): LessonSimulationSpec {
  const input = lessonSimulationInput()
  const request = createLessonSimulationGenerateRequest(input)
  const simulation = structuredClone(input.lesson.simulation)
  if (!simulation) throw new Error('Missing simulation')
  return {
    ...simulation,
    status: 'generated-needs-review',
    review: undefined,
    provenance: {
      kind: 'ai-generated',
      model: 'test-model',
      promptVersion: 'lesson-simulation-v2',
      generatedAt: '2026-09-07T00:00:00.000Z',
      inputHash: lessonSimulationGenerationInputHash(request),
    },
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

  it('accepts a schema v2 lesson simulation bound to the full lesson source', async () => {
    const input = lessonSimulationInput()
    const generated = generatedLessonSimulation()
    const fetcher = vi.fn(async (_input: RequestInfo | URL, _init?: RequestInit) => new Response(JSON.stringify({
      simulation: generated,
      requestId: 'lesson-request-1',
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    }))

    await expect(generateLessonSimulation(input, 'author-token', fetcher)).resolves.toMatchObject({
      simulation: { schemaVersion: 2, id: generated.id },
      requestId: 'lesson-request-1',
    })
    const [route, init] = fetcher.mock.calls[0]
    expect(route).toBe('/api/author/lesson-simulations/generate')
    expect(String(init?.body)).toContain(`"sourceContentHash":"${generated.source.contentHash}"`)
    expect(String(init?.body)).not.toContain('author-token')
  })

  it('rejects lesson output with a mismatched source, lifecycle, or actor topology', async () => {
    const input = lessonSimulationInput()
    const valid = generatedLessonSimulation()
    const invalidOutputs: LessonSimulationSpec[] = [
      { ...valid, source: { ...valid.source, slug: 'another-lesson' } },
      { ...valid, status: 'reviewed' },
      { ...valid, actors: valid.actors.slice().reverse() },
      {
        ...valid,
        provenance: valid.provenance.kind === 'ai-generated'
          ? { ...valid.provenance, inputHash: 'f'.repeat(64) }
          : valid.provenance,
      },
    ]

    for (const simulation of invalidOutputs) {
      const fetcher = vi.fn(async () => new Response(JSON.stringify({ simulation }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }))
      await expect(generateLessonSimulation(input, 'author-token', fetcher)).rejects.toMatchObject({
        details: { code: 'invalid_response' },
      })
    }
  })
})
