import type {
  InterviewLevel,
  InterviewQuestion,
  Locale,
  LocalizedInterviewQuestion,
  QuestionDraft,
} from '../content/types'
import { questionContentHash } from './questionContentHash'

function fallbackId() {
  const randomPart = globalThis.crypto?.randomUUID?.()
    ?? `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`
  return `draft-${randomPart}`
}

export type DraftFactoryOptions = {
  id?: string
  now?: Date
  locale?: Locale
  topicSlug?: string
  level?: InterviewLevel
}

export function createEmptyDraft(options: DraftFactoryOptions = {}): QuestionDraft {
  return {
    schemaVersion: 1,
    id: options.id ?? fallbackId(),
    locale: options.locale ?? 'vi',
    topicSlug: options.topicSlug ?? 'typescript',
    level: options.level ?? 'junior',
    content: {
      question: '',
      quickAnswer: '',
      conceptualExplanation: '',
      productionTradeOff: '',
      appliedExample: {
        label: options.locale === 'en' ? 'Applied example' : 'Ví dụ áp dụng',
        detail: '',
      },
    },
    sourceNotes: '',
    lifecycle: 'draft',
    reviewStatus: 'draft-needs-review',
    provenance: {
      kind: 'manual',
      createdAt: (options.now ?? new Date()).toISOString(),
    },
  }
}

type SeedQuestion = InterviewQuestion | LocalizedInterviewQuestion

export function createDraftFromInterviewQuestion(
  question: SeedQuestion,
  options: Pick<DraftFactoryOptions, 'id' | 'now'> = {},
): QuestionDraft {
  const locale: Locale = 'locale' in question ? question.locale : 'vi'
  const draft = createEmptyDraft({
    id: options.id,
    now: options.now,
    locale,
    topicSlug: question.topicSlug,
    level: question.level,
  })

  return {
    ...draft,
    content: {
      question: question.question,
      quickAnswer: question.quickAnswer,
      conceptualExplanation: question.conceptualExplanation,
      productionTradeOff: question.productionTradeOff,
      appliedExample: { ...question.appliedExample },
    },
    sourceNotes: locale === 'en'
      ? `Seeded from ${question.source.relativePath}#${question.source.anchor}.`
      : `Seed từ ${question.source.relativePath}#${question.source.anchor}.`,
    provenance: {
      kind: 'question-bank-copy',
      createdAt: (options.now ?? new Date()).toISOString(),
      sourceQuestion: {
        questionId: question.id,
        locale,
        contentHash: questionContentHash(question),
      },
    },
  }
}

export function cloneDraftAsNew(source: QuestionDraft, options: Pick<DraftFactoryOptions, 'id' | 'now'> = {}) {
  const cloned = createEmptyDraft({
    id: options.id,
    now: options.now,
    locale: source.locale,
    topicSlug: source.topicSlug,
    level: source.level,
  })
  return {
    ...cloned,
    content: {
      ...source.content,
      question: source.locale === 'en'
        ? `${source.content.question} (copy)`
        : `${source.content.question} (bản sao)`,
      appliedExample: { ...source.content.appliedExample },
    },
    sourceNotes: source.sourceNotes,
  } satisfies QuestionDraft
}
