import { describe, expect, it } from 'vitest'
import { getLessons } from '../content/lessons'
import { lessonContentHash } from '../content/lessonValidation'
import { createPwaKitArchitectureSimulation } from '../content/lessonSimulations/pwaKitArchitecture'
import type { LessonSimulationSpec, RichLesson } from '../content/types'
import {
  getLessonSimulationDraft,
  LESSON_SIMULATION_DRAFT_STORAGE_KEY,
  MAX_LESSON_SIMULATION_DRAFTS,
  readLessonSimulationDraftStore,
  removeLessonSimulationDraft,
  resetLessonSimulationDraftStore,
  upsertLessonSimulationDraft,
  type LessonSimulationStorageAdapter,
} from './lessonSimulationDraftStore'

class MemoryStorage implements LessonSimulationStorageAdapter {
  values = new Map<string, string>()
  getError: unknown = null
  setError: unknown = null

  getItem(key: string) {
    if (this.getError) throw this.getError
    return this.values.get(key) ?? null
  }

  setItem(key: string, value: string) {
    if (this.setError) throw this.setError
    this.values.set(key, value)
  }

  removeItem(key: string) {
    if (this.setError) throw this.setError
    this.values.delete(key)
  }
}

function sourceLesson(): RichLesson {
  const lesson = getLessons('vi').find((entry) => entry.slug === 'pwa-kit-architecture')
  if (!lesson?.content) throw new Error('Missing PWA Kit test lesson.')
  return lesson
}

function lessonFixture(slug = 'pwa-kit-architecture'): RichLesson {
  const lesson = sourceLesson()
  return {
    ...lesson,
    slug,
    simulation: undefined,
  }
}

function simulationFixture(lesson = lessonFixture()): LessonSimulationSpec {
  const simulation = createPwaKitArchitectureSimulation(lesson.locale, lessonContentHash(lesson))
  return {
    ...simulation,
    id: `lesson.${lesson.slug}`,
    source: {
      kind: 'lesson',
      slug: lesson.slug,
      contentHash: lessonContentHash(lesson),
    },
  }
}

