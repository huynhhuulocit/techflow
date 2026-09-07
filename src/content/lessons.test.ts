import { describe, expect, it } from 'vitest'
import {
  lessonContentHash,
  validateLessonsByLocale,
} from './lessonValidation'
import { getLessons, lessonsByLocale } from './lessons'
import { simulationReviewHash } from '../simulation'
import type { LessonReviewMetadata, RichLesson } from './types'

function pwaKitLesson<TLocale extends 'vi' | 'en'>(locale: TLocale) {
  const lesson = getLessons(locale).find((entry) => entry.slug === 'pwa-kit-architecture')
  if (!lesson?.content) throw new Error(`Missing enriched PWA Kit lesson for ${locale}`)
  return lesson as Extract<RichLesson, { locale: TLocale }>
}

function reviewMetadata(contentHash: string): LessonReviewMetadata {
  return {
    reviewer: 'Technical reviewer',
    reviewedAt: '2026-09-07T00:00:00.000Z',
    evidence: [{ label: 'Primary documentation', url: 'https://example.com/reference' }],
    contentHash,
  }
}

function replaceLesson(locale: 'vi' | 'en', replacement: RichLesson) {
  return lessonsByLocale[locale].map((lesson) => (
    lesson.slug === replacement.slug ? replacement : lesson
  ))
}

