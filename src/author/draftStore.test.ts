import { describe, expect, it } from 'vitest'
import type { QuestionDraft } from '../content/types'
import { createPwaKitArchitectureSimulation } from '../content/lessonSimulations/pwaKitArchitecture'
import {
  appendDrafts,
  AUTHOR_DRAFT_STORAGE_KEY,
  deleteDraft,
  readDraftStore,
  upsertDraft,
  writeDraftStore,
  type StorageAdapter,
} from './draftStore'
import { createTestDraft, createTestSimulation } from './testFixtures'

class MemoryStorage implements StorageAdapter {
  values = new Map<string, string>()
  setError: unknown = null

  getItem(key: string) {
    return this.values.get(key) ?? null
  }

  setItem(key: string, value: string) {
    if (this.setError) throw this.setError
    this.values.set(key, value)
  }

  removeItem(key: string) {
    this.values.delete(key)
  }
}

describe('draftStore', () => {
  it('supports versioned create, update, read, and delete', () => {
    const storage = new MemoryStorage()
    const created = upsertDraft(storage, createTestDraft(), new Date('2026-09-07T01:00:00.000Z'))
    expect(created.ok).toBe(true)

    const updated = upsertDraft(storage, createTestDraft({ sourceNotes: 'Updated notes.' }))
    expect(updated.ok).toBe(true)
    if (updated.ok) expect(updated.value.drafts).toHaveLength(1)

    const read = readDraftStore(storage)
    expect(read.ok).toBe(true)
    if (read.ok) {
      expect(read.value.schemaVersion).toBe(1)
      expect(read.value.drafts[0].sourceNotes).toBe('Updated notes.')
    }

    const removed = deleteDraft(storage, 'draft-test-1')
    expect(removed.ok).toBe(true)
    if (removed.ok) expect(removed.value.drafts).toEqual([])
  })

  it('does not overwrite corrupt storage', () => {
    const storage = new MemoryStorage()
    storage.values.set(AUTHOR_DRAFT_STORAGE_KEY, '{not-json')
    const result = upsertDraft(storage, createTestDraft())
    expect(result).toMatchObject({ ok: false, code: 'corrupt-data' })
    expect(storage.values.get(AUTHOR_DRAFT_STORAGE_KEY)).toBe('{not-json')
  })

  it('reports quota failures without mutating the existing value', () => {
    const storage = new MemoryStorage()
    const original = JSON.stringify({ schemaVersion: 1, updatedAt: '2026-09-07T00:00:00.000Z', drafts: [] })
    storage.values.set(AUTHOR_DRAFT_STORAGE_KEY, original)
    storage.setError = Object.assign(new Error('full'), { name: 'QuotaExceededError' })
    const result = writeDraftStore(storage, [createTestDraft()])
    expect(result).toMatchObject({ ok: false, code: 'quota-exceeded' })
    expect(storage.values.get(AUTHOR_DRAFT_STORAGE_KEY)).toBe(original)
  })

  it('rejects an append batch with an ID collision atomically', () => {
    const storage = new MemoryStorage()
    expect(writeDraftStore(storage, [createTestDraft()]).ok).toBe(true)
    const before = storage.values.get(AUTHOR_DRAFT_STORAGE_KEY)
    const result = appendDrafts(storage, [createTestDraft()])
    expect(result).toMatchObject({ ok: false, code: 'duplicate-id' })
    expect(storage.values.get(AUTHOR_DRAFT_STORAGE_KEY)).toBe(before)
  })

  it('rejects a lesson schema v2 simulation instead of storing it as a question draft', () => {
    const storage = new MemoryStorage()
    const incompatible = {
      ...createTestDraft(),
      simulation: createPwaKitArchitectureSimulation('vi', 'a'.repeat(64)),
    } as unknown as QuestionDraft

    const result = upsertDraft(storage, incompatible)

    expect(result).toMatchObject({ ok: false, code: 'invalid-draft' })
    expect(storage.values.has(AUTHOR_DRAFT_STORAGE_KEY)).toBe(false)
  })

  it('drops and reports a simulation whose content hash is stale on load', () => {
    const storage = new MemoryStorage()
    const stale = createTestDraft({ simulation: createTestSimulation('draft-test-1', 'f'.repeat(64)) })
    storage.values.set(AUTHOR_DRAFT_STORAGE_KEY, JSON.stringify({
      schemaVersion: 1,
      updatedAt: '2026-09-07T00:00:00.000Z',
      drafts: [stale],
    }))
    const result = readDraftStore(storage)
    expect(result.ok).toBe(true)
    if (result.ok) {
      expect(result.value.drafts[0].simulation).toBeUndefined()
      expect(result.warnings).toContainEqual(expect.objectContaining({ code: 'content-hash-mismatch' }))
    }
  })
})
