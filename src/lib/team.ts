import { createClient } from '@/lib/supabase/server'

export type TeamMemberLite = { id: string; name: string; role: string }

type RosterFn = (fn: string) => Promise<{ data: unknown }>

/**
 * Roster of assignable members (id + display name), excluding no-access 'pending'
 * users. Backed by the security-definer `team_members()` so any authenticated
 * user can resolve owner names without broad profiles read access.
 */
export async function getTeamMembers(): Promise<TeamMemberLite[]> {
  const supabase = await createClient()
  if (!supabase) return []
  const rpc = supabase.rpc.bind(supabase) as unknown as RosterFn
  const { data } = await rpc('team_members')
  const rows = (data ?? []) as Array<{ id: string; full_name: string | null; email: string | null; role: string }>
  return rows.map((r) => ({
    id: r.id,
    name: r.full_name?.trim() || r.email || '—',
    role: r.role,
  }))
}
