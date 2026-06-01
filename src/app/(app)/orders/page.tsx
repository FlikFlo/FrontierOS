import { createClient } from '@/lib/supabase/server'
import { OrdersView, type OrderRow, type OrderLine } from '@/components/orders/orders-view'

export default async function OrdersPage() {
  const supabase = await createClient()
  if (!supabase) return <OrdersView status="unconfigured" />

  const [ordersRes, clientsRes, productsRes, itemsRes] = await Promise.all([
    supabase.from('orders').select('*').order('order_date', { ascending: false }),
    supabase.from('clients').select('id, name'),
    supabase.from('products').select('id, name, price').order('name'),
    supabase.from('order_items').select('order_id, product_id, description, quantity, unit_price'),
  ])

  if (ordersRes.error) return <OrdersView status="error" />

  const clients = (clientsRes.data ?? []).map((c) => ({ id: c.id, name: c.name }))
  const products = (productsRes.data ?? []).map((p) => ({ id: p.id, name: p.name, price: Number(p.price) }))
  const nameById = new Map(clients.map((c) => [c.id, c.name]))

  // Group line items per order.
  const linesByOrder = new Map<string, OrderLine[]>()
  for (const it of itemsRes.data ?? []) {
    const list = linesByOrder.get(it.order_id) ?? []
    list.push({
      product_id: it.product_id,
      description: it.description,
      quantity: Number(it.quantity),
      unit_price: Number(it.unit_price),
    })
    linesByOrder.set(it.order_id, list)
  }

  const rows: OrderRow[] = (ordersRes.data ?? []).map((o) => {
    const lines = linesByOrder.get(o.id) ?? []
    return {
      id: o.id,
      order_number: o.order_number,
      client_id: o.client_id,
      clientName: o.client_id ? nameById.get(o.client_id) ?? null : null,
      status: o.status,
      order_date: o.order_date,
      currency: o.currency,
      notes: o.notes,
      total: lines.reduce((s, l) => s + l.quantity * l.unit_price, 0),
      itemCount: lines.length,
      lines,
    }
  })

  return <OrdersView status="ok" rows={rows} clients={clients} products={products} />
}
