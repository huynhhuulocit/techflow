import { lazy, Suspense, useEffect, useRef, useState } from 'react'
import { ArrowLeft, CircleAlert, Code2, RotateCcw } from 'lucide-react'
import type { LocalizedInterviewQuestion } from '../content/types'
import { loadInterviewRepository, type InterviewRepository } from '../interview/interviewRepository'
import { useLocale } from '../i18n'
import { InterviewBank } from './InterviewBank'
import { InterviewQuestionView } from './InterviewQuestionView'
import { LocaleSwitcher } from './LocaleSwitcher'

type InterviewExperienceProps = {
  onBack: () => void
  authorStudioEnabled?: boolean
}

const QuestionStudio = lazy(() => import('./QuestionStudio'))

function InterviewLocaleState({ kind, onBackToList, onHome, onRetry }: {
  kind: 'loading' | 'error' | 'missing'
  onBackToList: () => void
  onHome: () => void
  onRetry: () => void
}) {
  const { copy } = useLocale()
  const title = kind === 'loading'
    ? copy.interview.loading
    : kind === 'error'
      ? copy.interview.loadErrorTitle
      : copy.interview.missingTitle
  const body = kind === 'error'
    ? copy.interview.loadErrorBody
    : kind === 'missing'
      ? copy.interview.missingBody
      : null

  return <main className="interview-shell interview-locale-page">
    <header className="interview-header">
      <button type="button" className="interview-brand" onClick={onHome} aria-label={copy.interview.homeLabel}>
        <span aria-hidden="true"><Code2 size={20}/></span>Tech<span>Flow</span>
      </button>
      <div className="interview-header-actions">
        <LocaleSwitcher compact/>
        <button type="button" className="interview-header-back" onClick={onBackToList} aria-label={copy.interview.backToList}>
          <ArrowLeft size={18} aria-hidden="true"/><span>{copy.interview.backToList}</span>
        </button>
      </div>
    </header>
    <section className="interview-locale-state" role={kind === 'error' ? 'alert' : 'status'}>
      <CircleAlert size={34} aria-hidden="true"/>
      <h1>{title}</h1>
      {body && <p>{body}</p>}
      {kind === 'error' && <button type="button" onClick={onRetry}><RotateCcw size={16} aria-hidden="true"/> {copy.interview.retry}</button>}
      {kind === 'missing' && <button type="button" onClick={onBackToList}>{copy.interview.browseAvailable}</button>}
    </section>
  </main>
}

export default function InterviewExperience({ onBack, authorStudioEnabled = false }: InterviewExperienceProps) {
  const { locale, copy } = useLocale()
  const [selectedQuestionId, setSelectedQuestionId] = useState<string | null>(null)
  const [studioSeed, setStudioSeed] = useState<LocalizedInterviewQuestion | null>(null)
  const [repository, setRepository] = useState<InterviewRepository | null>(null)
  const [loadError, setLoadError] = useState(false)
  const [retryVersion, setRetryVersion] = useState(0)
  const lastOpenedQuestionId = useRef<string | null>(null)
  const bankScrollY = useRef(0)
  const currentRepository = repository?.locale === locale ? repository : null
  const selectedQuestion = selectedQuestionId
    ? currentRepository?.getQuestion(selectedQuestionId) ?? null
    : null
  const adjacent = selectedQuestion ? currentRepository?.getAdjacent(selectedQuestion.id) ?? null : null
  const previousQuestionId = adjacent?.previous?.id
  const nextQuestionId = adjacent?.next?.id

  useEffect(() => {
    let active = true
    setLoadError(false)

    loadInterviewRepository(locale).then(nextRepository => {
      if (active) setRepository(nextRepository)
    }).catch(() => {
      if (active) setLoadError(true)
    })

    return () => { active = false }
  }, [locale, retryVersion])

  const openQuestion = (question: LocalizedInterviewQuestion) => {
    lastOpenedQuestionId.current = question.id
    bankScrollY.current = window.scrollY
    setSelectedQuestionId(question.id)
  }

  const returnToBank = () => {
    setSelectedQuestionId(null)

    requestAnimationFrame(() => {
      window.scrollTo({ top: bankScrollY.current, behavior: 'auto' })
      const previousCard = lastOpenedQuestionId.current
        ? document.getElementById(`interview-question-${lastOpenedQuestionId.current}`)
        : null
      ;(previousCard ?? document.getElementById('interview-bank-title'))?.focus({ preventScroll: true })
    })
  }

  const returnFromStudio = () => {
    setStudioSeed(null)
    requestAnimationFrame(() => document.getElementById('interview-open-studio')?.focus({ preventScroll: true }))
  }

  return <>
    {studioSeed && <Suspense fallback={<main className="app-loading" aria-live="polite">{copy.home.authorStudioLoading}</main>}>
      <QuestionStudio seed={studioSeed} onBack={returnFromStudio}/>
    </Suspense>}
    <div hidden={studioSeed !== null}>
      <div hidden={selectedQuestionId !== null}>
        <InterviewBank
          repository={currentRepository}
          loadError={loadError}
          onRetry={() => setRetryVersion(version => version + 1)}
          onBack={onBack}
          onOpen={openQuestion}
        />
      </div>
      {selectedQuestionId && !currentRepository && <InterviewLocaleState
        kind={loadError ? 'error' : 'loading'}
        onBackToList={returnToBank}
        onHome={onBack}
        onRetry={() => setRetryVersion(version => version + 1)}
      />}
      {selectedQuestionId && currentRepository && !selectedQuestion && <InterviewLocaleState
        kind="missing"
        onBackToList={returnToBank}
        onHome={onBack}
        onRetry={() => setRetryVersion(version => version + 1)}
      />}
      {selectedQuestion && <InterviewQuestionView
        question={selectedQuestion}
        onBack={returnToBank}
        onHome={onBack}
        onOpenStudio={authorStudioEnabled ? () => setStudioSeed(selectedQuestion) : undefined}
        onPrevious={previousQuestionId ? () => setSelectedQuestionId(previousQuestionId) : undefined}
        onNext={nextQuestionId ? () => setSelectedQuestionId(nextQuestionId) : undefined}
      />}
    </div>
  </>
}
