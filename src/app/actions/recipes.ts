'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import type {
  BeverageCategory,
  Database,
  RecipeMalt, RecipeHop, RecipeYeast, RecipeAdjunct,
} from '@/types/database'

type RecipeInsert = Database['public']['Tables']['recipes']['Insert']
type RecipeUpdate = Database['public']['Tables']['recipes']['Update']

export interface RecipePayload {
  id?: string
  name: string
  category: BeverageCategory
  style: string
  description: string | null
  batch_size_l: number
  efficiency: number
  boil_time_min: number
  notes: string | null
  og_target: number | null
  fg_target: number | null
  abv_target: number | null
  ibu_target: number | null
  srm_target: number | null
  brix_target: number | null
  ph_target: number | null
  malts: RecipeMalt[]
  hops: RecipeHop[]
  yeasts: RecipeYeast[]
  adjuncts: RecipeAdjunct[]
}

export async function saveRecipe(payload: RecipePayload) {
  const supabase = await createClient()
  if (!supabase) {
    return { ok: false as const, error: 'Supabase не настроен. Заполните NEXT_PUBLIC_SUPABASE_URL и NEXT_PUBLIC_SUPABASE_ANON_KEY.' }
  }

  const { id, ...row } = payload
  const result = id
    ? await supabase.from('recipes').update(row as RecipeUpdate).eq('id', id).select('id').single()
    : await supabase.from('recipes').insert(row as RecipeInsert).select('id').single()

  if (result.error) {
    return { ok: false as const, error: result.error.message }
  }

  revalidatePath('/recipes')
  revalidatePath(`/recipes/${result.data!.id}`)
  return { ok: true as const, id: result.data!.id }
}

export async function deleteRecipe(id: string) {
  const supabase = await createClient()
  if (!supabase) return { ok: false as const, error: 'Supabase не настроен' }

  const { error } = await supabase.from('recipes').delete().eq('id', id)
  if (error) return { ok: false as const, error: error.message }

  revalidatePath('/recipes')
  redirect('/recipes')
}
