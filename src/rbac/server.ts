import { cookies } from 'next/headers'
import { DEFAULT_ROLE, isRole, ROLE_COOKIE, type Role } from './config'

/**
 * Read the active role from the request cookie in a Server Component.
 * Placeholder source until auth: later this resolves from the signed-in user's
 * profile row instead of a client-set cookie.
 */
export async function getRole(): Promise<Role> {
  const store = await cookies()
  const value = store.get(ROLE_COOKIE)?.value
  return isRole(value) ? value : DEFAULT_ROLE
}
