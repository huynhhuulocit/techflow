import { z } from 'zod'

export const LocaleSchema = z.enum(['vi', 'en'])
export const LevelSchema = z.enum(['junior', 'middle', 'senior'])
export const SimulationKindSchema = z.enum(['sequence', 'flow', 'state'])

const boundedText = (minimum: number, maximum: number) => z.string().trim().min(minimum).max(maximum)

export const QuestionGenerateRequestSchema = z.strictObject({
  locale: LocaleSchema,
  topicSlug: boundedText(1, 80),
  level: LevelSchema,
  count: z.number().int().min(1).max(3),
  brief: z.string().trim().max(1_000),
  sourceNotes: z.string().trim().max(8_000),
  avoidTitles: z.array(boundedText(1, 240)).max(30),
})

const AppliedExampleSchema = z.strictObject({
  label: boundedText(1, 80),
  detail: boundedText(10, 1_800),
})

export const GeneratedQuestionSchema = z.strictObject({
  question: boundedText(8, 300),
  quickAnswer: boundedText(20, 1_200),
  conceptualExplanation: boundedText(30, 2_400),
  productionTradeOff: boundedText(20, 1_800),
  appliedExample: AppliedExampleSchema,
})

export const GeneratedQuestionBatchSchema = z.strictObject({
  drafts: z.array(GeneratedQuestionSchema).min(1).max(3),
})

export const QuestionDraftInputSchema = z.strictObject({
  id: boundedText(1, 120),
  locale: LocaleSchema,
  topicSlug: boundedText(1, 80),
  level: LevelSchema,
  content: GeneratedQuestionSchema,
  sourceNotes: z.string().trim().max(8_000),
})

export const SimulationGenerateRequestSchema = z.strictObject({
  draft: QuestionDraftInputSchema,
  kind: SimulationKindSchema,
  failureScenario: z.string().trim().max(800),
})

const SimulationScalarSchema = z.union([z.string(), z.number(), z.boolean(), z.null()])
const SnapshotSchema = z.record(z.string().min(1).max(80), SimulationScalarSchema)

const GeneratedActorSchema = z.strictObject({
  id: boundedText(1, 48).regex(/^[a-z][a-z0-9-]*$/),
  label: boundedText(1, 80),
  role: boundedText(1, 160),
  iconToken: z.enum(['client', 'server', 'database', 'queue', 'cache', 'service', 'runtime']),
})

const GeneratedTransitionSchema = z.strictObject({
  id: boundedText(1, 48).regex(/^[a-z][a-z0-9-]*$/),
  actorId: boundedText(1, 48),
  event: boundedText(2, 140),
  explanation: boundedText(10, 500),
  snapshot: SnapshotSchema,
  highlights: z.array(boundedText(1, 48)).max(8),
})

const GeneratedScenarioSchema = z.strictObject({
  id: boundedText(1, 48).regex(/^[a-z][a-z0-9-]*$/),
  label: boundedText(1, 80),
  kind: z.enum(['happy-path', 'failure', 'what-if']),
  initialSnapshot: SnapshotSchema,
  transitions: z.array(GeneratedTransitionSchema).min(3).max(9),
  terminalState: z.enum(['success', 'degraded', 'failed']),
  terminalSummary: boundedText(5, 400),
})

const GeneratedInvariantSchema = z.strictObject({
  id: boundedText(1, 48).regex(/^[a-z][a-z0-9-]*$/),
  label: boundedText(3, 180),
  stateKey: boundedText(1, 80),
  operator: z.enum(['eq', 'neq', 'gte', 'lte', 'includes']),
  expected: SimulationScalarSchema,
})

export const GeneratedSimulationSchema = z.strictObject({
  learningObjective: boundedText(10, 300),
  misconception: boundedText(10, 300),
  takeaway: boundedText(10, 300),
  actors: z.array(GeneratedActorSchema).min(2).max(6),
  scenarios: z.array(GeneratedScenarioSchema).min(1).max(2),
  invariants: z.array(GeneratedInvariantSchema).min(1).max(5),
})

export type QuestionGenerateRequest = z.infer<typeof QuestionGenerateRequestSchema>
export type SimulationGenerateRequest = z.infer<typeof SimulationGenerateRequestSchema>
export type GeneratedQuestionBatch = z.infer<typeof GeneratedQuestionBatchSchema>
export type GeneratedSimulation = z.infer<typeof GeneratedSimulationSchema>

