import { ArrowDown, CheckCircle2, ExternalLink, ShieldAlert, XCircle } from 'lucide-react'
import type { LessonContent, LessonReviewStatus, LessonTranslationStatus } from '../content/types'
import { useLocale } from '../i18n'

type LessonContentProps = {
  content: LessonContent
  reviewStatus: LessonReviewStatus
  translationStatus?: LessonTranslationStatus
}

export function LessonContentView({ content, reviewStatus, translationStatus }: LessonContentProps) {
  const { copy } = useLocale()
  const actorLabels = new Map(content.actors.map((actor) => [actor.id, actor.label]))
  const isReviewed = reviewStatus === 'reviewed'

  return (
    <section id="lesson-understand" className="lesson-understanding" aria-labelledby="lesson-understanding-title">
      <div className="lesson-scope">
        <span>{copy.lesson.scopeLabel}</span>
        <p>{content.scope}</p>
      </div>

      <div className={`lesson-review-state ${isReviewed ? 'is-reviewed' : 'is-pending'}`} role="status">
        {isReviewed
          ? <CheckCircle2 aria-hidden="true" size={19}/>
          : <ShieldAlert aria-hidden="true" size={19}/>
        }
        <div>
          <strong>{isReviewed ? copy.lesson.reviewed : copy.lesson.reviewPending}</strong>
          {!isReviewed && <p>{copy.lesson.reviewPendingBody}</p>}
        </div>
      </div>
      {translationStatus && (
        <div className={`lesson-review-state ${translationStatus === 'reviewed' ? 'is-reviewed' : 'is-pending'}`} role="status">
          {translationStatus === 'reviewed'
            ? <CheckCircle2 aria-hidden="true" size={19}/>
            : <ShieldAlert aria-hidden="true" size={19}/>
          }
          <div>
            <strong>{translationStatus === 'reviewed' ? copy.lesson.translationReviewed : copy.lesson.translationReviewPending}</strong>
            {translationStatus !== 'reviewed' && <p>{copy.lesson.translationReviewPendingBody}</p>}
          </div>
        </div>
      )}

      <div className="lesson-concept-copy">
        <span className="eyebrow">{copy.lesson.mentalModelTitle}</span>
        <h2 id="lesson-understanding-title">{copy.lesson.overviewTitle}</h2>
        <p className="mental-model">{content.mentalModel}</p>
        <p>{content.conceptualExplanation}</p>
      </div>

      <section className="lesson-actors" aria-labelledby="lesson-actors-title">
        <h3 id="lesson-actors-title">{copy.lesson.actorsTitle}</h3>
        <div className="actor-grid">
          {content.actors.map((actor) => (
            <article key={actor.id}>
              <strong>{actor.label}</strong>
              <p>{actor.responsibility}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="lesson-mechanism" aria-labelledby="lesson-mechanism-title">
        <h3 id="lesson-mechanism-title">{copy.lesson.mechanismTitle}</h3>
        <ol>
          {content.mechanism.map((step, index) => (
            <li key={step.id}>
              <span className="mechanism-number">{String(index + 1).padStart(2, '0')}</span>
              <div>
                <small>{actorLabels.get(step.actorId)}</small>
                <h4>{step.title}</h4>
                <p>{step.detail}</p>
              </div>
              {index < content.mechanism.length - 1 && <ArrowDown className="mechanism-arrow" aria-hidden="true" size={18}/>}
            </li>
          ))}
        </ol>
      </section>

      <section className="lesson-tradeoffs" aria-labelledby="lesson-tradeoffs-title">
        <h3 id="lesson-tradeoffs-title">{copy.lesson.tradeOffsTitle}</h3>
        <div className="tradeoff-grid">
          {content.productionTradeOffs.map((tradeOff) => (
            <article key={tradeOff.title}>
              <h4>{tradeOff.title}</h4>
              <dl>
                <div><dt>{copy.lesson.benefitLabel}</dt><dd>{tradeOff.benefit}</dd></div>
                <div><dt>{copy.lesson.costLabel}</dt><dd>{tradeOff.cost}</dd></div>
                <div><dt>{copy.lesson.decisionRuleLabel}</dt><dd>{tradeOff.decisionRule}</dd></div>
              </dl>
            </article>
          ))}
        </div>
      </section>

      <section className="lesson-misconceptions" aria-labelledby="lesson-misconceptions-title">
        <h3 id="lesson-misconceptions-title">{copy.lesson.misconceptionsTitle}</h3>
        <div>
          {content.misconceptions.map((item) => (
            <article key={item.claim}>
              <p className="misconception-claim"><XCircle aria-hidden="true" size={18}/><span>{item.claim}</span></p>
              <p className="misconception-correction"><CheckCircle2 aria-hidden="true" size={18}/><span><strong>{copy.lesson.correctionLabel}:</strong> {item.correction}</span></p>
            </article>
          ))}
        </div>
      </section>

      <section className="lesson-example" aria-labelledby="lesson-example-title">
        <span className="eyebrow">{copy.lesson.appliedExampleTitle}</span>
        <h3 id="lesson-example-title">{content.appliedExample.label}</h3>
        <p>{content.appliedExample.summary}</p>
        <ol>
          {content.appliedExample.steps.map((step, index) => (
            <li key={step}><span>{index + 1}</span><p>{step}</p></li>
          ))}
        </ol>
      </section>

      <details className="lesson-evidence">
        <summary>{copy.lesson.evidenceTitle} <span>{content.evidence.length}</span></summary>
        <ul>
          {content.evidence.map((item) => (
            <li key={item.url}>
              <a href={item.url} target="_blank" rel="noreferrer">
                {item.label}<ExternalLink aria-hidden="true" size={14}/>
              </a>
              {item.note && <p>{item.note}</p>}
            </li>
          ))}
        </ul>
      </details>
    </section>
  )
}
