'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { isAuthBypassed } from '@/lib/dev-auth'

const BUCKET = 'deal-attachments'
type ActionResult = { error: string | null }

async function authorLabel(supabase: NonNullable<Awaited<ReturnType<typeof createClient>>>): Promise<string> {
  if (isAuthBypassed()) return 'dev@local'
  const {
    data: { user },
  } = await supabase.auth.getUser()
  return user?.email ?? 'unknown'
}

export async function addComment(dealId: string, body: string): Promise<ActionResult> {
  const text = body.trim()
  if (!text) return { error: 'Empty comment' }
  const supabase = await createClient()
  if (!supabase) return { error: 'Supabase is not configured' }

  const author = await authorLabel(supabase)
  const { error } = await supabase.from('deal_comments').insert({ deal_id: dealId, body: text, author })
  if (error) return { error: error.message }

  revalidatePath(`/deals/${dealId}`)
  return { error: null }
}

export async function removeComment(id: string, dealId: string): Promise<ActionResult> {
  const supabase = await createClient()
  if (!supabase) return { error: 'Supabase is not configured' }
  const { error } = await supabase.from('deal_comments').delete().eq('id', id)
  if (error) return { error: error.message }
  revalidatePath(`/deals/${dealId}`)
  return { error: null }
}

export async function uploadAttachment(formData: FormData): Promise<ActionResult> {
  const dealId = String(formData.get('dealId') ?? '')
  const file = formData.get('file')
  if (!dealId || !(file instanceof File) || file.size === 0) return { error: 'No file' }

  const supabase = await createClient()
  if (!supabase) return { error: 'Supabase is not configured' }

  const safe = file.name.replace(/[^\w.\-]+/g, '_')
  const path = `${dealId}/${crypto.randomUUID()}-${safe}`

  const { error: upErr } = await supabase.storage
    .from(BUCKET)
    .upload(path, file, { contentType: file.type || undefined, upsert: false })
  if (upErr) return { error: upErr.message }

  const { error } = await supabase.from('deal_attachments').insert({
    deal_id: dealId,
    name: file.name,
    path,
    mime: file.type || null,
    size: file.size,
  })
  if (error) return { error: error.message }

  revalidatePath(`/deals/${dealId}`)
  return { error: null }
}

export async function removeAttachment(id: string, dealId: string, path: string): Promise<ActionResult> {
  const supabase = await createClient()
  if (!supabase) return { error: 'Supabase is not configured' }
  await supabase.storage.from(BUCKET).remove([path])
  const { error } = await supabase.from('deal_attachments').delete().eq('id', id)
  if (error) return { error: error.message }
  revalidatePath(`/deals/${dealId}`)
  return { error: null }
}
