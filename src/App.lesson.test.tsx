// @vitest-environment jsdom

import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import App, { LessonView } from './App'
import { getLessons } from './content/lessons'
import { LocaleProvider } from './i18n'
import {
  LESSON_SIMULATION_DRAFT_STORAGE_KEY,
  readLessonSimulationDraftStore,
  upsertLessonSimulationDraft,
} from './author/lessonSimulationDraftStore'

function renderApp() {
  return render(<LocaleProvider><App/></LocaleProvider>)
}

function openPwaKitLesson() {
  fireEvent.click(screen.getByRole('button', { name: /PWA Kit hoạt động trong kiến trúc SFCC/ }))
}

describe('rich lesson experience', () => {
  beforeEach(() => {
    window.localStorage.clear()
    window.location.hash = ''
    Object.defineProperty(window, 'scrollY', { configurable: true, writable: true, value: 0 })
  })

  afterEach(() => {
    cleanup()
    vi.unstubAllGlobals()
  })

  it('renders the PWA Kit learning layers and pending review boundary', () => {
    renderApp()
    openPwaKitLesson()

    expect(screen.getByRole('heading', { level: 1, name: 'PWA Kit hoạt động trong kiến trúc SFCC ra sao?' })).toBeTruthy()
    expect(screen.getByRole('heading', { level: 2, name: 'Trả lời nhanh' })).toBeTruthy()
    expect(screen.getByRole('heading', { name: 'Ai chịu trách nhiệm cho phần nào?' })).toBeTruthy()
    expect(screen.getByRole('heading', { name: 'Cơ chế theo từng bước' })).toBeTruthy()
    expect(screen.getByRole('heading', { name: 'Production trade-offs' })).toBeTruthy()
    expect(screen.getByRole('heading', { name: 'Hiểu lầm thường gặp' })).toBeTruthy()
    expect(screen.getByRole('heading', { name: 'PDP và Add to Cart' })).toBeTruthy()
    expect(screen.getByRole('heading', { level: 2, name: 'INTERVIEWER CÓ THỂ HỎI TIẾP' })).toBeTruthy()
    expect(screen.getByRole('status').textContent).toContain('Đang chờ technical review')
    expect(screen.getByText(/PWA Kit như storefront application/)).toBeTruthy()
    expect(screen.getByRole('heading', { level: 2, name: /Theo dõi một PDP request/ })).toBeTruthy()
    expect(screen.getByText('AI draft · cần review')).toBeTruthy()
  })

  it('loads a validated local simulation override and restores the repository version', async () => {
    const source = getLessons('vi').find((entry) => entry.slug === 'pwa-kit-architecture')
    if (!source?.content || !source.simulation) throw new Error('Missing rich PWA lesson simulation')
    const localSimulation = {
      ...structuredClone(source.simulation),
      id: 'lesson.pwa-kit-architecture.local-test',
      learningObjective: 'Local override objective for the author preview.',
    }
    expect(upsertLessonSimulationDraft(window.localStorage, source, localSimulation).ok).toBe(true)

    render(<LocaleProvider><LessonView lesson={source} onBack={vi.fn()}/></LocaleProvider>)

    expect(await screen.findByText('Đang dùng local override')).toBeTruthy()
    expect(screen.getByRole('heading', { level: 2, name: localSimulation.learningObjective })).toBeTruthy()
    fireEvent.click(screen.getByRole('button', { name: 'Khôi phục bản repository' }))
    fireEvent.click(screen.getByRole('button', { name: 'Xác nhận xóa local override' }))

    await waitFor(() => {
      expect(screen.getByText('Đang dùng bản trong repository')).toBeTruthy()
    })
    await waitFor(() => {
      expect(document.activeElement).toBe(screen.getByRole('button', { name: 'Tạo lại bằng AI' }))
    })
    const stored = readLessonSimulationDraftStore(window.localStorage)
    expect(stored.ok).toBe(true)
    if (stored.ok) expect(stored.value.entries).toEqual([])
  })

  it('offers scoped recovery before resetting a corrupt local simulation store', async () => {
    const source = getLessons('vi').find((entry) => entry.slug === 'pwa-kit-architecture')
    if (!source?.content) throw new Error('Missing rich PWA lesson')
    window.localStorage.setItem(LESSON_SIMULATION_DRAFT_STORAGE_KEY, '{broken-json')
    window.localStorage.setItem('unrelated-local-key', 'keep-me')

    render(<LocaleProvider><LessonView lesson={source} onBack={vi.fn()}/></LocaleProvider>)

    expect(screen.getByRole('button', { name: 'Tải bản recovery' })).toBeTruthy()
    fireEvent.click(screen.getByRole('button', { name: 'Reset local store bị lỗi' }))
    expect(screen.getByText(content => content.includes(LESSON_SIMULATION_DRAFT_STORAGE_KEY))).toBeTruthy()
    fireEvent.click(screen.getByRole('button', { name: 'Xác nhận reset toàn bộ local simulation drafts' }))

    await waitFor(() => {
      expect(screen.queryByRole('heading', { name: 'Không thể dùng local draft storage' })).toBeNull()
    })
    await waitFor(() => {
      expect(document.activeElement).toBe(document.getElementById('lesson-simulation'))
    })
    expect(window.localStorage.getItem(LESSON_SIMULATION_DRAFT_STORAGE_KEY)).toBeNull()
    expect(window.localStorage.getItem('unrelated-local-key')).toBe('keep-me')
  })

  it('plays deterministic lesson scenarios and exposes localized state meaning', () => {
    renderApp()
    openPwaKitLesson()

    expect(screen.getByText('Giai đoạn')).toBeTruthy()
    expect(screen.getByText('Bước hiện tại của request hoặc interaction.')).toBeTruthy()
    fireEvent.click(screen.getByRole('button', { name: 'Đi tới bước tiếp theo' }))
    expect(screen.getByRole('heading', { level: 3, name: 'Mở PDP trực tiếp' })).toBeTruthy()
    expect(screen.getByText('document-request')).toBeTruthy()

    fireEvent.change(screen.getByRole('combobox', { name: 'Scenario' }), {
      target: { value: 'unsafe-personalized-shared-cache' },
    })
    expect(screen.getByRole('heading', { level: 3, name: 'Failure: personalized output trong shared cache' })).toBeTruthy()
    fireEvent.click(screen.getByRole('button', { name: 'Đi tới bước tiếp theo' }))
    expect(screen.getByRole('heading', { level: 3, name: 'Yêu cầu PDP có shopper context' })).toBeTruthy()
  })

  it('keeps the same lesson selected when switching to English', () => {
    renderApp()
    openPwaKitLesson()

    fireEvent.click(screen.getByRole('button', { name: 'English' }))

    expect(screen.getByRole('heading', { level: 1, name: 'How does PWA Kit fit into an SFCC architecture?' })).toBeTruthy()
    expect(screen.getByRole('heading', { name: 'Who owns each responsibility?' })).toBeTruthy()
    expect(screen.getByRole('heading', { name: 'PDP and Add to Cart' })).toBeTruthy()
    const reviewStates = screen.getAllByRole('status').map((status) => status.textContent)
    expect(reviewStates.some((status) => status?.includes('Technical review pending'))).toBe(true)
    expect(reviewStates.some((status) => status?.includes('Translation review pending'))).toBe(true)
  })

  it('resets simulation playback at the new locale source boundary', () => {
    renderApp()
    openPwaKitLesson()
    fireEvent.change(screen.getByRole('combobox', { name: 'Scenario' }), {
      target: { value: 'unsafe-personalized-shared-cache' },
    })
    fireEvent.click(screen.getByRole('button', { name: 'Đi tới bước tiếp theo' }))
    expect(screen.getByRole('heading', { level: 3, name: 'Yêu cầu PDP có shopper context' })).toBeTruthy()

    fireEvent.click(screen.getByRole('button', { name: 'English' }))

    const scenario = screen.getByRole('combobox', { name: 'Scenario' }) as HTMLSelectElement
    expect(scenario.value).toBe('cache-miss-ssr-add-to-cart')
    expect(screen.getByRole('heading', { level: 3, name: 'Cache miss: SSR through Add to Cart' })).toBeTruthy()
  })

  it('fails closed when the lesson changes after its simulation was generated', () => {
    const source = getLessons('vi').find((lesson) => lesson.slug === 'pwa-kit-architecture')
    if (!source?.content) throw new Error('Missing rich PWA Kit lesson')
    const stale = { ...source, title: `${source.title} updated` }

    render(<LocaleProvider><LessonView lesson={stale} onBack={vi.fn()}/></LocaleProvider>)

    expect(screen.getByRole('heading', { level: 2, name: 'Mô phỏng cần được cập nhật' })).toBeTruthy()
    expect(screen.getByText(/đã được dừng để tránh giải thích sai cơ chế/)).toBeTruthy()
    expect(screen.queryByRole('combobox', { name: 'Scenario' })).toBeNull()
  })

  it('disables autoplay for reduced motion while retaining manual step controls', () => {
    vi.stubGlobal('matchMedia', vi.fn(() => ({
      matches: true,
      media: '(prefers-reduced-motion: reduce)',
      onchange: null,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      addListener: vi.fn(),
      removeListener: vi.fn(),
      dispatchEvent: vi.fn(),
    })))
    renderApp()
    openPwaKitLesson()

    const play = screen.getByRole('button', { name: 'Chạy mô phỏng' }) as HTMLButtonElement
    const next = screen.getByRole('button', { name: 'Đi tới bước tiếp theo' }) as HTMLButtonElement
    expect(play.disabled).toBe(true)
    expect(next.disabled).toBe(false)
    expect(screen.getByText(/Reduced motion đang bật/)).toBeTruthy()

    fireEvent.click(next)
    expect(screen.getByRole('heading', { level: 3, name: 'Mở PDP trực tiếp' })).toBeTruthy()
    expect((screen.getByRole('button', { name: 'Quay lại bước trước' }) as HTMLButtonElement).disabled).toBe(false)
  })

  it('uses real table-of-content links instead of a hard-coded active item', () => {
    renderApp()
    openPwaKitLesson()

    const quickAnswerLink = screen.getByRole('link', { name: /1Trả lời nhanh/ })
    const mechanismLink = screen.getByRole('link', { name: /2Hiểu bản chất/ })

    expect(quickAnswerLink.getAttribute('aria-current')).toBe('location')
    expect(quickAnswerLink.getAttribute('href')).toBe('#lesson-quick-answer')
    expect(mechanismLink.getAttribute('href')).toBe('#lesson-understand')

    fireEvent.click(mechanismLink)
    expect(mechanismLink.getAttribute('aria-current')).toBe('location')
    expect(quickAnswerLink.getAttribute('aria-current')).toBeNull()

    const mobileJumpMenu = screen.getByRole('combobox', { name: 'NỘI DUNG BÀI HỌC' })
    fireEvent.change(mobileJumpMenu, { target: { value: 'lesson-follow-ups' } })
    expect((mobileJumpMenu as HTMLSelectElement).value).toBe('lesson-follow-ups')
  })

  it('tracks the section nearest the activation line and handles page bottom', () => {
    renderApp()
    openPwaKitLesson()

    const positions: Record<string, number> = {
      'lesson-quick-answer': -1200,
      'lesson-understand': -900,
      'lesson-simulation': 100,
      'lesson-follow-ups': 900,
    }
    for (const [id, top] of Object.entries(positions)) {
      const section = document.getElementById(id)
      if (!section) throw new Error(`Missing section ${id}`)
      vi.spyOn(section, 'getBoundingClientRect').mockReturnValue({
        x: 0, y: top, top, bottom: top + 100, left: 0, right: 100,
        width: 100, height: 100, toJSON: () => ({}),
      })
    }
    Object.defineProperty(window, 'innerHeight', { configurable: true, writable: true, value: 800 })
    Object.defineProperty(document.documentElement, 'scrollHeight', { configurable: true, value: 4000 })
    window.scrollY = 1200

    fireEvent.scroll(window)
    expect(screen.getByRole('link', { name: /3Mô phỏng workflow/ }).getAttribute('aria-current')).toBe('location')

    window.scrollY = 3200
    fireEvent.scroll(window)
    expect(screen.getByRole('link', { name: /4Câu hỏi đào sâu/ }).getAttribute('aria-current')).toBe('location')
  })

  it('keeps the generic fallback for legacy lessons', () => {
    renderApp()
    fireEvent.click(screen.getByRole('button', { name: /Database Index tăng tốc truy vấn/ }))

    expect(screen.getByText(/Thay vì chỉ ghi nhớ định nghĩa/)).toBeTruthy()
    expect(screen.getByText('Mô phỏng cho bài này đang được xây dựng.')).toBeTruthy()
    expect(screen.queryByRole('heading', { name: 'Production trade-offs' })).toBeNull()
    expect(screen.queryByRole('heading', { name: 'AI Simulation Studio' })).toBeNull()
  })
})
