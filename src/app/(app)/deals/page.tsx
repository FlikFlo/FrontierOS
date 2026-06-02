import { createClient } from '@/lib/supabase/server'
import { DealsView, type DealRow } from '@/components/deals/deals-view'
import { getTeamMembers } from '@/lib/team'

export default async function DealsPage() {
  const supabase = await createClient()
  if (!supabase) return <DealsView status="unconfigured" />

  const [dealsRes, clientsRes, members] = await Promise.all([
    supabase.from('deals').select('*').order('amount', { ascending: false }),
    supabase.from('clients').select('id, name'),
    getTeamMembers(),
  ])

  if (dealsRes.error) return <DealsView status="error" />

  const clients = (clientsRes.data ?? []).map((c) => ({ id: c.id, name: c.name }))
  const nameById = new Map(clients.map((c) => [c.id, c.name]))
  const rows: DealRow[] = (dealsRes.data ?? []).map((d) => ({
    ...d,
    clientName: d.client_id ? nameById.get(d.client_id) ?? null : null,
  }))

  return (
    <DealsView
      status="ok"
      rows={rows}
      clients={clients}
      members={members.map((m) => ({ id: m.id, name: m.name }))}
    />
  )
}
