export type Difficulty = 'Cơ bản' | 'Trung cấp' | 'Nâng cao'

export type InterviewLevel = 'junior' | 'middle' | 'senior'

export type Locale = 'vi' | 'en'

export type InterviewReviewStatus = 'imported-needs-review' | 'reviewed'

export type InterviewReviewMetadata = {
  reviewer: string
  reviewedAt: string
  evidence: {
    label: string
    url: string
  }[]
  contentHash: string
}

export type InterviewTopic = {
  slug: string
  title: string
  description: string
  aliases: string[]
}

export type InterviewQuestionCopy = {
  question: string
  quickAnswer: string
  conceptualExplanation: string
  productionTradeOff: string
  appliedExample: {
    label: string
    detail: string
  }
}

type InterviewQuestionContent = InterviewQuestionCopy & {
  id: string
  topicSlug: string
  level: InterviewLevel
  position: number
  source: {
    relativePath: string
    anchor: string
  }
}

export type InterviewQuestion = InterviewQuestionContent & (
  | {
      reviewStatus: 'imported-needs-review'
      review?: never
    }
  | {
      reviewStatus: 'reviewed'
      review: InterviewReviewMetadata
    }
)

export type InterviewTranslationStatus = 'ai-translated-needs-review' | 'reviewed'

type InterviewTranslationBase = InterviewQuestionCopy & {
  questionId: string
  locale: 'en'
  translatedFromHash: string
  provenance: {
    kind: 'ai-translated'
    generatedAt: string
    generator: string
  }
}

type InterviewTranslationReviewState =
  | {
      translationStatus: 'ai-translated-needs-review'
      translationReview?: never
    }
  | {
      translationStatus: 'reviewed'
      translationReview: InterviewReviewMetadata
    }

export type InterviewTranslation = InterviewTranslationBase & InterviewTranslationReviewState

export type LocalizedInterviewQuestion = InterviewQuestion & (
  | {
      locale: 'vi'
      translationStatus?: never
      translatedFromHash?: never
      translationProvenance?: never
      translationReview?: never
    }
  | ({
      locale: 'en'
      translatedFromHash: string
      translationProvenance: InterviewTranslation['provenance']
    } & InterviewTranslationReviewState)
)

export type QuestionDraftProvenanceKind = 'manual' | 'json-import' | 'markdown-import' | 'question-bank-copy' | 'ai-generated'

export type QuestionDraft = {
  schemaVersion: 1
  id: string
  locale: Locale
  topicSlug: string
  level: InterviewLevel
  content: InterviewQuestionCopy
  sourceNotes: string
  lifecycle: 'draft'
  reviewStatus: 'draft-needs-review' | 'generated-needs-review'
  provenance: {
    kind: QuestionDraftProvenanceKind
    createdAt: string
    model?: string
    promptVersion?: string
    responseId?: string
    inputHash?: string
    sourceQuestion?: {
      questionId: string
      locale: Locale
      contentHash: string
    }
  }
  simulation?: QuestionSimulationSpec
}

export type SimulationKind = 'sequence' | 'flow' | 'state'

export type SimulationScalar = string | number | boolean | null

export type SimulationActor = {
  id: string
  label: string
  role: string
  iconToken: 'client' | 'server' | 'database' | 'queue' | 'cache' | 'service' | 'runtime'
}

export type SimulationTransition = {
  id: string
  actorId: string
  event: string
  explanation: string
  snapshot: Record<string, SimulationScalar>
  highlights: string[]
}

export type SimulationScenario = {
  id: string
  label: string
  kind: 'happy-path' | 'failure' | 'what-if'
  initialSnapshot: Record<string, SimulationScalar>
  transitions: SimulationTransition[]
  terminalState: 'success' | 'degraded' | 'failed'
  terminalSummary: string
}

export type SimulationInvariant = {
  id: string
  label: string
  stateKey: string
  operator: 'eq' | 'neq' | 'gte' | 'lte' | 'includes'
  expected: SimulationScalar
}

export type SimulationStateField = {
  key: string
  label: string
  description: string
}

export type SimulationPlaybackSpec = {
  id: string
  locale: Locale
  kind: SimulationKind
  learningObjective: string
  misconception: string
  takeaway: string
  actors: SimulationActor[]
  scenarios: SimulationScenario[]
  invariants: SimulationInvariant[]
}

export type SimulationGeneration = {
  model: string
  promptVersion: string
  generatedAt: string
  responseId?: string
  inputHash: string
}

