import { describe, expect, it } from 'vitest'
import { validateQuestionDraft } from './draftValidation'
import { createTestDraft, createTestSimulation, testContent } from './testFixtures'
import { questionContentHash } from './questionContentHash'
import { createPwaKitArchitectureSimulation } from '../content/lessonSimulations/pwaKitArchitecture'

describe('validateQuestionDraft', () => {
  it('accepts a complete manual draft', () => {
    expect(validateQuestionDraft(createTestDraft()).success).toBe(true)
  })

  it('rejects an incomplete draft', () => {
    const result = validateQuestionDraft(createTestDraft({
      content: { ...testContent, quickAnswer: '' },
    }))
    expect(result.success).toBe(false)
    if (!result.success) expect(result.issues.some(issue => issue.path === 'draft.content.quickAnswer')).toBe(true)
  })

  it('requires traceability metadata for Question Bank copies', () => {
    const result = validateQuestionDraft(createTestDraft({
      provenance: {
        kind: 'question-bank-copy',
        createdAt: '2026-09-07T00:00:00.000Z',
      },
    }))
    expect(result.success).toBe(false)
    if (!result.success) expect(result.issues.some(issue => issue.path === 'draft.provenance.sourceQuestion')).toBe(true)
  })

  it('rejects reviewed simulations until canonical review hashing exists', () => {
    const simulation = createTestSimulation('draft-test-1', questionContentHash(testContent), 'reviewed')
    const result = validateQuestionDraft(createTestDraft({ simulation }))
    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.issues).toContainEqual(expect.objectContaining({ path: 'draft.simulation.status' }))
    }
  })

  it('rejects lesson-bound schema v2 simulations at the Question Studio boundary', () => {
    const draft = {
      ...createTestDraft(),
      simulation: createPwaKitArchitectureSimulation('vi', 'a'.repeat(64)),
    }
    const result = validateQuestionDraft(draft)

    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.issues).toContainEqual(expect.objectContaining({
        path: 'draft.simulation.schemaVersion',
      }))
    }
  })
})
