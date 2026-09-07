import { describe, expect, it } from 'vitest'
import { getLessons } from '../content/lessons'
import {
  lessonClaimSource,
  lessonClaimSourceHash,
  lessonContentHash,
} from '../content/lessonValidation'
import type { RichLesson } from '../content/types'
import {
  canonicalLessonSimulationGenerateRequest,
  createLessonSimulationGenerateRequest,
  lessonSimulationEditorIdentity,
  lessonSimulationGenerationInputHash,
} from './lessonSimulationGeneration'

function richLesson(locale: 'vi' | 'en' = 'vi') {
  const lesson = getLessons(locale).find(entry => entry.slug === 'pwa-kit-architecture')
  if (!lesson?.content) throw new Error(`Missing rich lesson for ${locale}`)
  return lesson as RichLesson
}

describe('lesson simulation generation identity', () => {
  it('uses the exact claim-bearing lesson source and excludes lifecycle state', () => {
    const lesson = richLesson()
    const source = lessonClaimSource(lesson)

    expect(source).toMatchObject({
      schemaVersion: 1,
      slug: lesson.slug,
      locale: lesson.locale,
      content: lesson.content,
    })
    expect(source).not.toHaveProperty('progress')
    expect(source).not.toHaveProperty('featured')
    expect(source).not.toHaveProperty('reviewStatus')
    expect(source).not.toHaveProperty('simulation')
    expect(lessonClaimSourceHash(source)).toBe(lessonContentHash(lesson))
  })

  it('normalizes only the author failure prompt for the server input hash', () => {
    const lesson = richLesson()
    const request = createLessonSimulationGenerateRequest({
      lesson,
      kind: 'flow',
      failureScenario: '  Shared cache leaks a customer price.  ',
    })
    const normalizedRequest = {
      ...request,
      failureScenario: 'Shared cache leaks a customer price.',
    }

    expect(request.failureScenario).toBe(normalizedRequest.failureScenario)
    expect(new TextEncoder().encode(JSON.stringify(request)).byteLength).toBeLessThan(32 * 1024)
    expect(canonicalLessonSimulationGenerateRequest(request)).toBe(
      canonicalLessonSimulationGenerateRequest(normalizedRequest),
    )
    expect(lessonSimulationGenerationInputHash(request)).toMatch(/^[a-f0-9]{64}$/u)
  })

  it('keeps the editor identity sensitive to in-flight prompt edits', () => {
    const lesson = richLesson()
    const base = { lesson, kind: 'flow' as const, failureScenario: 'cache failure' }

    expect(lessonSimulationEditorIdentity(base)).not.toBe(
      lessonSimulationEditorIdentity({ ...base, failureScenario: 'cache failure ' }),
    )
  })
})
