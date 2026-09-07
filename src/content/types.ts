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
  simulation?: SimulationSpec
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

export type SimulationSpec = {
  schemaVersion: 1
  id: string
  sourceQuestionId: string
  sourceContentHash: string
  locale: Locale
  kind: SimulationKind
  learningObjective: string
  misconception: string
  takeaway: string
  actors: SimulationActor[]
  scenarios: SimulationScenario[]
  invariants: SimulationInvariant[]
  status: 'generated-needs-review' | 'reviewed'
  generation: {
    model: string
    promptVersion: string
    generatedAt: string
    responseId?: string
    inputHash: string
  }
  review?: InterviewReviewMetadata
}

export type WorkflowStep = {
  id: string
  title: string
  actor: string
  detail: string
  color: string
}

export type Lesson = {
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
