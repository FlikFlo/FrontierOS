'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { isAuthBypassed } from '@/lib/dev-auth'
import type { EntityKind } from '@/types/database'

const BUCKET = 'attachments'
type ActionResult = { error: string | null }
type Supa = NonNullable<Awaited<ReturnType<typeof createClient>>>

function entityPath(entity: EntityKind, id: string) {
  return entity === 'deal' ? `/deals/${id}` : entity === 'client' ? `/clients/${id}` : `/orders/${id}`
}

async function authorLabel(supabase: Supa): Promise<string> {
  if (isAuthBypassed()) return 'dev@local'
  const {
    data: { user },
  } = await supabase.auth.getUser()
  return user?.email ?? 'unknown'
}

export async function addComment(entity: EntityKind, entityId: string, body: string): Promise<ActionResult> {
  const text = body.trim()
  if (!text) return { error: 'Empty comment' }
  const supabase = await createClient()
  if (!supabase) return { error: 'Supabase is not configured' }
  const author = await authorLabel(supabase)
  const { error } = await supabase.from('comments').insert({ entity, entity_id: entityId, body: text, author })
  if (error) return { error: error.message }
  revalidatePath(entityPath(entity, entityId))
  return { error: null }
}

export async function removeComment(id: string, entity: EntityKind, entityId: string): Promise<ActionResult> {
  const supabase = await createClient()
  if (!supabase) return { error: 'Supabase is not configured' }
  const { error } = await supabase.from('comments').delete().eq('id', id)
  if (error) return { error: error.message }
  revalidatePath(entityPath(entity, entityId))
  return { error: null }
}

export async function uploadAttachment(formData: FormData): Promise<ActionResult> {
  const entity = String(formData.get('entity') ?? '') as EntityKind
  const entityId = String(formData.get('entityId') ?? '')
  const file = formData.get('file')
  if (!entity || !entityId || !(file instanceof File) || file.size === 0) return { error: 'No file' }

  const supabase = await createClient()
  if (!supabase) return { error: 'Supabase is not configured' }

  const safe = file.name.replace(/[^\w.\-]+/g, '_')
  const path = `${entity}/${entityId}/${crypto.randomUUID()}-${safe}`

  const { error: upErr } = await supabase.storage
    .from(BUCKET)
    .upload(path, file, { contentType: file.type || undefined, upsert: false })
  if (upErr) return { error: upErr.message }

  const { error } = await supabase.from('attachments').insert({
    entity,
    entity_id: entityId,
    name: file.name,
    path,
    mime: file.type || null,
    size: file.size,
  })
  if (error) return { error: error.message }

  revalidatePath(entityPath(entity, entityId))
  return { error: null }
}

/**
 * Save attachment metadata after the browser uploaded the bytes straight to
 * Storage. Keeps large files out of the server-action body (Next 1MB / Vercel
 * 4.5MB caps), so uploads no longer stall on big photos.
 */
export async function saveAttachmentMeta(input: {
  entity: EntityKind
  entityId: string
  name: string
  path: string
  mime: string | null
  size: number
}): Promise<ActionResult> {
  if (!input.entity || !input.entityId || !input.path) return { error: 'Invalid attachment' }
  const supabase = await createClient()
  if (!supabase) return { error: 'Supabase is not configured' }
  const { error } = await supabase.from('attachments').insert({
    entity: input.entity,
    entity_id: input.entityId,
    name: input.name,
    path: input.path,
    mime: input.mime,
    size: input.size,
  })
  if (error) return { error: error.message }
  revalidatePath(entityPath(input.entity, input.entityId))
  return { error: null }
}

export async function removeAttachment(
  id: string,
  entity: EntityKind,
  entityId: string,
  path: string,
): Promise<ActionResult> {
  const supabase = await createClient()
  if (!supabase) return { error: 'Supabase is not configured' }
  await supabase.storage.from(BUCKET).remove([path])
  const { error } = await supabase.from('attachments').delete().eq('id', id)
  if (error) return { error: error.message }
  revalidatePath(entityPath(entity, entityId))
  return { error: null }
}
