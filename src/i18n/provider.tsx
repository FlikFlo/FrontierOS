'use client'

import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from 'react'
import { dictionaries } from './dictionaries'
import { defaultLocale, LOCALE_COOKIE, type Locale } from './config'

type Vars = Record<string, string | number>

interface I18nContextValue {
  locale: Locale
  setLocale: (locale: Locale) => void
  /** Translate a dotted key, interpolating `{var}` placeholders. */
  t: (key: string, vars?: Vars) => string
}

const I18nContext = createContext<I18nContextValue | null>(null)

function lookup(dict: unknown, key: string): unknown {
  return key.split('.').reduce<unknown>(
    (node, part) => (node && typeof node === 'object' ? (node as Record<string, unknown>)[part] : undefined),
    dict,
  )
}

function interpolate(template: string, vars?: Vars): string {
  if (!vars) return template
  return template.replace(/\{(\w+)\}/g, (_, name) => (name in vars ? String(vars[name]) : `{${name}}`))
}

/**
 * I18nProvider — holds the active locale in client state (seeded server-side
 * from the `locale` cookie, so first paint matches and there is no flash).
 * Switching is instant (no reload): it updates state, persists the cookie for
 * the next request, and syncs `<html lang>`.
 */
export function I18nProvider({
  initialLocale = defaultLocale,
  children,
}: {
  initialLocale?: Locale
  children: ReactNode
}) {
  const [locale, setLocaleState] = useState<Locale>(initialLocale)

  const setLocale = useCallback((next: Locale) => {
    setLocaleState(next)
    document.cookie = `${LOCALE_COOKIE}=${next}; path=/; max-age=31536000; samesite=lax`
    document.documentElement.lang = next
  }, [])

  const t = useCallback(
    (key: string, vars?: Vars) => {
      const value = lookup(dictionaries[locale], key)
      return typeof value === 'string' ? interpolate(value, vars) : key
    },
    [locale],
  )

  const value = useMemo(() => ({ locale, setLocale, t }), [locale, setLocale, t])

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>
}

export function useI18n(): I18nContextValue {
  const ctx = useContext(I18nContext)
  if (!ctx) throw new Error('useI18n must be used within <I18nProvider>')
  return ctx
}
