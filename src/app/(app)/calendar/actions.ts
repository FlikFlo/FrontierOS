'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'

export type ReminderInput = {
  title: string
  due_date: string
  client_id: string | null
  done: boolean
}

type ActionResult = { error: string | null }

export async function addReminder(input: ReminderInput): Promise<ActionResult> {
  const supabase = await createClient()
  if (!supabase) return { error: 'Supabase is not configured' }
  const { error } = await supabase.from('reminders').insert(input)
  if (error) return { error: error.message }
  revalidatePath('/calendar')
  return { error: null }
}

export async function editReminder(id: string, input: ReminderInput): Promise<ActionResult> {
  const supabase = await createClient()
  if (!supabase) return { error: 'Supabase is not configured' }
  const { error } = await supabase.from('reminders').update(input).eq('id', id)
  if (error) return { error: error.message }
  revalidatePath('/calendar')
  return { error: null }
}

export async function toggleReminder(id: string, done: boolean): Promise<ActionResult> {
  const supabase = await createClient()
  if (!supabase) return { error: 'Supabase is not configured' }
  const { error } = await supabase.from('reminders').update({ done }).eq('id', id)
  if (error) return { error: error.message }
  revalidatePath('/calendar')
  return { error: null }
}

export async function removeReminder(id: string): Promise<ActionResult> {
  const supabase = await createClient()
  if (!supabase) return { error: 'Supabase is not configured' }
  const { error } = await supabase.from('reminders').delete().eq('id', id)
  if (error) return { error: error.message }
  revalidatePath('/calendar')
  return { error: null }
}
