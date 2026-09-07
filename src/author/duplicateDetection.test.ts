import { describe, expect, it } from 'vitest'
import { findDuplicateWarnings, normalizeQuestionTitle, questionSimilarity } from './duplicateDetection'
import { createTestDraft } from './testFixtures'

describe('duplicate detection', () => {
  it('normalizes Vietnamese accents for exact comparison', () => {
    expect(normalizeQuestionTitle('Bộ nhớ đệm là gì?')).toBe('bo nho dem la gi')
  })

  it('warns on exact duplicates', () => {
    const candidate = createTestDraft({
      id: 'draft-candidate',
      content: { ...createTestDraft().content, question: 'Redis cache la gi' },
    })
    const warnings = findDuplicateWarnings(candidate, [createTestDraft()])
    expect(warnings[0]).toMatchObject({ kind: 'exact', draftId: 'draft-test-1' })
  })

  it('scores small title edits as near duplicates', () => {
    expect(questionSimilarity('Redis cache hoạt động như thế nào?', 'Redis cache hoạt động thế nào?')).toBeGreaterThan(.82)
  })
})
