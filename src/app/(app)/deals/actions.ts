'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { logActivity } from '@/lib/activity'
import type { Deal, DealStage } from '@/types/database'

export type DealInput = {
  title: string
  client_id: string | null
  stage: DealStage
  amount: number
  probability: number
  est_cases_per_month: number
  outlets: number
  expected_close_date: string | null
}

type Result<T> = { error: string | null; data: T }

export async function addDeal(input: DealInput): Promise<Result<Deal | null>> {
  const supabase = await createClient()
  if (!supabase) return { error: 'Supabase is not configured', data: null }

  const { data, error } = await supabase
    .from('deals')
    .insert({ ...input, currency: 'MAD' })
    .select()
    .single()
  if (error) return { error: error.message, data: null }

  await logActivity('deal', 'created', input.title, data?.id)
  revalidatePath('/deals')
  revalidatePath('/dashboard')
  return { error: null, data }
}

export async function editDeal(id: string, input: DealInput): Promise<Result<Deal | null>> {
  const supabase = await createClient()
  if (!supabase) return { error: 'Supabase is not configured', data: null }

  const { data, error } = await supabase
    .from('deals')
    .update({ ...input, currency: 'MAD' })
    .eq('id', id)
    .select()
    .single()
  if (error) return { error: error.message, data: null }

  await logActivity('deal', 'updated', input.title, id)
  revalidatePath('/deals')
  revalidatePath('/dashboard')
  return { error: null, data }
}

export async function removeDeal(id: string): Promise<{ error: string | null }> {
  const supabase = await createClient()
  if (!supabase) return { error: 'Supabase is not configured' }

  const { data: row } = await supabase.from('deals').select('title').eq('id', id).single()
  const { error } = await supabase.from('deals').delete().eq('id', id)
  if (error) return { error: error.message }

  await logActivity('deal', 'deleted', row?.title ?? 'Deal', id)
  revalidatePath('/deals')
  revalidatePath('/dashboard')
  return { error: null }
}

/** Move a deal to a new pipeline stage (kanban drag-and-drop). */
export async function moveDeal(id: string, stage: DealStage): Promise<{ error: string | null }> {
  const supabase = await createClient()
  if (!supabase) return { error: 'Supabase is not configured' }

  const { data: row } = await supabase.from('deals').select('title').eq('id', id).single()
  const { error } = await supabase.from('deals').update({ stage }).eq('id', id)
  if (error) return { error: error.message }

  await logActivity('deal', 'updated', `${row?.title ?? 'Deal'} → ${stage}`, id)
  revalidatePath('/deals')
  revalidatePath('/dashboard')
  return { error: null }
}
