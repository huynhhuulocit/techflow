import { useEffect, useMemo, useState } from 'react'
import {
  ArrowLeft,
  ArrowRight,
  BookOpenCheck,
  ChevronLeft,
  ChevronRight,
  CircleAlert,
  Code2,
  RotateCcw,
  Search,
  ShieldAlert,
  SlidersHorizontal,
} from 'lucide-react'
import { getInterviewTopics, interviewLevelLabels } from '../content/interviewTopics'
import type { InterviewLevel, LocalizedInterviewQuestion } from '../content/types'
import type { InterviewRepository } from '../interview/interviewRepository'
import { useLocale } from '../i18n'
import '../interview/interview.css'
import { LocaleSwitcher } from './LocaleSwitcher'

const PAGE_SIZE = 20

type InterviewBankProps = {
  repository: InterviewRepository | null
  loadError: boolean
  onRetry: () => void
  onBack: () => void
  onOpen: (question: LocalizedInterviewQuestion) => void
}

type PaginationItem = number | 'start-ellipsis' | 'end-ellipsis'

function getPaginationItems(currentPage: number, totalPages: number): PaginationItem[] {
  if (totalPages <= 7) return Array.from({ length: totalPages }, (_, index) => index + 1)

  const visible = new Set([1, totalPages, currentPage - 1, currentPage, currentPage + 1])
  const pages = [...visible].filter(page => page > 0 && page <= totalPages).sort((a, b) => a - b)
  const items: PaginationItem[] = []

  pages.forEach((page, index) => {
    const previous = pages[index - 1]
    if (previous && page - previous > 1) {
      items.push(previous === 1 ? 'start-ellipsis' : 'end-ellipsis')
    }
    items.push(page)
  })

  return items
}

const isTechnicalReviewPending = (question: LocalizedInterviewQuestion) => (
  question.reviewStatus === 'imported-needs-review'
)

const isTranslationReviewPending = (question: LocalizedInterviewQuestion) => (
  question.locale === 'en' && question.translationStatus === 'ai-translated-needs-review'
)

