import { createClient } from '@/lib/supabase/server'
import { ClientsView } from '@/components/clients/clients-view'

export default async function ClientsPage() {
  const supabase = await createClient()

  // No env yet → show the setup state instead of failing.
  if (!supabase) return <ClientsView status="unconfigured" />

  const { data, error } = await supabase.from('clients').select('*').order('name')

  if (error) return <ClientsView status="error" />

  return <ClientsView status="ok" rows={data ?? []} />
}
