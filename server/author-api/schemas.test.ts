import { describe, expect, it } from 'vitest'
import {
  GeneratedQuestionBatchSchema,
  GeneratedSimulationSchema,
  QuestionGenerateRequestSchema,
} from './schemas.ts'

describe('author API schemas', () => {
  it('accepts a bounded question-generation request', () => {
    const result = QuestionGenerateRequestSchema.safeParse({
      locale: 'vi',
      topicSlug: 'typescript',
      level: 'middle',
      count: 2,
      brief: 'Tập trung vào generic constraints.',
      sourceNotes: '',
      avoidTitles: ['Generic constraint giải quyết vấn đề gì?'],
    })

    expect(result.success).toBe(true)
  })

  it('rejects extra fields and oversized batches', () => {
    const result = QuestionGenerateRequestSchema.safeParse({
      locale: 'en',
      topicSlug: 'typescript',
      level: 'senior',
      count: 4,
      brief: '',
      sourceNotes: '',
      avoidTitles: [],
      apiKey: 'must-never-be-accepted-from-the-browser',
    })

    expect(result.success).toBe(false)
  })

  it('rejects an incomplete generated question', () => {
    const result = GeneratedQuestionBatchSchema.safeParse({
      drafts: [{
        question: 'How does TypeScript narrowing work?',
        quickAnswer: 'It narrows a union after a runtime-aware type guard.',
        conceptualExplanation: 'Control-flow analysis carries the refined type through reachable branches.',
        productionTradeOff: 'A forced assertion can bypass that analysis and hide an invalid runtime assumption.',
      }],
    })

    expect(result.success).toBe(false)
  })

  it('accepts structured simulation data without presentation code', () => {
    const result = GeneratedSimulationSchema.safeParse({
      learningObjective: 'Observe how a queued job changes state before and after a worker handles it.',
      misconception: 'Enqueueing a job does not mean that its work has already completed.',
      takeaway: 'Track accepted and processed states separately in asynchronous systems.',
      actors: [
        { id: 'api', label: 'API', role: 'Accepts the command', iconToken: 'server' },
        { id: 'worker', label: 'Worker', role: 'Processes the queued job', iconToken: 'service' },
      ],
      scenarios: [{
        id: 'happy-path',
        label: 'Happy path',
        kind: 'happy-path',
        initialSnapshot: { status: 'idle' },
        transitions: [
          { id: 'accept', actorId: 'api', event: 'Accept command', explanation: 'The API validates and accepts the command.', snapshot: { status: 'accepted' }, highlights: ['api', 'status'] },
          { id: 'enqueue', actorId: 'api', event: 'Enqueue job', explanation: 'The durable queue now owns pending delivery.', snapshot: { status: 'queued' }, highlights: ['api', 'status'] },
          { id: 'process', actorId: 'worker', event: 'Process job', explanation: 'The worker completes the background operation.', snapshot: { status: 'processed' }, highlights: ['worker', 'status'] },
        ],
        terminalState: 'success',
        terminalSummary: 'The accepted command was eventually processed.',
      }],
      invariants: [{ id: 'status-known', label: 'Status remains observable', stateKey: 'status', operator: 'neq', expected: null }],
    })

    expect(result.success).toBe(true)
  })
})
