import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import type { Locale } from '../content/types'
import { copyByLocale, type AppCopy } from './copy'

const STORAGE_KEY = 'techflow.locale'

type LocaleContextValue = {
  locale: Locale
  setLocale: (locale: Locale) => void
  copy: AppCopy
}

const LocaleContext = createContext<LocaleContextValue | null>(null)

function getInitialLocale(): Locale {
  if (typeof window === 'undefined') return 'vi'

  try {
    const stored = window.localStorage.getItem(STORAGE_KEY)
    return stored === 'en' || stored === 'vi' ? stored : 'vi'
  } catch {
    return 'vi'
  }
}

export function LocaleProvider({ children }: { children: ReactNode }) {
  const [locale, setLocale] = useState<Locale>(getInitialLocale)

  useEffect(() => {
    document.documentElement.lang = locale
    document.title = locale === 'vi'
      ? 'TechFlow — Học kỹ thuật bằng trực quan'
      : 'TechFlow — Visual technical learning'

    try {
      window.localStorage.setItem(STORAGE_KEY, locale)
    } catch {
      // The application still works when storage is unavailable or blocked.
    }
  }, [locale])

  const value = useMemo<LocaleContextValue>(() => ({
    locale,
    setLocale,
    copy: copyByLocale[locale],
  }), [locale])

  return <LocaleContext.Provider value={value}>{children}</LocaleContext.Provider>
}

export function useLocale() {
  const value = useContext(LocaleContext)
  if (!value) throw new Error('useLocale must be used inside LocaleProvider')
  return value
}
