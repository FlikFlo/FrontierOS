'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

/**
 * useRealtime — re-fetch the current route when any of the given tables change,
 * so lists/boards/threads stay live across users. Pass a STABLE array
 * (module-level const) to avoid resubscribing each render.
 *
 * Requires the tables to be in the `supabase_realtime` publication and a signed-
 * in session (Realtime honours RLS); a no-op when Supabase isn't configured.
 */
export function useRealtime(tables: string[]) {
  const router = useRouter()
  const key = tables.join(',')

  useEffect(() => {
    const supabase = createClient()
    if (!supabase || !key) return

    const list = key.split(',').filter(Boolean)
    let timer: ReturnType<typeof setTimeout> | null = null
    const refresh = () => {
      if (timer) clearTimeout(timer)
      timer = setTimeout(() => router.refresh(), 300)
    }

    const channel = supabase.channel(`rt:${key}`)
    for (const table of list) {
      channel.on('postgres_changes', { event: '*', schema: 'public', table }, refresh)
    }

    let cancelled = false
    // Apply the signed-in user's access token to Realtime BEFORE subscribing,
    // otherwise the socket authorizes as `anon` and RLS (`to authenticated`)
    // silently drops every change event.
    supabase.auth.getSession().then(({ data }) => {
      if (cancelled) return
      if (data.session) supabase.realtime.setAuth(data.session.access_token)
      channel.subscribe()
    })

    return () => {
      cancelled = true
      if (timer) clearTimeout(timer)
      supabase.removeChannel(channel)
    }
  }, [key, router])
}
