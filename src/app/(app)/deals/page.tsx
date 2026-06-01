import { createClient } from '@/lib/supabase/server'
import { DealsView, type DealRow } from '@/components/deals/deals-view'

export default async function DealsPage() {
  const supabase = await createClient()
  if (!supabase) return <DealsView status="unconfigured" />

  const [dealsRes, clientsRes] = await Promise.all([
    supabase.from('deals').select('*').order('amount', { ascending: false }),
    supabase.from('clients').select('id, name'),
  ])

  if (dealsRes.error) return <DealsView status="error" />

  const nameById = new Map((clientsRes.data ?? []).map((c) => [c.id, c.name]))
  const rows: DealRow[] = (dealsRes.data ?? []).map((d) => ({
    ...d,
    clientName: d.client_id ? nameById.get(d.client_id) ?? null : null,
  }))

  return <DealsView status="ok" rows={rows} />
}
