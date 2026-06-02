'use server'

import { createClient } from '@/lib/supabase/server'

export type SearchHit = {
  type: 'client' | 'deal' | 'order' | 'product'
  id: string
  label: string
  sub: string | null
}

export async function globalSearch(q: string): Promise<SearchHit[]> {
  const query = q.trim()
  if (!query) return []

  const supabase = await createClient()
  if (!supabase) return []

  const like = `%${query}%`
  const [cl, de, or, pr] = await Promise.all([
    supabase.from('clients').select('id, name, industry').ilike('name', like).limit(5),
    supabase.from('deals').select('id, title, stage').ilike('title', like).limit(5),
    supabase.from('orders').select('id, order_number, status').ilike('order_number', like).limit(5),
    supabase.from('products').select('id, name, sku').ilike('name', like).limit(5),
  ])

  const hits: SearchHit[] = []
  for (const c of cl.data ?? []) hits.push({ type: 'client', id: c.id, label: c.name, sub: c.industry })
  for (const d of de.data ?? []) hits.push({ type: 'deal', id: d.id, label: d.title, sub: d.stage })
  for (const o of or.data ?? []) hits.push({ type: 'order', id: o.id, label: o.order_number, sub: o.status })
  for (const p of pr.data ?? []) hits.push({ type: 'product', id: p.id, label: p.name, sub: p.sku })
  return hits
}
