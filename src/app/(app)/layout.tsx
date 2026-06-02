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

  // Notification center: open follow-ups due within the next week or overdue,
  // earliest deadline first. The bell badge counts the overdue ones.
  const today = new Date().toISOString().slice(0, 10)
  const h = new Date(today)
  h.setDate(h.getDate() + 7)
  const horizon = h.toISOString().slice(0, 10)
  let overdueCount = 0
  let notifications: { id: string; title: string; dueDate: string; overdue: boolean; clientName: string | null }[] = []
  if (supabase) {
    const { data } = await supabase
      .from('reminders')
      .select('id, title, due_date, clients(name)')
      .eq('done', false)
      .lte('due_date', horizon)
      .order('due_date', { ascending: true })
      .limit(10)
    notifications = (data ?? []).map((r) => {
      const c = r.clients as unknown as { name: string } | { name: string }[] | null
      const clientName = Array.isArray(c) ? c[0]?.name ?? null : c?.name ?? null
      return { id: r.id, title: r.title, dueDate: r.due_date, overdue: r.due_date < today, clientName }
    })
    overdueCount = notifications.filter((n) => n.overdue).length
  }

  return (
    <RoleProvider role={role}>
      <CrmShell userEmail={email} overdueCount={overdueCount} notifications={notifications}>
        {children}
      </CrmShell>
    </RoleProvider>
  )
}
