import { useEffect, useId, useMemo, useReducer, useState } from 'react'
import { ChevronLeft, ChevronRight, Pause, Play, RotateCcw } from 'lucide-react'
import type { SimulationScalar, SimulationScenario, SimulationSpec } from '../content/types'
import {
  createInitialSimulationState,
  evaluateSimulationInvariants,
  getSimulationActorPlaybackState,
  getSimulationScenario,
  getSimulationSnapshot,
  reduceSimulationState,
  simulationSpeeds,
} from '../simulation'
import type { SimulationAction, SimulationRuntimeState, SimulationSpeed } from '../simulation'
import { validateSimulationSpec } from '../simulation'
import '../simulation/simulation.css'

export type SimulationPlayerProps = {
  spec: SimulationSpec
  initialScenarioId?: string
  className?: string
}

const simulationCopyByLocale = {
  vi: {
    eyebrow: 'MÔ PHỎNG CÓ KIỂM SOÁT',
    reviewed: 'Đã review',
    needsReview: 'AI draft · cần review',
    misconception: 'Hiểu lầm cần sửa',
    scenario: 'Scenario',
    speed: 'Tốc độ',
    reducedMotion: 'Reduced motion đang bật. Autoplay được tắt; bạn vẫn có thể đi từng bước.',
    initial: 'Ban đầu',
    initialState: 'TRẠNG THÁI BAN ĐẦU',
    initialDescription: 'Quan sát state ban đầu trước khi event đầu tiên được xử lý.',
    step: (current: number, total: number) => `Bước ${current}/${total}`,
    stepLabel: (current: number) => `BƯỚC ${current}`,
    stepStatus: (current: number, total: number, event: string, explanation: string) => `Bước ${current} trên ${total}: ${event}. ${explanation}`,
    initialStatus: (scenario: string) => `Trạng thái ban đầu của ${scenario}.`,
    actors: 'Các thành phần trong mô phỏng',
    actorActive: 'Đang xử lý',
    actorComplete: 'Đã xử lý',
    actorWaiting: 'Đang chờ',
    snapshot: 'State snapshot',
    invariants: 'Invariants',
    invariantPass: 'Đạt',
    invariantFail: 'Chưa đạt',
    invariantUnknown: 'Chưa xác định',
    controls: 'Điều khiển mô phỏng',
    reset: 'Đặt lại',
    resetAria: 'Đặt lại mô phỏng về trạng thái ban đầu',
    previous: 'Bước trước',
    previousAria: 'Quay lại bước trước',
    next: 'Bước tiếp',
    nextAria: 'Đi tới bước tiếp theo',
    play: 'Chạy',
    replay: 'Chạy lại',
    pause: 'Tạm dừng',
    playAria: 'Chạy mô phỏng',
    replayAria: 'Chạy lại mô phỏng',
    pauseAria: 'Tạm dừng mô phỏng',
    transcript: 'Bản mô tả đầy đủ cho mô phỏng',
    initialSnapshot: 'State ban đầu',
    state: 'State',
    finish: 'Kết thúc',
    undefinedValue: 'Chưa xác định',
    invalidTitle: 'Không thể chạy mô phỏng',
    invalidBody: 'Simulation spec chưa đạt validation. Nội dung không được render để đảm bảo an toàn.',
    scenarioKinds: {
      'happy-path': 'Luồng bình thường',
      failure: 'Failure scenario',
      'what-if': 'What-if scenario',
    } satisfies Record<SimulationScenario['kind'], string>,
    terminals: {
      success: 'Thành công',
      degraded: 'Suy giảm',
      failed: 'Thất bại',
    } satisfies Record<SimulationScenario['terminalState'], string>,
  },
  en: {
    eyebrow: 'CONTROLLED SIMULATION',
    reviewed: 'Reviewed',
    needsReview: 'AI draft · review required',
    misconception: 'Misconception to correct',
    scenario: 'Scenario',
    speed: 'Speed',
    reducedMotion: 'Reduced motion is enabled. Autoplay is off; step controls remain available.',
    initial: 'Initial',
    initialState: 'INITIAL STATE',
    initialDescription: 'Observe the initial state before the first event is processed.',
    step: (current: number, total: number) => `Step ${current}/${total}`,
    stepLabel: (current: number) => `STEP ${current}`,
    stepStatus: (current: number, total: number, event: string, explanation: string) => `Step ${current} of ${total}: ${event}. ${explanation}`,
    initialStatus: (scenario: string) => `Initial state for ${scenario}.`,
    actors: 'Simulation actors',
    actorActive: 'Processing',
    actorComplete: 'Processed',
    actorWaiting: 'Waiting',
    snapshot: 'State snapshot',
    invariants: 'Invariants',
    invariantPass: 'Pass',
    invariantFail: 'Fail',
    invariantUnknown: 'Unknown',
    controls: 'Simulation controls',
    reset: 'Reset',
    resetAria: 'Reset the simulation to its initial state',
    previous: 'Previous step',
    previousAria: 'Go to the previous step',
    next: 'Next step',
    nextAria: 'Go to the next step',
    play: 'Play',
    replay: 'Replay',
    pause: 'Pause',
    playAria: 'Play simulation',
    replayAria: 'Replay simulation',
    pauseAria: 'Pause simulation',
    transcript: 'Complete simulation transcript',
    initialSnapshot: 'Initial state',
    state: 'State',
    finish: 'Finish',
    undefinedValue: 'Unknown',
    invalidTitle: 'Unable to run simulation',
    invalidBody: 'The simulation spec did not pass validation, so it was not rendered.',
    scenarioKinds: {
      'happy-path': 'Happy path',
      failure: 'Failure scenario',
      'what-if': 'What-if scenario',
    } satisfies Record<SimulationScenario['kind'], string>,
    terminals: {
      success: 'Success',
      degraded: 'Degraded',
      failed: 'Failed',
    } satisfies Record<SimulationScenario['terminalState'], string>,
  },
}

