import { describe, expect, it } from 'vitest'
import type { SimulationSpec } from '../content/types'
import {
  canonicalSimulationReviewContent,
  simulationReviewHash,
  validateSimulationSpec,
} from './simulationValidator'

const HASH = 'a'.repeat(64)

function validSpec(): SimulationSpec {
  return {
    schemaVersion: 1,
    id: 'sim.queue',
    sourceQuestionId: 'question.queue.1',
    sourceContentHash: HASH,
    locale: 'vi',
    kind: 'flow',
    learningObjective: 'Quan sát at-least-once delivery.',
    misconception: 'Consumer luôn nhận message đúng một lần.',
    takeaway: 'Consumer cần idempotent dù broker retry.',
    actors: [
      { id: 'producer', label: 'Producer', role: 'Publish message', iconToken: 'service' },
      { id: 'queue', label: 'Queue', role: 'Giữ message', iconToken: 'queue' },
      { id: 'consumer', label: 'Consumer', role: 'Xử lý message', iconToken: 'service' },
    ],
    scenarios: [
      {
        id: 'happy',
        label: 'Xử lý thành công',
        kind: 'happy-path',
        initialSnapshot: { phase: 'new', deliveryCount: 0 },
        transitions: [
          {
            id: 'happy.publish',
            actorId: 'producer',
            event: 'Publish',
            explanation: 'Producer gửi message vào queue.',
            snapshot: { phase: 'queued', deliveryCount: 0 },
            highlights: ['producer', 'phase'],
          },
          {
            id: 'happy.consume',
            actorId: 'consumer',
            event: 'Consume',
            explanation: 'Consumer xử lý và acknowledge message.',
            snapshot: { phase: 'done', deliveryCount: 1 },
            highlights: ['consumer', 'deliveryCount'],
          },
        ],
        terminalState: 'success',
        terminalSummary: 'Message được xử lý thành công.',
      },
    ],
    invariants: [
      { id: 'delivery-bound', label: 'Không có delivery âm', stateKey: 'deliveryCount', operator: 'gte', expected: 0 },
    ],
    status: 'generated-needs-review',
    generation: {
      model: 'test-model',
      promptVersion: 'simulation-v1',
      generatedAt: '2026-09-07T10:00:00.000Z',
      responseId: 'resp_test',
      inputHash: 'b'.repeat(64),
    },
  }
}

type TestSimulationSpec = SimulationSpec & {
  html?: string
  actors: Array<SimulationSpec['actors'][number] & { color?: string }>
}

function cloneSpec(): TestSimulationSpec {
  return structuredClone(validSpec()) as TestSimulationSpec
}

function reviewedSpec(): TestSimulationSpec {
  const spec = cloneSpec()
  spec.status = 'reviewed'
  spec.review = {
    reviewer: 'Reviewer',
    reviewedAt: '2026-09-07T10:00:00.000Z',
    evidence: [{ label: 'Spec', url: 'https://example.com/spec' }],
    contentHash: simulationReviewHash(spec),
  }
  return spec
}

