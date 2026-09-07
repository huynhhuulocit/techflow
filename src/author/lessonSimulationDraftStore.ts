import type {
  LessonSimulationSpec,
  Locale,
  RichLesson,
} from '../content/types'
import {
  validateLessonSimulationBinding,
  type LessonValidationIssue,
} from '../content/lessonValidation'
import { validateSimulationSpec } from '../simulation'

export const LESSON_SIMULATION_DRAFT_STORAGE_KEY = 'techflow.author.lesson-simulation-drafts.v1'
export const LESSON_SIMULATION_DRAFT_SCHEMA_VERSION = 1 as const
export const MAX_LESSON_SIMULATION_DRAFTS = 24

export type LessonSimulationStorageAdapter = Pick<Storage, 'getItem' | 'setItem'>
export type LessonSimulationResetStorageAdapter = Pick<Storage, 'removeItem'>

export type LessonSimulationDraftEntry = {
  locale: Locale
  slug: string
  updatedAt: string
  simulation: LessonSimulationSpec
}

export type LessonSimulationDraftEnvelope = {
  schemaVersion: typeof LESSON_SIMULATION_DRAFT_SCHEMA_VERSION
  updatedAt: string
  entries: LessonSimulationDraftEntry[]
}

export type LessonSimulationDraftStoreErrorCode =
  | 'corrupt-data'
  | 'unsupported-version'
  | 'storage-unavailable'
  | 'quota-exceeded'
  | 'invalid-simulation'
  | 'invalid-binding'

export type LessonSimulationDraftStoreFailure = {
  ok: false
  code: LessonSimulationDraftStoreErrorCode
  message: string
  rawValue?: string
}

export type LessonSimulationDraftStoreReadResult =
  | { ok: true; value: LessonSimulationDraftEnvelope }
  | LessonSimulationDraftStoreFailure

export type LessonSimulationDraftStoreMutationResult = LessonSimulationDraftStoreReadResult

export type LessonSimulationDraftLookupResult =
  | {
      ok: true
      value: LessonSimulationDraftEnvelope
      status: 'missing'
      entry: null
      activeSimulation: null
      bindingIssues: []
    }
  | {
      ok: true
      value: LessonSimulationDraftEnvelope
      status: 'active'
      entry: LessonSimulationDraftEntry
      activeSimulation: LessonSimulationSpec
      bindingIssues: []
    }
  | {
      ok: true
      value: LessonSimulationDraftEnvelope
      status: 'stale'
      entry: LessonSimulationDraftEntry
      activeSimulation: null
      bindingIssues: LessonValidationIssue[]
    }
  | LessonSimulationDraftStoreFailure

const ENVELOPE_KEYS = ['schemaVersion', 'updatedAt', 'entries'] as const
const ENTRY_KEYS = ['locale', 'slug', 'updatedAt', 'simulation'] as const
const ISO_UTC_PATTERN = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d{3})?Z$/u

