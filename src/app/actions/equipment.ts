'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import type { Database, EquipmentStatus, EquipmentType } from '@/types/database'

type EqInsert = Database['public']['Tables']['equipment']['Insert']
type EqUpdate = Database['public']['Tables']['equipment']['Update']

export interface EquipmentPayload {
  id?: string
  name: string
  type: EquipmentType
  capacity_l: number | null
  status: EquipmentStatus
  current_brew_id: string | null
  position_x: number | null
  position_y: number | null
  notes: string | null
}

export async function saveEquipment(payload: EquipmentPayload) {
  const supabase = await createClient()
  if (!supabase) return { ok: false as const, error: 'Supabase не настроен' }

  const { id, ...row } = payload
  const result = id
    ? await supabase.from('equipment').update(row as EqUpdate).eq('id', id).select('id').single()
    : await supabase.from('equipment').insert(row as EqInsert).select('id').single()

  if (result.error) return { ok: false as const, error: result.error.message }

  revalidatePath('/equipment')
  revalidatePath('/floor')
  return { ok: true as const, id: result.data!.id }
}

export async function updateEquipmentStatus(id: string, status: EquipmentStatus) {
  const supabase = await createClient()
  if (!supabase) return { ok: false as const, error: 'Supabase не настроен' }

  const { error } = await supabase.from('equipment').update({ status } as EqUpdate).eq('id', id)
  if (error) return { ok: false as const, error: error.message }

  revalidatePath('/equipment')
  revalidatePath('/floor')
  return { ok: true as const }
}

export async function updateEquipmentPosition(id: string, x: number | null, y: number | null) {
  const supabase = await createClient()
  if (!supabase) return { ok: false as const, error: 'Supabase не настроен' }

  const { error } = await supabase
    .from('equipment')
    .update({ position_x: x, position_y: y } as EqUpdate)
    .eq('id', id)

  if (error) return { ok: false as const, error: error.message }
  revalidatePath('/floor')
  return { ok: true as const }
}

export async function deleteEquipment(id: string) {
  const supabase = await createClient()
  if (!supabase) return { ok: false as const, error: 'Supabase не настроен' }

  const { error } = await supabase.from('equipment').delete().eq('id', id)
  if (error) return { ok: false as const, error: error.message }

  revalidatePath('/equipment')
  revalidatePath('/floor')
  return { ok: true as const }
}
