import { sha256Utf8 } from '../author/questionContentHash.ts'
import { validateSimulationSpec } from '../simulation/simulationValidator.ts'
import type {
  Lesson,
  LessonSimulationSpec,
  LessonReviewMetadata,
  Locale,
  RichLesson,
} from './types.ts'

export type LessonClaimSource = Pick<
  RichLesson,
  | 'slug'
  | 'title'
  | 'shortAnswer'
  | 'category'
  | 'difficulty'
  | 'duration'
  | 'tags'
  | 'workflow'
  | 'followUps'
  | 'search'
  | 'locale'
  | 'content'
> & {
  schemaVersion: 1
}

export type LessonValidationIssueCode =
  | 'duplicate-slug'
  | 'locale-mismatch'
  | 'nested-review-state'
  | 'invalid-rich-content'
  | 'invalid-review-contract'
  | 'technical-review-stale'
  | 'invalid-translation-contract'
  | 'translation-source-stale'
  | 'translation-review-stale'
  | 'invalid-simulation'
  | 'simulation-source-mismatch'
  | 'simulation-source-stale'
  | 'simulation-review-source-unreviewed'
  | 'missing-source-lesson'
  | 'missing-translation-lesson'
  | 'translation-structure-mismatch'
  | 'simulation-structure-mismatch'

export type LessonValidationIssue = {
  code: LessonValidationIssueCode
  path: string
  message: string
}

export type LessonValidationResult =
  | { success: true; issues: [] }
  | { success: false; issues: LessonValidationIssue[] }

const HASH_PATTERN = /^[a-f0-9]{64}$/u
const ISO_UTC_PATTERN = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d{3})?Z$/u

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function canonicalValue(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(canonicalValue)
  if (!isObject(value)) return value

  return Object.fromEntries(
    Object.keys(value)
      .sort()
      .filter((key) => value[key] !== undefined)
      .map((key) => [key, canonicalValue(value[key])]),
  )
}

/**
 * Canonical technical-claim payload for rich lessons.
 *
 * Learner progress, merchandising state, and all review/translation metadata
 * are deliberately excluded. The lesson-bound simulation is also excluded to
 * avoid a circular source hash; it has its own source binding and review hash.
 * Everything else is included, including title, short answer, rich content,
 * workflow, follow-up questions, and taxonomy.
 * Object keys are sorted recursively while array order is preserved because
 * instructional sequence is meaningful.
 */
export function lessonClaimSource(lesson: RichLesson): LessonClaimSource {
  const {
    progress: _progress,
    featured: _featured,
    reviewStatus: _reviewStatus,
    review: _review,
    translationStatus: _translationStatus,
    translatedFromHash: _translatedFromHash,
    translationReview: _translationReview,
    simulation: _simulation,
    ...claimBearingLesson
  } = lesson

  return {
    schemaVersion: 1,
    ...claimBearingLesson,
  }
}

export function canonicalLessonClaimSource(source: LessonClaimSource) {
  return JSON.stringify(canonicalValue(source))
}

export function lessonClaimSourceHash(source: LessonClaimSource) {
  return sha256Utf8(canonicalLessonClaimSource(source))
}

export function canonicalLessonReviewContent(lesson: RichLesson) {
  return canonicalLessonClaimSource(lessonClaimSource(lesson))
}

export function lessonContentHash(lesson: RichLesson) {
  return sha256Utf8(canonicalLessonReviewContent(lesson))
}

export function isRichLesson(lesson: Lesson): lesson is RichLesson {
  return lesson.content !== undefined
}

function addIssue(
  issues: LessonValidationIssue[],
  code: LessonValidationIssueCode,
  path: string,
  message: string,
) {
  issues.push({ code, path, message })
}