/** Question Studio payload retained as schema v1 for saved-draft compatibility. */
export type QuestionSimulationSpec = SimulationPlaybackSpec & {
  schemaVersion: 1
  sourceQuestionId: string
  sourceContentHash: string
  status: 'generated-needs-review' | 'reviewed'
  generation: SimulationGeneration
  review?: InterviewReviewMetadata
}

export type LessonSimulationSource = {
  kind: 'lesson'
  slug: string
  contentHash: string
}

export type LessonSimulationProvenance =
  | {
      kind: 'authored'
      author: string
      createdAt: string
    }
  | ({ kind: 'ai-generated' } & SimulationGeneration)

/** Lesson-bound payload with explicit source and authorship provenance. */
export type LessonSimulationSpec = SimulationPlaybackSpec & {
  schemaVersion: 2
  source: LessonSimulationSource
  stateFields: SimulationStateField[]
  provenance: LessonSimulationProvenance
  status: 'draft-needs-review' | 'generated-needs-review' | 'reviewed'
  review?: InterviewReviewMetadata
}

export type SimulationSpec = QuestionSimulationSpec | LessonSimulationSpec

export type WorkflowStep = {
  id: string
  title: string
  actor: string
  detail: string
  color: string
}

export type LessonActor = {
  id: string
  label: string
  responsibility: string
}

export type LessonMechanismStep = {
  id: string
  actorId: string
  title: string
  detail: string
}

export type LessonProductionTradeOff = {
  title: string
  benefit: string
  cost: string
  decisionRule: string
}

export type LessonMisconception = {
  claim: string
  correction: string
}

export type LessonAppliedExample = {
  label: string
  summary: string
  steps: string[]
}

export type LessonEvidence = {
  label: string
  url: string
  note?: string
}

export type LessonContent = {
  scope: string
  mentalModel: string
  conceptualExplanation: string
  actors: LessonActor[]
  mechanism: LessonMechanismStep[]
  productionTradeOffs: LessonProductionTradeOff[]
  misconceptions: LessonMisconception[]
  appliedExample: LessonAppliedExample
  evidence: LessonEvidence[]
}

export type LessonReviewStatus = 'draft-needs-review' | 'reviewed'

export type LessonTranslationStatus = 'translated-needs-review' | 'reviewed'

export type LessonReviewMetadata = InterviewReviewMetadata

export type LessonTechnicalReviewState =
  | {
      reviewStatus: 'draft-needs-review'
      review?: never
    }
  | {
      reviewStatus: 'reviewed'
      review: LessonReviewMetadata
    }

export type LessonTranslationReviewState =
  | {
      translationStatus: 'translated-needs-review'
      translatedFromHash: string
      translationReview?: never
    }
  | {
      translationStatus: 'reviewed'
      translatedFromHash: string
      translationReview: LessonReviewMetadata
    }

type LessonBase = {
  slug: string
  title: string
  shortAnswer: string
  category: string
  difficulty: Difficulty
  duration: number
  tags: string[]
  progress: number
  featured?: boolean
  workflow: WorkflowStep[]
  followUps: string[]
  search: {
    aliases: string[]
    concepts: string[]
    relatedSlugs: string[]
  }
}

/**
 * Compact lessons remain valid while they are migrated to the rich three-layer
 * content model. They cannot claim a technical or translation review because
 * there is no rich content payload for that review to attest to.
 */
export type LegacyLesson = LessonBase & {
  content?: never
  simulation?: never
  locale?: never
  reviewStatus?: never
  review?: never
  translationStatus?: never
  translatedFromHash?: never
  translationReview?: never
}

type RichVietnameseLesson = LessonBase & {
  content: LessonContent
  simulation?: LessonSimulationSpec
  locale: 'vi'
  translationStatus?: never
  translatedFromHash?: never
  translationReview?: never
}

type RichEnglishLesson = LessonBase & {
  content: LessonContent
  simulation?: LessonSimulationSpec
  locale: 'en'
} & LessonTranslationReviewState

/**
 * Technical review and English translation review are independent assertions.
 * Both hashes bind to the complete claim-bearing lesson payload rather than to
 * the nested rich-content object alone.
 */
export type RichLesson = (RichVietnameseLesson | RichEnglishLesson) & LessonTechnicalReviewState

export type Lesson = LegacyLesson | RichLesson

export type SearchRelation = {
  concepts: string[]
  title: string
  summary: string
  connections: { from: string; to: string; label: string }[]
  suggestions: string[]
}

export type SearchResult = {
  lesson: Lesson
  score: number
  matchedTerms: string[]
}
