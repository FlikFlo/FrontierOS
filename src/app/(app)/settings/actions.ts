'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { ROLES, type Role } from '@/rbac/config'

type Result = { error?: string }

// The functions from migration 0008 aren't in the generated Database types, so
// type the rpc call loosely here.
type RpcFn = (fn: string, args: Record<string, unknown>) => Promise<{ error: { message: string } | null }>

export async function updateMyProfile(fullName: string): Promise<Result> {
  const supabase = await createClient()
  if (!supabase) return { error: 'unconfigured' }
  const rpc = supabase.rpc.bind(supabase) as unknown as RpcFn
  const { error } = await rpc('update_my_profile', { p_full_name: fullName })
  if (error) return { error: error.message }
  revalidatePath('/settings')
  return {}
}

export async function updateMember(id: string, fullName: string, role: Role): Promise<Result> {
  if (!ROLES.includes(role)) return { error: 'invalid role' }
  const supabase = await createClient()
  if (!supabase) return { error: 'unconfigured' }
  const rpc = supabase.rpc.bind(supabase) as unknown as RpcFn
  const { error } = await rpc('admin_update_member', {
    p_id: id,
    p_full_name: fullName,
    p_role: role,
  })
  if (error) return { error: error.message }
  revalidatePath('/settings')
  return {}
}