export function InterviewBank({ repository, loadError, onRetry, onBack, onOpen }: InterviewBankProps) {
  const { locale, copy } = useLocale()
  const [query, setQuery] = useState('')
  const [topicSlug, setTopicSlug] = useState('all')
  const [level, setLevel] = useState<InterviewLevel | 'all'>('all')
  const [page, setPage] = useState(1)
  const topics = getInterviewTopics(locale)
  const availableTopicSlugs = useMemo(
    () => new Set(repository?.questions.map(question => question.topicSlug) ?? []),
    [repository],
  )
  const availableTopics = useMemo(
    () => topics.filter(topic => availableTopicSlugs.has(topic.slug)),
    [availableTopicSlugs, topics],
  )

  useEffect(() => {
    if (!repository || topicSlug === 'all' || availableTopicSlugs.has(topicSlug)) return
    setTopicSlug('all')
    setPage(1)
  }, [availableTopicSlugs, repository, topicSlug])

  const results = useMemo(() => repository?.query({
    query,
    topicSlug: topicSlug === 'all' ? undefined : topicSlug,
    level: level === 'all' ? undefined : level,
    page,
    pageSize: PAGE_SIZE,
  }) ?? {
    items: [],
    total: 0,
    page: 1,
    pageSize: PAGE_SIZE,
    totalPages: 1,
  }, [level, page, query, repository, topicSlug])

  const topicBySlug = useMemo(() => new Map(topics.map(topic => [topic.slug, topic])), [topics])
  const paginationItems = getPaginationItems(results.page, results.totalPages)
  const firstResult = results.total === 0 ? 0 : (results.page - 1) * results.pageSize + 1
  const lastResult = Math.min(results.page * results.pageSize, results.total)
  const hasFilters = Boolean(query.trim()) || topicSlug !== 'all' || level !== 'all'
  const technicalReviewCount = repository?.questions.filter(isTechnicalReviewPending).length ?? 0
  const translationReviewCount = repository?.questions.filter(isTranslationReviewPending).length ?? 0

  function resetFilters() {
    setQuery('')
    setTopicSlug('all')
    setLevel('all')
    setPage(1)
  }

  return (
    <main className="interview-shell interview-bank-page">
      <header className="interview-header">
        <button type="button" className="interview-brand" onClick={onBack} aria-label={copy.interview.homeLabel}>
          <span aria-hidden="true"><Code2 size={20}/></span>
          Tech<span>Flow</span>
        </button>
        <div className="interview-header-actions">
          <LocaleSwitcher compact/>
          <button type="button" className="interview-header-back" onClick={onBack} aria-label={copy.interview.backToExplore}>
            <ArrowLeft size={18} aria-hidden="true"/>
            <span>{copy.interview.backToExplore}</span>
          </button>
        </div>
      </header>

      <section className="interview-bank-hero" aria-labelledby="interview-bank-title">
        <span className="interview-kicker"><BookOpenCheck size={16} aria-hidden="true"/> INTERVIEW QUESTION BANK</span>
        <h1 id="interview-bank-title" tabIndex={-1}>{copy.interview.heroTitle}</h1>
        <p>{copy.interview.heroDescription}</p>
        <span className="interview-coverage" aria-live="polite">
          {locale === 'en' ? copy.interview.englishCoverage : copy.interview.vietnameseCoverage}
        </span>
      </section>

      <section className="interview-bank-content" aria-label={copy.interview.bankAria}>
        {!repository ? (
          <div className="interview-load-state" role={loadError ? 'alert' : 'status'}>
            <CircleAlert size={28} aria-hidden="true"/>
            <h2>{loadError ? copy.interview.loadErrorTitle : copy.interview.loading}</h2>
            {loadError && <>
              <p>{copy.interview.loadErrorBody}</p>
              <button type="button" onClick={onRetry}><RotateCcw size={16} aria-hidden="true"/> {copy.interview.retry}</button>
            </>}
          </div>
        ) : <>
          <aside className="interview-bank-review-notice" aria-label={copy.interview.technicalPending}>
            <ShieldAlert size={20} aria-hidden="true"/>
            <div>
              <strong>{copy.interview.technicalReviewTitle(technicalReviewCount)}</strong>
              <p>{copy.interview.technicalReviewBody}</p>
              {locale === 'en' && <div className="interview-secondary-review-status">
                <strong>{copy.interview.translationReviewTitle(translationReviewCount)}</strong>
                <p>{copy.interview.translationReviewBody}</p>
              </div>}
            </div>
          </aside>

          <div className="interview-filter-panel">
            <div className="interview-filter-heading">
              <div><SlidersHorizontal size={18} aria-hidden="true"/><strong>{copy.interview.filterTitle}</strong></div>
              {hasFilters && <button type="button" className="interview-reset-button" onClick={resetFilters}><RotateCcw size={15} aria-hidden="true"/> {copy.interview.reset}</button>}
            </div>

            <div className="interview-filters">
              <label className="interview-search-field" htmlFor="interview-query">
                <span>{copy.interview.keyword}</span>
                <div><Search size={18} aria-hidden="true"/><input
                  id="interview-query"
                  type="search"
                  value={query}
                  onChange={event => { setQuery(event.target.value); setPage(1) }}
                  placeholder={copy.interview.searchPlaceholder}
                  autoComplete="off"
                /></div>
              </label>

              <label className="interview-select-field" htmlFor="interview-topic">
                <span>{copy.interview.topic}</span>
                <select id="interview-topic" value={topicSlug} onChange={event => { setTopicSlug(event.target.value); setPage(1) }}>
                  <option value="all">{copy.interview.allTopics}</option>
                  {availableTopics.map(topic => <option value={topic.slug} key={topic.slug}>{topic.title}</option>)}
                </select>
              </label>

              <fieldset className="interview-level-filter">
                <legend>{copy.interview.level}</legend>
                <div>
                  <button type="button" className={level === 'all' ? 'active' : ''} aria-pressed={level === 'all'} onClick={() => { setLevel('all'); setPage(1) }}>{copy.interview.allLevels}</button>
                  {(Object.keys(interviewLevelLabels) as InterviewLevel[]).map(item => <button
                    type="button"
                    className={level === item ? 'active' : ''}
                    aria-pressed={level === item}
                    onClick={() => { setLevel(item); setPage(1) }}
                    key={item}
                  >{interviewLevelLabels[item]}</button>)}
                </div>
              </fieldset>
            </div>
          </div>

          <div className="interview-result-summary" aria-live="polite" aria-atomic="true">
            <div><span className="interview-kicker">{copy.interview.resultsEyebrow}</span><h2>{copy.interview.questionCount(results.total)}</h2></div>
            {results.total > 0 && <p>{copy.interview.showing(firstResult, lastResult, results.total)}</p>}
          </div>

          {results.items.length > 0 ? <div className="interview-question-list">
            {results.items.map(question => {
              const topic = topicBySlug.get(question.topicSlug)
              return <button
                id={`interview-question-${question.id}`}
                type="button"
                className="interview-question-card"
                onClick={() => onOpen(question)}
                key={question.id}
              >
                <span className="interview-question-number" aria-hidden="true">{String(question.position).padStart(2, '0')}</span>
                <span className="interview-question-copy">
                  <span className="interview-card-meta">
                    <span>{topic?.title ?? question.topicSlug}</span>
                    <span className={`interview-level-badge ${question.level}`}>{interviewLevelLabels[question.level]}</span>
                    {isTechnicalReviewPending(question) && <span className="interview-card-review-status">{copy.interview.technicalReviewBadge}</span>}
                    {isTranslationReviewPending(question) && <span className="interview-card-review-status translation">{copy.interview.translationReviewBadge}</span>}
                  </span>
                  <strong>{question.question}</strong>
                  <span className="interview-answer-preview">{question.quickAnswer}</span>
                </span>
                <span className="interview-open-label">{copy.interview.viewAnswer} <ArrowRight size={17} aria-hidden="true"/></span>
              </button>
            })}
          </div> : <div className="interview-empty-state">
            <CircleAlert size={28} aria-hidden="true"/>
            <h2>{copy.interview.emptyTitle}</h2>
            <p>{copy.interview.emptyBody}</p>
            {hasFilters && <button type="button" onClick={resetFilters}><RotateCcw size={16} aria-hidden="true"/> {copy.interview.clearFilters}</button>}
          </div>}

          {results.totalPages > 1 && <nav className="interview-pagination" aria-label={copy.interview.pagination}>
            <button type="button" className="interview-page-direction" aria-label={copy.interview.previousPage} onClick={() => setPage(current => Math.max(1, current - 1))} disabled={results.page <= 1}>
              <ChevronLeft size={17} aria-hidden="true"/><span>{copy.interview.previousPage}</span>
            </button>
            <div className="interview-page-numbers">
              {paginationItems.map(item => typeof item === 'number' ? <button
                type="button"
                className={item === results.page ? 'active' : ''}
                aria-label={copy.interview.page(item)}
                aria-current={item === results.page ? 'page' : undefined}
                onClick={() => setPage(item)}
                key={item}
              >{item}</button> : <span aria-hidden="true" key={item}>…</span>)}
            </div>
            <span className="interview-mobile-page-status" aria-live="polite">{copy.interview.page(results.page, results.totalPages)}</span>
            <button type="button" className="interview-page-direction" aria-label={copy.interview.nextPage} onClick={() => setPage(current => Math.min(results.totalPages, current + 1))} disabled={results.page >= results.totalPages}>
              <span>{copy.interview.nextPage}</span><ChevronRight size={17} aria-hidden="true"/>
            </button>
          </nav>}
        </>}
      </section>
    </main>
  )
}
