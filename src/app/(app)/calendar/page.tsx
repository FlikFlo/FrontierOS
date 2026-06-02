import { createClient } from '@/lib/supabase/server'
import { CalendarView } from '@/components/calendar/calendar-view'
import { getTeamMembers } from '@/lib/team'

export default async function CalendarPage() {
  const supabase = await createClient()
  if (!supabase) return <CalendarView status="unconfigured" />

  const [remindersRes, clientsRes, members] = await Promise.all([
    supabase.from('reminders').select('*').order('due_date'),
    supabase.from('clients').select('id, name').order('name'),
    getTeamMembers(),
  ])

  if (remindersRes.error) return <CalendarView status="error" />

  const clients = (clientsRes.data ?? []).map((c) => ({ id: c.id, name: c.name }))
  return (
    <CalendarView
      status="ok"
      reminders={remindersRes.data ?? []}
      clients={clients}
      members={members.map((m) => ({ id: m.id, name: m.name }))}
    />
  )
}
