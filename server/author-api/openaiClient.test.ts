import { describe, expect, it, vi } from 'vitest'
import type { LessonSimulationGenerateRequest } from './schemas.ts'
import { AiUpstreamError, generateLessonSimulation } from './openaiClient.ts'

const request = {
  source: {
    locale: 'en',
    content: { actors: [] },
  },
  sourceContentHash: 'a'.repeat(64),
  kind: 'flow',
  failureScenario: '',
} as unknown as LessonSimulationGenerateRequest

const generatedOutput = {
  learningObjective: 'Observe how accepted work moves through a durable queue to completion.',
  misconception: 'Accepted asynchronous work has not necessarily completed yet.',
  takeaway: 'Track accepted and completed lifecycle states separately.',
  actors: [
    { id: 'api', label: 'API', role: 'Accepts work', iconToken: 'server' as const },
    { id: 'worker', label: 'Worker', role: 'Completes work', iconToken: 'service' as const },
  ],
  stateFields: [{ key: 'status', label: 'Status', description: 'Current job lifecycle state.' }],
  scenarios: [{
    id: 'happy-path',
    label: 'Happy path',
    kind: 'happy-path' as const,
    initialState: [{ key: 'status', value: 'idle' }],
    transitions: [
      { id: 'accept', actorId: 'api', event: 'Accept', explanation: 'The API accepts the validated work.', state: [{ key: 'status', value: 'accepted' }], highlights: ['api'] },
      { id: 'enqueue', actorId: 'api', event: 'Enqueue', explanation: 'The API persists the work durably.', state: [{ key: 'status', value: 'queued' }], highlights: ['api'] },
      { id: 'process', actorId: 'worker', event: 'Process', explanation: 'The worker completes the queued work.', state: [{ key: 'status', value: 'processed' }], highlights: ['worker'] },
    ],
    terminalState: 'success' as const,
    terminalSummary: 'The queued work completed.',
  }],
  invariants: [{ id: 'processed', label: 'Work is processed', stateKey: 'status', operator: 'eq' as const, expected: 'processed' }],
}

describe('lesson simulation OpenAI adapter', () => {
  it('uses a server-side structured-output request without provider storage', async () => {
    const parse = vi.fn().mockResolvedValue({
      id: 'response-1',
      status: 'completed',
      output_parsed: generatedOutput,
    })

    const result = await generateLessonSimulation(
      { apiKey: 'server-only-key', model: 'test-model' },
      request,
      { responses: { parse } } as never,
    )

    expect(result).toEqual({ output: generatedOutput, responseId: 'response-1' })
    expect(parse).toHaveBeenCalledOnce()
    expect(parse.mock.calls[0][0]).toMatchObject({
      model: 'test-model',
      store: false,
      max_output_tokens: 8_000,
    })
    expect(parse.mock.calls[0][0].text.format.name).toBe('techflow_lesson_simulation_v2')
  })

  it('maps incomplete provider output to invalid_output', async () => {
    const parse = vi.fn().mockResolvedValue({
      id: 'response-incomplete',
      status: 'incomplete',
      output_parsed: null,
    })

    await expect(generateLessonSimulation(
      { apiKey: 'server-only-key', model: 'test-model' },
      request,
      { responses: { parse } } as never,
    )).rejects.toMatchObject<Partial<AiUpstreamError>>({ code: 'invalid_output' })
  })
})
