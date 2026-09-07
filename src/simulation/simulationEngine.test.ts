import { describe, expect, it } from 'vitest'
import type { SimulationSpec } from '../content/types'
import {
  createInitialSimulationState,
  evaluateSimulationInvariants,
  getSimulationActorPlaybackState,
  getSimulationSnapshot,
  reduceSimulationState,
} from './simulationEngine'

const HASH = 'a'.repeat(64)

function createSpec(): SimulationSpec {
  return {
    schemaVersion: 1,
    id: 'sim.checkout',
    sourceQuestionId: 'checkout-1',
    sourceContentHash: HASH,
    locale: 'vi',
    kind: 'sequence',
    learningObjective: 'Hiểu request đi qua service như thế nào.',
    misconception: 'Response thành công đồng nghĩa mọi bước đều an toàn.',
    takeaway: 'Theo dõi từng state transition và invariant.',
    actors: [
      { id: 'client', label: 'Client', role: 'Gửi request', iconToken: 'client' },
      { id: 'service', label: 'Service', role: 'Xử lý request', iconToken: 'service' },
    ],
    scenarios: [
      {
        id: 'normal',
        label: 'Request hợp lệ',
        kind: 'happy-path',
        initialSnapshot: { stage: 'idle', attempts: 0 },
        transitions: [
          {
            id: 'normal.received',
            actorId: 'client',
            event: 'Gửi request',
            explanation: 'Client gửi một request có idempotency key.',
            snapshot: { stage: 'received', attempts: 1 },
            highlights: ['client', 'stage'],
          },
          {
            id: 'normal.completed',
            actorId: 'service',
            event: 'Commit kết quả',
            explanation: 'Service kiểm tra invariant trước khi trả response.',
            snapshot: { stage: 'completed', attempts: 1 },
            highlights: ['service', 'stage'],
          },
        ],
        terminalState: 'success',
        terminalSummary: 'Request hoàn tất một lần.',
      },
      {
        id: 'failure',
        label: 'Request lặp lại',
        kind: 'failure',
        initialSnapshot: { stage: 'idle', attempts: 0 },
        transitions: [
          {
            id: 'failure.retried',
            actorId: 'service',
            event: 'Retry không an toàn',
            explanation: 'Service nhận lại request nhưng không deduplicate.',
            snapshot: { stage: 'duplicated', attempts: 2 },
            highlights: ['service', 'attempts'],
          },
        ],
        terminalState: 'failed',
        terminalSummary: 'Side effect bị tạo hai lần.',
      },
    ],
    invariants: [
      { id: 'attempt-limit', label: 'Không xử lý quá một lần', stateKey: 'attempts', operator: 'lte', expected: 1 },
    ],
    status: 'generated-needs-review',
    generation: {
      model: 'test-model',
      promptVersion: 'v1',
      generatedAt: '2026-09-07T10:00:00.000Z',
      inputHash: 'b'.repeat(64),
    },
  }
}

