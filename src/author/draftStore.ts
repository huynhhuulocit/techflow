import type { QuestionDraft } from '../content/types'
import { formatDraftIssues, validateQuestionDraft } from './draftValidation'
import { dropStaleDraftSimulation, type SimulationIntegrityWarning } from './questionContentHash'

export const AUTHOR_DRAFT_STORAGE_KEY = 'techflow.author.question-drafts.v1'
export const AUTHOR_DRAFT_SCHEMA_VERSION = 1 as const

export type StorageAdapter = Pick<Storage, 'getItem' | 'setItem' | 'removeItem'>

export type DraftStoreEnvelope = {
  schemaVersion: typeof AUTHOR_DRAFT_SCHEMA_VERSION
  updatedAt: string
  drafts: QuestionDraft[]
}

export type DraftStoreErrorCode =
  | 'corrupt-data'
  | 'unsupported-version'
  | 'storage-unavailable'
  | 'quota-exceeded'
  | 'invalid-draft'
  | 'duplicate-id'

export type DraftStoreFailure = {
  ok: false
  code: DraftStoreErrorCode
  message: string
  rawValue?: string
}

export type DraftStoreReadResult =
  | { ok: true; value: DraftStoreEnvelope; warnings: SimulationIntegrityWarning[] }
  | DraftStoreFailure

export type DraftStoreMutationResult =
  | { ok: true; value: DraftStoreEnvelope; warnings: SimulationIntegrityWarning[] }
  | DraftStoreFailure

