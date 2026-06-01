/* ============================================================================
   Role-based access control — model.
   Roles map to the set of modules they may access. Nav items + routes are
   tagged with a module; the sidebar filters by it and a guard enforces it.
   When auth lands, the active role comes from the user's profile (and RLS
   mirrors this server-side) — this file stays the single source of truth.
   ========================================================================== */

export type Role = 'owner' | 'sales_manager' | 'brewer'

export const ROLES: Role[] = ['owner', 'sales_manager', 'brewer']
export const DEFAULT_ROLE: Role = 'owner'

/** Functional areas of the app. Nav sections + routes belong to one. */
export type ModuleKey = 'overview' | 'crm' | 'production' | 'admin'

/** Which modules each role may access. Owner sees everything. */
export const ROLE_MODULES: Record<Role, ModuleKey[]> = {
  owner: ['overview', 'crm', 'production', 'admin'],
  sales_manager: ['overview', 'crm'],
  brewer: ['overview', 'production'],
}

export function canAccess(role: Role, mod: ModuleKey): boolean {
  return ROLE_MODULES[role].includes(mod)
}

/** Map a pathname to the module that guards it (null = unguarded). */
export function moduleForPath(pathname: string): ModuleKey | null {
  if (pathname.startsWith('/dashboard')) return 'overview'
  if (
    pathname.startsWith('/clients') ||
    pathname.startsWith('/deals') ||
    pathname.startsWith('/orders') ||
    pathname.startsWith('/products')
  ) {
    return 'crm'
  }
  if (pathname.startsWith('/settings')) return 'admin'
  return null
}

export function isRole(value: string | undefined | null): value is Role {
  return value === 'owner' || value === 'sales_manager' || value === 'brewer'
}
