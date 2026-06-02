'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
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
  revalidatePath(PATHS[table])
  return { error: null }
}

export async function bulkUpdateStage(ids: string[], stage: DealStage): Promise<Result> {
  if (ids.length === 0) return { error: null }
  const supabase = await createClient()
  if (!supabase) return { error: 'Supabase is not configured' }
  const { error } = await supabase.from('deals').update({ stage }).in('id', ids)
  if (error) return { error: error.message }
  revalidatePath('/deals')
  return { error: null }
}

export async function bulkUpdateStatus(ids: string[], status: OrderStatus): Promise<Result> {
  if (ids.length === 0) return { error: null }
  const supabase = await createClient()
  if (!supabase) return { error: 'Supabase is not configured' }
  const { error } = await supabase.from('orders').update({ status }).in('id', ids)
  if (error) return { error: error.message }
  revalidatePath('/orders')
  return { error: null }
}
