import { createClient } from '@/lib/supabase/server'
import { SettingsView, type TeamMember } from '@/components/settings/settings-view'
import { DEFAULT_ROLE, isRole, type Role } from '@/rbac/config'
import { isAuthBypassed } from '@/lib/dev-auth'

export default async function SettingsPage() {
  const supabase = await createClient()

  let email: string | null = 'dev@local'
  let role: Role = 'owner'
  let fullName: string | null = null
  let userId: string | null = null

  if (!isAuthBypassed() && supabase) {
    const {
      data: { user },
    } = await supabase.auth.getUser()
    email = user?.email ?? null
    userId = user?.id ?? null
    if (user) {
      const { data: profile } = await supabase
        .from('profiles')
        .select('full_name, role')
        .eq('id', user.id)
        .single()
      fullName = profile?.full_name ?? null
      role = isRole(profile?.role) ? profile.role : DEFAULT_ROLE
    }
  }

  let members: TeamMember[] = []
  if (role === 'owner' && supabase) {
    const { data } = await supabase.from('profiles').select('id, email, full_name, role').order('email')
    members = (data ?? []).map((p) => ({
      id: p.id,
      email: p.email,
      full_name: p.full_name,
      role: isRole(p.role) ? p.role : DEFAULT_ROLE,
    }))
  }

  return (
    <SettingsView
      email={email}
      role={role}
      fullName={fullName}
      userId={userId}
      members={members}
    />
  )
}
