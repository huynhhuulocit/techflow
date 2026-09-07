import type {
  SimulationInvariant,
  SimulationPlaybackSpec,
  SimulationScalar,
  SimulationScenario,
} from '../content/types.ts'

export const simulationSpeeds = [0.5, 1, 1.5, 2] as const

export type SimulationSpeed = (typeof simulationSpeeds)[number]

export type SimulationPlaybackStatus = 'idle' | 'playing' | 'paused' | 'complete'

export type SimulationRuntimeState = {
  scenarioId: string
  /** -1 represents the scenario's initial state, before the first transition. */
  frame: number
  status: SimulationPlaybackStatus
  speed: SimulationSpeed
}

export type SimulationAction =
  | { type: 'SELECT_SCENARIO'; scenarioId: string }
  | { type: 'PLAY' }
  | { type: 'PAUSE' }
  | { type: 'STEP_NEXT' }
  | { type: 'STEP_PREVIOUS' }
  | { type: 'RESET' }
  | { type: 'SET_SPEED'; speed: SimulationSpeed }

export type SimulationInvariantResult = {
  invariant: SimulationInvariant
  status: 'pass' | 'fail' | 'unknown'
  actual: SimulationScalar | undefined
}

export type SimulationActorPlaybackState = 'active' | 'visited' | 'complete' | 'waiting'

function firstScenario(spec: SimulationPlaybackSpec): SimulationScenario | undefined {
  return spec.scenarios.find((scenario) => scenario.kind === 'happy-path') ?? spec.scenarios[0]
}

export function getSimulationScenario(
  spec: SimulationPlaybackSpec,
  scenarioId: string,
): SimulationScenario | undefined {
  return spec.scenarios.find((scenario) => scenario.id === scenarioId)
}

export function createInitialSimulationState(
  spec: SimulationPlaybackSpec,
  scenarioId?: string,
): SimulationRuntimeState {
  const requestedScenario = scenarioId ? getSimulationScenario(spec, scenarioId) : undefined
  const scenario = requestedScenario ?? firstScenario(spec)

  return {
    scenarioId: scenario?.id ?? '',
    frame: -1,
    status: 'idle',
    speed: 1,
  }
}

/**
 * Pure state transition function. Keeping the spec outside runtime state makes
 * playback serializable while ensuring every transition is derived from the
 * reviewed simulation definition.
 */
export function reduceSimulationState(
  spec: SimulationPlaybackSpec,
  state: SimulationRuntimeState,
  action: SimulationAction,
): SimulationRuntimeState {
  const scenario = getSimulationScenario(spec, state.scenarioId) ?? firstScenario(spec)

  switch (action.type) {
    case 'SELECT_SCENARIO': {
      if (!getSimulationScenario(spec, action.scenarioId)) return state
      return {
        ...state,
        scenarioId: action.scenarioId,
        frame: -1,
        status: 'idle',
      }
    }
    case 'PLAY': {
      if (!scenario || scenario.transitions.length === 0) return state
      const isAtEnd = state.frame >= scenario.transitions.length - 1
      return {
        ...state,
        scenarioId: scenario.id,
        frame: isAtEnd ? -1 : state.frame,
        status: 'playing',
      }
    }
    case 'PAUSE':
      return state.status === 'playing' ? { ...state, status: 'paused' } : state
    case 'STEP_NEXT': {
      if (!scenario || scenario.transitions.length === 0) return state
      const lastFrame = scenario.transitions.length - 1
      const nextFrame = Math.min(state.frame + 1, lastFrame)
      return {
        ...state,
        scenarioId: scenario.id,
        frame: nextFrame,
        status: nextFrame === lastFrame
          ? 'complete'
          : state.status === 'playing' ? 'playing' : 'paused',
      }
    }
    case 'STEP_PREVIOUS': {
      if (!scenario) return state
      const previousFrame = Math.max(-1, state.frame - 1)
      return {
        ...state,
        scenarioId: scenario.id,
        frame: previousFrame,
        status: previousFrame === -1 ? 'idle' : 'paused',
      }
    }
    case 'RESET':
      return {
        ...state,
        scenarioId: scenario?.id ?? state.scenarioId,
        frame: -1,
        status: 'idle',
      }
    case 'SET_SPEED':
      return simulationSpeeds.includes(action.speed)
        ? { ...state, speed: action.speed }
        : state
    default:
      return state
  }
}

export function getSimulationSnapshot(
  spec: SimulationPlaybackSpec,
  state: SimulationRuntimeState,
): Record<string, SimulationScalar> {
  const scenario = getSimulationScenario(spec, state.scenarioId) ?? firstScenario(spec)
  if (!scenario) return {}
  if (state.frame < 0) return scenario.initialSnapshot
  return scenario.transitions[state.frame]?.snapshot ?? scenario.initialSnapshot
}

/**
 * Actor progress and transition highlighting are intentionally separate. The
 * actor for the visible transition is active while playback is in progress.
 * An actor is only complete after its final transition in the scenario; an
 * actor that already ran but will participate again is marked visited.
 */
export function getSimulationActorPlaybackState(
  actorId: string,
  scenario: SimulationScenario,
  state: SimulationRuntimeState,
): SimulationActorPlaybackState {
  const currentTransition = state.frame >= 0 ? scenario.transitions[state.frame] : undefined
  if (state.status !== 'complete' && currentTransition?.actorId === actorId) return 'active'

  const actorHasRun = scenario.transitions
    .slice(0, Math.max(0, state.frame + 1))
    .some((transition) => transition.actorId === actorId)
  const actorRunsAgain = scenario.transitions
    .slice(Math.max(0, state.frame + 1))
    .some((transition) => transition.actorId === actorId)
  if (!actorHasRun) return 'waiting'
  return actorRunsAgain ? 'visited' : 'complete'
}

export function evaluateSimulationInvariants(
  invariants: SimulationInvariant[],
  snapshot: Record<string, SimulationScalar>,
): SimulationInvariantResult[] {
  return invariants.map((invariant) => {
    const actual = snapshot[invariant.stateKey]
    if (actual === undefined) return { invariant, actual, status: 'unknown' }

    let passes = false
    switch (invariant.operator) {
      case 'eq':
        passes = actual === invariant.expected
        break
      case 'neq':
        passes = actual !== invariant.expected
        break
      case 'gte':
        passes = typeof actual === 'number'
          && typeof invariant.expected === 'number'
          && actual >= invariant.expected
        break
      case 'lte':
        passes = typeof actual === 'number'
          && typeof invariant.expected === 'number'
          && actual <= invariant.expected
        break
      case 'includes':
        passes = typeof actual === 'string'
          && typeof invariant.expected === 'string'
          && actual.includes(invariant.expected)
        break
    }

    return { invariant, actual, status: passes ? 'pass' : 'fail' }
  })
}
