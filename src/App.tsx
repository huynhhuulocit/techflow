import { lazy, Suspense, useEffect, useMemo, useRef, useState } from 'react'
import { ArrowLeft, ArrowRight, BookOpen, BrainCircuit, Clock, Code2, Download, Flame, Menu, Search, Sparkles, Target, Trash2, X } from 'lucide-react'
import { LocaleSwitcher } from './components/LocaleSwitcher'
import { LessonContentView } from './components/LessonContent'
import { SearchResults } from './components/SearchResults'
import { SimulationPlayer } from './components/SimulationPlayer'
import { WorkflowPlayer } from './components/WorkflowPlayer'
import { getLessons } from './content/lessons'
import { isRichLesson, lessonContentHash, validateLessonSimulationBinding } from './content/lessonValidation'
import { interviewQuestionCount, interviewQuestionCountByLocale, interviewTopics } from './content/interviewTopics'
import type { Lesson, LessonSimulationSpec, RichLesson } from './content/types'
import { useLocale } from './i18n'
import {
  getLessonSimulationDraft,
  LESSON_SIMULATION_DRAFT_STORAGE_KEY,
  removeLessonSimulationDraft,
  resetLessonSimulationDraftStore,
  upsertLessonSimulationDraft,
} from './author/lessonSimulationDraftStore'

const InterviewExperience = lazy(() => import('./components/InterviewExperience'))
const QuestionStudio = lazy(() => import('./components/QuestionStudio'))
const LessonSimulationStudio = lazy(() => import('./components/LessonSimulationStudio'))
const categories = ['JavaScript', 'TypeScript', 'SFCC', 'Backend', 'Database', 'System Design', 'AI Engineer']
const authorStudioEnabled = import.meta.env.DEV || import.meta.env.VITE_ENABLE_AUTHOR_STUDIO === 'true'
const mobileNavigationBreakpoint = 960
const lessonSectionIds = ['lesson-quick-answer', 'lesson-understand', 'lesson-simulation', 'lesson-follow-ups'] as const

function Logo() {
  return <div className="logo"><span aria-hidden="true"><Code2 size={20}/></span>Tech<span>Flow</span></div>
}

