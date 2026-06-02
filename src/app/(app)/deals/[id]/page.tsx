import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { DealDetailView, type DealDetail, type AttachmentView } from '@/components/deals/deal-detail-view'

const BUCKET = 'deal-attachments'

export default async function DealDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()
  if (!supabase) notFound()

  const [dealRes, clientsRes, commentsRes, attachRes] = await Promise.all([
    supabase.from('deals').select('*').eq('id', id).single(),
    supabase.from('clients').select('id, name').order('name'),
    supabase.from('deal_comments').select('*').eq('deal_id', id).order('created_at', { ascending: false }),
    supabase.from('deal_attachments').select('*').eq('deal_id', id).order('created_at', { ascending: false }),
  ])

  if (dealRes.error || !dealRes.data) notFound()

  const clients = (clientsRes.data ?? []).map((c) => ({ id: c.id, name: c.name }))
  const nameById = new Map(clients.map((c) => [c.id, c.name]))
  const deal: DealDetail = {
    ...dealRes.data,
    clientName: dealRes.data.client_id ? nameById.get(dealRes.data.client_id) ?? null : null,
  }

  // Signed URLs serve the file inline (preview), not as a download.
  const attachments: AttachmentView[] = await Promise.all(
    (attachRes.data ?? []).map(async (a) => {
      const { data } = await supabase.storage.from(BUCKET).createSignedUrl(a.path, 3600)
      return { id: a.id, name: a.name, path: a.path, mime: a.mime, url: data?.signedUrl ?? null }
    }),
  )

  return (
    <DealDetailView deal={deal} clients={clients} comments={commentsRes.data ?? []} attachments={attachments} />
  )
}
