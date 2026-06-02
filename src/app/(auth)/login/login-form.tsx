'use client'

import { useState, type FormEvent } from 'react'
import { useRouter } from 'next/navigation'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input, Label } from '@/components/ui/input'
import { useI18n } from '@/i18n/provider'
import { createClient } from '@/lib/supabase/client'

export function LoginForm({ next }: { next: string }) {
  const { t } = useI18n()
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [pending, setPending] = useState(false)

  async function onSubmit(e: FormEvent) {
    e.preventDefault()
    setError(null)
    setPending(true)

    const supabase = createClient()
    if (!supabase) {
      setError(t('auth.genericError'))
      setPending(false)
      return
    }

    const { error: signInError } = await supabase.auth.signInWithPassword({ email, password })
    if (signInError) {
      setError(signInError.message || t('auth.genericError'))
      setPending(false)
      return
    }

    router.push(next)
    router.refresh()
  }

  return (
    <Card className="p-6">
      <div className="mb-5 text-center">
        <span className="text-accent text-sm font-semibold tracking-[0.2em]">FRONTIER&nbsp;OS</span>
        <h1 className="mt-4 text-lg font-semibold text-white">{t('auth.signInTitle')}</h1>
        <p className="mt-1 text-[13px] text-white/45">{t('auth.signInSubtitle')}</p>
      </div>

      <form onSubmit={onSubmit} className="space-y-4">
        <div className="space-y-1.5">
          <Label htmlFor="email">{t('auth.email')}</Label>
          <Input
            id="email"
            type="email"
            autoComplete="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="password">{t('auth.password')}</Label>
          <Input
            id="password"
            type="password"
            autoComplete="current-password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </div>

        {error && <p className="text-[13px] text-danger">{error}</p>}

        <Button type="submit" className="w-full" disabled={pending}>
          {pending ? t('auth.pending') : t('auth.signIn')}
        </Button>
      </form>

      <p className="mt-4 text-center text-[12px] text-white/30">{t('auth.inviteOnly')}</p>
    </Card>
  )
}
