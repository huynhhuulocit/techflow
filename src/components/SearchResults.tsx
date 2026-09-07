import { ArrowLeft, ArrowRight, BookOpen, Clock, GitBranch, Lightbulb, Search, Sparkles } from 'lucide-react'
import type { Lesson } from '../content/types'
import { useLocale } from '../i18n'
import { searchKnowledge } from '../search/searchEngine'
import { LocaleSwitcher } from './LocaleSwitcher'

export function SearchResults({ query, onQueryChange, onBack, onOpen }: {
  query: string
  onQueryChange: (value: string) => void
  onBack: () => void
  onOpen: (lesson: Lesson) => void
}) {
  const { locale, copy } = useLocale()
  const { results, relation } = searchKnowledge(query, locale)

  return <main className="search-page">
    <header className="search-header">
      <button type="button" className="back" onClick={onBack}><ArrowLeft size={18}/> {copy.search.back}</button>
      <div className="mini-search">
        <Search size={18} aria-hidden="true"/>
        <input
          autoFocus
          value={query}
          aria-label={copy.search.inputLabel}
          onChange={event => onQueryChange(event.target.value)}
        />
      </div>
      <div className="search-header-actions">
        <span className="result-total" aria-live="polite">{copy.search.results(results.length)}</span>
        <LocaleSwitcher compact/>
      </div>
    </header>
    <div className="search-layout">
      <section className="search-main">
        <div className="search-title">
          <span className="eyebrow">{copy.search.eyebrow}</span>
          <h1>{copy.search.title(query)}</h1>
          <p>{copy.search.description}</p>
        </div>
        {relation && <article className="relation-answer">
          <div className="answer-label"><Sparkles size={16}/> {copy.search.synthesized}</div>
          <h2>{relation.title}</h2>
          <p>{relation.summary}</p>
          <div className="relation-flow">{relation.connections.map(connection => <div className="relation-part" key={`${connection.from}-${connection.to}`}>
            <strong>{connection.from}</strong><span><ArrowRight size={15}/>{connection.label}</span><strong>{connection.to}</strong>
          </div>)}</div>
          <div className="answer-note"><GitBranch size={17}/><span>{copy.search.synthesisNote(relation.concepts.length, results.length)}</span></div>
        </article>}
        {!relation && results.length > 1 && <article className="relation-hint"><GitBranch/><div><strong>{copy.search.relationHintTitle}</strong><p>{copy.search.relationHintBody}</p></div></article>}
        <div className="result-heading"><div><span className="eyebrow">{copy.search.relatedLessons}</span><h2>{copy.search.rankedByRelevance}</h2></div></div>
        <div className="result-list">{results.map(({ lesson, matchedTerms }) => <button type="button" key={lesson.slug} onClick={() => onOpen(lesson)}>
          <div className="result-icon"><BookOpen size={20}/></div>
          <div className="result-copy">
            <div><span className="result-category">{lesson.category}</span><span><Clock size={13}/>{copy.common.minutes(lesson.duration)}</span></div>
            <h3>{lesson.title}</h3>
            <p>{lesson.shortAnswer}</p>
            <div className="matched">{copy.search.matched} {matchedTerms.slice(0, 4).map(term => <i key={term}>{term}</i>)}</div>
          </div>
          <ArrowRight className="result-arrow" size={20}/>
        </button>)}</div>
        {!results.length && <div className="no-results"><Search size={28}/><h2>{copy.search.noResultsTitle}</h2><p>{copy.search.noResultsBody}</p></div>}
      </section>
      <aside className="suggestion-panel">
        <div className="suggestion-title"><Lightbulb size={18}/><strong>{copy.search.suggestionsTitle}</strong></div>
        {(relation?.suggestions ?? copy.search.defaultSuggestions).map(suggestion => <button type="button" key={suggestion} onClick={() => onQueryChange(suggestion)}>{suggestion}<ArrowRight size={15}/></button>)}
      </aside>
    </div>
  </main>
}
