import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { DealDetailView, type DealDetail, type DealContact } from '@/components/deals/deal-detail-view'
import { fetchThread } from '@/lib/thread'
import { getTeamMembers } from '@/lib/team'

export default async function DealDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()
  if (!supabase) notFound()

  const [dealRes, clientsRes, followupsRes, members] = await Promise.all([
    supabase.from('deals').select('*').eq('id', id).single(),
    supabase.from('clients').select('id, name').order('name'),
    supabase.from('reminders').select('id, title, due_date, done').eq('deal_id', id).order('due_date'),
    getTeamMembers(),
  ])
  if (dealRes.error || !dealRes.data) notFound()

  const today = new Date().toISOString().slice(0, 10)
  const followups = (followupsRes.data ?? []).map((r) => ({
    id: r.id,
    title: r.title,
    dueDate: r.due_date,
    done: r.done,
    overdue: !r.done && r.due_date < today,
  }))

  const clients = (clientsRes.data ?? []).map((c) => ({ id: c.id, name: c.name }))
  const nameById = new Map(clients.map((c) => [c.id, c.name]))
  const deal: DealDetail = {
    ...dealRes.data,
    clientName: dealRes.data.client_id ? nameById.get(dealRes.data.client_id) ?? null : null,
  }

  let contact: DealContact | null = null
  if (dealRes.data.contact_id) {
    const { data } = await supabase
      .from('contacts')
      .select('first_name, last_name, title, phone, email')
      .eq('id', dealRes.data.contact_id)
      .single()
    if (data) {
      contact = {
        name: [data.first_name, data.last_name].filter(Boolean).join(' ') || '—',
        title: data.title,
        phone: data.phone,
        email: data.email,
      }
    }
  }

  const { comments, attachments } = await fetchThread(supabase, 'deal', id)

  return (
    <DealDetailView
      deal={deal}
      clients={clients}
      members={members.map((m) => ({ id: m.id, name: m.name }))}
      contact={contact}
      comments={comments}
      attachments={attachments}
      followups={followups}
    />
  )
}
