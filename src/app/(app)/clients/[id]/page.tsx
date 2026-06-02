import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { ClientDetailView, type DealMini, type OrderMini } from '@/components/clients/client-detail-view'
import { fetchThread } from '@/lib/thread'
import { getTeamMembers } from '@/lib/team'

export default async function ClientDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()
  if (!supabase) notFound()

  const [clientRes, contactsRes, dealsRes, ordersRes] = await Promise.all([
    supabase.from('clients').select('*').eq('id', id).single(),
    supabase.from('contacts').select('*').eq('client_id', id).order('is_primary', { ascending: false }),
    supabase.from('deals').select('id, title, stage, amount, currency').eq('client_id', id).order('amount', { ascending: false }),
    supabase
      .from('orders')
      .select('id, order_number, status, order_date, currency')
      .eq('client_id', id)
      .order('order_date', { ascending: false }),
  ])

  if (clientRes.error || !clientRes.data) notFound()

  const orders = ordersRes.data ?? []
  const totals = new Map<string, number>()
  if (orders.length) {
    const { data: items } = await supabase
      .from('order_items')
      .select('order_id, quantity, unit_price')
      .in(
        'order_id',
        orders.map((o) => o.id),
      )
    for (const it of items ?? []) {
      totals.set(it.order_id, (totals.get(it.order_id) ?? 0) + Number(it.quantity) * Number(it.unit_price))
    }
  }

  const orderRows: OrderMini[] = orders.map((o) => ({
    id: o.id,
    order_number: o.order_number,
    status: o.status,
    order_date: o.order_date,
    currency: o.currency,
    total: totals.get(o.id) ?? 0,
  }))

  const { comments, attachments } = await fetchThread(supabase, 'client', id)
  const members = (await getTeamMembers()).map((m) => ({ id: m.id, name: m.name }))

  return (
    <ClientDetailView
      client={clientRes.data}
      contacts={contactsRes.data ?? []}
      deals={(dealsRes.data ?? []) as DealMini[]}
      orders={orderRows}
      comments={comments}
      attachments={attachments}
      members={members}
    />
  )
}
