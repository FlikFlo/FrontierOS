import { createClient } from '@/lib/supabase/server'
import { ClientsView } from '@/components/clients/clients-view'
import { getTeamMembers } from '@/lib/team'

export default async function ClientsPage() {
  const supabase = await createClient()

  // No env yet → show the setup state instead of failing.
  if (!supabase) return <ClientsView status="unconfigured" />

  const [{ data, error }, members] = await Promise.all([
    supabase.from('clients').select('*').order('name'),
    getTeamMembers(),
  ])

  if (error) return <ClientsView status="error" />

  return (
    <ClientsView
      status="ok"
      rows={data ?? []}
      members={members.map((m) => ({ id: m.id, name: m.name }))}
    />
  )
}
