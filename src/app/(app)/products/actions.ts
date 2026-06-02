'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { logActivity } from '@/lib/activity'

export type ProductInput = {
  sku: string | null
  name: string
  description: string | null
  price: number
  unit: string
  active: boolean
}

type ActionResult = { error: string | null }

export async function addProduct(input: ProductInput): Promise<ActionResult> {
  const supabase = await createClient()
  if (!supabase) return { error: 'Supabase is not configured' }

  const { data, error } = await supabase
    .from('products')
    .insert({ ...input, currency: 'MAD' })
    .select('id')
    .single()
  if (error) return { error: error.message }

  await logActivity('product', 'created', input.name, data?.id)
  revalidatePath('/products')
  return { error: null }
}

export async function editProduct(id: string, input: ProductInput): Promise<ActionResult> {
  const supabase = await createClient()
  if (!supabase) return { error: 'Supabase is not configured' }

  const { error } = await supabase.from('products').update(input).eq('id', id)
  if (error) return { error: error.message }

  await logActivity('product', 'updated', input.name, id)
  revalidatePath('/products')
  return { error: null }
}

export async function removeProduct(id: string): Promise<ActionResult> {
  const supabase = await createClient()
  if (!supabase) return { error: 'Supabase is not configured' }

  const { data: row } = await supabase.from('products').select('name').eq('id', id).single()
  const { error } = await supabase.from('products').delete().eq('id', id)
  if (error) return { error: error.message }

  await logActivity('product', 'deleted', row?.name ?? 'Product', id)
  revalidatePath('/products')
  return { error: null }
}
