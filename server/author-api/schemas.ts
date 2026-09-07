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

const HASH_PATTERN = /^[a-f0-9]{64}$/u
const SAFE_ID_PATTERN = /^[a-zA-Z0-9][a-zA-Z0-9._:-]{0,127}$/u
const SAFE_STATE_KEY_PATTERN = /^(?!__proto__$|prototype$|constructor$)[a-zA-Z][a-zA-Z0-9._:-]{0,63}$/u
const claimText = (minimum: number, maximum: number) => z.string()
  .max(maximum)
  .refine(value => value.trim().length >= minimum, `Must contain at least ${minimum} non-whitespace character(s).`)

const WorkflowStepSchema = z.strictObject({
  id: claimText(1, 128),
  title: claimText(1, 240),
  actor: claimText(1, 160),
  detail: claimText(1, 2_000),
  color: claimText(1, 48),
})

const LessonActorSchema = z.strictObject({
  id: claimText(1, 128).regex(SAFE_ID_PATTERN),
  label: claimText(1, 120),
  responsibility: claimText(1, 1_000),
})

const LessonMechanismStepSchema = z.strictObject({
  id: claimText(1, 128),
  actorId: claimText(1, 128).regex(SAFE_ID_PATTERN),
  title: claimText(1, 240),
  detail: claimText(1, 2_000),
})

const LessonProductionTradeOffSchema = z.strictObject({
  title: claimText(1, 240),
  benefit: claimText(1, 1_500),
  cost: claimText(1, 1_500),
  decisionRule: claimText(1, 1_500),
})

const LessonMisconceptionSchema = z.strictObject({
  claim: claimText(1, 1_000),
  correction: claimText(1, 1_500),
})

const LessonAppliedExampleSchema = z.strictObject({
  label: claimText(1, 160),
  summary: claimText(1, 1_500),
  steps: z.array(claimText(1, 1_500)).min(1).max(20),
})

const LessonEvidenceSchema = z.strictObject({
  label: claimText(1, 160),
  url: claimText(1, 1_000).pipe(z.url()).refine(value => new URL(value).protocol === 'https:', 'Evidence URL must use HTTPS.'),
  note: claimText(1, 1_000).optional(),
})

/**
 * Exact claim-bearing lesson payload sent by the browser. Review metadata,
 * learner progress, merchandising state, and any existing simulation are
 * deliberately excluded so the server can independently verify the source
 * binding without accepting a client-authored hash on trust.
 */
const LessonClaimContentSchema = z.strictObject({
  scope: claimText(1, 2_000),
  mentalModel: claimText(1, 2_000),
  conceptualExplanation: claimText(1, 6_000),
  actors: z.array(LessonActorSchema).min(2).max(6),
  mechanism: z.array(LessonMechanismStepSchema).min(1).max(40),
  productionTradeOffs: z.array(LessonProductionTradeOffSchema).min(1).max(20),
  misconceptions: z.array(LessonMisconceptionSchema).min(1).max(20),
  appliedExample: LessonAppliedExampleSchema,
  evidence: z.array(LessonEvidenceSchema).min(1).max(30),
}).superRefine((content, context) => {
  const actorIds = new Set<string>()
  content.actors.forEach((actor, index) => {
    if (actorIds.has(actor.id)) {
      context.addIssue({
        code: 'custom',
        path: ['actors', index, 'id'],
        message: 'Lesson actor IDs must be unique.',
      })
    }
    actorIds.add(actor.id)
  })
  content.mechanism.forEach((step, index) => {
    if (!actorIds.has(step.actorId)) {
      context.addIssue({
        code: 'custom',
        path: ['mechanism', index, 'actorId'],
        message: 'Mechanism actorId must reference a lesson actor.',
      })
    }
  })
})

export const LessonClaimSourceSchema = z.strictObject({
  schemaVersion: z.literal(1),
  slug: claimText(1, 128).regex(SAFE_ID_PATTERN),
  title: claimText(1, 300),
  shortAnswer: claimText(1, 2_000),
  category: claimText(1, 120),
  difficulty: z.enum(['Cơ bản', 'Trung cấp', 'Nâng cao']),
  duration: z.number().int().min(1).max(600),
  tags: z.array(claimText(1, 80)).max(30),
  workflow: z.array(WorkflowStepSchema).max(30),
  followUps: z.array(claimText(1, 500)).max(30),
  search: z.strictObject({
    aliases: z.array(claimText(1, 160)).max(30),
    concepts: z.array(claimText(1, 160)).max(30),
    relatedSlugs: z.array(claimText(1, 128)).max(30),
  }),
  locale: LocaleSchema,
  content: LessonClaimContentSchema,
})

