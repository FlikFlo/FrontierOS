'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { logActivity } from '@/lib/activity'
import type { DealStage, OrderStatus } from '@/types/database'

type Result = { error: string | null }
type BulkTable = 'clients' | 'deals' | 'orders' | 'products'

const PATHS: Record<BulkTable, string> = {
  clients: '/clients',
  deals: '/deals',
  orders: '/orders',
  products: '/products',
}

export async function bulkDelete(table: BulkTable, ids: string[]): Promise<Result> {
  if (ids.length === 0) return { error: null }
  const supabase = await createClient()
  if (!supabase) return { error: 'Supabase is not configured' }
  const { error } = await supabase.from(table).delete().in('id', ids)
  if (error) return { error: error.message }
  await logActivity(table, 'deleted', `${ids.length} item(s)`)
  revalidatePath(PATHS[table])
  revalidatePath('/dashboard')
  return { error: null }
}

export async function bulkUpdateStage(ids: string[], stage: DealStage): Promise<Result> {
  if (ids.length === 0) return { error: null }
  const supabase = await createClient()
  if (!supabase) return { error: 'Supabase is not configured' }
  const { error } = await supabase.from('deals').update({ stage }).in('id', ids)
  if (error) return { error: error.message }
  await logActivity('deal', 'updated', `${ids.length} deal(s) → ${stage}`)
  revalidatePath('/deals')
  revalidatePath('/dashboard')
  return { error: null }
}

export async function bulkUpdateStatus(ids: string[], status: OrderStatus): Promise<Result> {
  if (ids.length === 0) return { error: null }
  const supabase = await createClient()
  if (!supabase) return { error: 'Supabase is not configured' }
  const { error } = await supabase.from('orders').update({ status }).in('id', ids)
  if (error) return { error: error.message }
  await logActivity('order', 'updated', `${ids.length} order(s) → ${status}`)
  revalidatePath('/orders')
  return { error: null }
}
