import { createClient } from '@/lib/supabase/server'
import { OrdersView, type OrderRow } from '@/components/orders/orders-view'

export default async function OrdersPage() {
  const supabase = await createClient()
  if (!supabase) return <OrdersView status="unconfigured" />

  const [ordersRes, clientsRes, itemsRes] = await Promise.all([
    supabase.from('orders').select('*').order('order_date', { ascending: false }),
    supabase.from('clients').select('id, name'),
    supabase.from('order_items').select('order_id, quantity, unit_price'),
  ])

  if (ordersRes.error) return <OrdersView status="error" />

  const nameById = new Map((clientsRes.data ?? []).map((c) => [c.id, c.name]))

  // Aggregate line items into a per-order total + count.
  const totals = new Map<string, { total: number; count: number }>()
  for (const it of itemsRes.data ?? []) {
    const cur = totals.get(it.order_id) ?? { total: 0, count: 0 }
    cur.total += Number(it.quantity) * Number(it.unit_price)
    cur.count += 1
    totals.set(it.order_id, cur)
  }

  const rows: OrderRow[] = (ordersRes.data ?? []).map((o) => {
    const agg = totals.get(o.id) ?? { total: 0, count: 0 }
    return {
      id: o.id,
      order_number: o.order_number,
      clientName: o.client_id ? nameById.get(o.client_id) ?? null : null,
      status: o.status,
      order_date: o.order_date,
      currency: o.currency,
      total: agg.total,
      itemCount: agg.count,
    }
  })

  return <OrdersView status="ok" rows={rows} />
}
