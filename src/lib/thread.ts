import type { createClient } from '@/lib/supabase/server'
import type { AttachmentView } from '@/components/entity-thread'
import type { Comment, EntityKind } from '@/types/database'

type Supa = NonNullable<Awaited<ReturnType<typeof createClient>>>
const BUCKET = 'attachments'

/** Load an entity's comments + attachments (with inline-serving signed URLs). */
export async function fetchThread(
  supabase: Supa,
  entity: EntityKind,
  entityId: string,
): Promise<{ comments: Comment[]; attachments: AttachmentView[] }> {
  const [commentsRes, attachRes] = await Promise.all([
    supabase
      .from('comments')
      .select('*')
      .eq('entity', entity)
      .eq('entity_id', entityId)
      .order('created_at', { ascending: false }),
    supabase
      .from('attachments')
      .select('*')
      .eq('entity', entity)
      .eq('entity_id', entityId)
      .order('created_at', { ascending: false }),
  ])

  const attachments: AttachmentView[] = await Promise.all(
    (attachRes.data ?? []).map(async (a) => {
      const { data } = await supabase.storage.from(BUCKET).createSignedUrl(a.path, 3600)
      return { id: a.id, name: a.name, path: a.path, mime: a.mime, url: data?.signedUrl ?? null }
    }),
  )

  return { comments: commentsRes.data ?? [], attachments }
}
