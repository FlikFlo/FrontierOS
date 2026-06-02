import { createClient } from '@/lib/supabase/server'
import { ActivityView } from '@/components/activity/activity-view'

export default async function ActivityPage() {
  const supabase = await createClient()
  if (!supabase) return <ActivityView status="unconfigured" rows={[]} />

  const { data, error } = await supabase
    .from('activity_log')
    .select('id, actor, action, entity, entity_id, label, created_at')
    .order('created_at', { ascending: false })
    .limit(100)

  if (error) return <ActivityView status="error" rows={[]} />
  return <ActivityView status="ok" rows={data ?? []} />
}
