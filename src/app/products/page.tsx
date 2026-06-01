import { createClient } from '@/lib/supabase/server'
import { ProductsView } from '@/components/products/products-view'

export default async function ProductsPage() {
  const supabase = await createClient()
  if (!supabase) return <ProductsView status="unconfigured" />

  const { data, error } = await supabase.from('products').select('*').order('name')
  if (error) return <ProductsView status="error" />

  return <ProductsView status="ok" rows={data ?? []} />
}