describe('validateSimulationSpec', () => {
  it('accepts a bounded, deterministic spec', () => {
    const spec = validSpec()
    const result = validateSimulationSpec(spec)

    expect(result.success).toBe(true)
    if (result.success) expect(result.data).toBe(spec)
  })

  it('rejects unknown keys at root and nested levels', () => {
    const spec = cloneSpec()
    spec.html = '<div>unsafe renderer</div>'
    spec.actors[0].color = 'purple'

    const result = validateSimulationSpec(spec)
    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.issues.map((issue) => issue.path)).toEqual(expect.arrayContaining([
        'simulation.html',
        'simulation.actors[0].color',
      ]))
    }
  })

  it('rejects unsafe markup and malformed source hashes', () => {
    const spec = cloneSpec()
    spec.learningObjective = '<script>alert(1)</script>'
    spec.sourceContentHash = 'not-a-hash'

    const result = validateSimulationSpec(spec)
    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.issues.some((issue) => issue.path === 'simulation.learningObjective')).toBe(true)
      expect(result.issues.some((issue) => issue.path === 'simulation.sourceContentHash')).toBe(true)
    }
  })

  it('rejects duplicate and missing references', () => {
    const spec = cloneSpec()
    spec.actors[1].id = 'producer'
    spec.scenarios[0].transitions[0].actorId = 'ghost'
    spec.scenarios[0].transitions[0].highlights = ['ghost', 'ghost']

    const result = validateSimulationSpec(spec)
    expect(result.success).toBe(false)
    if (!result.success) {
      const messages = result.issues.map((issue) => issue.message)
      expect(messages).toContain('Actor ID bị trùng.')
      expect(messages).toContain('Actor reference không tồn tại.')
      expect(messages).toContain('Highlight reference bị trùng.')
    }
  })

  it('enforces actor, scenario and transition bounds plus one happy path', () => {
    const spec = cloneSpec()
    spec.actors = [spec.actors[0]]
    spec.scenarios[0].kind = 'what-if'
    spec.scenarios[0].transitions = Array.from({ length: 25 }, (_, index) => ({
      ...spec.scenarios[0].transitions[0],
      id: `transition-${index}`,
    }))

    const result = validateSimulationSpec(spec)
    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.issues.some((issue) => issue.message === 'Simulation cần 2 đến 6 actors.')).toBe(true)
      expect(result.issues.some((issue) => issue.message === 'Mỗi scenario cần 1 đến 24 transitions.')).toBe(true)
      expect(result.issues.some((issue) => issue.message === 'Simulation phải có đúng một happy path.')).toBe(true)
    }
  })

  it('rejects inconsistent snapshots, terminal states and invalid invariants', () => {
    const spec = cloneSpec()
    spec.scenarios[0].terminalState = 'failed'
    spec.scenarios[0].transitions[0].snapshot = { phase: 'queued' }
    spec.invariants[0].stateKey = 'unknownState'
    spec.invariants[0].operator = 'gte'
    spec.invariants[0].expected = 'zero'

    const result = validateSimulationSpec(spec)
    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.issues.some((issue) => issue.message.includes('full snapshot'))).toBe(true)
      expect(result.issues.some((issue) => issue.message === 'Happy path phải kết thúc ở success.')).toBe(true)
      expect(result.issues.some((issue) => issue.message.includes('state key'))).toBe(true)
      expect(result.issues.some((issue) => issue.message.includes('expected là number'))).toBe(true)
    }
  })

  it('rejects an invariant contradicted by a happy-path terminal snapshot', () => {
    const spec = cloneSpec()
    spec.invariants[0] = {
      id: 'delivery-must-stay-zero',
      label: 'Delivery count must stay at zero',
      stateKey: 'deliveryCount',
      operator: 'eq',
      expected: 0,
    }

    const result = validateSimulationSpec(spec)
    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.issues).toContainEqual({
        path: 'simulation.scenarios[0].transitions[1].snapshot.deliveryCount',
        message: 'Happy-path terminal snapshot không thỏa invariant "delivery-must-stay-zero".',
      })
    }
  })

  it('rejects a decorative no-op transition', () => {
    const spec = cloneSpec()
    spec.scenarios[0].transitions[0].snapshot = { ...spec.scenarios[0].initialSnapshot }
    spec.scenarios[0].transitions[0].highlights = []

    const result = validateSimulationSpec(spec)
    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.issues.some((issue) => issue.message.includes('thay đổi state'))).toBe(true)
    }
  })

  it('canonicalizes every reviewable field while excluding status and review metadata', () => {
    const spec = reviewedSpec()
    const canonical = JSON.parse(canonicalSimulationReviewContent(spec)) as Record<string, unknown>
    const originalHash = simulationReviewHash(spec)
    const reorderedSnapshot = cloneSpec()
    reorderedSnapshot.scenarios[0].initialSnapshot = { deliveryCount: 0, phase: 'new' }

    expect(canonical).not.toHaveProperty('status')
    expect(canonical).not.toHaveProperty('review')
    expect(canonical).toMatchObject({
      sourceQuestionId: spec.sourceQuestionId,
      sourceContentHash: spec.sourceContentHash,
      generation: {
        model: 'test-model',
        responseId: 'resp_test',
        inputHash: 'b'.repeat(64),
      },
    })
    expect(simulationReviewHash(reorderedSnapshot)).toBe(originalHash)
  })

  it('requires complete review metadata with the exact canonical content hash', () => {
    const draftWithReview = cloneSpec()
    draftWithReview.review = {
      reviewer: 'Reviewer',
      reviewedAt: '2026-09-07T10:00:00.000Z',
      evidence: [{ label: 'Spec', url: 'https://example.com/spec' }],
      contentHash: 'c'.repeat(64),
    }
    expect(validateSimulationSpec(draftWithReview).success).toBe(false)

    const reviewed = reviewedSpec()
    expect(validateSimulationSpec(reviewed).success).toBe(true)
  })

  it.each([
    ['lesson content', (spec: TestSimulationSpec) => { spec.takeaway += ' Changed after review.' }],
    ['source binding', (spec: TestSimulationSpec) => { spec.sourceContentHash = 'd'.repeat(64) }],
    ['generation provenance', (spec: TestSimulationSpec) => { spec.generation.promptVersion = 'simulation-v2' }],
  ])('invalidates review when %s changes', (_label, mutate) => {
    const reviewed = reviewedSpec()
    mutate(reviewed)

    const result = validateSimulationSpec(reviewed)
    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.issues).toContainEqual({
        path: 'simulation.review.contentHash',
        message: 'Review contentHash không khớp canonical simulation content hiện tại.',
      })
    }
  })
})
