import { lazy, Suspense, useEffect, useMemo, useRef, useState } from 'react'
import { ArrowLeft, ArrowRight, BookOpen, BrainCircuit, Clock, Code2, Flame, Menu, Search, Sparkles, Target, X } from 'lucide-react'
import { LocaleSwitcher } from './components/LocaleSwitcher'
import { SearchResults } from './components/SearchResults'
import { WorkflowPlayer } from './components/WorkflowPlayer'
import { getLessons } from './content/lessons'
import { interviewQuestionCount, interviewQuestionCountByLocale, interviewTopics } from './content/interviewTopics'
import type { Lesson } from './content/types'
import { useLocale } from './i18n'

const InterviewExperience = lazy(() => import('./components/InterviewExperience'))
const QuestionStudio = lazy(() => import('./components/QuestionStudio'))
const categories = ['JavaScript', 'TypeScript', 'SFCC', 'Backend', 'Database', 'System Design', 'AI Engineer']
const authorStudioEnabled = import.meta.env.DEV || import.meta.env.VITE_ENABLE_AUTHOR_STUDIO === 'true'
const mobileNavigationBreakpoint = 960

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

function LessonView({ lesson, onBack }: { lesson: Lesson; onBack: () => void }) {
  const { copy } = useLocale()

  return <main>
    <header>
      <Logo/>
      <div className="header-actions">
        <LocaleSwitcher/>
        <button type="button" className="back" onClick={onBack}><ArrowLeft size={18}/> {copy.common.library}</button>
        <button type="button" className="avatar">HL</button>
      </div>
    </header>
    <div className="lesson-layout">
      <aside>
        <span className="eyebrow">{copy.lesson.contentLabel}</span>
        {copy.lesson.sections.map((section, index) => <a className={index === 2 ? 'active' : ''} key={section}><span>{index + 1}</span>{section}</a>)}
      </aside>
      <article className="lesson-page">
        <div className="breadcrumbs">{lesson.category} / {copy.common.level[lesson.difficulty]}</div>
        <h1>{lesson.title}</h1>
        <div className="lesson-meta"><span><Clock size={16}/>{copy.common.minutes(lesson.duration)}</span><span><BookOpen size={16}/>{copy.lesson.visualLesson}</span><span><Flame size={16}/>+120 XP</span></div>
        <section className="quick-answer"><span>{copy.lesson.quickAnswer}</span><p>{lesson.shortAnswer}</p></section>
        <h2>{copy.lesson.overviewTitle}</h2><p>{copy.lesson.overviewDescription}</p>
        {lesson.workflow.length ? <WorkflowPlayer steps={lesson.workflow}/> : <div className="empty-sim">{copy.lesson.simulationPending}</div>}
        <section className="follow-ups"><span className="eyebrow">{copy.lesson.followUps}</span>{lesson.followUps.map((question, index) => <div key={question}><b>0{index + 1}</b><span>{question}</span><ArrowRight size={18}/></div>)}</section>
      </article>
    </div>
  </main>
}

export default App
