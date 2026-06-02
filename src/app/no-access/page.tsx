'use client'

import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'

export default function NoAccessPage() {
  const router = useRouter()

  async function signOut() {
    const supabase = createClient()
    if (supabase) await supabase.auth.signOut()
    router.push('/login')
    router.refresh()
  }

  return (
    <main className="min-h-svh flex items-center justify-center p-4">
      <Card className="w-full max-w-sm p-6 text-center animate-fade-up">
        <span className="text-accent text-sm font-semibold tracking-[0.2em]">FRONTIER&nbsp;OS</span>
        <h1 className="mt-4 text-lg font-semibold text-white">Account not activated</h1>
        <p className="mt-2 text-[13px] leading-relaxed text-white/50">
          Your account doesn’t have access yet. Ask your administrator for an invite link to join
          the workspace.
        </p>
        <Button variant="outline" size="sm" className="mt-5 w-full" onClick={signOut}>
          Sign out
        </Button>
      </Card>
    </main>
  )
}
