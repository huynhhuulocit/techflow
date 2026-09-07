import { describe, expect, it } from 'vitest'
import type { LocalizedInterviewQuestion } from '../content/types'
import { cloneDraftAsNew, createDraftFromInterviewQuestion } from './draftFactory'
import { createTestDraft } from './testFixtures'

const englishQuestion: LocalizedInterviewQuestion = {
  id: 'typescript-junior-question-1',
  topicSlug: 'typescript',
  level: 'junior',
  position: 1,
  source: {
    relativePath: 'typescript/01_junior_typescript.md',
    anchor: 'question-1',
  },
  reviewStatus: 'imported-needs-review',
  locale: 'en',
  translatedFromHash: 'a'.repeat(64),
  translationStatus: 'ai-translated-needs-review',
  translationProvenance: {
    kind: 'ai-translated',
    generatedAt: '2026-09-07T00:00:00.000Z',
    generator: 'test',
  },
  question: 'What is TypeScript?',
  quickAnswer: 'TypeScript adds static types to JavaScript.',
  conceptualExplanation: 'The compiler checks types before runtime.',
  productionTradeOff: 'Teams trade extra tooling for earlier feedback.',
  appliedExample: {
    label: 'Applied example',
    detail: 'A typed API client catches response-shape drift.',
  },
}

describe('draftFactory localization', () => {
  it('uses English provenance copy for an English Question Bank seed', () => {
    const draft = createDraftFromInterviewQuestion(englishQuestion, {
      id: 'draft-en',
      now: new Date('2026-09-07T00:00:00.000Z'),
    })

    expect(draft.locale).toBe('en')
    expect(draft.sourceNotes).toBe('Seeded from typescript/01_junior_typescript.md#question-1.')
  })

  it('localizes the cloned-question suffix', () => {
    const englishDraft = createTestDraft({
      locale: 'en',
      content: {
        ...createTestDraft().content,
        question: 'When does a Promise microtask run?',
      },
    })

    expect(cloneDraftAsNew(englishDraft, { id: 'draft-copy' }).content.question)
      .toBe('When does a Promise microtask run? (copy)')
  })
})
