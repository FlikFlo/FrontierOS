'use client'

import { createContext, useContext, type ReactNode } from 'react'
import { DEFAULT_ROLE, type Role } from './config'

interface RoleContextValue {
  role: Role
}

const RoleContext = createContext<RoleContextValue>({ role: DEFAULT_ROLE })

/**
 * RoleProvider — exposes the signed-in user's role to client components. The
 * role is resolved server-side from the user's profile (see the app layout) and
 * passed in; it is read-only on the client (RLS + the proxy enforce the real
 * boundaries).
 */
export function RoleProvider({ role, children }: { role: Role; children: ReactNode }) {
  return <RoleContext.Provider value={{ role }}>{children}</RoleContext.Provider>
}

export function useRole(): RoleContextValue {
  return useContext(RoleContext)
}
