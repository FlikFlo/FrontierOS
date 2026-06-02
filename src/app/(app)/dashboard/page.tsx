import { createClient } from '@/lib/supabase/server'
import { DashboardView, type DashboardMetrics } from '@/components/dashboard/dashboard-view'
import type { DealStage } from '@/types/database'

const STAGES: DealStage[] = ['lead', 'qualified', 'proposal', 'negotiation', 'won', 'lost']
const OPEN_STAGES: DealStage[] = ['lead', 'qualified', 'proposal', 'negotiation']
const pad = (n: number) => String(n).padStart(2, '0')

export default async function DashboardPage() {
  const supabase = await createClient()
  if (!supabase) return <DashboardView status="unconfigured" />

  const [clientsRes, dealsRes, ordersRes, itemsRes, productsRes] = await Promise.all([
    supabase.from('clients').select('id, name, status'),
    supabase.from('deals').select('stage, amount, client_id, probability, est_cases_per_month, outlets'),
    supabase.from('orders').select('id, order_date'),
    supabase.from('order_items').select('order_id, quantity, unit_price'),
    supabase.from('products').select('id'),
  ])

  const clients = clientsRes.data ?? []
  const deals = dealsRes.data ?? []
  const orders = ordersRes.data ?? []
  const items = itemsRes.data ?? []

  const sumAmount = (rows: { amount: number }[]) => rows.reduce((s, d) => s + Number(d.amount), 0)
  const openDeals = deals.filter((d) => OPEN_STAGES.includes(d.stage))
  const wonDeals = deals.filter((d) => d.stage === 'won')
  const lostDeals = deals.filter((d) => d.stage === 'lost')
  const closed = wonDeals.length + lostDeals.length

  // Revenue per month (last 6) from order line items.
  const dateById = new Map(orders.map((o) => [o.id, o.order_date]))
  const revByMonth = new Map<string, number>()
  for (const it of items) {
    const date = dateById.get(it.order_id)
    if (!date) continue
    const key = date.slice(0, 7) // YYYY-MM
    revByMonth.set(key, (revByMonth.get(key) ?? 0) + Number(it.quantity) * Number(it.unit_price))
  }
  const now = new Date()
  const revenueByMonth = Array.from({ length: 6 }, (_, i) => {
    const d = new Date(now.getFullYear(), now.getMonth() - (5 - i), 1)
    const key = `${d.getFullYear()}-${pad(d.getMonth() + 1)}`
    return { month: key, value: revByMonth.get(key) ?? 0 }
  })

  // Top clients by open pipeline value.
  const nameById = new Map(clients.map((c) => [c.id, c.name]))
  const byClient = new Map<string, number>()
  for (const d of openDeals) {
    if (!d.client_id) continue
    byClient.set(d.client_id, (byClient.get(d.client_id) ?? 0) + Number(d.amount))
  }
  const topClients = [...byClient.entries()]
    .map(([id, value]) => ({ name: nameById.get(id) ?? '—', value }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 5)

  const metrics: DashboardMetrics = {
    clientsTotal: clients.length,
    clientsActive: clients.filter((c) => c.status === 'active').length,
    productsCount: (productsRes.data ?? []).length,
    ordersCount: orders.length,
    revenue: items.reduce((s, it) => s + Number(it.quantity) * Number(it.unit_price), 0),
    openValue: sumAmount(openDeals),
    openCount: openDeals.length,
    wonValue: sumAmount(wonDeals),
    wonCount: wonDeals.length,
    winRate: closed ? Math.round((wonDeals.length / closed) * 100) : 0,
    pipeline: STAGES.map((stage) => {
      const inStage = deals.filter((d) => d.stage === stage)
      return { stage, count: inStage.length, value: sumAmount(inStage) }
    }),
    revenueByMonth,
    topClients,
    volume: {
      casesMonth: openDeals.reduce((s, d) => s + Number(d.est_cases_per_month ?? 0), 0),
      weightedCasesMonth: Math.round(
        openDeals.reduce((s, d) => s + (Number(d.est_cases_per_month ?? 0) * Number(d.probability ?? 0)) / 100, 0),
      ),
      outlets: openDeals.reduce((s, d) => s + Number(d.outlets ?? 0), 0),
    },
  }

  return <DashboardView status="ok" metrics={metrics} />
}
