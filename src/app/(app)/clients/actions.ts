'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import type { ClientStatus } from '@/types/database'

export type ClientInput = {
  name: string
  industry: string | null
  email: string | null
  phone: string | null
  status: ClientStatus
}

type ActionResult = { error: string | null }

export async function addClient(input: ClientInput): Promise<ActionResult> {
  const supabase = await createClient()
  if (!supabase) return { error: 'Supabase is not configured' }

  const { error } = await supabase.from('clients').insert(input)
  if (error) return { error: error.message }

  revalidatePath('/clients')
  return { error: null }
}

export async function editClient(id: string, input: ClientInput): Promise<ActionResult> {
  const supabase = await createClient()
  if (!supabase) return { error: 'Supabase is not configured' }

  const { error } = await supabase.from('clients').update(input).eq('id', id)
  if (error) return { error: error.message }

  revalidatePath('/clients')
  return { error: null }
}

export async function removeClient(id: string): Promise<ActionResult> {
  const supabase = await createClient()
  if (!supabase) return { error: 'Supabase is not configured' }

  const { error } = await supabase.from('clients').delete().eq('id', id)
  if (error) return { error: error.message }

  revalidatePath('/clients')
  return { error: null }
}
