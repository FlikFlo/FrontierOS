import { cookies } from 'next/headers'
import { THEME_COOKIE, type Theme } from './theme'

/** Read the active theme from the request cookie in a Server Component. */
export async function getTheme(): Promise<Theme> {
  const store = await cookies()
  return store.get(THEME_COOKIE)?.value === 'light' ? 'light' : 'dark'
}
