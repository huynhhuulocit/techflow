import { describe, expect, it } from 'vitest'
import { zodTextFormat } from 'openai/helpers/zod'
import {
  GeneratedQuestionBatchSchema,
  GeneratedLessonSimulationSchema,
  GeneratedSimulationSchema,
  LessonSimulationGenerateRequestSchema,
  QuestionGenerateRequestSchema,
} from './schemas.ts'

const lessonSource = {
  schemaVersion: 1 as const,
  slug: 'queued-job-lifecycle',
  title: 'How does a queued job move through the system?',
  shortAnswer: 'The API accepts work before a worker completes it.',
  category: 'Backend',
  difficulty: 'Trung cấp' as const,
  duration: 12,
  tags: ['Queue'],
  workflow: [],
  followUps: ['What happens when a worker fails?'],
  search: { aliases: ['job queue'], concepts: ['delivery'], relatedSlugs: [] },
  locale: 'en' as const,
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

const generatedLessonSimulation = {
  learningObjective: 'Observe how accepted work becomes processed work through a durable queue.',
  misconception: 'An accepted asynchronous command has not necessarily completed yet.',
  takeaway: 'Model acceptance and completion as distinct observable states.',
  actors: [
    { id: 'api', label: 'API', role: 'Accepts the command', iconToken: 'server' as const },
    { id: 'worker', label: 'Worker', role: 'Processes the job', iconToken: 'service' as const },
  ],
  stateFields: [
    { key: 'status', label: 'Status', description: 'Current lifecycle state of the job.' },
  ],
  scenarios: [{
    id: 'happy-path',
    label: 'Happy path',
    kind: 'happy-path' as const,
    initialState: [{ key: 'status', value: 'idle' }],
    transitions: [
      { id: 'accept', actorId: 'api', event: 'Accept', explanation: 'The API accepts the command after validation.', state: [{ key: 'status', value: 'accepted' }], highlights: ['api', 'status'] },
      { id: 'enqueue', actorId: 'api', event: 'Enqueue', explanation: 'The API persists the job for later delivery.', state: [{ key: 'status', value: 'queued' }], highlights: ['api', 'status'] },
      { id: 'process', actorId: 'worker', event: 'Process', explanation: 'The worker completes the durable queued job.', state: [{ key: 'status', value: 'processed' }], highlights: ['worker', 'status'] },
    ],
    terminalState: 'success' as const,
    terminalSummary: 'The durable job completed successfully.',
  }],
  invariants: [{ id: 'processed', label: 'Job reaches processed', stateKey: 'status', operator: 'eq' as const, expected: 'processed' }],
}

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
        initialState: [{ key: 'status', value: 'idle' }],
        transitions: [
          { id: 'accept', actorId: 'api', event: 'Accept command', explanation: 'The API validates and accepts the command.', state: [{ key: 'status', value: 'accepted' }], highlights: ['api', 'status'] },
          { id: 'enqueue', actorId: 'api', event: 'Enqueue job', explanation: 'The durable queue now owns pending delivery.', state: [{ key: 'status', value: 'queued' }], highlights: ['api', 'status'] },
          { id: 'process', actorId: 'worker', event: 'Process job', explanation: 'The worker completes the background operation.', state: [{ key: 'status', value: 'processed' }], highlights: ['worker', 'status'] },
        ],
        terminalState: 'success',
        terminalSummary: 'The accepted command was eventually processed.',
      }],
      invariants: [{ id: 'status-known', label: 'Status remains observable', stateKey: 'status', operator: 'neq', expected: null }],
    })

    expect(result.success).toBe(true)
  })

  it('accepts an exact lesson-source request without review or simulation metadata', () => {
    const result = LessonSimulationGenerateRequestSchema.safeParse({
      source: lessonSource,
      sourceContentHash: 'a'.repeat(64),
      kind: 'sequence',
      failureScenario: '',
    })

    expect(result.success).toBe(true)
  })

  it.each([
    ['an unsafe slug', { ...lessonSource, slug: 'queued job/lifecycle' }],
    ['a duplicate actor ID', {
      ...lessonSource,
      content: {
        ...lessonSource.content,
        actors: [lessonSource.content.actors[0], { ...lessonSource.content.actors[1], id: 'api' }],
      },
    }],
    ['an unknown mechanism actor', {
      ...lessonSource,
      content: {
        ...lessonSource.content,
        mechanism: [{ ...lessonSource.content.mechanism[0], actorId: 'missing-actor' }],
      },
    }],
  ])('rejects lesson source with %s', (_case, source) => {
    const result = LessonSimulationGenerateRequestSchema.safeParse({
      source,
      sourceContentHash: 'a'.repeat(64),
      kind: 'sequence',
      failureScenario: '',
    })

    expect(result.success).toBe(false)
  })

  it('validates claim text without changing source bytes before hash verification', () => {
    const title = '  Intentional lesson title spacing  '
    const result = LessonSimulationGenerateRequestSchema.safeParse({
      source: { ...lessonSource, title },
      sourceContentHash: 'a'.repeat(64),
      kind: 'sequence',
      failureScenario: '  worker timeout  ',
    })

    expect(result.success).toBe(true)
    if (!result.success) return
    expect(result.data.source.title).toBe(title)
    expect(result.data.failureScenario).toBe('worker timeout')
  })

  it('rejects client-owned lifecycle metadata in the lesson source', () => {
    const result = LessonSimulationGenerateRequestSchema.safeParse({
      source: { ...lessonSource, reviewStatus: 'reviewed' },
      sourceContentHash: 'a'.repeat(64),
      kind: 'sequence',
      failureScenario: '',
    })

    expect(result.success).toBe(false)
  })

  it('accepts a lesson simulation payload without server-owned metadata', () => {
    expect(GeneratedLessonSimulationSchema.safeParse(generatedLessonSimulation).success).toBe(true)
  })

  it('caps generated lesson simulation topology to the configured output budget', () => {
    const stateFields = Array.from({ length: 6 }, (_, index) => ({
      key: `state${index}`,
      label: `State ${index}`,
      description: `Observable state field number ${index}.`,
    }))
    const state = stateFields.map((field, index) => ({ key: field.key, value: `value-${index}` }))
    const atLimit = {
      ...generatedLessonSimulation,
      stateFields,
      scenarios: Array.from({ length: 2 }, (_, scenarioIndex) => ({
        ...generatedLessonSimulation.scenarios[0],
        id: `scenario-${scenarioIndex}`,
        kind: scenarioIndex === 0 ? 'happy-path' as const : 'failure' as const,
        initialState: state,
        transitions: Array.from({ length: 6 }, (_, transitionIndex) => ({
          ...generatedLessonSimulation.scenarios[0].transitions[0],
          id: `transition-${scenarioIndex}-${transitionIndex}`,
          state,
        })),
      })),
    }

    expect(GeneratedLessonSimulationSchema.safeParse(atLimit).success).toBe(true)
    expect(GeneratedLessonSimulationSchema.safeParse({
      ...atLimit,
      stateFields: [...stateFields, { key: 'overflow', label: 'Overflow', description: 'This field exceeds the limit.' }],
    }).success).toBe(false)
    expect(GeneratedLessonSimulationSchema.safeParse({
      ...atLimit,
      scenarios: [{
        ...atLimit.scenarios[0],
        transitions: [...atLimit.scenarios[0].transitions, atLimit.scenarios[0].transitions[0]],
      }],
    }).success).toBe(false)
  })

  it('rejects server-owned provenance supplied by the provider', () => {
    const result = GeneratedLessonSimulationSchema.safeParse({
      ...generatedLessonSimulation,
      status: 'reviewed',
      provenance: { kind: 'ai-generated' },
    })

    expect(result.success).toBe(false)
  })

  it('keeps both simulation provider DTOs compatible with strict Structured Outputs', () => {
    expect(() => zodTextFormat(GeneratedSimulationSchema, 'question_simulation')).not.toThrow()
    expect(() => zodTextFormat(GeneratedLessonSimulationSchema, 'lesson_simulation')).not.toThrow()
  })
})