function usePrefersReducedMotion() {
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false)

  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)')
    const updatePreference = () => setPrefersReducedMotion(mediaQuery.matches)
    updatePreference()
    mediaQuery.addEventListener('change', updatePreference)
    return () => mediaQuery.removeEventListener('change', updatePreference)
  }, [])

  return prefersReducedMotion
}

function formatScalar(value: SimulationScalar | undefined, undefinedValue: string) {
  if (value === undefined) return undefinedValue
  if (value === null) return 'null'
  if (typeof value === 'boolean') return value ? 'true' : 'false'
  return String(value)
}

function snapshotDescription(snapshot: Record<string, SimulationScalar>, undefinedValue: string) {
  return Object.entries(snapshot)
    .map(([key, value]) => `${key}: ${formatScalar(value, undefinedValue)}`)
    .join('; ')
}

function SimulationPlayback({
  spec,
  initialScenarioId,
  className,
}: SimulationPlayerProps) {
  const reducer = useMemo(
    () => (state: SimulationRuntimeState, action: SimulationAction) => reduceSimulationState(spec, state, action),
    [spec],
  )
  const [state, dispatch] = useReducer(reducer, createInitialSimulationState(spec, initialScenarioId))
  const prefersReducedMotion = usePrefersReducedMotion()
  const copy = simulationCopyByLocale[spec.locale]
  const instanceId = useId()
  const scenarioSelectId = `${instanceId}-scenario`
  const speedSelectId = `${instanceId}-speed`
  const scenarioHelpId = `${instanceId}-scenario-help`

  const scenario = getSimulationScenario(spec, state.scenarioId) ?? spec.scenarios[0]
  const currentTransition = state.frame >= 0 ? scenario.transitions[state.frame] : undefined
  const currentSnapshot = getSimulationSnapshot(spec, state)
  const invariantResults = evaluateSimulationInvariants(spec.invariants, currentSnapshot)
  const currentPosition = state.frame + 1

  useEffect(() => {
    if (!prefersReducedMotion || state.status !== 'playing') return
    dispatch({ type: 'PAUSE' })
  }, [prefersReducedMotion, state.status])

  useEffect(() => {
    if (state.status !== 'playing' || prefersReducedMotion) return
    const delay = Math.round(1_800 / state.speed)
    const timer = window.setTimeout(() => dispatch({ type: 'STEP_NEXT' }), delay)
    return () => window.clearTimeout(timer)
  }, [prefersReducedMotion, state.frame, state.speed, state.status])

  const handleSpeedChange = (value: string) => {
    const speed = Number(value) as SimulationSpeed
    if (simulationSpeeds.includes(speed)) dispatch({ type: 'SET_SPEED', speed })
  }

  const statusMessage = currentTransition
    ? copy.stepStatus(currentPosition, scenario.transitions.length, currentTransition.event, currentTransition.explanation)
    : copy.initialStatus(scenario.label)

  return (
    <section
      className={['simulation-player', className].filter(Boolean).join(' ')}
      lang={spec.locale}
      aria-labelledby={`${instanceId}-title`}
    >
      <header className="simulation-player__header">
        <div>
          <span className="simulation-player__eyebrow">{copy.eyebrow}</span>
          <h2 id={`${instanceId}-title`}>{spec.learningObjective}</h2>
          <p>{spec.takeaway}</p>
        </div>
        <span className={`simulation-player__review-status simulation-player__review-status--${spec.status}`}>
          {spec.status === 'reviewed' ? copy.reviewed : copy.needsReview}
        </span>
      </header>

      <div className="simulation-player__teaching-note">
        <strong>{copy.misconception}</strong>
        <p>{spec.misconception}</p>
      </div>

      <div className="simulation-player__settings">
        <label htmlFor={scenarioSelectId}>
          {copy.scenario}
          <select
            id={scenarioSelectId}
            aria-describedby={scenarioHelpId}
            value={scenario.id}
            onChange={(event) => dispatch({ type: 'SELECT_SCENARIO', scenarioId: event.target.value })}
          >
            {spec.scenarios.map((entry) => (
              <option key={entry.id} value={entry.id}>
                {copy.scenarioKinds[entry.kind]} · {entry.label}
              </option>
            ))}
          </select>
        </label>
        <span id={scenarioHelpId} className="simulation-player__scenario-kind">
          {copy.scenarioKinds[scenario.kind]}
        </span>
        <label htmlFor={speedSelectId}>
          {copy.speed}
          <select
            id={speedSelectId}
            value={state.speed}
            disabled={prefersReducedMotion}
            onChange={(event) => handleSpeedChange(event.target.value)}
          >
            {simulationSpeeds.map((speed) => <option key={speed} value={speed}>{speed}×</option>)}
          </select>
        </label>
      </div>

      {prefersReducedMotion && (
        <p className="simulation-player__motion-notice" role="status">
          {copy.reducedMotion}
        </p>
      )}

      <div className="simulation-player__progress">
        <div>
          <span>{state.frame < 0 ? copy.initial : copy.step(currentPosition, scenario.transitions.length)}</span>
          <span>{Math.round((currentPosition / scenario.transitions.length) * 100)}%</span>
        </div>
        <progress max={scenario.transitions.length} value={currentPosition}>
          {currentPosition}/{scenario.transitions.length}
        </progress>
      </div>

      <ol className="simulation-player__actors" aria-label={copy.actors}>
        {spec.actors.map((actor) => {
          const isHighlighted = currentTransition?.highlights.includes(actor.id) ?? false
          const actorState = getSimulationActorPlaybackState(actor.id, scenario, state)
          const actorStateLabel = actorState === 'active' ? copy.actorActive : actorState === 'complete' ? copy.actorComplete : copy.actorWaiting
          return (
            <li key={actor.id} data-state={actorState} data-highlighted={isHighlighted || undefined}>
              <span className="simulation-player__actor-icon" aria-hidden="true">
                {actor.label.slice(0, 2).toUpperCase()}
              </span>
              <span>
                <strong>{actor.label}</strong>
                <small>{actor.role}</small>
              </span>
              <em>{actorStateLabel}</em>
            </li>
          )
        })}
      </ol>

      <div className="simulation-player__current">
        <span>{currentTransition ? copy.stepLabel(currentPosition) : copy.initialState}</span>
        <h3>{currentTransition?.event ?? scenario.label}</h3>
        <p>{currentTransition?.explanation ?? copy.initialDescription}</p>
        {state.status === 'complete' && (
          <p className={`simulation-player__terminal simulation-player__terminal--${scenario.terminalState}`}>
            <strong>{copy.terminals[scenario.terminalState]}:</strong> {scenario.terminalSummary}
          </p>
        )}
      </div>

      <div className="simulation-player__state-grid">
        <section aria-labelledby={`${instanceId}-snapshot-title`}>
          <h3 id={`${instanceId}-snapshot-title`}>{copy.snapshot}</h3>
          <dl>
            {Object.entries(currentSnapshot).map(([key, value]) => {
              const highlighted = currentTransition?.highlights.includes(key) ?? false
              return (
                <div key={key} data-highlighted={highlighted || undefined}>
                  <dt>{key}</dt>
                  <dd>{formatScalar(value, copy.undefinedValue)}</dd>
                </div>
              )
            })}
          </dl>
        </section>
        <section aria-labelledby={`${instanceId}-invariants-title`}>
          <h3 id={`${instanceId}-invariants-title`}>{copy.invariants}</h3>
          <ul className="simulation-player__invariants">
            {invariantResults.map(({ invariant, status }) => (
              <li key={invariant.id} data-status={status}>
                <span aria-hidden="true">{status === 'pass' ? '✓' : status === 'fail' ? '×' : '?'}</span>
                <span><strong>{invariant.label}</strong><small>{status === 'pass' ? copy.invariantPass : status === 'fail' ? copy.invariantFail : copy.invariantUnknown}</small></span>
              </li>
            ))}
          </ul>
        </section>
      </div>

      <div className="simulation-player__controls" aria-label={copy.controls}>
        <button type="button" onClick={() => dispatch({ type: 'RESET' })} aria-label={copy.resetAria}>
          <RotateCcw size={17} aria-hidden="true" /> {copy.reset}
        </button>
        <button
          type="button"
          onClick={() => dispatch({ type: 'STEP_PREVIOUS' })}
          disabled={state.frame < 0}
          aria-label={copy.previousAria}
        >
          <ChevronLeft size={18} aria-hidden="true" /> {copy.previous}
        </button>
        <button
          type="button"
          className="simulation-player__play"
          disabled={prefersReducedMotion}
          onClick={() => dispatch({ type: state.status === 'playing' ? 'PAUSE' : 'PLAY' })}
          aria-label={state.status === 'playing' ? copy.pauseAria : state.status === 'complete' ? copy.replayAria : copy.playAria}
        >
          {state.status === 'playing' ? <Pause size={18} aria-hidden="true" /> : <Play size={18} aria-hidden="true" />}
          {state.status === 'playing' ? copy.pause : state.status === 'complete' ? copy.replay : copy.play}
        </button>
        <button
          type="button"
          onClick={() => dispatch({ type: 'STEP_NEXT' })}
          disabled={state.frame >= scenario.transitions.length - 1}
          aria-label={copy.nextAria}
        >
          {copy.next} <ChevronRight size={18} aria-hidden="true" />
        </button>
      </div>

      <p className="simulation-player__sr-status sr-only" aria-live="polite" aria-atomic="true">{statusMessage}</p>

      <details className="simulation-player__transcript">
        <summary>{copy.transcript}</summary>
        <div>
          <p><strong>{copy.initialSnapshot}:</strong> {snapshotDescription(scenario.initialSnapshot, copy.undefinedValue)}</p>
          <ol>
            {scenario.transitions.map((transition, index) => (
              <li key={transition.id}>
                <strong>{copy.stepLabel(index + 1)} — {transition.event}</strong>
                <p>{transition.explanation}</p>
                <p>{copy.state}: {snapshotDescription(transition.snapshot, copy.undefinedValue)}</p>
              </li>
            ))}
          </ol>
          <p><strong>{copy.finish} — {copy.terminals[scenario.terminalState]}:</strong> {scenario.terminalSummary}</p>
        </div>
      </details>
    </section>
  )
}

export function SimulationPlayer(props: SimulationPlayerProps) {
  const validation = useMemo(() => validateSimulationSpec(props.spec), [props.spec])
  const copy = simulationCopyByLocale[props.spec.locale] ?? simulationCopyByLocale.vi

  if (!validation.success) {
    return (
      <section
        className="simulation-player simulation-player--invalid"
        lang={props.spec.locale}
        role="alert"
      >
        <h2>{copy.invalidTitle}</h2>
        <p>{copy.invalidBody}</p>
        <ul>
          {validation.issues.slice(0, 8).map((issue, index) => (
            <li key={`${issue.path}-${index}`}><code>{issue.path}</code>: {issue.message}</li>
          ))}
        </ul>
      </section>
    )
  }

  return (
    <SimulationPlayback
      key={`${validation.data.id}:${validation.data.sourceContentHash}`}
      {...props}
      spec={validation.data}
    />
  )
}

export default SimulationPlayer