describe('localized lesson content', () => {
  it('keeps the PWA Kit structure aligned between Vietnamese and English', () => {
    const vi = pwaKitLesson('vi')
    const en = pwaKitLesson('en')
    const viContent = vi.content!
    const enContent = en.content!

    expect(enContent.actors.map((actor) => actor.id)).toEqual(viContent.actors.map((actor) => actor.id))
    expect(enContent.mechanism.map((step) => step.id)).toEqual(viContent.mechanism.map((step) => step.id))
    expect(enContent.mechanism.map((step) => step.actorId)).toEqual(viContent.mechanism.map((step) => step.actorId))
    expect(enContent.productionTradeOffs).toHaveLength(viContent.productionTradeOffs.length)
    expect(enContent.misconceptions).toHaveLength(viContent.misconceptions.length)
    expect(enContent.appliedExample.steps).toHaveLength(viContent.appliedExample.steps.length)
    expect(enContent.evidence.map((item) => item.url)).toEqual(viContent.evidence.map((item) => item.url))
    expect(en.followUps).toHaveLength(3)
    expect(vi.followUps).toHaveLength(3)
  })

  it('keeps enriched lessons review-gated and internally consistent', () => {
    const vi = pwaKitLesson('vi')
    const en = pwaKitLesson('en')

    expect(vi.locale).toBe('vi')
    expect(vi.reviewStatus).toBe('draft-needs-review')
    expect(vi.review).toBeUndefined()
    expect(en.locale).toBe('en')
    expect(en.reviewStatus).toBe('draft-needs-review')
    expect(en.translationStatus).toBe('translated-needs-review')
    expect(en.translationReview).toBeUndefined()
    expect(en.translatedFromHash).toBe(lessonContentHash(vi))
    expect('reviewStatus' in vi.content).toBe(false)
    expect('reviewStatus' in en.content).toBe(false)
    expect(validateLessonsByLocale(lessonsByLocale)).toEqual({ success: true, issues: [] })
  })

  it('invalidates a technical review after any claim-bearing lesson text changes', () => {
    const source = pwaKitLesson('vi')
    const reviewed = {
      ...source,
      reviewStatus: 'reviewed',
      review: reviewMetadata(lessonContentHash(source)),
    } satisfies RichLesson
    const stale = { ...reviewed, followUps: [...reviewed.followUps, 'A new reviewed claim?'] } satisfies RichLesson
    const translation = {
      ...pwaKitLesson('en'),
      translatedFromHash: lessonContentHash(stale),
    } satisfies RichLesson

    const result = validateLessonsByLocale({
      vi: replaceLesson('vi', stale),
      en: replaceLesson('en', translation),
    })

    expect(result.success).toBe(false)
    if (!result.success) expect(result.issues.some((issue) => issue.code === 'technical-review-stale')).toBe(true)
  })

  it('hashes the title, quick answer, rich explanation, and follow-up claims', () => {
    const source = pwaKitLesson('vi')
    const originalHash = lessonContentHash(source)
    const mutations: RichLesson[] = [
      { ...source, title: `${source.title} changed` },
      { ...source, shortAnswer: `${source.shortAnswer} changed` },
      {
        ...source,
        content: {
          ...source.content,
          conceptualExplanation: `${source.content.conceptualExplanation} changed`,
        },
      },
      { ...source, followUps: [...source.followUps, 'changed'] },
    ]

    mutations.forEach((lesson) => expect(lessonContentHash(lesson)).not.toBe(originalHash))
  })

  it('invalidates English when its stored Vietnamese source hash is stale', () => {
    const source = pwaKitLesson('vi')
    const changedSource = { ...source, shortAnswer: `${source.shortAnswer} Nội dung đã đổi.` } satisfies RichLesson
    const result = validateLessonsByLocale({
      vi: replaceLesson('vi', changedSource),
      en: lessonsByLocale.en,
    })

    expect(result.success).toBe(false)
    if (!result.success) expect(result.issues.some((issue) => issue.code === 'translation-source-stale')).toBe(true)
  })

  it('invalidates a reviewed English translation after translated content changes', () => {
    const translation = pwaKitLesson('en')
    const reviewed = {
      ...translation,
      translationStatus: 'reviewed',
      translationReview: reviewMetadata(lessonContentHash(translation)),
    } satisfies RichLesson
    const stale = { ...reviewed, title: `${reviewed.title} Updated` } satisfies RichLesson
    const result = validateLessonsByLocale({
      vi: lessonsByLocale.vi,
      en: replaceLesson('en', stale),
    })

    expect(result.success).toBe(false)
    if (!result.success) expect(result.issues.some((issue) => issue.code === 'translation-review-stale')).toBe(true)
  })

  it('binds bilingual PWA simulations to the current narrative hashes', () => {
    const vi = pwaKitLesson('vi')
    const en = pwaKitLesson('en')

    expect(vi.simulation?.schemaVersion).toBe(2)
    expect(vi.simulation?.status).toBe('generated-needs-review')
    expect(vi.simulation?.source.contentHash).toBe(lessonContentHash(vi))
    expect(en.simulation?.source.contentHash).toBe(lessonContentHash(en))
    expect(vi.simulation?.scenarios.map((scenario) => scenario.id)).toEqual(
      en.simulation?.scenarios.map((scenario) => scenario.id),
    )
  })

  it('keeps narrative and simulation review hashes independent', () => {
    const source = pwaKitLesson('vi')
    if (!source.simulation) throw new Error('Missing PWA Kit simulation')
    const changed = structuredClone(source)
    if (!changed.simulation) throw new Error('Missing cloned PWA Kit simulation')
    const originalSimulationHash = simulationReviewHash(source.simulation)
    changed.simulation.takeaway += ' Nội dung simulation thay đổi.'

    expect(lessonContentHash(changed)).toBe(lessonContentHash(source))
    expect(simulationReviewHash(changed.simulation)).not.toBe(originalSimulationHash)
  })

  it('marks a lesson simulation stale when its narrative source changes', () => {
    const source = pwaKitLesson('vi')
    const changedSource = { ...source, title: `${source.title} updated` } satisfies RichLesson
    const translation = {
      ...pwaKitLesson('en'),
      translatedFromHash: lessonContentHash(changedSource),
    } satisfies RichLesson
    const result = validateLessonsByLocale({
      vi: replaceLesson('vi', changedSource),
      en: replaceLesson('en', translation),
    })

    expect(result.success).toBe(false)
    if (!result.success) expect(result.issues.some((issue) => issue.code === 'simulation-source-stale')).toBe(true)
  })

  it('rejects bilingual simulations with different machine topology', () => {
    const translation = structuredClone(pwaKitLesson('en'))
    if (!translation.simulation) throw new Error('Missing PWA Kit simulation translation')
    translation.simulation.scenarios[0].transitions[0].actorId = 'managed-runtime'
    const result = validateLessonsByLocale({
      vi: lessonsByLocale.vi,
      en: replaceLesson('en', translation),
    })

    expect(result.success).toBe(false)
    if (!result.success) expect(result.issues.some((issue) => issue.code === 'simulation-structure-mismatch')).toBe(true)
  })
})