function reviewMetadataIsWellFormed(
  value: unknown,
  path: string,
  issues: LessonValidationIssue[],
  code: 'invalid-review-contract' | 'invalid-translation-contract',
): value is LessonReviewMetadata {
  if (!isObject(value)) {
    addIssue(issues, code, path, 'Reviewed state requires review metadata.')
    return false
  }

  let valid = true
  if (typeof value.reviewer !== 'string' || value.reviewer.trim().length === 0) {
    addIssue(issues, code, `${path}.reviewer`, 'Reviewer must be a non-empty string.')
    valid = false
  }
  if (typeof value.reviewedAt !== 'string'
    || !ISO_UTC_PATTERN.test(value.reviewedAt)
    || Number.isNaN(Date.parse(value.reviewedAt))) {
    addIssue(issues, code, `${path}.reviewedAt`, 'reviewedAt must be a valid UTC ISO timestamp.')
    valid = false
  }
  if (typeof value.contentHash !== 'string' || !HASH_PATTERN.test(value.contentHash)) {
    addIssue(issues, code, `${path}.contentHash`, 'contentHash must be a lowercase SHA-256 hex value.')
    valid = false
  }
  if (!Array.isArray(value.evidence) || value.evidence.length === 0) {
    addIssue(issues, code, `${path}.evidence`, 'Reviewed state requires at least one evidence entry.')
    valid = false
  } else {
    value.evidence.forEach((entry, index) => {
      const evidencePath = `${path}.evidence[${index}]`
      if (!isObject(entry)
        || typeof entry.label !== 'string'
        || entry.label.trim().length === 0
        || typeof entry.url !== 'string') {
        addIssue(issues, code, evidencePath, 'Evidence requires a label and an HTTPS URL.')
        valid = false
        return
      }
      try {
        if (new URL(entry.url).protocol !== 'https:') throw new Error('not HTTPS')
      } catch {
        addIssue(issues, code, `${evidencePath}.url`, 'Evidence URL must be a valid HTTPS URL.')
        valid = false
      }
    })
  }

  return valid
}

function validateRichContent(
  lesson: RichLesson,
  path: string,
  issues: LessonValidationIssue[],
) {
  const rawContent = lesson.content as unknown as Record<string, unknown>
  if ('reviewStatus' in rawContent || 'review' in rawContent) {
    addIssue(
      issues,
      'nested-review-state',
      `${path}.content`,
      'Technical review state belongs on the lesson, not inside rich content.',
    )
  }

  const actorIds = new Set<string>()
  lesson.content.actors.forEach((actor, index) => {
    if (actorIds.has(actor.id)) {
      addIssue(issues, 'invalid-rich-content', `${path}.content.actors[${index}].id`, 'Actor ID must be unique.')
    }
    actorIds.add(actor.id)
  })
  lesson.content.mechanism.forEach((step, index) => {
    if (!actorIds.has(step.actorId)) {
      addIssue(
        issues,
        'invalid-rich-content',
        `${path}.content.mechanism[${index}].actorId`,
        'Mechanism step must reference an existing actor.',
      )
    }
  })
  if (lesson.content.evidence.length === 0) {
    addIssue(issues, 'invalid-rich-content', `${path}.content.evidence`, 'Rich technical content requires evidence.')
  }
  lesson.content.evidence.forEach((entry, index) => {
    try {
      if (new URL(entry.url).protocol !== 'https:') throw new Error('not HTTPS')
    } catch {
      addIssue(
        issues,
        'invalid-rich-content',
        `${path}.content.evidence[${index}].url`,
        'Lesson evidence URL must be a valid HTTPS URL.',
      )
    }
  })
}

function validateSimulationBinding(
  lesson: RichLesson,
  path: string,
  issues: LessonValidationIssue[],
) {
  if (!lesson.simulation) return

  const validation = validateSimulationSpec(lesson.simulation)
  if (!validation.success) {
    validation.issues.forEach((issue) => {
      const suffix = issue.path.replace(/^simulation/u, '')
      addIssue(
        issues,
        'invalid-simulation',
        `${path}.simulation${suffix}`,
        issue.message,
      )
    })
    return
  }

  const simulation = validation.data
  if (simulation.schemaVersion !== 2) {
    addIssue(
      issues,
      'invalid-simulation',
      `${path}.simulation.schemaVersion`,
      'Rich lessons only accept lesson-bound simulation schema version 2.',
    )
    return
  }
  if (simulation.source.slug !== lesson.slug) {
    addIssue(
      issues,
      'simulation-source-mismatch',
      `${path}.simulation.source.slug`,
      'Simulation source slug must match its lesson.',
    )
  }
  if (simulation.locale !== lesson.locale) {
    addIssue(
      issues,
      'simulation-source-mismatch',
      `${path}.simulation.locale`,
      'Simulation locale must match its lesson.',
    )
  }

  const expectedSourceHash = lessonContentHash(lesson)
  if (simulation.source.contentHash !== expectedSourceHash) {
    addIssue(
      issues,
      'simulation-source-stale',
      `${path}.simulation.source.contentHash`,
      `Simulation source is stale; expected ${expectedSourceHash}.`,
    )
  }

  if (simulation.status === 'reviewed' && lesson.reviewStatus !== 'reviewed') {
    addIssue(
      issues,
      'simulation-review-source-unreviewed',
      `${path}.simulation.status`,
      'A reviewed simulation requires a technically reviewed source lesson.',
    )
  }
  if (simulation.status === 'reviewed'
    && lesson.locale === 'en'
    && lesson.translationStatus !== 'reviewed') {
    addIssue(
      issues,
      'simulation-review-source-unreviewed',
      `${path}.simulation.status`,
      'A reviewed English simulation requires a reviewed lesson translation.',
    )
  }
}

