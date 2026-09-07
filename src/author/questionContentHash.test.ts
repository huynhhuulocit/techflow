import { describe, expect, it } from 'vitest'
import {
  canonicalQuestionContent,
  canonicalSimulationGenerationInput,
  questionContentHash,
  sha256Utf8,
  simulationEditorIdentity,
  simulationGenerationInputHash,
  type SimulationGenerationInputShape,
} from './questionContentHash'
import { createTestDraft, testContent } from './testFixtures'

describe('sha256Utf8', () => {
  it.each([
    ['', 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855'],
    ['abc', 'ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad'],
    ['Tiếng Việt', '690829f87a103acd5eb5734b27b86ca2fc994ea6cabf6c18285130906fed8419'],
  ])('matches the known SHA-256 vector for %j', (input, expected) => {
    expect(sha256Utf8(input)).toBe(expected)
  })

  it('matches the server stableHash(JSON.stringify(content)) property order contract', () => {
    expect(canonicalQuestionContent(testContent)).toBe(
      '{"question":"Redis cache là gì?","quickAnswer":"Cache stores hot data.","conceptualExplanation":"Reads check cache before database.","productionTradeOff":"Invalidation and staleness must be managed.","appliedExample":{"label":"GameStream","detail":"Redis caches product reads."}}',
    )
    expect(questionContentHash(testContent)).toBe('f4406b32d893c53242a53a1c38f510f3e8f4cf01401e31d06f716fced9e73218')
  })
})

describe('simulation request identity', () => {
  const draft = createTestDraft()
  const input: SimulationGenerationInputShape = {
    draft: {
      id: draft.id,
      locale: draft.locale,
      topicSlug: draft.topicSlug,
      level: draft.level,
      content: draft.content,
      sourceNotes: draft.sourceNotes,
    },
    kind: 'sequence',
    failureScenario: 'Cache miss',
  }

  it('matches the normalized property order used by the local Author API', () => {
    const withWhitespace: SimulationGenerationInputShape = {
      ...input,
      draft: {
        ...input.draft,
        id: ` ${input.draft.id} `,
        topicSlug: ` ${input.draft.topicSlug} `,
        sourceNotes: ` ${input.draft.sourceNotes} `,
      },
      failureScenario: ' Cache miss ',
    }

    expect(canonicalSimulationGenerationInput(withWhitespace)).toBe(JSON.stringify({
      draft: {
        id: draft.id,
        locale: draft.locale,
        topicSlug: draft.topicSlug,
        level: draft.level,
        content: draft.content,
        sourceNotes: draft.sourceNotes,
      },
      kind: 'sequence',
      failureScenario: 'Cache miss',
    }))
    expect(simulationGenerationInputHash(withWhitespace)).toBe(simulationGenerationInputHash(input))
  })

  it.each([
    ['draft ID', { ...input, draft: { ...input.draft, id: 'draft-other' } }],
    ['locale', { ...input, draft: { ...input.draft, locale: 'en' as const } }],
    ['topic', { ...input, draft: { ...input.draft, topicSlug: 'typescript' } }],
    ['level', { ...input, draft: { ...input.draft, level: 'senior' as const } }],
    ['content', { ...input, draft: { ...input.draft, content: { ...input.draft.content, quickAnswer: `${input.draft.content.quickAnswer}!` } } }],
    ['source notes', { ...input, draft: { ...input.draft, sourceNotes: `${input.draft.sourceNotes}!` } }],
    ['kind', { ...input, kind: 'state' as const }],
    ['failure scenario', { ...input, failureScenario: 'Broker unavailable' }],
  ] satisfies [string, SimulationGenerationInputShape][])('detects an editor change to %s', (_label, changed) => {
    expect(simulationEditorIdentity(changed)).not.toBe(simulationEditorIdentity(input))
  })
})
