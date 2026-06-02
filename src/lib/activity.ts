import { createClient } from '@/lib/supabase/server'
import { isAuthBypassed } from '@/lib/dev-auth'
import type { ActivityAction } from '@/types/database'

/**
 * Record one entry in the activity feed. Best-effort: logging never throws or
 * blocks the primary mutation. Call from server actions after a successful write.
 */
export async function logActivity(
  entity: string,
  action: ActivityAction,
  label: string,
  entityId?: string | null,
): Promise<void> {
  try {
    const supabase = await createClient()
    if (!supabase) return

    let actor: string | null = 'dev@local'
    if (!isAuthBypassed()) {
      const { data } = await supabase.auth.getUser()
      actor = data.user?.email ?? null
    }

    await supabase.from('activity_log').insert({
      entity,
      action,
      label,
      entity_id: entityId ?? null,
      actor,
    })
  } catch {
    // Swallow — the feed is non-critical and must never break a real mutation.
  }
}
