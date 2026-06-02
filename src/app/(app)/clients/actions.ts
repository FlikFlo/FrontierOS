'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { logActivity } from '@/lib/activity'
import type { ClientStatus, SalesChannel } from '@/types/database'

export type ClientInput = {
  name: string
  industry: string | null
  website: string | null
  email: string | null
  phone: string | null
  address: string | null
  status: ClientStatus
  channel: SalesChannel | null
  owner_id: string | null
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
  revalidatePath('/dashboard')
  return { error: null }
}

export async function editClient(id: string, input: ClientInput): Promise<ActionResult> {
  const supabase = await createClient()
  if (!supabase) return { error: 'Supabase is not configured' }

  const { error } = await supabase.from('clients').update(input).eq('id', id)
  if (error) return { error: error.message }

  await logActivity('client', 'updated', input.name, id)
  revalidatePath('/clients')
  revalidatePath('/dashboard')
  return { error: null }
}

export type ClientImportRow = {
  name: string
  email: string | null
  phone: string | null
  industry: string | null
  address: string | null
  website: string | null
  status: ClientStatus
  channel: SalesChannel | null
}

/** Bulk-insert clients from a parsed CSV. Returns how many were inserted. */
export async function importClients(rows: ClientImportRow[]): Promise<{ error: string | null; inserted: number }> {
  const supabase = await createClient()
  if (!supabase) return { error: 'Supabase is not configured', inserted: 0 }

  const clean = rows
    .filter((r) => r.name.trim())
    .slice(0, 1000)
    .map((r) => ({ ...r, name: r.name.trim() }))
  if (!clean.length) return { error: 'No valid rows', inserted: 0 }

  const { data, error } = await supabase.from('clients').insert(clean).select('id')
  if (error) return { error: error.message, inserted: 0 }

  await logActivity('client', 'created', `Imported ${data?.length ?? 0} clients`)
  revalidatePath('/clients')
  revalidatePath('/dashboard')
  return { error: null, inserted: data?.length ?? 0 }
}

export async function removeClient(id: string): Promise<ActionResult> {
  const supabase = await createClient()
  if (!supabase) return { error: 'Supabase is not configured' }

  const { data: row } = await supabase.from('clients').select('name').eq('id', id).single()
  const { error } = await supabase.from('clients').delete().eq('id', id)
  if (error) return { error: error.message }

  await logActivity('client', 'deleted', row?.name ?? 'Client', id)
  revalidatePath('/clients')
  revalidatePath('/dashboard')
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

const contactName = (i: { first_name: string; last_name: string | null }) =>
  [i.first_name, i.last_name].filter(Boolean).join(' ') || 'Contact'

export async function addContact(input: ContactInput): Promise<ActionResult> {
  const supabase = await createClient()
  if (!supabase) return { error: 'Supabase is not configured' }
  const { data, error } = await supabase.from('contacts').insert(input).select('id').single()
  if (error) return { error: error.message }
  await logActivity('contact', 'created', contactName(input), data?.id)
  revalidatePath(`/clients/${input.client_id}`)
  return { error: null }
}

export async function editContact(id: string, input: ContactInput): Promise<ActionResult> {
  const supabase = await createClient()
  if (!supabase) return { error: 'Supabase is not configured' }
  const { error } = await supabase.from('contacts').update(input).eq('id', id)
  if (error) return { error: error.message }
  await logActivity('contact', 'updated', contactName(input), id)
  revalidatePath(`/clients/${input.client_id}`)
  return { error: null }
}

export async function removeContact(id: string, clientId: string): Promise<ActionResult> {
  const supabase = await createClient()
  if (!supabase) return { error: 'Supabase is not configured' }
  const { data: row } = await supabase
    .from('contacts')
    .select('first_name, last_name')
    .eq('id', id)
    .single()
  const { error } = await supabase.from('contacts').delete().eq('id', id)
  if (error) return { error: error.message }
  await logActivity('contact', 'deleted', row ? contactName(row) : 'Contact', id)
  revalidatePath(`/clients/${clientId}`)
  return { error: null }
}