function emptyEnvelope(now = new Date()): DraftStoreEnvelope {
  return {
    schemaVersion: AUTHOR_DRAFT_SCHEMA_VERSION,
    updatedAt: now.toISOString(),
    drafts: [],
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function isQuotaError(error: unknown) {
  if (!isRecord(error)) return false
  return error.name === 'QuotaExceededError'
    || error.name === 'NS_ERROR_DOM_QUOTA_REACHED'
    || error.code === 22
    || error.code === 1014
}

function validateDraftArray(value: unknown):
  | { ok: true; drafts: QuestionDraft[]; warnings: SimulationIntegrityWarning[] }
  | DraftStoreFailure {
  if (!Array.isArray(value)) {
    return { ok: false, code: 'corrupt-data', message: 'Danh sách draft trong local storage không phải là mảng.' }
  }

  const drafts: QuestionDraft[] = []
  const warnings: SimulationIntegrityWarning[] = []
  const ids = new Set<string>()
  for (const [index, entry] of value.entries()) {
    const validation = validateQuestionDraft(entry)
    if (!validation.success) {
      return {
        ok: false,
        code: 'corrupt-data',
        message: `Draft ${index + 1} không hợp lệ: ${formatDraftIssues(validation.issues).join(' ')}`,
      }
    }
    if (ids.has(validation.data.id)) {
      return {
        ok: false,
        code: 'duplicate-id',
        message: `Draft ID bị trùng: ${validation.data.id}.`,
      }
    }
    ids.add(validation.data.id)
    const integrity = dropStaleDraftSimulation(validation.data)
    if (integrity.warning) warnings.push(integrity.warning)
    drafts.push(integrity.draft)
  }
  return { ok: true, drafts, warnings }
}

export function readDraftStore(storage: StorageAdapter, now = new Date()): DraftStoreReadResult {
  let rawValue: string | null
  try {
    rawValue = storage.getItem(AUTHOR_DRAFT_STORAGE_KEY)
  } catch {
    return {
      ok: false,
      code: 'storage-unavailable',
      message: 'Browser đang chặn local storage. Draft chưa thể được đọc hoặc lưu.',
    }
  }

  if (rawValue === null) return { ok: true, value: emptyEnvelope(now), warnings: [] }

  let parsed: unknown
  try {
    parsed = JSON.parse(rawValue) as unknown
  } catch {
    return {
      ok: false,
      code: 'corrupt-data',
      message: 'Dữ liệu draft trong local storage bị lỗi JSON. TechFlow sẽ không tự ghi đè dữ liệu này.',
      rawValue,
    }
  }

  if (!isRecord(parsed)) {
    return {
      ok: false,
      code: 'corrupt-data',
      message: 'Dữ liệu draft trong local storage không đúng định dạng envelope.',
      rawValue,
    }
  }
  if (parsed.schemaVersion !== AUTHOR_DRAFT_SCHEMA_VERSION) {
    return {
      ok: false,
      code: 'unsupported-version',
      message: `Không hỗ trợ draft schemaVersion ${String(parsed.schemaVersion)}. TechFlow sẽ không tự ghi đè dữ liệu này.`,
      rawValue,
    }
  }
  if (typeof parsed.updatedAt !== 'string' || Number.isNaN(Date.parse(parsed.updatedAt))) {
    return {
      ok: false,
      code: 'corrupt-data',
      message: 'Dữ liệu draft thiếu updatedAt hợp lệ.',
      rawValue,
    }
  }

  const validated = validateDraftArray(parsed.drafts)
  if (!validated.ok) return { ...validated, rawValue }

  return {
    ok: true,
    value: {
      schemaVersion: AUTHOR_DRAFT_SCHEMA_VERSION,
      updatedAt: parsed.updatedAt,
      drafts: validated.drafts,
    },
    warnings: validated.warnings,
  }
}

export function writeDraftStore(
  storage: StorageAdapter,
  draftsInput: readonly QuestionDraft[],
  now = new Date(),
): DraftStoreMutationResult {
  const validated = validateDraftArray(draftsInput)
  if (!validated.ok) {
    return {
      ...validated,
      code: validated.code === 'corrupt-data' ? 'invalid-draft' : validated.code,
    }
  }

  const value: DraftStoreEnvelope = {
    schemaVersion: AUTHOR_DRAFT_SCHEMA_VERSION,
    updatedAt: now.toISOString(),
    drafts: validated.drafts,
  }

  try {
    storage.setItem(AUTHOR_DRAFT_STORAGE_KEY, JSON.stringify(value))
    return { ok: true, value, warnings: validated.warnings }
  } catch (error) {
    if (isQuotaError(error)) {
      return {
        ok: false,
        code: 'quota-exceeded',
        message: 'Local storage đã hết dung lượng. Draft trên form vẫn được giữ; hãy export hoặc xóa draft cũ trước khi thử lại.',
      }
    }
    return {
      ok: false,
      code: 'storage-unavailable',
      message: 'Không thể ghi local storage. Draft trên form vẫn được giữ và chưa được lưu.',
    }
  }
}

export function upsertDraft(
  storage: StorageAdapter,
  input: QuestionDraft,
  now = new Date(),
): DraftStoreMutationResult {
  const validation = validateQuestionDraft(input)
  if (!validation.success) {
    return {
      ok: false,
      code: 'invalid-draft',
      message: formatDraftIssues(validation.issues).join(' '),
    }
  }
  const current = readDraftStore(storage, now)
  if (!current.ok) return current

  const index = current.value.drafts.findIndex(draft => draft.id === validation.data.id)
  const drafts = [...current.value.drafts]
  if (index >= 0) drafts[index] = validation.data
  else drafts.unshift(validation.data)
  return writeDraftStore(storage, drafts, now)
}

export function deleteDraft(
  storage: StorageAdapter,
  draftId: string,
  now = new Date(),
): DraftStoreMutationResult {
  const current = readDraftStore(storage, now)
  if (!current.ok) return current
  return writeDraftStore(storage, current.value.drafts.filter(draft => draft.id !== draftId), now)
}

export function replaceDrafts(
  storage: StorageAdapter,
  drafts: readonly QuestionDraft[],
  now = new Date(),
): DraftStoreMutationResult {
  return writeDraftStore(storage, drafts, now)
}

export function appendDrafts(
  storage: StorageAdapter,
  importedDrafts: readonly QuestionDraft[],
  now = new Date(),
): DraftStoreMutationResult {
  const current = readDraftStore(storage, now)
  if (!current.ok) return current

  const currentIds = new Set(current.value.drafts.map(draft => draft.id))
  const batchIds = new Set<string>()
  for (const draft of importedDrafts) {
    if (currentIds.has(draft.id) || batchIds.has(draft.id)) {
      return {
        ok: false,
        code: 'duplicate-id',
        message: `Không import vì draft ID bị trùng: ${draft.id}. Không có dữ liệu nào được thay đổi.`,
      }
    }
    batchIds.add(draft.id)
  }

  return writeDraftStore(storage, [...importedDrafts, ...current.value.drafts], now)
}

export function clearDraftStore(storage: StorageAdapter):
  | { ok: true }
  | DraftStoreFailure {
  try {
    storage.removeItem(AUTHOR_DRAFT_STORAGE_KEY)
    return { ok: true }
  } catch {
    return {
      ok: false,
      code: 'storage-unavailable',
      message: 'Không thể xóa dữ liệu local storage trong browser hiện tại.',
    }
  }
}
