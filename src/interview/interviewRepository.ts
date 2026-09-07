import { getInterviewTopics } from '../content/interviewTopics'
import type { InterviewLevel, InterviewQuestion, LocalizedInterviewQuestion, Locale } from '../content/types'

export type InterviewQuestionQuery = {
  query?: string
  topicSlug?: string
  level?: InterviewLevel
  page?: number
  pageSize?: number
}

export type InterviewQuestionQueryResult = {
  items: LocalizedInterviewQuestion[]
  total: number
  page: number
  pageSize: number
  totalPages: number
}

export type InterviewRepository = {
  locale: Locale
  questions: readonly LocalizedInterviewQuestion[]
  query: (input?: InterviewQuestionQuery) => InterviewQuestionQueryResult
  getQuestion: (id: string) => LocalizedInterviewQuestion | null
  getAdjacent: (id: string) => {
    previous: LocalizedInterviewQuestion | null
    next: LocalizedInterviewQuestion | null
  }
}

const defaultPageSize = 12
const maximumPageSize = 100
const repositoryCache = new Map<Locale, Promise<InterviewRepository>>()

function normalizeSearchText(value: string) {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/gu, '')
    .replace(/đ/giu, 'd')
    .toLowerCase()
    .replace(/[^a-z0-9]+/gu, ' ')
    .replace(/\s+/gu, ' ')
    .trim()
}

function toPositiveInteger(value: number | undefined, fallback: number) {
  if (!Number.isFinite(value)) return fallback
  return Math.max(1, Math.floor(value ?? fallback))
}

function createInterviewRepository(
  locale: Locale,
  questions: readonly LocalizedInterviewQuestion[],
): InterviewRepository {
  const questionById = new Map(questions.map(question => [question.id, question]))
  const questionIndexById = new Map(questions.map((question, index) => [question.id, index]))
  const topicBySlug = new Map(getInterviewTopics(locale).map(topic => [topic.slug, topic]))
  const searchableTextById = new Map(questions.map(question => {
    const topic = topicBySlug.get(question.topicSlug)
    const searchableText = normalizeSearchText([
      question.question,
      question.quickAnswer,
      question.conceptualExplanation,
      question.productionTradeOff,
      question.appliedExample.detail,
      topic?.title ?? '',
      ...(topic?.aliases ?? []),
    ].join(' '))

    return [question.id, searchableText]
  }))

  return {
    locale,
    questions,
    query(input = {}) {
      const queryTerms = normalizeSearchText(input.query ?? '').split(' ').filter(Boolean)
      const requestedPage = toPositiveInteger(input.page, 1)
      const pageSize = Math.min(toPositiveInteger(input.pageSize, defaultPageSize), maximumPageSize)
      const matches = questions.filter(question => {
        if (input.topicSlug && question.topicSlug !== input.topicSlug) return false
        if (input.level && question.level !== input.level) return false
        if (!queryTerms.length) return true

        const searchableText = searchableTextById.get(question.id) ?? ''
        return queryTerms.every(term => searchableText.includes(term))
      })

      const total = matches.length
      const totalPages = Math.max(1, Math.ceil(total / pageSize))
      const page = Math.min(requestedPage, totalPages)
      const start = (page - 1) * pageSize

      return {
        items: matches.slice(start, start + pageSize),
        total,
        page,
        pageSize,
        totalPages,
      }
    },
    getQuestion(id) {
      return questionById.get(id) ?? null
    },
    getAdjacent(id) {
      const index = questionIndexById.get(id)
      if (index === undefined) return { previous: null, next: null }

      return {
        previous: questions[index - 1] ?? null,
        next: questions[index + 1] ?? null,
      }
    },
  }
}

function localizeVietnameseQuestions(
  questions: readonly InterviewQuestion[],
): LocalizedInterviewQuestion[] {
  return questions.map(question => ({ ...question, locale: 'vi' }))
}

/**
 * Loads only the selected locale bundle. Both imports stay literal so Vite can
 * split the 585-question Vietnamese snapshot from the English pilot bundle.
 */
export function loadInterviewRepository(locale: Locale): Promise<InterviewRepository> {
  const cached = repositoryCache.get(locale)
  if (cached) return cached

  const promise = locale === 'vi'
    ? import('../content/generated/gameStreamInterview').then(module => createInterviewRepository(
        'vi',
        localizeVietnameseQuestions(module.gameStreamInterviewQuestions),
      ))
    : import('../content/generated/gameStreamInterview.en').then(module => createInterviewRepository(
        'en',
        module.gameStreamInterviewEnglishQuestions,
      ))

  repositoryCache.set(locale, promise)
  promise.catch(() => repositoryCache.delete(locale))
  return promise
}

export function clearInterviewRepositoryCache() {
  repositoryCache.clear()
}
