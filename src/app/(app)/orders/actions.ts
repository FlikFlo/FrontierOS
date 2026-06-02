'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { logActivity } from '@/lib/activity'
import { nextOrderNumber } from '@/lib/order-number'
import type { OrderStatus } from '@/types/database'

export type OrderLineInput = {
  product_id: string | null
  description: string | null
  quantity: number
  unit_price: number
}

export type OrderInput = {
  order_number: string
  client_id: string | null
  status: OrderStatus
  order_date: string
  notes: string | null
}

type ActionResult = { error: string | null }

function revalidate() {
  revalidatePath('/orders')
  revalidatePath('/dashboard')
}

export async function addOrder(input: OrderInput, lines: OrderLineInput[]): Promise<ActionResult> {
  const supabase = await createClient()
  if (!supabase) return { error: 'Supabase is not configured' }

  // Insert; if the order number collided (two people created at once), fetch the
  // live list, regenerate the next number, and retry once.
  let number = input.order_number.trim()
  let attempt = await supabase.from('orders').insert({ ...input, order_number: number, currency: 'MAD' }).select('id').single()
  if (attempt.error?.code === '23505') {
    const { data: existing } = await supabase.from('orders').select('order_number')
    number = nextOrderNumber((existing ?? []).map((o) => o.order_number), Number(input.order_date.slice(0, 4)))
    attempt = await supabase.from('orders').insert({ ...input, order_number: number, currency: 'MAD' }).select('id').single()
  }
  const { data: order, error } = attempt
  if (error || !order) return { error: error?.message ?? 'Error' }

  if (lines.length) {
    const { error: liErr } = await supabase
      .from('order_items')
      .insert(lines.map((l) => ({ ...l, order_id: order.id })))
    if (liErr) return { error: liErr.message }
  }

  await logActivity('order', 'created', number, order.id)
  revalidate()
  return { error: null }
}

export async function editOrder(id: string, input: OrderInput, lines: OrderLineInput[]): Promise<ActionResult> {
  const supabase = await createClient()
  if (!supabase) return { error: 'Supabase is not configured' }

  const { error } = await supabase.from('orders').update({ ...input, currency: 'MAD' }).eq('id', id)
  if (error) return { error: error.message }

  await logActivity('order', 'updated', input.order_number, id)

  // Replace the line items wholesale.
  await supabase.from('order_items').delete().eq('order_id', id)
  if (lines.length) {
    const { error: liErr } = await supabase
      .from('order_items')
      .insert(lines.map((l) => ({ ...l, order_id: id })))
    if (liErr) return { error: liErr.message }
  }

  revalidate()
  return { error: null }
}

export async function removeOrder(id: string): Promise<ActionResult> {
  const supabase = await createClient()
  if (!supabase) return { error: 'Supabase is not configured' }

  // order_items cascade-delete via FK.
  const { data: row } = await supabase.from('orders').select('order_number').eq('id', id).single()
  const { error } = await supabase.from('orders').delete().eq('id', id)
  if (error) return { error: error.message }

  await logActivity('order', 'deleted', row?.order_number ?? 'Order', id)
  revalidate()
  return { error: null }
}
