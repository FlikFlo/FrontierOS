import { createClient } from '@/lib/supabase/server'
import { SettingsView } from '@/components/settings/settings-view'
import { DEFAULT_ROLE, isRole, type Role } from '@/rbac/config'
import { isAuthBypassed } from '@/lib/dev-auth'

export default async function SettingsPage() {
  let email: string | null = 'dev@local'
  let role: Role = 'owner'

  if (!isAuthBypassed()) {
    const supabase = await createClient()
    if (supabase) {
      const {
        data: { user },
      } = await supabase.auth.getUser()
      email = user?.email ?? null
      if (user) {
        const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
        role = isRole(profile?.role) ? profile.role : DEFAULT_ROLE
      }
    }
  }

  return <SettingsView email={email} role={role} />
}
