'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { ROLES, type Role } from '@/rbac/config'
import type { Invitation } from '@/types/database'

export type InviteRow = Pick<Invitation, 'id' | 'role' | 'revoked' | 'created_at' | 'expires_at'>

/** Owner-only — create a reusable invite link for a role. Returns its token (id). */
export async function createInvite(role: Role): Promise<{ id: string | null; error: string | null }> {
  if (!ROLES.includes(role)) return { id: null, error: 'invalid role' }
  const supabase = await createClient()
  if (!supabase) return { id: null, error: 'unconfigured' }

  const {
    data: { user },
  } = await supabase.auth.getUser()

  const { data, error } = await supabase
    .from('invitations')
    .insert({ role: role as 'owner' | 'sales_manager' | 'brewer', created_by: user?.id ?? null })
    .select('id')
    .single()
  if (error) return { id: null, error: error.message }

  revalidatePath('/settings')
  return { id: data.id, error: null }
}

export async function listInvites(): Promise<InviteRow[]> {
  const supabase = await createClient()
  if (!supabase) return []
  const { data } = await supabase
    .from('invitations')
    .select('id, role, revoked, created_at, expires_at')
    .order('created_at', { ascending: false })
  return data ?? []
}

export async function revokeInvite(id: string): Promise<{ error: string | null }> {
  const supabase = await createClient()
  if (!supabase) return { error: 'unconfigured' }
  const { error } = await supabase.from('invitations').update({ revoked: true }).eq('id', id)
  if (error) return { error: error.message }
  revalidatePath('/settings')
  return { error: null }
}
