// @vitest-environment jsdom

import { cleanup, fireEvent, render, screen, within } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import App from './App'
import { LocaleProvider } from './i18n'

function renderApp() {
  return render(<LocaleProvider><App/></LocaleProvider>)
}

function setViewportWidth(width: number) {
  Object.defineProperty(window, 'innerWidth', {
    configurable: true,
    writable: true,
    value: width,
  })
}

describe('home mobile navigation and filters', () => {
  beforeEach(() => {
    window.localStorage.clear()
    setViewportWidth(320)
  })

  afterEach(() => cleanup())

  it('opens the disclosure and closes it from outside or Escape', () => {
    renderApp()
    const trigger = screen.getByRole('button', { name: 'Mở menu chính' })

    fireEvent.click(trigger)
    expect(trigger.getAttribute('aria-expanded')).toBe('true')
    expect(screen.getByRole('navigation', { name: 'Điều hướng chính' }).classList.contains('is-open')).toBe(true)

    fireEvent.pointerDown(screen.getByRole('heading', { level: 1 }))
    expect(trigger.getAttribute('aria-expanded')).toBe('false')

    fireEvent.click(trigger)
    fireEvent.keyDown(document, { key: 'Escape' })
    expect(trigger.getAttribute('aria-expanded')).toBe('false')
    expect(document.activeElement).toBe(trigger)
  })

  it('does not reopen after a mobile-desktop-mobile resize round trip', () => {
    renderApp()
    const trigger = screen.getByRole('button', { name: 'Mở menu chính' })

    fireEvent.click(trigger)
    expect(trigger.getAttribute('aria-expanded')).toBe('true')

    setViewportWidth(1024)
    fireEvent.resize(window)
    expect(trigger.getAttribute('aria-expanded')).toBe('false')

    setViewportWidth(320)
    fireEvent.resize(window)
    expect(trigger.getAttribute('aria-expanded')).toBe('false')
  })

  it('localizes mobile labels and exposes the selected topic', () => {
    renderApp()
    fireEvent.click(screen.getByRole('button', { name: 'English' }))

    expect(screen.getByRole('button', { name: 'Open primary menu' })).toBeTruthy()
    const filters = screen.getByRole('group', { name: 'Filter lessons by topic' })
    const all = within(filters).getByRole('button', { name: 'All' })
    const typescript = within(filters).getByRole('button', { name: 'TypeScript' })

    expect(all.getAttribute('aria-pressed')).toBe('true')
    fireEvent.click(typescript)
    expect(all.getAttribute('aria-pressed')).toBe('false')
    expect(typescript.getAttribute('aria-pressed')).toBe('true')
  })
})