export const LessonSimulationGenerateRequestSchema = z.strictObject({
  source: LessonClaimSourceSchema,
  sourceContentHash: z.string().regex(HASH_PATTERN),
  kind: SimulationKindSchema,
  failureScenario: z.string().trim().max(800),
})

const SimulationScalarSchema = z.union([z.string().max(80), z.number(), z.boolean(), z.null()])
const GeneratedStateEntrySchema = z.strictObject({
  key: boundedText(1, 32).regex(SAFE_STATE_KEY_PATTERN),
  value: SimulationScalarSchema,
})

const GeneratedActorSchema = z.strictObject({
  id: boundedText(1, 128).regex(SAFE_ID_PATTERN),
  label: boundedText(1, 80),
  role: boundedText(1, 160),
  iconToken: z.enum(['client', 'server', 'database', 'queue', 'cache', 'service', 'runtime']),
})

const GeneratedTransitionSchema = z.strictObject({
  id: boundedText(1, 48).regex(SAFE_ID_PATTERN),
  actorId: boundedText(1, 128).regex(SAFE_ID_PATTERN),
  event: boundedText(2, 100),
  explanation: boundedText(10, 280),
  state: z.array(GeneratedStateEntrySchema).min(1).max(6),
  highlights: z.array(boundedText(1, 128)).max(4),
})

const GeneratedScenarioSchema = z.strictObject({
  id: boundedText(1, 48).regex(SAFE_ID_PATTERN),
  label: boundedText(1, 80),
  kind: z.enum(['happy-path', 'failure', 'what-if']),
  initialState: z.array(GeneratedStateEntrySchema).min(1).max(6),
  transitions: z.array(GeneratedTransitionSchema).min(3).max(6),
  terminalState: z.enum(['success', 'degraded', 'failed']),
  terminalSummary: boundedText(5, 400),
})

const GeneratedInvariantSchema = z.strictObject({
  id: boundedText(1, 48).regex(SAFE_ID_PATTERN),
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

const GeneratedLessonStateFieldSchema = z.strictObject({
  key: boundedText(1, 32).regex(SAFE_STATE_KEY_PATTERN),
  label: boundedText(1, 100),
  description: boundedText(5, 240),
})

const GeneratedLessonTransitionSchema = z.strictObject({
  id: boundedText(1, 48).regex(SAFE_ID_PATTERN),
  actorId: boundedText(1, 128).regex(SAFE_ID_PATTERN),
  event: boundedText(2, 100),
  explanation: boundedText(10, 280),
  state: z.array(GeneratedStateEntrySchema).min(1).max(6),
  highlights: z.array(boundedText(1, 128)).max(4),
})

const GeneratedLessonScenarioSchema = z.strictObject({
  id: boundedText(1, 48).regex(SAFE_ID_PATTERN),
  label: boundedText(1, 80),
  kind: z.enum(['happy-path', 'failure', 'what-if']),
  initialState: z.array(GeneratedStateEntrySchema).min(1).max(6),
  transitions: z.array(GeneratedLessonTransitionSchema).min(3).max(6),
  terminalState: z.enum(['success', 'degraded', 'failed']),
  terminalSummary: boundedText(5, 400),
})

/** Provider-owned instructional fields only. Identity, source binding, review
 * state, and provenance are intentionally absent and are added by the server. */
export const GeneratedLessonSimulationSchema = z.strictObject({
  learningObjective: boundedText(10, 300),
  misconception: boundedText(10, 300),
  takeaway: boundedText(10, 300),
  actors: z.array(GeneratedActorSchema).min(2).max(6),
  stateFields: z.array(GeneratedLessonStateFieldSchema).min(1).max(6),
  scenarios: z.array(GeneratedLessonScenarioSchema).min(1).max(2),
  invariants: z.array(GeneratedInvariantSchema).min(1).max(5),
})

export type QuestionGenerateRequest = z.infer<typeof QuestionGenerateRequestSchema>
export type SimulationGenerateRequest = z.infer<typeof SimulationGenerateRequestSchema>
export type LessonClaimSource = z.infer<typeof LessonClaimSourceSchema>
export type LessonSimulationGenerateRequest = z.infer<typeof LessonSimulationGenerateRequestSchema>
export type GeneratedQuestionBatch = z.infer<typeof GeneratedQuestionBatchSchema>
export type GeneratedSimulation = z.infer<typeof GeneratedSimulationSchema>
export type GeneratedLessonSimulation = z.infer<typeof GeneratedLessonSimulationSchema>
