import { cookies } from 'next/headers'
import { defaultLocale, isLocale, LOCALE_COOKIE, type Locale } from './config'

/**
 * Read the active locale from the request cookie in a Server Component.
 * Reading cookies opts the route into dynamic rendering — expected for the
 * app shell (it becomes dynamic anyway once auth/data land).
 */
export async function getLocale(): Promise<Locale> {
  const store = await cookies()
  const value = store.get(LOCALE_COOKIE)?.value
  return isLocale(value) ? value : defaultLocale
}