function emptyEnvelope(now = new Date()): LessonSimulationDraftEnvelope {
  return {
    schemaVersion: LESSON_SIMULATION_DRAFT_SCHEMA_VERSION,
    updatedAt: now.toISOString(),
    entries: [],
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function hasExactKeys(value: Record<string, unknown>, expected: readonly string[]) {
  const keys = Object.keys(value)
  return keys.length === expected.length && expected.every((key) => Object.hasOwn(value, key))
}

function isUtcTimestamp(value: unknown): value is string {
  return typeof value === 'string'
    && ISO_UTC_PATTERN.test(value)
    && !Number.isNaN(Date.parse(value))
}

function isQuotaError(error: unknown) {
  if (!isRecord(error)) return false
  return error.name === 'QuotaExceededError'
    || error.name === 'NS_ERROR_DOM_QUOTA_REACHED'
    || error.code === 22
    || error.code === 1014
}

function lessonKey(locale: Locale, slug: string) {
  return `${locale}:${slug}`
}

function validateStoredEntry(
  value: unknown,
  index: number,
): { ok: true; entry: LessonSimulationDraftEntry } | LessonSimulationDraftStoreFailure {
  const prefix = `Entry ${index + 1}`
  if (!isRecord(value) || !hasExactKeys(value, ENTRY_KEYS)) {
    return {
      ok: false,
      code: 'corrupt-data',
      message: `${prefix} không đúng định dạng strict của lesson simulation draft.`,
    }
  }
  if (value.locale !== 'vi' && value.locale !== 'en') {
    return {
      ok: false,
      code: 'corrupt-data',
      message: `${prefix} có locale không hợp lệ.`,
    }
  }
  if (typeof value.slug !== 'string' || value.slug.trim().length === 0) {
    return {
      ok: false,
      code: 'corrupt-data',
      message: `${prefix} thiếu lesson slug hợp lệ.`,
    }
  }
  if (!isUtcTimestamp(value.updatedAt)) {
    return {
      ok: false,
      code: 'corrupt-data',
      message: `${prefix} thiếu updatedAt UTC hợp lệ.`,
    }
  }

  const validation = validateSimulationSpec(value.simulation)
  if (!validation.success || validation.data.schemaVersion !== 2) {
    return {
      ok: false,
      code: 'corrupt-data',
      message: `${prefix} không chứa LessonSimulationSpec schema v2 hợp lệ.`,
    }
  }

  const simulation = validation.data
  if (simulation.locale !== value.locale || simulation.source.slug !== value.slug) {
    return {
      ok: false,
      code: 'corrupt-data',
      message: `${prefix} không khớp locale/slug với simulation source.`,
    }
  }
  if (simulation.status !== 'generated-needs-review'
    || simulation.provenance.kind !== 'ai-generated'
    || simulation.review !== undefined) {
    return {
      ok: false,
      code: 'corrupt-data',
      message: `${prefix} phải là AI draft ở trạng thái generated-needs-review và chưa có review metadata.`,
    }
  }

  return {
    ok: true,
    entry: {
      locale: value.locale,
      slug: value.slug,
      updatedAt: value.updatedAt,
      simulation,
    },
  }
}

function validateStoredEntries(value: unknown):
  | { ok: true; entries: LessonSimulationDraftEntry[] }
  | LessonSimulationDraftStoreFailure {
  if (!Array.isArray(value)) {
    return {
      ok: false,
      code: 'corrupt-data',
      message: 'Danh sách lesson simulation draft không phải là mảng.',
    }
  }
  if (value.length > MAX_LESSON_SIMULATION_DRAFTS) {
    return {
      ok: false,
      code: 'corrupt-data',
      message: `Lesson simulation draft vượt giới hạn ${MAX_LESSON_SIMULATION_DRAFTS} entries.`,
    }
  }

  const entries: LessonSimulationDraftEntry[] = []
  const keys = new Set<string>()
  for (const [index, rawEntry] of value.entries()) {
    const validated = validateStoredEntry(rawEntry, index)
    if (!validated.ok) return validated
    const key = lessonKey(validated.entry.locale, validated.entry.slug)
    if (keys.has(key)) {
      return {
        ok: false,
        code: 'corrupt-data',
        message: `Lesson simulation draft bị trùng key ${key}.`,
      }
    }
    keys.add(key)
    entries.push(validated.entry)
  }
  return { ok: true, entries }
}

export function readLessonSimulationDraftStore(
  storage: LessonSimulationStorageAdapter,
  now = new Date(),
): LessonSimulationDraftStoreReadResult {
  let rawValue: string | null
  try {
    rawValue = storage.getItem(LESSON_SIMULATION_DRAFT_STORAGE_KEY)
  } catch {
    return {
      ok: false,
      code: 'storage-unavailable',
      message: 'Browser đang chặn local storage nên chưa thể đọc lesson simulation draft.',
    }
  }

  if (rawValue === null) return { ok: true, value: emptyEnvelope(now) }

  let parsed: unknown
  try {
    parsed = JSON.parse(rawValue) as unknown
  } catch {
    return {
      ok: false,
      code: 'corrupt-data',
      message: 'Lesson simulation draft trong local storage bị lỗi JSON. TechFlow sẽ không tự ghi đè dữ liệu này.',
      rawValue,
    }
  }

  if (!isRecord(parsed) || !hasExactKeys(parsed, ENVELOPE_KEYS)) {
    return {
      ok: false,
      code: 'corrupt-data',
      message: 'Lesson simulation draft không đúng định dạng envelope strict.',
      rawValue,
    }
  }
  if (parsed.schemaVersion !== LESSON_SIMULATION_DRAFT_SCHEMA_VERSION) {
    return {
      ok: false,
      code: 'unsupported-version',
      message: `Không hỗ trợ lesson simulation draft schemaVersion ${String(parsed.schemaVersion)}. TechFlow sẽ không tự ghi đè dữ liệu này.`,
      rawValue,
    }
  }
  if (!isUtcTimestamp(parsed.updatedAt)) {
    return {
      ok: false,
      code: 'corrupt-data',
      message: 'Lesson simulation draft envelope thiếu updatedAt UTC hợp lệ.',
      rawValue,
    }
  }

  const entries = validateStoredEntries(parsed.entries)
  if (!entries.ok) return { ...entries, rawValue }

  return {
    ok: true,
    value: {
      schemaVersion: LESSON_SIMULATION_DRAFT_SCHEMA_VERSION,
      updatedAt: parsed.updatedAt,
      entries: entries.entries,
    },
  }
}

export function getLessonSimulationDraft(
  storage: LessonSimulationStorageAdapter,
  lesson: RichLesson,
  now = new Date(),
): LessonSimulationDraftLookupResult {
  const current = readLessonSimulationDraftStore(storage, now)
  if (!current.ok) return current

  const entry = current.value.entries.find((candidate) => (
    candidate.locale === lesson.locale && candidate.slug === lesson.slug
  ))
  if (!entry) {
    return {
      ok: true,
      value: current.value,
      status: 'missing',
      entry: null,
      activeSimulation: null,
      bindingIssues: [],
    }
  }

  const binding = validateLessonSimulationBinding({ ...lesson, simulation: entry.simulation })
  if (!binding.success) {
    return {
      ok: true,
      value: current.value,
      status: 'stale',
      entry,
      activeSimulation: null,
      bindingIssues: binding.issues,
    }
  }

  return {
    ok: true,
    value: current.value,
    status: 'active',
    entry,
    activeSimulation: entry.simulation,
    bindingIssues: [],
  }
}

function writeEntries(
  storage: LessonSimulationStorageAdapter,
  entries: readonly LessonSimulationDraftEntry[],
  now: Date,
): LessonSimulationDraftStoreMutationResult {
  const value: LessonSimulationDraftEnvelope = {
    schemaVersion: LESSON_SIMULATION_DRAFT_SCHEMA_VERSION,
    updatedAt: now.toISOString(),
    entries: [...entries],
  }

  try {
    storage.setItem(LESSON_SIMULATION_DRAFT_STORAGE_KEY, JSON.stringify(value))
    return { ok: true, value }
  } catch (error) {
    if (isQuotaError(error)) {
      return {
        ok: false,
        code: 'quota-exceeded',
        message: 'Local storage đã hết dung lượng. AI draft vẫn ở preview; hãy export JSON trước khi rời trang.',
      }
    }
    return {
      ok: false,
      code: 'storage-unavailable',
      message: 'Không thể ghi local storage. AI draft vẫn ở preview và chưa được áp dụng.',
    }
  }
}

export function upsertLessonSimulationDraft(
  storage: LessonSimulationStorageAdapter,
  lesson: RichLesson,
  input: LessonSimulationSpec,
  now = new Date(),
): LessonSimulationDraftStoreMutationResult {
  const validation = validateSimulationSpec(input)
  if (!validation.success || validation.data.schemaVersion !== 2) {
    return {
      ok: false,
      code: 'invalid-simulation',
      message: 'Chỉ có LessonSimulationSpec schema v2 hợp lệ mới được áp dụng local.',
    }
  }

  const simulation = validation.data
  if (simulation.status !== 'generated-needs-review'
    || simulation.provenance.kind !== 'ai-generated'
    || simulation.review !== undefined) {
    return {
      ok: false,
      code: 'invalid-simulation',
      message: 'Local AI simulation phải giữ trạng thái generated-needs-review và không được có review metadata.',
    }
  }

  const binding = validateLessonSimulationBinding({ ...lesson, simulation })
  if (!binding.success) {
    return {
      ok: false,
      code: 'invalid-binding',
      message: binding.issues.map((issue) => issue.message).join(' '),
    }
  }

  const current = readLessonSimulationDraftStore(storage, now)
  if (!current.ok) return current

  const nextEntry: LessonSimulationDraftEntry = {
    locale: lesson.locale,
    slug: lesson.slug,
    updatedAt: now.toISOString(),
    simulation,
  }
  const key = lessonKey(lesson.locale, lesson.slug)
  const entries = [
    nextEntry,
    ...current.value.entries.filter((entry) => lessonKey(entry.locale, entry.slug) !== key),
  ].slice(0, MAX_LESSON_SIMULATION_DRAFTS)

  return writeEntries(storage, entries, now)
}

export function removeLessonSimulationDraft(
  storage: LessonSimulationStorageAdapter,
  locale: Locale,
  slug: string,
  now = new Date(),
): LessonSimulationDraftStoreMutationResult {
  const current = readLessonSimulationDraftStore(storage, now)
  if (!current.ok) return current

  const key = lessonKey(locale, slug)
  const entries = current.value.entries.filter((entry) => lessonKey(entry.locale, entry.slug) !== key)
  if (entries.length === current.value.entries.length) return current
  return writeEntries(storage, entries, now)
}

/** Explicit recovery escape hatch for a corrupt or unsupported envelope. */
export function resetLessonSimulationDraftStore(
  storage: LessonSimulationResetStorageAdapter,
  now = new Date(),
): LessonSimulationDraftStoreMutationResult {
  try {
    storage.removeItem(LESSON_SIMULATION_DRAFT_STORAGE_KEY)
    return { ok: true, value: emptyEnvelope(now) }
  } catch {
    return {
      ok: false,
      code: 'storage-unavailable',
      message: 'Browser đang chặn local storage nên chưa thể reset lesson simulation drafts.',
    }
  }
}
