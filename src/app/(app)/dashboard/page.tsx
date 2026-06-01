import { createClient } from '@/lib/supabase/server'
import { DashboardView, type DashboardMetrics } from '@/components/dashboard/dashboard-view'
import type { DealStage } from '@/types/database'

const STAGES: DealStage[] = ['lead', 'qualified', 'proposal', 'negotiation', 'won', 'lost']
const OPEN_STAGES: DealStage[] = ['lead', 'qualified', 'proposal', 'negotiation']

export default async function DashboardPage() {
  const supabase = await createClient()
  if (!supabase) return <DashboardView status="unconfigured" />

  const [clientsRes, dealsRes, ordersRes, itemsRes, productsRes] = await Promise.all([
    supabase.from('clients').select('status'),
    supabase.from('deals').select('stage, amount'),
    supabase.from('orders').select('id'),
    supabase.from('order_items').select('quantity, unit_price'),
    supabase.from('products').select('id'),
  ])

  const clients = clientsRes.data ?? []
  const deals = dealsRes.data ?? []
  const items = itemsRes.data ?? []

  const sumAmount = (rows: { amount: number }[]) => rows.reduce((s, d) => s + Number(d.amount), 0)
  const openDeals = deals.filter((d) => OPEN_STAGES.includes(d.stage))
  const wonDeals = deals.filter((d) => d.stage === 'won')

  const metrics: DashboardMetrics = {
    clientsTotal: clients.length,
    clientsActive: clients.filter((c) => c.status === 'active').length,
    productsCount: (productsRes.data ?? []).length,
    ordersCount: (ordersRes.data ?? []).length,
    revenue: items.reduce((s, it) => s + Number(it.quantity) * Number(it.unit_price), 0),
    openValue: sumAmount(openDeals),
    openCount: openDeals.length,
    wonValue: sumAmount(wonDeals),
    wonCount: wonDeals.length,
    pipeline: STAGES.map((stage) => {
      const inStage = deals.filter((d) => d.stage === stage)
      return { stage, count: inStage.length, value: sumAmount(inStage) }
    }),
  }

  return <DashboardView status="ok" metrics={metrics} />
}
