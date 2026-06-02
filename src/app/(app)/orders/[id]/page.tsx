import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { OrderDetailView } from '@/components/orders/order-detail-view'
import type { OrderRow, OrderLine } from '@/components/orders/orders-view'
import { fetchThread } from '@/lib/thread'

export default async function OrderDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()
  if (!supabase) notFound()

  const [orderRes, clientsRes, productsRes, itemsRes] = await Promise.all([
    supabase.from('orders').select('*').eq('id', id).single(),
    supabase.from('clients').select('id, name').order('name'),
    supabase.from('products').select('id, name, price').order('name'),
    supabase.from('order_items').select('product_id, description, quantity, unit_price').eq('order_id', id),
  ])
  if (orderRes.error || !orderRes.data) notFound()

  const o = orderRes.data
  const clients = (clientsRes.data ?? []).map((c) => ({ id: c.id, name: c.name }))
  const products = (productsRes.data ?? []).map((p) => ({ id: p.id, name: p.name, price: Number(p.price) }))
  const nameById = new Map(clients.map((c) => [c.id, c.name]))

  const lines: OrderLine[] = (itemsRes.data ?? []).map((it) => ({
    product_id: it.product_id,
    description: it.description,
    quantity: Number(it.quantity),
    unit_price: Number(it.unit_price),
  }))

  const order: OrderRow = {
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

  const { comments, attachments } = await fetchThread(supabase, 'order', id)

  return (
    <OrderDetailView
      order={order}
      clients={clients}
      products={products}
      comments={comments}
      attachments={attachments}
    />
  )
}
