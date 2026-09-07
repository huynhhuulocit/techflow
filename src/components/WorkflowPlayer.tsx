import { useEffect, useState } from 'react'
import { Pause, Play, RotateCcw, SkipForward } from 'lucide-react'
import type { WorkflowStep } from '../content/types'
import { useLocale } from '../i18n'

export function WorkflowPlayer({ steps }: { steps: WorkflowStep[] }) {
  const { copy } = useLocale()
  const [active, setActive] = useState(0)
  const [playing, setPlaying] = useState(false)

  useEffect(() => {
    if (!playing) return
    const timer = window.setInterval(() => setActive(value => {
      if (value >= steps.length - 1) {
        setPlaying(false)
        return value
      }
      return value + 1
    }), 1800)
    return () => window.clearInterval(timer)
  }, [playing, steps.length])

  const current = steps[active]
  return <section className="workflow-card">
    <div className="workflow-head">
      <div><span className="eyebrow">{copy.workflow.label}</span><h2>{copy.workflow.title}</h2></div>
      <span className="step-count">{copy.workflow.step(active + 1, steps.length)}</span>
    </div>
    <div className="flow-canvas">
      <div className="flow-line" />
      {steps.map((step, index) => <button
        type="button"
        key={step.id}
        aria-pressed={index === active}
        className={`flow-node ${index === active ? 'active' : ''} ${index < active ? 'done' : ''}`}
        onClick={() => setActive(index)}
      >
        <span className="node-dot" style={{ '--node-color': step.color } as React.CSSProperties}>{index + 1}</span>
        <strong>{step.actor}</strong><small>{step.title}</small>
      </button>)}
    </div>
    <div className="explain-box"><span style={{ background: current.color }}>{active + 1}</span><div><strong>{current.title}</strong><p>{current.detail}</p></div></div>
    <div className="player-controls">
      <button type="button" className="icon-button" aria-label={copy.workflow.restart} onClick={() => { setActive(0); setPlaying(false) }}><RotateCcw size={18}/></button>
      <button type="button" className="play-button" onClick={() => setPlaying(!playing)}>{playing ? <Pause size={18}/> : <Play size={18}/>} {playing ? copy.workflow.pause : copy.workflow.play}</button>
      <button type="button" className="icon-button" aria-label={copy.workflow.nextStep} onClick={() => setActive(Math.min(active + 1, steps.length - 1))}><SkipForward size={18}/></button>
    </div>
  </section>
}
