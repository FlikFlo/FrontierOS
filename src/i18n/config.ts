/** Supported interface locales. English is the default. */
export const locales = ['en', 'fr'] as const
export type Locale = (typeof locales)[number]

export const defaultLocale: Locale = 'en'

/** Non-httpOnly cookie so the client switcher can write it directly. */
export const LOCALE_COOKIE = 'locale'

export function isLocale(value: string | undefined | null): value is Locale {
  return value === 'en' || value === 'fr'
}
