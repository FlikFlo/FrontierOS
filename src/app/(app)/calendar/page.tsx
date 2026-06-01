import { createClient } from '@/lib/supabase/server'
import { CalendarView } from '@/components/calendar/calendar-view'

export default async function CalendarPage() {
  const supabase = await createClient()
  if (!supabase) return <CalendarView status="unconfigured" />

  const [remindersRes, clientsRes] = await Promise.all([
    supabase.from('reminders').select('*').order('due_date'),
    supabase.from('clients').select('id, name').order('name'),
  ])

  if (remindersRes.error) return <CalendarView status="error" />

  const clients = (clientsRes.data ?? []).map((c) => ({ id: c.id, name: c.name }))
  return <CalendarView status="ok" reminders={remindersRes.data ?? []} clients={clients} />
}
