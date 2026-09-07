import { useLocale } from '../i18n'

export function LocaleSwitcher({ compact = false }: { compact?: boolean }) {
  const { locale, setLocale, copy } = useLocale()

  return (
    <div className={`locale-switcher${compact ? ' compact' : ''}`} role="group" aria-label={copy.language.label}>
      <button
        type="button"
        className={locale === 'vi' ? 'active' : ''}
        aria-pressed={locale === 'vi'}
        aria-label={copy.language.vietnamese}
        onClick={() => setLocale('vi')}
      >
        VI
      </button>
      <button
        type="button"
        className={locale === 'en' ? 'active' : ''}
        aria-pressed={locale === 'en'}
        aria-label={copy.language.english}
        onClick={() => setLocale('en')}
      >
        EN
      </button>
    </div>
  )
}
