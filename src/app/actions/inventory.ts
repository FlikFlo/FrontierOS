'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import type { Database, IngredientType } from '@/types/database'

type InvInsert = Database['public']['Tables']['inventory']['Insert']
type InvUpdate = Database['public']['Tables']['inventory']['Update']

export interface InventoryPayload {
  id?: string
  name: string
  type: IngredientType
  quantity: number
  unit: string
  min_stock: number | null
  cost_per_unit: number | null
  supplier: string | null
  notes: string | null
}

export async function saveInventoryItem(payload: InventoryPayload) {
  const supabase = await createClient()
  if (!supabase) return { ok: false as const, error: 'Supabase не настроен' }

  const { id, ...row } = payload
  const result = id
    ? await supabase.from('inventory').update(row as InvUpdate).eq('id', id).select('id').single()
    : await supabase.from('inventory').insert(row as InvInsert).select('id').single()

  if (result.error) return { ok: false as const, error: result.error.message }

  revalidatePath('/inventory')
  return { ok: true as const, id: result.data!.id }
}

export async function deleteInventoryItem(id: string) {
  const supabase = await createClient()
  if (!supabase) return { ok: false as const, error: 'Supabase не настроен' }

  const { error } = await supabase.from('inventory').delete().eq('id', id)
  if (error) return { ok: false as const, error: error.message }

  revalidatePath('/inventory')
  return { ok: true as const }
}
