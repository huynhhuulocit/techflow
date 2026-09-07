// @vitest-environment jsdom

import { act, cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import type { LessonSimulationSpec, RichLesson } from '../content/types'
import { getLessons } from '../content/lessons'
import { isRichLesson } from '../content/lessonValidation'
import { AUTHOR_TOKEN_SESSION_KEY, AuthorApiError } from '../author/aiClient'
import {
  createLessonSimulationGenerateRequest,
  lessonSimulationGenerationInputHash,
} from '../author/lessonSimulationGeneration'
import {
  LessonSimulationStudio,
  type LessonSimulationGenerator,
} from './LessonSimulationStudio'

function lessonFixture(locale: 'vi' | 'en' = 'vi') {
  const lesson = getLessons(locale).find(entry => entry.slug === 'pwa-kit-architecture')
  if (!lesson || !isRichLesson(lesson) || !lesson.simulation) {
    throw new Error('Expected the rich PWA Kit lesson fixture with a simulation.')
  }
  return lesson
}

function cloneSimulation(
  lesson: RichLesson,
  kind: LessonSimulationSpec['kind'] = 'flow',
  failureScenario = '',
): LessonSimulationSpec {
  if (!lesson.simulation) throw new Error('Expected a simulation fixture.')
  const simulation = structuredClone(lesson.simulation)
  simulation.kind = kind
  if (simulation.provenance.kind !== 'ai-generated') throw new Error('Expected an AI simulation fixture.')
  simulation.provenance.inputHash = lessonSimulationGenerationInputHash(
    createLessonSimulationGenerateRequest({ lesson, kind, failureScenario }),
  )
  return simulation
}

function createStorage(seed: Record<string, string> = {}) {
  const values = new Map(Object.entries(seed))
  return {
    values,
    getItem: vi.fn((key: string) => values.get(key) ?? null),
    setItem: vi.fn((key: string, value: string) => { values.set(key, value) }),
    removeItem: vi.fn((key: string) => { values.delete(key) }),
  }
}

function deferred<T>() {
  let resolve!: (value: T) => void
  let reject!: (error: unknown) => void
  const promise = new Promise<T>((resolvePromise, rejectPromise) => {
    resolve = resolvePromise
    reject = rejectPromise
  })
  return { promise, resolve, reject }
}

afterEach(() => cleanup())

describe('LessonSimulationStudio', () => {
  it('keeps generation as preview until explicit local apply, then exports and discards it', async () => {
    const lesson = lessonFixture()
    const simulation = cloneSimulation(lesson, 'flow', 'shared cache leaks personalized HTML')
    const generation = deferred<{ simulation: LessonSimulationSpec; requestId?: string }>()
    const generator = vi.fn<LessonSimulationGenerator>(() => generation.promise)
    const applyLocal = vi.fn()
    const exported = vi.fn()

    render(
      <LessonSimulationStudio
        lesson={lesson}
        activeSimulation={lesson.simulation}
        onApplyLocal={applyLocal}
        generator={generator}
        onExport={exported}
        initiallyOpen
      />,
    )

    fireEvent.change(screen.getByLabelText('Author Token'), { target: { value: ' author-token ' } })
    fireEvent.change(screen.getByLabelText('Failure/what-if cần mô phỏng (không bắt buộc)'), {
      target: { value: '  shared cache leaks personalized HTML  ' },
    })
    fireEvent.click(screen.getByRole('button', { name: 'Generate preview' }))

    expect(screen.getByText('Đang generate preview…')).toBeTruthy()
    expect(screen.getByText('Đang generate preview…').closest('[aria-busy]')?.getAttribute('aria-busy')).toBe('true')
    expect(applyLocal).not.toHaveBeenCalled()

    await act(async () => generation.resolve({ simulation, requestId: 'request-1' }))

    const previewTitle = await screen.findByRole('heading', { level: 3, name: 'Preview simulation cần review' })
    expect(document.activeElement).toBe(previewTitle)
    expect(generator).toHaveBeenCalledWith({
      lesson,
      kind: 'flow',
      failureScenario: 'shared cache leaks personalized HTML',
    }, ' author-token ')
    expect(screen.getByText('AI DRAFT · GENERATED-NEEDS-REVIEW')).toBeTruthy()
    expect(applyLocal).not.toHaveBeenCalled()

    fireEvent.change(screen.getByLabelText('Kiểu mô phỏng'), { target: { value: 'state' } })
    expect(screen.getByText(/Generation settings đã thay đổi/u)).toBeTruthy()
    expect((screen.getByRole('button', { name: 'Apply locally' }) as HTMLButtonElement).disabled).toBe(true)
    expect((screen.getByRole('button', { name: 'Export JSON' }) as HTMLButtonElement).disabled).toBe(true)
    fireEvent.change(screen.getByLabelText('Kiểu mô phỏng'), { target: { value: 'flow' } })

    fireEvent.click(screen.getByRole('button', { name: 'Apply locally' }))
    await waitFor(() => expect(applyLocal).toHaveBeenCalledWith(simulation))
    expect(screen.getByText(/Đã apply local override/u)).toBeTruthy()

    fireEvent.click(screen.getByRole('button', { name: 'Export JSON' }))
    expect(exported).toHaveBeenCalledTimes(1)
    expect(exported.mock.calls[0][0]).toBe('techflow-pwa-kit-architecture-vi-simulation.json')
    expect(JSON.parse(exported.mock.calls[0][1])).toEqual(simulation)

    fireEvent.click(screen.getByRole('button', { name: 'Bỏ preview' }))
    expect(screen.queryByRole('heading', { name: 'Preview simulation cần review' })).toBeNull()
    expect(screen.getByText('Đã bỏ preview. Simulation đang áp dụng không thay đổi.')).toBeTruthy()
  })

  it('preserves the previous candidate when regenerate fails or returns an invalid binding', async () => {
    const lesson = lessonFixture()
    const simulation = cloneSimulation(lesson)
    const invalid = structuredClone(simulation)
    invalid.source.contentHash = 'a'.repeat(64)
    const generator = vi.fn<LessonSimulationGenerator>()
      .mockResolvedValueOnce({ simulation })
      .mockRejectedValueOnce(new AuthorApiError('provider error', { code: 'rate_limited' }))
      .mockResolvedValueOnce({ simulation: invalid })

    render(
      <LessonSimulationStudio
        lesson={lesson}
        activeSimulation={lesson.simulation}
        onApplyLocal={vi.fn()}
        generator={generator}
        initiallyOpen
      />,
    )

    fireEvent.change(screen.getByLabelText('Author Token'), { target: { value: 'token' } })
    fireEvent.click(screen.getByRole('button', { name: 'Generate preview' }))
    await screen.findByRole('heading', { name: 'Preview simulation cần review' })

    fireEvent.click(screen.getAllByRole('button', { name: 'Generate lại' })[0])
    await screen.findByRole('alert')
    expect(screen.getByText(/AI provider đang giới hạn request/u)).toBeTruthy()
    expect(screen.getByRole('heading', { name: 'Preview simulation cần review' })).toBeTruthy()

    fireEvent.click(screen.getAllByRole('button', { name: 'Generate lại' })[0])
    await waitFor(() => expect(screen.getByText(/AI output không đạt schema v2/u)).toBeTruthy())
    expect(screen.getByRole('heading', { name: 'Preview simulation cần review' })).toBeTruthy()
  })

  it('ignores a late response when generation settings change', async () => {
    const lesson = lessonFixture()
    const generation = deferred<{ simulation: LessonSimulationSpec; requestId?: string }>()
    const generator = vi.fn<LessonSimulationGenerator>(() => generation.promise)

    render(
      <LessonSimulationStudio
        lesson={lesson}
        activeSimulation={lesson.simulation}
        onApplyLocal={vi.fn()}
        generator={generator}
        initiallyOpen
      />,
    )

    fireEvent.change(screen.getByLabelText('Author Token'), { target: { value: 'token' } })
    fireEvent.click(screen.getByRole('button', { name: 'Generate preview' }))
    fireEvent.change(screen.getByLabelText('Kiểu mô phỏng'), { target: { value: 'state' } })

    await act(async () => generation.resolve({ simulation: cloneSimulation(lesson) }))

    expect(await screen.findByText(/Đã bỏ qua kết quả AI trả về trễ/u)).toBeTruthy()
    expect(screen.queryByRole('heading', { name: 'Preview simulation cần review' })).toBeNull()
  })

  it('loads and manages the tab token and restores a local override explicitly', async () => {
    const lesson = lessonFixture()
    const storage = createStorage({ [AUTHOR_TOKEN_SESSION_KEY]: 'saved-token' })
    const restore = vi.fn()
    const exported = vi.fn()

    render(
      <LessonSimulationStudio
        lesson={lesson}
        activeSimulation={lesson.simulation}
        localOverrideActive
        onApplyLocal={vi.fn()}
        onRestoreRepository={restore}
        tokenStorage={storage}
        generator={vi.fn()}
        onExport={exported}
      />,
    )

    expect(screen.getByText('Đang dùng local override')).toBeTruthy()
    fireEvent.click(screen.getByRole('button', { name: 'Export local override' }))
    expect(exported.mock.calls[0][0]).toBe('techflow-pwa-kit-architecture-vi-local-simulation.json')
    fireEvent.click(screen.getByRole('button', { name: 'Khôi phục bản repository' }))
    expect(restore).not.toHaveBeenCalled()
    expect(screen.getByText(/Local override sẽ bị xóa khỏi browser/u)).toBeTruthy()
    fireEvent.click(screen.getByRole('button', { name: 'Xác nhận xóa local override' }))
    await waitFor(() => expect(restore).toHaveBeenCalledTimes(1))
    await waitFor(() => expect(document.activeElement).toBe(screen.getByRole('button', { name: 'Tạo lại bằng AI' })))

    fireEvent.click(screen.getByRole('button', { name: 'Tạo lại bằng AI' }))
    await waitFor(() => expect((screen.getByLabelText('Author Token') as HTMLInputElement).value).toBe('saved-token'))

    fireEvent.click(screen.getByRole('button', { name: 'Xóa token' }))
    expect(storage.values.has(AUTHOR_TOKEN_SESSION_KEY)).toBe(false)

    fireEvent.change(screen.getByLabelText('Author Token'), { target: { value: '  next-token  ' } })
    fireEvent.click(screen.getByRole('button', { name: 'Giữ token trong tab' }))
    expect(storage.values.get(AUTHOR_TOKEN_SESSION_KEY)).toBe('next-token')
  })

  it('drops a preview when the lesson locale and source identity change', async () => {
    const viLesson = lessonFixture('vi')
    const enLesson = lessonFixture('en')
    const generator = vi.fn<LessonSimulationGenerator>().mockResolvedValue({
      simulation: cloneSimulation(viLesson),
    })
    const view = render(
      <LessonSimulationStudio
        lesson={viLesson}
        activeSimulation={viLesson.simulation}
        onApplyLocal={vi.fn()}
        generator={generator}
        initiallyOpen
      />,
    )

    fireEvent.change(screen.getByLabelText('Author Token'), { target: { value: 'token' } })
    fireEvent.click(screen.getByRole('button', { name: 'Generate preview' }))
    await screen.findByRole('heading', { name: 'Preview simulation cần review' })

    view.rerender(
      <LessonSimulationStudio
        lesson={enLesson}
        activeSimulation={enLesson.simulation}
        onApplyLocal={vi.fn()}
        generator={generator}
        initiallyOpen
      />,
    )

    await waitFor(() => expect(screen.getByText(/lesson source or locale changed/iu)).toBeTruthy())
    expect(screen.queryByRole('heading', { name: 'Simulation preview requiring review' })).toBeNull()
  })

  it('never plays a stale stored override but keeps explicit recovery actions', async () => {
    const lesson = lessonFixture()
    const stale = cloneSimulation(lesson)
    stale.source.contentHash = 'b'.repeat(64)
    const exported = vi.fn()
    const discardStale = vi.fn()

    render(
      <LessonSimulationStudio
        lesson={lesson}
        activeSimulation={lesson.simulation}
        staleStoredSimulation={stale}
        onApplyLocal={vi.fn()}
        onDiscardStale={discardStale}
        onExport={exported}
        generator={vi.fn()}
        initiallyOpen
      />,
    )

    expect(screen.getByRole('heading', { name: 'Local override đã stale' })).toBeTruthy()
    expect(screen.getByText(/không được phát vì source lesson đã thay đổi/u)).toBeTruthy()
    expect(screen.queryByText(stale.learningObjective)).toBeNull()

    fireEvent.click(screen.getByRole('button', { name: 'Export stale JSON' }))
    expect(exported.mock.calls[0][0]).toBe('techflow-pwa-kit-architecture-vi-stale-simulation.json')
    expect(JSON.parse(exported.mock.calls[0][1])).toEqual(stale)

    fireEvent.click(screen.getByRole('button', { name: 'Xóa local draft stale' }))
    expect(discardStale).not.toHaveBeenCalled()
    expect(screen.getByText(/Draft stale sẽ bị xóa khỏi browser/u)).toBeTruthy()
    fireEvent.click(screen.getByRole('button', { name: 'Xác nhận xóa draft stale' }))
    await waitFor(() => expect(discardStale).toHaveBeenCalledTimes(1))
    await waitFor(() => expect(document.activeElement).toBe(screen.getByRole('button', { name: 'Đóng AI Simulation Studio' })))
  })
})
