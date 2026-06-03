import { createClient } from '@/lib/supabase/server'
import { DealsView, type DealRow } from '@/components/deals/deals-view'
import { getTeamMembers } from '@/lib/team'

export default async function DealsPage() {
  const supabase = await createClient()
  if (!supabase) return <DealsView status="unconfigured" />

  const [dealsRes, clientsRes, followupsRes, members] = await Promise.all([
    supabase.from('deals').select('*').order('amount', { ascending: false }),
    supabase.from('clients').select('id, name'),
    supabase.from('reminders').select('deal_id, due_date').eq('done', false).not('deal_id', 'is', null),
    getTeamMembers(),
  ])

  if (dealsRes.error) return <DealsView status="error" />

  const clients = (clientsRes.data ?? []).map((c) => ({ id: c.id, name: c.name }))
  const nameById = new Map(clients.map((c) => [c.id, c.name]))

  // Earliest open follow-up per deal → the card's "next step".
  const today = new Date().toISOString().slice(0, 10)
  const nextByDeal = new Map<string, string>()
  for (const r of followupsRes.data ?? []) {
    if (!r.deal_id) continue
    const cur = nextByDeal.get(r.deal_id)
    if (!cur || r.due_date < cur) nextByDeal.set(r.deal_id, r.due_date)
  }

  const rows: DealRow[] = (dealsRes.data ?? []).map((d) => {
    const due = nextByDeal.get(d.id)
    return {
      ...d,
      clientName: d.client_id ? nameById.get(d.client_id) ?? null : null,
      nextStep: due ? { dueDate: due, overdue: due < today } : null,
    }
  })

  return (
    <DealsView
      status="ok"
      rows={rows}
      clients={clients}
      members={members.map((m) => ({ id: m.id, name: m.name }))}
    />
  )
}
