'use client'

import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from 'react'
import { DEFAULT_ROLE, ROLE_COOKIE, type Role } from './config'

interface RoleContextValue {
  role: Role
  /** Dev-only setter until auth provides the role. Persists via cookie. */
  setRole: (role: Role) => void
}

const RoleContext = createContext<RoleContextValue | null>(null)

/**
 * RoleProvider — holds the active role in client state, seeded server-side from
 * the `fos_role` cookie. Until Supabase Auth lands, the role is dev-selectable
 * (see RoleSwitcher); afterwards it will be derived from the signed-in user's
 * profile and this provider seeded from the server with that value.
 */
export function RoleProvider({
  initialRole = DEFAULT_ROLE,
  children,
}: {
  initialRole?: Role
  children: ReactNode
}) {
  const [role, setRoleState] = useState<Role>(initialRole)

  const setRole = useCallback((next: Role) => {
    setRoleState(next)
    document.cookie = `${ROLE_COOKIE}=${next}; path=/; max-age=31536000; samesite=lax`
  }, [])

  const value = useMemo(() => ({ role, setRole }), [role, setRole])

  return <RoleContext.Provider value={value}>{children}</RoleContext.Provider>
}

export function useRole(): RoleContextValue {
  const ctx = useContext(RoleContext)
  if (!ctx) throw new Error('useRole must be used within <RoleProvider>')
  return ctx
}
