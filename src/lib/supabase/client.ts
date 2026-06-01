import { createBrowserClient } from '@supabase/ssr'
// NOTE: typed client (`createBrowserClient<Database>`) returns once the CRM
// schema + generated types land. Untyped for now during the rebuild.

export function isSupabaseConfigured() {
  return Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL &&
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  )
}

export function createClient() {
  if (!isSupabaseConfigured()) return null
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}