describe('simulation runtime', () => {
  it('starts at frame -1 using the happy-path initial snapshot', () => {
    const spec = createSpec()
    const state = createInitialSimulationState(spec)

    expect(state).toEqual({ scenarioId: 'normal', frame: -1, status: 'idle', speed: 1 })
    expect(getSimulationSnapshot(spec, state)).toEqual({ stage: 'idle', attempts: 0 })
  })

  it('plays deterministically until the terminal frame', () => {
    const spec = createSpec()
    let state = createInitialSimulationState(spec)
    state = reduceSimulationState(spec, state, { type: 'PLAY' })
    state = reduceSimulationState(spec, state, { type: 'STEP_NEXT' })

    expect(state).toMatchObject({ frame: 0, status: 'playing' })
    expect(getSimulationSnapshot(spec, state)).toEqual({ stage: 'received', attempts: 1 })

    state = reduceSimulationState(spec, state, { type: 'STEP_NEXT' })
    expect(state).toMatchObject({ frame: 1, status: 'complete' })
    expect(getSimulationActorPlaybackState('service', spec.scenarios[0], state)).toBe('complete')
  })

  it('keeps actor progress separate from the visible transition highlight', () => {
    const spec = createSpec()
    const scenario = spec.scenarios[0]
    let state = createInitialSimulationState(spec)

    state = reduceSimulationState(spec, state, { type: 'STEP_NEXT' })
    expect(getSimulationActorPlaybackState('client', scenario, state)).toBe('active')
    expect(getSimulationActorPlaybackState('service', scenario, state)).toBe('waiting')

    state = reduceSimulationState(spec, state, { type: 'STEP_NEXT' })
    expect(scenario.transitions[state.frame].highlights).toContain('service')
    expect(getSimulationActorPlaybackState('client', scenario, state)).toBe('complete')
    expect(getSimulationActorPlaybackState('service', scenario, state)).toBe('complete')
  })

  it('does not mark a recurring actor complete before its final transition', () => {
    const spec = createSpec()
    const scenario = spec.scenarios[0]
    scenario.transitions.push({
      id: 'normal.confirmed',
      actorId: 'client',
      event: 'Nhận kết quả',
      explanation: 'Client hiển thị kết quả sau khi service hoàn tất.',
      snapshot: { stage: 'confirmed', attempts: 1 },
      highlights: ['client', 'stage'],
    })
    let state = createInitialSimulationState(spec)

    state = reduceSimulationState(spec, state, { type: 'STEP_NEXT' })
    state = reduceSimulationState(spec, state, { type: 'STEP_NEXT' })
    expect(getSimulationActorPlaybackState('client', scenario, state)).toBe('visited')
    expect(getSimulationActorPlaybackState('service', scenario, state)).toBe('active')

    state = reduceSimulationState(spec, state, { type: 'STEP_NEXT' })
    expect(getSimulationActorPlaybackState('client', scenario, state)).toBe('complete')
    expect(getSimulationActorPlaybackState('service', scenario, state)).toBe('complete')
  })

  it('supports scenario selection, manual stepping, reset and speed', () => {
    const spec = createSpec()
    let state = createInitialSimulationState(spec)
    state = reduceSimulationState(spec, state, { type: 'SELECT_SCENARIO', scenarioId: 'failure' })
    state = reduceSimulationState(spec, state, { type: 'SET_SPEED', speed: 2 })
    state = reduceSimulationState(spec, state, { type: 'STEP_NEXT' })

    expect(state).toEqual({ scenarioId: 'failure', frame: 0, status: 'complete', speed: 2 })
    expect(getSimulationSnapshot(spec, state)).toEqual({ stage: 'duplicated', attempts: 2 })

    state = reduceSimulationState(spec, state, { type: 'STEP_PREVIOUS' })
    expect(state).toMatchObject({ frame: -1, status: 'idle' })
    state = reduceSimulationState(spec, state, { type: 'STEP_NEXT' })
    state = reduceSimulationState(spec, state, { type: 'RESET' })
    expect(state).toEqual({ scenarioId: 'failure', frame: -1, status: 'idle', speed: 2 })
  })

  it('ignores an unknown scenario and restarts play after completion', () => {
    const spec = createSpec()
    let state = createInitialSimulationState(spec)
    const unchanged = reduceSimulationState(spec, state, { type: 'SELECT_SCENARIO', scenarioId: 'missing' })
    expect(unchanged).toBe(state)

    state = reduceSimulationState(spec, state, { type: 'STEP_NEXT' })
    state = reduceSimulationState(spec, state, { type: 'STEP_NEXT' })
    state = reduceSimulationState(spec, state, { type: 'PLAY' })
    expect(state).toMatchObject({ frame: -1, status: 'playing' })
  })

  it('evaluates invariant results without mutating the snapshot', () => {
    const invariants = createSpec().invariants
    const snapshot = { stage: 'completed', attempts: 2 }

    const [result] = evaluateSimulationInvariants(invariants, snapshot)
    expect(result).toMatchObject({ status: 'fail', actual: 2 })
    expect(snapshot).toEqual({ stage: 'completed', attempts: 2 })
  })
})
