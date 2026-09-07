import { useEffect, useRef, type ReactNode } from 'react'
import {
  ArrowLeft,
  ArrowRight,
  BookOpenText,
  BrainCircuit,
  ChevronLeft,
  ChevronRight,
  Code2,
  FileText,
  Gamepad2,
  Lightbulb,
  Scale,
  ShieldAlert,
  Sparkles,
} from 'lucide-react'
import { getInterviewTopics, interviewLevelLabels } from '../content/interviewTopics'
import type { LocalizedInterviewQuestion } from '../content/types'
import { useLocale } from '../i18n'
import '../interview/interview.css'
import { LocaleSwitcher } from './LocaleSwitcher'

type InterviewQuestionViewProps = {
  question: LocalizedInterviewQuestion
  onBack: () => void
  onHome: () => void
  onPrevious?: () => void
  onNext?: () => void
  onOpenStudio?: () => void
}

function InlineText({ value }: { value: string }) {
  return <>{value.split(/(`[^`\n]+`)/gu).map((part, index) => (
    part.startsWith('`') && part.endsWith('`')
      ? <code key={index}>{part.slice(1, -1)}</code>
      : part
  ))}</>
}

function SafeRichText({ value }: { value: string }) {
  const paragraphs = value.split(/\n\s*\n/gu).map(paragraph => paragraph.trim()).filter(Boolean)

  return <div className="interview-rich-text">{paragraphs.map((paragraph, paragraphIndex) => {
    const lines = paragraph.split('\n').map(line => line.trim()).filter(Boolean)
    const isBulletList = lines.length > 0 && lines.every(line => /^[-*]\s+/u.test(line))
    const isNumberedList = lines.length > 0 && lines.every(line => /^\d+[.)]\s+/u.test(line))

    if (isBulletList) return <ul key={paragraphIndex}>{lines.map((line, lineIndex) => <li key={lineIndex}><InlineText value={line.replace(/^[-*]\s+/u, '')}/></li>)}</ul>
    if (isNumberedList) return <ol key={paragraphIndex}>{lines.map((line, lineIndex) => <li key={lineIndex}><InlineText value={line.replace(/^\d+[.)]\s+/u, '')}/></li>)}</ol>

    return <p key={paragraphIndex}>{lines.map((line, lineIndex) => <span key={lineIndex}>{lineIndex > 0 && <br/>}<InlineText value={line}/></span>)}</p>
  })}</div>
}

function LearningSection({ number, eyebrow, title, icon, children, tone }: {
  number: string
  eyebrow: string
  title: string
  icon: ReactNode
  children: ReactNode
  tone: 'quick' | 'concept' | 'tradeoff' | 'example'
}) {
  return <section className={`interview-learning-section ${tone}`} aria-labelledby={`interview-section-${number}`}>
    <div className="interview-section-marker" aria-hidden="true"><span>{number}</span>{icon}</div>
    <div className="interview-section-content">
      <span className="interview-section-eyebrow">{eyebrow}</span>
      <h2 id={`interview-section-${number}`}>{title}</h2>
      {children}
    </div>
  </section>
}

export function InterviewQuestionView({ question, onBack, onHome, onPrevious, onNext, onOpenStudio }: InterviewQuestionViewProps) {
  const { locale, copy } = useLocale()
  const headingRef = useRef<HTMLHeadingElement>(null)
  const topic = getInterviewTopics(locale).find(item => item.slug === question.topicSlug)
  const translationNeedsReview = question.locale === 'en'
    && question.translationStatus === 'ai-translated-needs-review'
  const technicalNeedsReview = question.reviewStatus === 'imported-needs-review'
  const needsReview = translationNeedsReview || technicalNeedsReview
  const sectionCopy = copy.interview.learningSections

  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: 'auto' })
    headingRef.current?.focus({ preventScroll: true })
  }, [question.id, question.locale])

  return <main className="interview-shell interview-question-page">
    <header className="interview-header">
      <button type="button" className="interview-brand" onClick={onHome} aria-label={copy.interview.homeLabel}>
        <span aria-hidden="true"><Code2 size={20}/></span>Tech<span>Flow</span>
      </button>
      <div className="interview-header-actions">
        <LocaleSwitcher compact/>
        <button type="button" className="interview-header-back" onClick={onBack} aria-label={copy.interview.backToList}>
          <ArrowLeft size={18} aria-hidden="true"/><span>{copy.interview.backToList}</span>
        </button>
      </div>
    </header>

    <article className="interview-question-content">
      <div className="interview-question-breadcrumbs">
        <button type="button" onClick={onBack}>{copy.interview.breadcrumbs}</button>
        <ArrowRight size={13} aria-hidden="true"/>
        <span>{topic?.title ?? question.topicSlug}</span>
        <ArrowRight size={13} aria-hidden="true"/>
        <span>{interviewLevelLabels[question.level]}</span>
      </div>

      <div className="interview-question-heading">
        <div className="interview-question-heading-meta">
          <span className={`interview-level-badge ${question.level}`}>{interviewLevelLabels[question.level]}</span>
          <span>{copy.interview.questionNumber(question.position)}</span>
        </div>
        <h1 ref={headingRef} tabIndex={-1}>{question.question}</h1>
        <p>{copy.interview.answerGuide}</p>
      </div>

      {onOpenStudio && <aside className="interview-author-action">
        <div>
          <strong>{copy.interview.openInStudio}</strong>
          <p>{copy.interview.openInStudioDescription}</p>
        </div>
        <button id="interview-open-studio" type="button" onClick={onOpenStudio}>
          <Sparkles size={17} aria-hidden="true"/> {copy.interview.openInStudio}
        </button>
      </aside>}

      {technicalNeedsReview && <aside className="interview-review-notice" aria-label={copy.interview.technicalPending}>
        <ShieldAlert size={20} aria-hidden="true"/>
        <div>
          <strong>{copy.interview.technicalPending}</strong>
          <p>{copy.interview.technicalPendingBody}</p>
        </div>
      </aside>}
      {translationNeedsReview && <aside className="interview-review-notice translation" aria-label={copy.interview.translationPending}>
        <ShieldAlert size={20} aria-hidden="true"/>
        <div>
          <strong>{copy.interview.translationPending}</strong>
          <p>{copy.interview.translationPendingBody}</p>
        </div>
      </aside>}

      <div className="interview-learning-path" aria-label={copy.interview.learningPath}>
        <LearningSection number="01" eyebrow={sectionCopy.quickEyebrow} title={sectionCopy.quickTitle} icon={<Lightbulb size={20}/>} tone="quick">
          <SafeRichText value={question.quickAnswer}/>
        </LearningSection>
        <LearningSection number="02" eyebrow={sectionCopy.conceptEyebrow} title={sectionCopy.conceptTitle} icon={<BrainCircuit size={20}/>} tone="concept">
          <SafeRichText value={question.conceptualExplanation}/>
        </LearningSection>
        <LearningSection number="03" eyebrow={sectionCopy.tradeoffEyebrow} title={sectionCopy.tradeoffTitle} icon={<Scale size={20}/>} tone="tradeoff">
          <SafeRichText value={question.productionTradeOff}/>
        </LearningSection>
        <LearningSection number="04" eyebrow={sectionCopy.exampleEyebrow} title={sectionCopy.exampleTitle} icon={<Gamepad2 size={20}/>} tone="example">
          <div className="interview-example-callout">
            <span><BookOpenText size={17} aria-hidden="true"/> {question.appliedExample.label}</span>
            <SafeRichText value={question.appliedExample.detail}/>
          </div>
        </LearningSection>
      </div>

      <aside className="interview-source-card" aria-label={copy.interview.sourceLabel}>
        <FileText size={20} aria-hidden="true"/>
        <div><span>{copy.interview.importSource}</span><strong>{question.source.relativePath}</strong><small>{copy.interview.anchor}: {question.source.anchor}</small></div>
        <div className="interview-source-statuses">
          {technicalNeedsReview && <span className="needs-review">{copy.interview.technicalReviewBadge}</span>}
          {translationNeedsReview && <span className="needs-review translation">{copy.interview.translationReviewBadge}</span>}
          {!needsReview && <span className="reviewed">{copy.interview.reviewed}</span>}
        </div>
      </aside>

      <nav className="interview-question-navigation" aria-label={copy.interview.navigation}>
        <button type="button" onClick={onPrevious} disabled={!onPrevious}>
          <ChevronLeft size={19} aria-hidden="true"/><span><small>{copy.interview.wholeLibrary}</small><strong>{copy.interview.previousQuestion}</strong></span>
        </button>
        <button type="button" className="interview-back-to-list" onClick={onBack}>{copy.interview.backToList}</button>
        <button type="button" onClick={onNext} disabled={!onNext}>
          <span><small>{copy.interview.wholeLibrary}</small><strong>{copy.interview.nextQuestion}</strong></span><ChevronRight size={19} aria-hidden="true"/>
        </button>
      </nav>
    </article>
  </main>
}