describe('lessonSimulationDraftStore', () => {
  it('creates, replaces, reads, and removes a locale-plus-slug override', () => {
    const storage = new MemoryStorage()
    const lesson = lessonFixture()
    const created = upsertLessonSimulationDraft(
      storage,
      lesson,
      simulationFixture(lesson),
      new Date('2026-09-07T08:00:00.000Z'),
    )
    expect(created.ok).toBe(true)

    const replacement = {
      ...simulationFixture(lesson),
      takeaway: 'A replacement takeaway that remains unreviewed.',
    }
    const updated = upsertLessonSimulationDraft(
      storage,
      lesson,
      replacement,
      new Date('2026-09-07T08:05:00.000Z'),
    )
    expect(updated.ok).toBe(true)
    if (updated.ok) {
      expect(updated.value.entries).toHaveLength(1)
      expect(updated.value.entries[0].updatedAt).toBe('2026-09-07T08:05:00.000Z')
    }

    const lookup = getLessonSimulationDraft(storage, lesson)
    expect(lookup.ok).toBe(true)
    if (lookup.ok) {
      expect(lookup.status).toBe('active')
      expect(lookup.activeSimulation?.takeaway).toBe(replacement.takeaway)
      expect(lookup.entry?.locale).toBe('vi')
      expect(lookup.entry?.slug).toBe(lesson.slug)
    }

    const removed = removeLessonSimulationDraft(storage, 'vi', lesson.slug)
    expect(removed.ok).toBe(true)
    if (removed.ok) expect(removed.value.entries).toEqual([])
  })

  it('preserves a stale entry for export but never returns it as active', () => {
    const storage = new MemoryStorage()
    const lesson = lessonFixture()
    const simulation = simulationFixture(lesson)
    expect(upsertLessonSimulationDraft(storage, lesson, simulation).ok).toBe(true)

    const changedLesson = {
      ...lesson,
      shortAnswer: `${lesson.shortAnswer} Nội dung source đã thay đổi.`,
    } satisfies RichLesson
    const lookup = getLessonSimulationDraft(storage, changedLesson)

    expect(lookup.ok).toBe(true)
    if (lookup.ok) {
      expect(lookup.status).toBe('stale')
      expect(lookup.activeSimulation).toBeNull()
      expect(lookup.entry?.simulation).toEqual(simulation)
      expect(lookup.bindingIssues.some((issue) => issue.code === 'simulation-source-stale')).toBe(true)
      expect(lookup.value.entries).toHaveLength(1)
    }
  })

  it('rejects v1, reviewed, and source-mismatched simulations before writing', () => {
    const storage = new MemoryStorage()
    const lesson = lessonFixture()
    const simulation = simulationFixture(lesson)

    expect(upsertLessonSimulationDraft(storage, lesson, {
      ...simulation,
      schemaVersion: 1,
    } as unknown as LessonSimulationSpec)).toMatchObject({ ok: false, code: 'invalid-simulation' })

    expect(upsertLessonSimulationDraft(storage, lesson, {
      ...simulation,
      status: 'reviewed',
    })).toMatchObject({ ok: false, code: 'invalid-simulation' })

    expect(upsertLessonSimulationDraft(storage, lesson, {
      ...simulation,
      source: { ...simulation.source, contentHash: 'f'.repeat(64) },
    })).toMatchObject({ ok: false, code: 'invalid-binding' })

    expect(storage.values.has(LESSON_SIMULATION_DRAFT_STORAGE_KEY)).toBe(false)
  })

  it('does not overwrite corrupt or unsupported stored data', () => {
    const storage = new MemoryStorage()
    const lesson = lessonFixture()
    const simulation = simulationFixture(lesson)

    storage.values.set(LESSON_SIMULATION_DRAFT_STORAGE_KEY, '{not-json')
    expect(upsertLessonSimulationDraft(storage, lesson, simulation)).toMatchObject({
      ok: false,
      code: 'corrupt-data',
    })
    expect(storage.values.get(LESSON_SIMULATION_DRAFT_STORAGE_KEY)).toBe('{not-json')

    const unsupported = JSON.stringify({
      schemaVersion: 2,
      updatedAt: '2026-09-07T08:00:00.000Z',
      entries: [],
    })
    storage.values.set(LESSON_SIMULATION_DRAFT_STORAGE_KEY, unsupported)
    expect(removeLessonSimulationDraft(storage, lesson.locale, lesson.slug)).toMatchObject({
      ok: false,
      code: 'unsupported-version',
    })
    expect(storage.values.get(LESSON_SIMULATION_DRAFT_STORAGE_KEY)).toBe(unsupported)
  })

  it('resets only the dedicated key after explicit corrupt-data recovery', () => {
    const storage = new MemoryStorage()
    storage.values.set(LESSON_SIMULATION_DRAFT_STORAGE_KEY, '{not-json')
    storage.values.set('unrelated', 'keep-me')

    const result = resetLessonSimulationDraftStore(
      storage,
      new Date('2026-09-07T08:00:00.000Z'),
    )

    expect(result).toEqual({
      ok: true,
      value: {
        schemaVersion: 1,
        updatedAt: '2026-09-07T08:00:00.000Z',
        entries: [],
      },
    })
    expect(storage.values.has(LESSON_SIMULATION_DRAFT_STORAGE_KEY)).toBe(false)
    expect(storage.values.get('unrelated')).toBe('keep-me')
  })

  it('rejects extra envelope and entry fields instead of silently rewriting them', () => {
    const storage = new MemoryStorage()
    const lesson = lessonFixture()
    const simulation = simulationFixture(lesson)
    const base = {
      schemaVersion: 1,
      updatedAt: '2026-09-07T08:00:00.000Z',
      entries: [{
        locale: lesson.locale,
        slug: lesson.slug,
        updatedAt: '2026-09-07T08:00:00.000Z',
        simulation,
      }],
    }

    storage.values.set(LESSON_SIMULATION_DRAFT_STORAGE_KEY, JSON.stringify({ ...base, extra: true }))
    expect(readLessonSimulationDraftStore(storage)).toMatchObject({ ok: false, code: 'corrupt-data' })

    storage.values.set(LESSON_SIMULATION_DRAFT_STORAGE_KEY, JSON.stringify({
      ...base,
      entries: [{ ...base.entries[0], extra: true }],
    }))
    expect(readLessonSimulationDraftStore(storage)).toMatchObject({ ok: false, code: 'corrupt-data' })
  })

  it('keeps writes bounded and evicts the oldest entry after a successful insert', () => {
    const storage = new MemoryStorage()
    for (let index = 0; index <= MAX_LESSON_SIMULATION_DRAFTS; index += 1) {
      const lesson = lessonFixture(`pwa-kit-${index}`)
      const result = upsertLessonSimulationDraft(
        storage,
        lesson,
        simulationFixture(lesson),
        new Date(Date.UTC(2026, 8, 7, 8, index)),
      )
      expect(result.ok).toBe(true)
    }

    const stored = readLessonSimulationDraftStore(storage)
    expect(stored.ok).toBe(true)
    if (stored.ok) {
      expect(stored.value.entries).toHaveLength(MAX_LESSON_SIMULATION_DRAFTS)
      expect(stored.value.entries[0].slug).toBe(`pwa-kit-${MAX_LESSON_SIMULATION_DRAFTS}`)
      expect(stored.value.entries.some((entry) => entry.slug === 'pwa-kit-0')).toBe(false)
    }
  })

  it('reports quota and storage access failures without changing existing data', () => {
    const storage = new MemoryStorage()
    const lesson = lessonFixture()
    expect(upsertLessonSimulationDraft(storage, lesson, simulationFixture(lesson)).ok).toBe(true)
    const original = storage.values.get(LESSON_SIMULATION_DRAFT_STORAGE_KEY)

    storage.setError = Object.assign(new Error('full'), { name: 'QuotaExceededError' })
    const result = upsertLessonSimulationDraft(storage, lesson, {
      ...simulationFixture(lesson),
      takeaway: 'This value must not be persisted.',
    })
    expect(result).toMatchObject({ ok: false, code: 'quota-exceeded' })
    expect(storage.values.get(LESSON_SIMULATION_DRAFT_STORAGE_KEY)).toBe(original)

    storage.setError = null
    storage.getError = new Error('blocked')
    expect(readLessonSimulationDraftStore(storage)).toMatchObject({
      ok: false,
      code: 'storage-unavailable',
    })
  })
})