export function validateLessonSimulationBinding(lesson: RichLesson): LessonValidationResult {
  const issues: LessonValidationIssue[] = []
  validateSimulationBinding(lesson, `lesson(${lesson.slug})`, issues)
  return issues.length === 0
    ? { success: true, issues: [] }
    : { success: false, issues }
}

function validateTechnicalReview(
  lesson: RichLesson,
  path: string,
  issues: LessonValidationIssue[],
) {
  const rawLesson = lesson as unknown as Record<string, unknown>
  if (lesson.reviewStatus === 'draft-needs-review') {
    if (rawLesson.review !== undefined) {
      addIssue(issues, 'invalid-review-contract', `${path}.review`, 'Draft technical content cannot carry review metadata.')
    }
    return
  }

  if (lesson.reviewStatus !== 'reviewed') {
    addIssue(issues, 'invalid-review-contract', `${path}.reviewStatus`, 'Unknown technical review status.')
    return
  }

  if (!reviewMetadataIsWellFormed(rawLesson.review, `${path}.review`, issues, 'invalid-review-contract')) return
  const expectedHash = lessonContentHash(lesson)
  if (rawLesson.review.contentHash !== expectedHash) {
    addIssue(
      issues,
      'technical-review-stale',
      `${path}.review.contentHash`,
      `Technical review is stale; expected ${expectedHash}.`,
    )
  }
}

function validateLocaleContract(
  lesson: RichLesson,
  locale: Locale,
  sourceBySlug: ReadonlyMap<string, Lesson>,
  path: string,
  issues: LessonValidationIssue[],
) {
  const rawLesson = lesson as unknown as Record<string, unknown>
  if (lesson.locale !== locale) {
    addIssue(issues, 'locale-mismatch', `${path}.locale`, `Rich lesson locale must be ${locale}.`)
  }

  if (locale === 'vi') {
    for (const field of ['translationStatus', 'translatedFromHash', 'translationReview'] as const) {
      if (rawLesson[field] !== undefined) {
        addIssue(issues, 'invalid-translation-contract', `${path}.${field}`, 'Vietnamese source lessons cannot carry translation review state.')
      }
    }
    return
  }

  const source = sourceBySlug.get(lesson.slug)
  if (!source || !isRichLesson(source) || source.locale !== 'vi') {
    addIssue(
      issues,
      'missing-source-lesson',
      path,
      'English rich lesson requires a Vietnamese rich lesson with the same slug.',
    )
    return
  }

  const expectedSourceHash = lessonContentHash(source)
  if (typeof rawLesson.translatedFromHash !== 'string' || !HASH_PATTERN.test(rawLesson.translatedFromHash)) {
    addIssue(
      issues,
      'invalid-translation-contract',
      `${path}.translatedFromHash`,
      'English rich lesson requires the Vietnamese source SHA-256 hash.',
    )
  } else if (rawLesson.translatedFromHash !== expectedSourceHash) {
    addIssue(
      issues,
      'translation-source-stale',
      `${path}.translatedFromHash`,
      `English translation is bound to stale Vietnamese content; expected ${expectedSourceHash}.`,
    )
  }

  if (rawLesson.translationStatus === 'translated-needs-review') {
    if (rawLesson.translationReview !== undefined) {
      addIssue(
        issues,
        'invalid-translation-contract',
        `${path}.translationReview`,
        'Unreviewed translation cannot carry translation review metadata.',
      )
    }
  } else if (rawLesson.translationStatus === 'reviewed') {
    if (reviewMetadataIsWellFormed(
      rawLesson.translationReview,
      `${path}.translationReview`,
      issues,
      'invalid-translation-contract',
    )) {
      const expectedTranslationHash = lessonContentHash(lesson)
      const translationReview = rawLesson.translationReview as LessonReviewMetadata
      if (translationReview.contentHash !== expectedTranslationHash) {
        addIssue(
          issues,
          'translation-review-stale',
          `${path}.translationReview.contentHash`,
          `Translation review is stale; expected ${expectedTranslationHash}.`,
        )
      }
    }
  } else {
    addIssue(
      issues,
      'invalid-translation-contract',
      `${path}.translationStatus`,
      'English rich lesson requires a translation review status.',
    )
  }

  validateTranslationStructure(source, lesson, path, issues)
}

function sameValues(left: readonly string[], right: readonly string[]) {
  return left.length === right.length && left.every((value, index) => value === right[index])
}

