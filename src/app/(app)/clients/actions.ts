'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { logActivity } from '@/lib/activity'
import type { ClientStatus } from '@/types/database'

export type ClientInput = {
  name: string
  industry: string | null
  website: string | null
  email: string | null
  phone: string | null
  address: string | null
  status: ClientStatus
  notes: string | null
}

type ActionResult = { error: string | null }

export async function addClient(input: ClientInput): Promise<ActionResult> {
  const supabase = await createClient()
  if (!supabase) return { error: 'Supabase is not configured' }

  const { data, error } = await supabase.from('clients').insert(input).select('id').single()
  if (error) return { error: error.message }

  await logActivity('client', 'created', input.name, data?.id)
  revalidatePath('/clients')
  return { error: null }
}

export async function editClient(id: string, input: ClientInput): Promise<ActionResult> {
  const supabase = await createClient()
  if (!supabase) return { error: 'Supabase is not configured' }

  const { error } = await supabase.from('clients').update(input).eq('id', id)
  if (error) return { error: error.message }

  await logActivity('client', 'updated', input.name, id)
  revalidatePath('/clients')
  return { error: null }
}

export async function removeClient(id: string): Promise<ActionResult> {
  const supabase = await createClient()
  if (!supabase) return { error: 'Supabase is not configured' }

  const { data: row } = await supabase.from('clients').select('name').eq('id', id).single()
  const { error } = await supabase.from('clients').delete().eq('id', id)
  if (error) return { error: error.message }

  await logActivity('client', 'deleted', row?.name ?? 'Client', id)
  revalidatePath('/clients')
  return { error: null }
}

// ── Contacts (on the client detail page) ────────────────────────────────────

export type ContactInput = {
  client_id: string
  first_name: string
  last_name: string | null
  title: string | null
  email: string | null
  phone: string | null
  is_primary: boolean
}

export async function addContact(input: ContactInput): Promise<ActionResult> {
  const supabase = await createClient()
  if (!supabase) return { error: 'Supabase is not configured' }
  const { error } = await supabase.from('contacts').insert(input)
  if (error) return { error: error.message }
  revalidatePath(`/clients/${input.client_id}`)
  return { error: null }
}

export async function editContact(id: string, input: ContactInput): Promise<ActionResult> {
  const supabase = await createClient()
  if (!supabase) return { error: 'Supabase is not configured' }
  const { error } = await supabase.from('contacts').update(input).eq('id', id)
  if (error) return { error: error.message }
  revalidatePath(`/clients/${input.client_id}`)
  return { error: null }
}

export async function removeContact(id: string, clientId: string): Promise<ActionResult> {
  const supabase = await createClient()
  if (!supabase) return { error: 'Supabase is not configured' }
  const { error } = await supabase.from('contacts').delete().eq('id', id)
  if (error) return { error: error.message }
  revalidatePath(`/clients/${clientId}`)
  return { error: null }
}