function App() {
  const { locale, copy } = useLocale()
  const [category, setCategory] = useState('all')
  const [query, setQuery] = useState('')
  const [searchQuery, setSearchQuery] = useState<string | null>(null)
  const [selectedSlug, setSelectedSlug] = useState<string | null>(null)
  const [showInterviewBank, setShowInterviewBank] = useState(false)
  const [showQuestionStudio, setShowQuestionStudio] = useState(false)
  const [mobileNavOpen, setMobileNavOpen] = useState(false)
  const mobileMenuButtonRef = useRef<HTMLButtonElement>(null)
  const siteHeaderRef = useRef<HTMLElement>(null)
  const localizedLessons = getLessons(locale)
  const selected = selectedSlug
    ? localizedLessons.find(lesson => lesson.slug === selectedSlug) ?? null
    : null
  const filtered = useMemo(() => localizedLessons.filter(lesson => (
    (category === 'all' || lesson.category === category)
    && lesson.title.toLowerCase().includes(query.toLowerCase())
  )), [category, localizedLessons, query])

  useEffect(() => {
    if (!mobileNavOpen) return

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key !== 'Escape') return
      mobileMenuButtonRef.current?.focus()
      setMobileNavOpen(false)
    }
    const handlePointerDown = (event: PointerEvent) => {
      if (!(event.target instanceof Node) || siteHeaderRef.current?.contains(event.target)) return
      setMobileNavOpen(false)
    }
    const handleResize = () => {
      if (window.innerWidth > mobileNavigationBreakpoint) setMobileNavOpen(false)
    }

    document.addEventListener('keydown', handleKeyDown)
    document.addEventListener('pointerdown', handlePointerDown)
    window.addEventListener('resize', handleResize)
    return () => {
      document.removeEventListener('keydown', handleKeyDown)
      document.removeEventListener('pointerdown', handlePointerDown)
      window.removeEventListener('resize', handleResize)
    }
  }, [mobileNavOpen])

  if (selected) return <LessonView lesson={selected} onBack={() => setSelectedSlug(null)} />
  if (showQuestionStudio && authorStudioEnabled) {
    return <Suspense fallback={<main className="app-loading" aria-live="polite">{copy.home.authorStudioLoading}</main>}>
      <QuestionStudio onBack={() => setShowQuestionStudio(false)} />
    </Suspense>
  }
  if (showInterviewBank) {
    return <Suspense fallback={<main className="app-loading" aria-live="polite">{copy.home.interviewLoading}</main>}>
      <InterviewExperience
        authorStudioEnabled={authorStudioEnabled}
        onBack={() => setShowInterviewBank(false)}
      />
    </Suspense>
  }
  if (searchQuery !== null) return <SearchResults
    query={searchQuery}
    onQueryChange={value => { setQuery(value); setSearchQuery(value) }}
    onBack={() => setSearchQuery(null)}
    onOpen={lesson => setSelectedSlug(lesson.slug)}
  />

  const localizedQuestionCount = locale === 'en'
    ? `${interviewQuestionCountByLocale.en}/${interviewQuestionCount}`
    : interviewQuestionCountByLocale.vi

  return <main>
    <header ref={siteHeaderRef} className="site-header">
      <Logo/>
      <button
        ref={mobileMenuButtonRef}
        type="button"
        className="mobile-menu-button"
        aria-expanded={mobileNavOpen}
        aria-controls="primary-navigation"
        aria-label={mobileNavOpen ? copy.home.closeMenu : copy.home.openMenu}
        onClick={() => setMobileNavOpen(open => !open)}
      >
        {mobileNavOpen ? <X size={20} aria-hidden="true"/> : <Menu size={20} aria-hidden="true"/>}
      </button>
      <nav id="primary-navigation" className={`primary-nav${mobileNavOpen ? ' is-open' : ''}`} aria-label={copy.home.navLabel}>
        <button type="button" className="active" aria-current="page" onClick={() => setMobileNavOpen(false)}>{copy.home.explore}</button>
        <button type="button" disabled title={copy.home.roadmapUnavailable} aria-label={`${copy.home.roadmap}. ${copy.home.roadmapUnavailable}`}>{copy.home.roadmap}</button>
        <button type="button" onClick={() => { setMobileNavOpen(false); setShowInterviewBank(true) }}>{copy.home.interview}</button>
        {authorStudioEnabled && <button type="button" onClick={() => { setMobileNavOpen(false); setShowQuestionStudio(true) }}>{copy.home.authorStudio}</button>}
      </nav>
      <div className="header-actions"><LocaleSwitcher/><button type="button" className="avatar">HL</button></div>
    </header>
    <section className="hero">
      <div className="hero-copy">
        <span className="badge"><Sparkles size={15}/> {copy.home.heroBadge}</span>
        <h1>{copy.home.heroTitleLead}<br/><span>{copy.home.heroTitleAccent}</span></h1>
        <p>{copy.home.heroDescription}</p>
        <form className="search" onSubmit={event => { event.preventDefault(); if (query.trim()) setSearchQuery(query.trim()) }}>
          <Search size={20}/>
          <input value={query} onChange={event => setQuery(event.target.value)} placeholder={copy.home.searchPlaceholder} aria-label={copy.search.inputLabel}/>
          <button type="submit">{copy.home.searchAction} <ArrowRight size={16}/></button>
        </form>
      </div>
      <div className="hero-visual" aria-hidden="true">
        <div className="orbit orbit-one"/><div className="orbit orbit-two"/>
        <div className="core"><BrainCircuit size={45}/><span>TECH</span></div>
        <div className="float-card card-a"><Code2/>Code</div>
        <div className="float-card card-b"><Target/>System</div>
        <div className="float-card card-c"><Sparkles/>AI</div>
      </div>
    </section>
    <section className="stats">
      <div><strong>{localizedQuestionCount}</strong><span>{copy.home.stats.questions}</span></div>
      <div><strong>{interviewTopics.length}</strong><span>{copy.home.stats.topics}</span></div>
      <div><strong>3</strong><span>{copy.home.stats.levels}</span></div>
      <div><strong>4</strong><span>{copy.home.stats.answerLayers}</span></div>
    </section>
    <section className="content">
      <div className="section-title">
        <div><span className="eyebrow">{copy.home.libraryEyebrow}</span><h2>{copy.home.libraryTitle}</h2></div>
        <div className="section-actions">
          {authorStudioEnabled && <button type="button" className="link-button" onClick={() => setShowQuestionStudio(true)}>{copy.home.authorStudio} <Sparkles size={16}/></button>}
          <button type="button" className="link-button" onClick={() => setShowInterviewBank(true)}>{copy.home.interview} <ArrowRight size={17}/></button>
        </div>
      </div>
      <div className="tabs" role="group" aria-label={copy.home.categoryFilterLabel}>
        <button type="button" aria-pressed={category === 'all'} className={category === 'all' ? 'active' : ''} onClick={() => setCategory('all')}>{copy.home.allCategories}</button>
        {categories.map(item => <button type="button" aria-pressed={item === category} className={item === category ? 'active' : ''} onClick={() => setCategory(item)} key={item}>{item}</button>)}
      </div>
      <div className="lesson-grid">{filtered.map(lesson => <article
        className="lesson-card"
        key={lesson.slug}
        role="button"
        tabIndex={0}
        onClick={() => setSelectedSlug(lesson.slug)}
        onKeyDown={event => {
          if (event.key === 'Enter' || event.key === ' ') {
            event.preventDefault()
            setSelectedSlug(lesson.slug)
          }
        }}
      >
        <div className="card-top"><span className={`category ${lesson.category.replace(' ', '-').toLowerCase()}`}>{lesson.category}</span><span className="duration"><Clock size={14}/>{copy.common.minutes(lesson.duration)}</span></div>
        <h3>{lesson.title}</h3><p>{lesson.shortAnswer}</p><div className="tags">{lesson.tags.map(tag => <span key={tag}>#{tag}</span>)}</div>
        <div className="card-bottom"><span className={`level ${lesson.difficulty}`}>{copy.common.level[lesson.difficulty]}</span><span className="open">{copy.home.startLesson} <ArrowRight size={16}/></span></div>
        {lesson.progress > 0 && <div className="progress"><i style={{ width: `${lesson.progress}%` }}/></div>}
      </article>)}</div>
    </section>
  </main>
}

type LocalLessonSimulationState = {
  localSimulation: LessonSimulationSpec | null
  staleLocalSimulation: LessonSimulationSpec | null
  localStorageIssue: {
    message: string
    rawValue?: string
  } | null
}

function readLocalLessonSimulation(lesson: RichLesson): LocalLessonSimulationState {
  const empty = {
    localSimulation: null,
    staleLocalSimulation: null,
    localStorageIssue: null,
  }
  if (!authorStudioEnabled || typeof window === 'undefined') return empty

  let storage: Storage
  try {
    storage = window.localStorage
  } catch {
    return {
      ...empty,
      localStorageIssue: {
        message: 'Browser đang chặn local storage nên chưa thể đọc lesson simulation draft.',
      },
    }
  }
  const stored = getLessonSimulationDraft(storage, lesson)
  if (!stored.ok) return {
    ...empty,
    localStorageIssue: { message: stored.message, rawValue: stored.rawValue },
  }
  if (stored.status === 'active') return { ...empty, localSimulation: stored.activeSimulation }
  if (stored.status === 'stale') return { ...empty, staleLocalSimulation: stored.entry.simulation }
  return empty
}

function RichLessonSimulation({ lesson }: { lesson: RichLesson }) {
  const { copy } = useLocale()
  const simulationSectionRef = useRef<HTMLElement>(null)
  const [localState, setLocalState] = useState<LocalLessonSimulationState>(() => (
    readLocalLessonSimulation(lesson)
  ))
  const [resetConfirmation, setResetConfirmation] = useState(false)
  const activeSimulation = localState.localSimulation ?? lesson.simulation
  const simulationBinding = activeSimulation
    ? validateLessonSimulationBinding({ ...lesson, simulation: activeSimulation } as RichLesson)
    : null

  const applyLocalSimulation = async (simulation: LessonSimulationSpec) => {
    if (typeof window === 'undefined') return
    let storage: Storage
    try {
      storage = window.localStorage
    } catch {
      throw new Error('Browser đang chặn local storage. Hãy export JSON để giữ draft.')
    }
    const result = upsertLessonSimulationDraft(storage, lesson, simulation)
    if (!result.ok) throw new Error(result.message)
    setLocalState({
      localSimulation: simulation,
      staleLocalSimulation: null,
      localStorageIssue: null,
    })
  }

  const restoreRepositorySimulation = async () => {
    if (typeof window === 'undefined') return
    let storage: Storage
    try {
      storage = window.localStorage
    } catch {
      throw new Error('Browser đang chặn local storage nên chưa thể xóa local override.')
    }
    const result = removeLessonSimulationDraft(storage, lesson.locale, lesson.slug)
    if (!result.ok) throw new Error(result.message)
    setLocalState({
      localSimulation: null,
      staleLocalSimulation: null,
      localStorageIssue: null,
    })
  }

  const exportCorruptStore = () => {
    const rawValue = localState.localStorageIssue?.rawValue
    if (!rawValue) return
    const url = URL.createObjectURL(new Blob([rawValue], { type: 'text/plain;charset=utf-8' }))
    const anchor = document.createElement('a')
    anchor.href = url
    anchor.download = `techflow-lesson-simulation-store-recovery-${lesson.locale}.txt`
    anchor.click()
    globalThis.setTimeout(() => URL.revokeObjectURL(url), 0)
  }

  const resetCorruptStore = () => {
    if (!resetConfirmation) {
      setResetConfirmation(true)
      return
    }
    let storage: Storage
    try {
      storage = window.localStorage
    } catch {
      setLocalState(state => ({
        ...state,
        localStorageIssue: {
          message: lesson.locale === 'en'
            ? 'The browser is blocking local storage, so the corrupt draft store cannot be reset.'
            : 'Browser đang chặn local storage nên chưa thể reset draft store bị lỗi.',
          rawValue: state.localStorageIssue?.rawValue,
        },
      }))
      return
    }
    const result = resetLessonSimulationDraftStore(storage)
    if (!result.ok) {
      setLocalState(state => ({
        ...state,
        localStorageIssue: {
          message: result.message,
          rawValue: state.localStorageIssue?.rawValue,
        },
      }))
      return
    }
    setResetConfirmation(false)
    setLocalState({
      localSimulation: null,
      staleLocalSimulation: null,
      localStorageIssue: null,
    })
    globalThis.setTimeout(() => simulationSectionRef.current?.focus(), 0)
  }

  return <section
    ref={simulationSectionRef}
    id="lesson-simulation"
    className="lesson-simulation-section"
    aria-label={copy.lesson.sections[2]}
    tabIndex={-1}
  >
    {authorStudioEnabled && <Suspense fallback={<div className="empty-sim" aria-live="polite">{copy.home.authorStudioLoading}</div>}>
      <LessonSimulationStudio
        lesson={lesson}
        activeSimulation={activeSimulation}
        localOverrideActive={Boolean(localState.localSimulation)}
        staleStoredSimulation={localState.staleLocalSimulation ?? undefined}
        onApplyLocal={applyLocalSimulation}
        onRestoreRepository={restoreRepositorySimulation}
        onDiscardStale={restoreRepositorySimulation}
      />
    </Suspense>}
    {localState.localStorageIssue && <div className="lesson-simulation-warning" role="alert">
      <h2>{lesson.locale === 'en' ? 'Local draft storage is unavailable' : 'Không thể dùng local draft storage'}</h2>
      <p>{localState.localStorageIssue.message}</p>
      {localState.localStorageIssue.rawValue && <div className="lesson-simulation-recovery__actions">
        <button type="button" onClick={exportCorruptStore}>
          <Download size={16} aria-hidden="true" />
          {lesson.locale === 'en' ? 'Download recovery copy' : 'Tải bản recovery'}
        </button>
        <button type="button" onClick={resetCorruptStore}>
          <Trash2 size={16} aria-hidden="true" />
          {resetConfirmation
            ? lesson.locale === 'en' ? 'Confirm reset of all local simulation drafts' : 'Xác nhận reset toàn bộ local simulation drafts'
            : lesson.locale === 'en' ? 'Reset corrupt local store' : 'Reset local store bị lỗi'}
        </button>
        {resetConfirmation && <span role="status">
          {lesson.locale === 'en'
            ? `This deletes only ${LESSON_SIMULATION_DRAFT_STORAGE_KEY}. Download recovery first if needed.`
            : `Thao tác chỉ xóa ${LESSON_SIMULATION_DRAFT_STORAGE_KEY}. Hãy tải recovery trước nếu cần.`}
        </span>}
      </div>}
    </div>}
    {activeSimulation
      ? simulationBinding?.success
        ? <SimulationPlayer spec={activeSimulation}/>
        : <div className="lesson-simulation-warning" role="alert">
            <h2>{copy.lesson.simulationInvalidTitle}</h2>
            <p>{copy.lesson.simulationInvalidBody}</p>
          </div>
      : lesson.workflow.length
        ? <WorkflowPlayer steps={lesson.workflow}/>
        : <div className="empty-sim">{copy.lesson.simulationPending}</div>}
  </section>
}

export function LessonView({ lesson, onBack }: { lesson: Lesson; onBack: () => void }) {
  const { copy } = useLocale()
  const richLesson = isRichLesson(lesson) ? lesson : null
  const [activeSectionId, setActiveSectionId] = useState<(typeof lessonSectionIds)[number]>(lessonSectionIds[0])

  useEffect(() => {
    document.documentElement.scrollTop = 0
    document.body.scrollTop = 0
  }, [lesson.slug])

  useEffect(() => {
    const sections = lessonSectionIds
      .map((id) => document.getElementById(id))
      .filter((section): section is HTMLElement => Boolean(section))

    const updateActiveSection = () => {
      const activationLine = Math.min(window.innerHeight * 0.28, 220)
      let nextSection: (typeof lessonSectionIds)[number] = lessonSectionIds[0]
      for (const section of sections) {
        if (section.getBoundingClientRect().top <= activationLine) {
          nextSection = section.id as (typeof lessonSectionIds)[number]
        }
      }

      const pageBottom = Math.ceil(window.scrollY + window.innerHeight) >= document.documentElement.scrollHeight - 2
      if (pageBottom) nextSection = lessonSectionIds[lessonSectionIds.length - 1]
      setActiveSectionId(nextSection)
    }

    window.addEventListener('scroll', updateActiveSection, { passive: true })
    window.addEventListener('resize', updateActiveSection)
    return () => {
      window.removeEventListener('scroll', updateActiveSection)
      window.removeEventListener('resize', updateActiveSection)
    }
  }, [lesson.slug])

  const navigateToSection = (sectionId: (typeof lessonSectionIds)[number]) => {
    setActiveSectionId(sectionId)
    document.getElementById(sectionId)?.scrollIntoView?.({ block: 'start' })
  }

  return <main>
    <header className="site-header">
      <Logo/>
      <div className="header-actions">
        <LocaleSwitcher/>
        <button type="button" className="back" onClick={onBack}><ArrowLeft size={18}/> {copy.common.library}</button>
        <button type="button" className="avatar">HL</button>
      </div>
    </header>
    <div className="lesson-layout">
      <aside className="lesson-toc" aria-label={copy.lesson.contentLabel}>
        <span className="eyebrow">{copy.lesson.contentLabel}</span>
        {copy.lesson.sections.map((section, index) => {
          const sectionId = lessonSectionIds[index]
          if (!sectionId) return null
          const isActive = activeSectionId === sectionId
          return <a
            className={isActive ? 'active' : ''}
            href={`#${sectionId}`}
            aria-current={isActive ? 'location' : undefined}
            key={sectionId}
            onClick={() => setActiveSectionId(sectionId)}
          ><span>{index + 1}</span>{section}</a>
        })}
      </aside>
      <div className="lesson-mobile-toc">
        <label htmlFor="lesson-section-select">{copy.lesson.contentLabel}</label>
        <select
          id="lesson-section-select"
          value={activeSectionId}
          onChange={(event) => navigateToSection(event.target.value as (typeof lessonSectionIds)[number])}
        >
          {copy.lesson.sections.map((section, index) => {
            const sectionId = lessonSectionIds[index]
            return sectionId ? <option key={sectionId} value={sectionId}>{index + 1}. {section}</option> : null
          })}
        </select>
      </div>
      <article className="lesson-page">
        <div className="breadcrumbs">{lesson.category} / {copy.common.level[lesson.difficulty]}</div>
        <h1>{lesson.title}</h1>
        <div className="lesson-meta"><span><Clock size={16}/>{copy.common.minutes(lesson.duration)}</span><span><BookOpen size={16}/>{copy.lesson.visualLesson}</span><span><Flame size={16}/>+120 XP</span></div>
        <section id="lesson-quick-answer" className="quick-answer" aria-labelledby="lesson-quick-answer-title"><h2 id="lesson-quick-answer-title" className="sr-only">{copy.lesson.sections[0]}</h2><span>{copy.lesson.quickAnswer}</span><p>{lesson.shortAnswer}</p></section>
        {lesson.content
          ? <LessonContentView
              content={lesson.content}
              reviewStatus={lesson.reviewStatus}
              translationStatus={lesson.locale === 'en' ? lesson.translationStatus : undefined}
            />
          : <section id="lesson-understand" className="lesson-generic-overview"><h2>{copy.lesson.overviewTitle}</h2><p>{copy.lesson.overviewDescription}</p></section>
        }
        {richLesson
          ? <RichLessonSimulation
              key={`${richLesson.locale}:${richLesson.slug}:${lessonContentHash(richLesson)}`}
              lesson={richLesson}
            />
          : <section id="lesson-simulation" className="lesson-simulation-section" aria-label={copy.lesson.sections[2]}>
              {lesson.workflow.length
                ? <WorkflowPlayer steps={lesson.workflow}/>
                : <div className="empty-sim">{copy.lesson.simulationPending}</div>}
            </section>}
        <section id="lesson-follow-ups" className="follow-ups" aria-labelledby="lesson-follow-ups-title"><h2 id="lesson-follow-ups-title" className="eyebrow">{copy.lesson.followUps}</h2>{lesson.followUps.map((question, index) => <div key={question}><b>0{index + 1}</b><span>{question}</span><ArrowRight size={18}/></div>)}</section>
      </article>
    </div>
  </main>
}

export default App
