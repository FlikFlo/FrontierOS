import { createClient } from '@/lib/supabase/server'
import { DashboardView, type DashboardMetrics } from '@/components/dashboard/dashboard-view'
import { getTeamMembers } from '@/lib/team'
import type { DealStage } from '@/types/database'

const STAGES: DealStage[] = ['lead', 'qualified', 'proposal', 'negotiation', 'won', 'lost']
const OPEN_STAGES: DealStage[] = ['lead', 'qualified', 'proposal', 'negotiation']
const pad = (n: number) => String(n).padStart(2, '0')
const STALE_DAYS = 14
const dayKey = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`

export default async function DashboardPage() {
  const supabase = await createClient()
  if (!supabase) return <DashboardView status="unconfigured" />

  const [clientsRes, dealsRes, ordersRes, itemsRes, productsRes, remindersRes, members] = await Promise.all([
    supabase.from('clients').select('id, name, status, channel'),
    supabase.from('deals').select('id, title, stage, amount, client_id, owner_id, created_at, updated_at, probability, est_cases_per_month, outlets'),
    supabase.from('orders').select('id, order_date'),
    supabase.from('order_items').select('order_id, quantity, unit_price'),
    supabase.from('products').select('id'),
    supabase.from('reminders').select('id, title, due_date, client_id, assignee_id, done').eq('done', false),
    getTeamMembers(),
  ])

  const clients = clientsRes.data ?? []
  const deals = dealsRes.data ?? []
  const orders = ordersRes.data ?? []
  const items = itemsRes.data ?? []
  const reminders = remindersRes.data ?? []
  const memberName = new Map(members.map((m) => [m.id, m.name]))

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

  // Follow-ups: open reminders due within the next 7 days or overdue.
  const todayKey = dayKey(now)
  const horizon = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 7)
  const horizonKey = dayKey(horizon)
  const followups = reminders
    .filter((r) => r.due_date <= horizonKey)
    .sort((a, b) => a.due_date.localeCompare(b.due_date))
    .slice(0, 6)
    .map((r) => ({
      id: r.id,
      title: r.title,
      dueDate: r.due_date,
      overdue: r.due_date < todayKey,
      clientName: r.client_id ? nameById.get(r.client_id) ?? null : null,
      assigneeName: r.assignee_id ? memberName.get(r.assignee_id) ?? null : null,
    }))

  // Stale deals: open deals untouched for STALE_DAYS+.
  const staleCutoff = new Date(now.getFullYear(), now.getMonth(), now.getDate() - STALE_DAYS)
  const staleDeals = openDeals
    .filter((d) => new Date(d.updated_at) < staleCutoff)
    .sort((a, b) => a.updated_at.localeCompare(b.updated_at))
    .slice(0, 6)
    .map((d) => ({
      id: d.id,
      title: d.title,
      daysStale: Math.floor((now.getTime() - new Date(d.updated_at).getTime()) / 86_400_000),
      ownerName: d.owner_id ? memberName.get(d.owner_id) ?? null : null,
    }))

  // Manager leaderboard — pipeline + won by deal owner.
  const ownerAgg = new Map<string, { openValue: number; wonValue: number; openCount: number }>()
  for (const d of deals) {
    if (!d.owner_id) continue
    const a = ownerAgg.get(d.owner_id) ?? { openValue: 0, wonValue: 0, openCount: 0 }
    if (OPEN_STAGES.includes(d.stage)) {
      a.openValue += Number(d.amount)
      a.openCount += 1
    } else if (d.stage === 'won') {
      a.wonValue += Number(d.amount)
    }
    ownerAgg.set(d.owner_id, a)
  }
  const leaderboard = [...ownerAgg.entries()]
    .map(([id, a]) => ({ name: memberName.get(id) ?? '—', ...a }))
    .sort((x, y) => y.openValue + y.wonValue - (x.openValue + x.wonValue))
    .slice(0, 6)

  // Conversion funnel — snapshot of how far deals have progressed. A deal counts
  // toward every stage up to and including its current one (lost excluded).
  const FUNNEL: DealStage[] = ['lead', 'qualified', 'proposal', 'negotiation', 'won']
  const reachedAt = (idx: number) =>
    deals.filter((d) => d.stage !== 'lost' && FUNNEL.indexOf(d.stage) >= idx).length
  const funnel = FUNNEL.map((stage, i) => {
    const reached = reachedAt(i)
    const prev = i === 0 ? reached : reachedAt(i - 1)
    return { stage, reached, conv: prev > 0 ? Math.round((reached / prev) * 100) : 0 }
  })

  // Velocity — average days from creation to win.
  const wonDurations = wonDeals
    .map((d) => (new Date(d.updated_at).getTime() - new Date(d.created_at).getTime()) / 86_400_000)
    .filter((n) => n >= 0)
  const avgDaysToWin = wonDurations.length
    ? Math.round(wonDurations.reduce((s, n) => s + n, 0) / wonDurations.length)
    : null

  // Channel breakdown — clients + open pipeline value + cases per channel.
  const channelOf = new Map(clients.map((c) => [c.id, c.channel]))
  const chanAgg = new Map<string, { clients: number; openValue: number; cases: number }>()
  for (const c of clients) {
    if (!c.channel) continue
    const a = chanAgg.get(c.channel) ?? { clients: 0, openValue: 0, cases: 0 }
    a.clients += 1
    chanAgg.set(c.channel, a)
  }
  for (const d of openDeals) {
    if (!d.client_id) continue
    const ch = channelOf.get(d.client_id)
    if (!ch) continue
    const a = chanAgg.get(ch) ?? { clients: 0, openValue: 0, cases: 0 }
    a.openValue += Number(d.amount)
    a.cases += Number(d.est_cases_per_month ?? 0)
    chanAgg.set(ch, a)
  }
  const channelBreakdown = [...chanAgg.entries()]
    .map(([channel, a]) => ({ channel, ...a }))
    .sort((x, y) => y.openValue - x.openValue)

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
    followups,
    staleDeals,
    leaderboard,
    funnel,
    avgDaysToWin,
    channelBreakdown,
  }

  return <DashboardView status="ok" metrics={metrics} />
}
