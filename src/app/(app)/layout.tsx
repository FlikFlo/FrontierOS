import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { RoleProvider } from '@/rbac/provider'
import { CrmShell } from '@/components/layout/crm-shell'
import { DEFAULT_ROLE, isRole } from '@/rbac/config'
import { isAuthBypassed } from '@/lib/dev-auth'

/**
 * Authenticated app layout. The proxy already gates unauthenticated traffic;
 * here we resolve the signed-in user's role from their profile and seed the
 * RoleProvider + shell with it. Falls back to a no-auth render only when env is
 * absent (local boot without Supabase).
 */
export default async function AppLayout({ children }: { children: React.ReactNode }) {
  // Dev bypass: render as owner, no session required.
  if (isAuthBypassed()) {
    return (
      <RoleProvider role="owner">
        <CrmShell userEmail="dev@local">{children}</CrmShell>
      </RoleProvider>
    )
  }

  const supabase = await createClient()

  let role = DEFAULT_ROLE
  let email: string | null = null

  if (supabase) {
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) redirect('/login')

    email = user.email ?? null
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()
    if (profile && isRole(profile.role)) role = profile.role
  }

  return (
    <RoleProvider role={role}>
      <CrmShell userEmail={email}>{children}</CrmShell>
    </RoleProvider>
  )
}
