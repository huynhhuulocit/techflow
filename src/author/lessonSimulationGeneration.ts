import type { RichLesson, SimulationKind } from '../content/types.ts'
import {
  canonicalLessonClaimSource,
  lessonClaimSource,
  lessonClaimSourceHash,
  type LessonClaimSource,
} from '../content/lessonValidation.ts'
import { sha256Utf8 } from './questionContentHash.ts'

export const LESSON_SIMULATION_PROMPT_VERSION = 'lesson-simulation-v2'

export type LessonSimulationGenerateRequest = {
  source: LessonClaimSource
  sourceContentHash: string
  kind: SimulationKind
  failureScenario: string
}

export type LessonSimulationGenerationInput = {
  lesson: RichLesson
  kind: SimulationKind
  failureScenario: string
}

export function createLessonSimulationGenerateRequest(
  input: LessonSimulationGenerationInput,
): LessonSimulationGenerateRequest {
  const source = lessonClaimSource(input.lesson)
  return {
    source,
    sourceContentHash: lessonClaimSourceHash(source),
    kind: input.kind,
    failureScenario: input.failureScenario.trim(),
  }
}

export function canonicalLessonSimulationGenerateRequest(
  request: LessonSimulationGenerateRequest,
) {
  return JSON.stringify({
    source: JSON.parse(canonicalLessonClaimSource(request.source)) as LessonClaimSource,
    sourceContentHash: request.sourceContentHash,
    kind: request.kind,
    failureScenario: request.failureScenario.trim(),
  })
}

export function lessonSimulationGenerationInputHash(
  request: LessonSimulationGenerateRequest,
) {
  return sha256Utf8(canonicalLessonSimulationGenerateRequest(request))
}

/**
 * UI-only identity for rejecting a response after the author changes lesson,
 * simulation kind, or failure scenario while a request is in flight.
 */
export function lessonSimulationEditorIdentity(
  input: LessonSimulationGenerationInput,
) {
  return sha256Utf8(JSON.stringify({
    slug: input.lesson.slug,
    locale: input.lesson.locale,
    sourceContentHash: lessonClaimSourceHash(lessonClaimSource(input.lesson)),
    kind: input.kind,
    failureScenario: input.failureScenario,
  }))
}