function canonicalSimulationTopology(simulation: LessonSimulationSpec) {
  return JSON.stringify(canonicalValue({
    kind: simulation.kind,
    actors: simulation.actors.map((entry) => ({ id: entry.id, iconToken: entry.iconToken })),
    stateFields: simulation.stateFields.map((entry) => entry.key),
    scenarios: simulation.scenarios.map((entry) => ({
      id: entry.id,
      kind: entry.kind,
      initialSnapshot: entry.initialSnapshot,
      transitions: entry.transitions.map((transition) => ({
        id: transition.id,
        actorId: transition.actorId,
        snapshot: transition.snapshot,
        highlights: transition.highlights,
      })),
      terminalState: entry.terminalState,
    })),
    invariants: simulation.invariants.map((entry) => ({
      id: entry.id,
      stateKey: entry.stateKey,
      operator: entry.operator,
      expected: entry.expected,
    })),
  }))
}

function validateTranslationStructure(
  source: RichLesson,
  translation: RichLesson,
  path: string,
  issues: LessonValidationIssue[],
) {
  const sourceActorIds = source.content.actors.map((entry) => entry.id)
  const translatedActorIds = translation.content.actors.map((entry) => entry.id)
  const sourceMechanism = source.content.mechanism.map((entry) => `${entry.id}:${entry.actorId}`)
  const translatedMechanism = translation.content.mechanism.map((entry) => `${entry.id}:${entry.actorId}`)
  const sourceEvidenceUrls = source.content.evidence.map((entry) => entry.url)
  const translatedEvidenceUrls = translation.content.evidence.map((entry) => entry.url)
  const aligned = sameValues(sourceActorIds, translatedActorIds)
    && sameValues(sourceMechanism, translatedMechanism)
    && source.content.productionTradeOffs.length === translation.content.productionTradeOffs.length
    && source.content.misconceptions.length === translation.content.misconceptions.length
    && source.content.appliedExample.steps.length === translation.content.appliedExample.steps.length
    && source.followUps.length === translation.followUps.length
    && sameValues(sourceEvidenceUrls, translatedEvidenceUrls)

  const simulationAligned = Boolean(source.simulation) === Boolean(translation.simulation)
    && (!source.simulation
      || !translation.simulation
      || canonicalSimulationTopology(source.simulation) === canonicalSimulationTopology(translation.simulation))

  if (!aligned) {
    addIssue(
      issues,
      'translation-structure-mismatch',
      path,
      'English lesson structure must remain aligned with its Vietnamese source.',
    )
  }
  if (!simulationAligned) {
    addIssue(
      issues,
      'simulation-structure-mismatch',
      `${path}.simulation`,
      'English lesson simulation topology and machine state must match its Vietnamese source.',
    )
  }
}

export function validateLessonsByLocale(
  lessonsByLocale: Record<Locale, readonly Lesson[]>,
): LessonValidationResult {
  const issues: LessonValidationIssue[] = []
  const viBySlug = new Map(lessonsByLocale.vi.map((lesson) => [lesson.slug, lesson] as const))

  for (const locale of ['vi', 'en'] as const) {
    const seenSlugs = new Set<string>()
    lessonsByLocale[locale].forEach((lesson, index) => {
      const path = `${locale}[${index}](${lesson.slug})`
      if (seenSlugs.has(lesson.slug)) {
        addIssue(issues, 'duplicate-slug', `${path}.slug`, `Duplicate lesson slug in ${locale}.`)
      }
      seenSlugs.add(lesson.slug)

      if (!isRichLesson(lesson)) return
      validateRichContent(lesson, path, issues)
      validateSimulationBinding(lesson, path, issues)
      validateTechnicalReview(lesson, path, issues)
      validateLocaleContract(lesson, locale, viBySlug, path, issues)
    })
  }

  const enBySlug = new Map(lessonsByLocale.en.map((lesson) => [lesson.slug, lesson] as const))
  lessonsByLocale.vi.forEach((source, index) => {
    if (!isRichLesson(source)) return
    const translation = enBySlug.get(source.slug)
    if (!translation || !isRichLesson(translation)) {
      addIssue(
        issues,
        'missing-translation-lesson',
        `vi[${index}](${source.slug})`,
        'Vietnamese rich lesson requires an English rich lesson with the same slug.',
      )
    }
  })

  return issues.length === 0
    ? { success: true, issues: [] }
    : { success: false, issues }
}

export function assertValidLessonsByLocale(
  lessonsByLocale: Record<Locale, readonly Lesson[]>,
) {
  const result = validateLessonsByLocale(lessonsByLocale)
  if (result.success) return

  const detail = result.issues
    .map((issue) => `${issue.code} at ${issue.path}: ${issue.message}`)
    .join('\n')
  throw new Error(`Lesson validation failed:\n${detail}`)
}
