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
  const [mode, setMode] = useState<'signin' | 'signup'>('signin')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [info, setInfo] = useState<string | null>(null)
  const [pending, setPending] = useState(false)

  async function onSubmit(e: FormEvent) {
    e.preventDefault()
    setError(null)
    setInfo(null)
    setPending(true)

    const supabase = createClient()
    if (!supabase) {
      setError(t('auth.genericError'))
      setPending(false)
      return
    }

    if (mode === 'signup') {
      const { data, error: signUpError } = await supabase.auth.signUp({ email, password })
      if (signUpError) {
        setError(signUpError.message || t('auth.genericError'))
        setPending(false)
        return
      }
      // No session → email confirmation is on; prompt to confirm and sign in.
      if (!data.session) {
        setInfo(t('auth.checkEmail'))
        setMode('signin')
        setPending(false)
        return
      }
    } else {
      const { error: signInError } = await supabase.auth.signInWithPassword({ email, password })
      if (signInError) {
        setError(signInError.message || t('auth.genericError'))
        setPending(false)
        return
      }
    }

    router.push(next)
    router.refresh()
  }

  return (
    <Card className="p-6">
      <div className="mb-6 text-center">
        <span className="text-accent text-sm font-semibold tracking-[0.2em]">FRONTIER&nbsp;OS</span>
        <p className="mt-2 text-[13px] text-white/45">{t('auth.tagline')}</p>
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
            autoComplete={mode === 'signin' ? 'current-password' : 'new-password'}
            required
            minLength={6}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </div>

        {info && <p className="text-[13px] text-success">{info}</p>}
        {error && <p className="text-[13px] text-danger">{error}</p>}

        <Button type="submit" className="w-full" disabled={pending}>
          {pending ? t('auth.pending') : mode === 'signin' ? t('auth.signIn') : t('auth.signUp')}
        </Button>
      </form>

      <button
        type="button"
        onClick={() => {
          setMode((m) => (m === 'signin' ? 'signup' : 'signin'))
          setError(null)
        }}
        className="mt-4 w-full text-center text-[13px] text-white/45 hover:text-white/70 transition-colors"
      >
        {mode === 'signin' ? t('auth.toSignUp') : t('auth.toSignIn')}
      </button>
    </Card>
  )
}
