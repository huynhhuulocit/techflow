import type { QuestionDraft, QuestionSimulationSpec } from '../content/types'
import { simulationReviewHash } from '../simulation'
import { questionContentHash } from './questionContentHash'

export const testContent: QuestionDraft['content'] = {
  question: 'Redis cache là gì?',
  quickAnswer: 'Cache stores hot data.',
  conceptualExplanation: 'Reads check cache before database.',
  productionTradeOff: 'Invalidation and staleness must be managed.',
  appliedExample: {
    label: 'GameStream',
    detail: 'Redis caches product reads.',
  },
}

export function createTestSimulation(
  draftId = 'draft-test-1',
  contentHash = questionContentHash(testContent),
  status: QuestionSimulationSpec['status'] = 'generated-needs-review',
): QuestionSimulationSpec {
  const simulation: QuestionSimulationSpec = {
    schemaVersion: 1,
    id: 'simulation-test-1',
    sourceQuestionId: draftId,
    sourceContentHash: contentHash,
    locale: 'vi',
    kind: 'sequence',
    learningObjective: 'Hiểu cache lookup trước database.',
    misconception: 'Cache luôn chứa dữ liệu mới nhất.',
    takeaway: 'Cache cần invalidation và fallback.',
    actors: [
      { id: 'client', label: 'Client', role: 'Gửi request', iconToken: 'client' },
      { id: 'cache', label: 'Redis', role: 'Giữ hot data', iconToken: 'cache' },
    ],
    scenarios: [{
      id: 'happy-path',
      label: 'Cache hit',
      kind: 'happy-path',
      initialSnapshot: { cacheHit: false },
      transitions: [{
        id: 'cache-read',
        actorId: 'cache',
        event: 'Đọc cache',
        explanation: 'Redis trả về dữ liệu đã cache.',
        snapshot: { cacheHit: true },
        highlights: ['cache', 'cacheHit'],
      }],
      terminalState: 'success',
      terminalSummary: 'Request hoàn tất từ cache.',
    }],
    invariants: [{
      id: 'cache-hit-invariant',
      label: 'Cache hit sau lookup',
      stateKey: 'cacheHit',
      operator: 'eq',
      expected: true,
    }],
    status,
    generation: {
      model: 'test-model',
      promptVersion: 'simulation-v1',
      generatedAt: '2026-09-07T00:00:00.000Z',
      inputHash: 'a'.repeat(64),
    },
  }
  if (status === 'reviewed') {
    simulation.review = {
      reviewer: 'Technical reviewer',
      reviewedAt: '2026-09-07T00:00:00.000Z',
      contentHash: simulationReviewHash(simulation),
      evidence: [{ label: 'Official docs', url: 'https://example.com/docs' }],
    }
  }
  return simulation
}

export function createTestDraft(overrides: Partial<QuestionDraft> = {}): QuestionDraft {
  const base: QuestionDraft = {
    schemaVersion: 1,
    id: 'draft-test-1',
    locale: 'vi',
    topicSlug: 'redis',
    level: 'junior',
    content: {
      ...testContent,
      appliedExample: { ...testContent.appliedExample },
    },
    sourceNotes: 'Official Redis documentation.',
    lifecycle: 'draft',
    reviewStatus: 'draft-needs-review',
    provenance: {
      kind: 'manual',
      createdAt: '2026-09-07T00:00:00.000Z',
    },
  }
  return { ...base, ...overrides }
}
