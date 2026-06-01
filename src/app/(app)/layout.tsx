import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { RoleProvider } from '@/rbac/provider'
import { CrmShell } from '@/components/layout/crm-shell'
import { DEFAULT_ROLE, isRole, type Role } from '@/rbac/config'
import { isAuthBypassed } from '@/lib/dev-auth'

/**
 * Authenticated app layout. The proxy already gates unauthenticated traffic;
 * here we resolve the signed-in user's role from their profile and seed the
 * RoleProvider + shell with it.
 */
export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const bypass = isAuthBypassed()

  let role: Role = DEFAULT_ROLE
  let email: string | null = null

  if (bypass) {
    role = 'owner'
    email = 'dev@local'
  } else if (supabase) {
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) redirect('/login')
    email = user.email ?? null
    const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
    if (profile && isRole(profile.role)) role = profile.role
  }

  // Overdue reminders → bell badge.
  let overdueCount = 0
  if (supabase) {
    const today = new Date().toISOString().slice(0, 10)
    const { count } = await supabase
      .from('reminders')
      .select('id', { count: 'exact', head: true })
      .eq('done', false)
      .lt('due_date', today)
    overdueCount = count ?? 0
  }

  return (
    <RoleProvider role={role}>
      <CrmShell userEmail={email} overdueCount={overdueCount}>
        {children}
      </CrmShell>
    </RoleProvider>
  )
}
