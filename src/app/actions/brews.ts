'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import type { BeverageCategory, BrewStatus, Database } from '@/types/database'

type BrewInsert = Database['public']['Tables']['brew_logs']['Insert']
type BrewUpdate = Database['public']['Tables']['brew_logs']['Update']

export interface BrewPayload {
  id?: string
  recipe_id: string | null
  recipe_name: string
  category: BeverageCategory
  batch_number: string
  status: BrewStatus
  brew_date: string | null
  package_date: string | null
  batch_size_l: number
  notes: string | null
  og_actual: number | null
  fg_actual: number | null
  abv_actual: number | null
  efficiency_actual: number | null
  total_cost: number | null
  cost_per_liter: number | null
}

export async function saveBrew(payload: BrewPayload) {
  const supabase = await createClient()
  if (!supabase) return { ok: false as const, error: 'Supabase не настроен' }

  const { id, ...row } = payload
  const result = id
    ? await supabase.from('brew_logs').update(row as BrewUpdate).eq('id', id).select('id').single()
    : await supabase.from('brew_logs').insert(row as BrewInsert).select('id').single()

  if (result.error) return { ok: false as const, error: result.error.message }

  revalidatePath('/brews')
  revalidatePath('/')
  return { ok: true as const, id: result.data!.id }
}

export async function updateBrewStatus(id: string, status: BrewStatus) {
  const supabase = await createClient()
  if (!supabase) return { ok: false as const, error: 'Supabase не настроен' }

  const { error } = await supabase.from('brew_logs').update({ status } as BrewUpdate).eq('id', id)
  if (error) return { ok: false as const, error: error.message }

  revalidatePath('/brews')
  revalidatePath(`/brews/${id}`)
  return { ok: true as const }
}

export async function deleteBrew(id: string) {
  const supabase = await createClient()
  if (!supabase) return { ok: false as const, error: 'Supabase не настроен' }

  const { error } = await supabase.from('brew_logs').delete().eq('id', id)
  if (error) return { ok: false as const, error: error.message }

  revalidatePath('/brews')
  redirect('/brews')
}
