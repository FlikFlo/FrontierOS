'use client'

import { useState, type FormEvent } from 'react'
import { useRouter } from 'next/navigation'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input, Label } from '@/components/ui/input'
import { Tabs } from '@/components/ui/tabs'
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

  const isSignup = mode === 'signup'

  function switchMode(next: 'signin' | 'signup') {
    setMode(next)
    setError(null)
    setInfo(null)
  }

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
      <div className="mb-5 text-center">
        <span className="text-accent text-sm font-semibold tracking-[0.2em]">FRONTIER&nbsp;OS</span>
      </div>

      {/* Explicit mode switch so it's obvious whether you're signing in or registering. */}
      <Tabs
        variant="segmented"
        value={mode}
        onChange={(v) => switchMode(v as 'signin' | 'signup')}
        items={[
          { value: 'signin', label: t('auth.signIn') },
          { value: 'signup', label: t('auth.signUp') },
        ]}
        className="mb-5"
      />

      <div className="mb-5 text-center">
        <h1 className="text-lg font-semibold text-white">
          {isSignup ? t('auth.signUpTitle') : t('auth.signInTitle')}
        </h1>
        <p className="mt-1 text-[13px] text-white/45">
          {isSignup ? t('auth.signUpSubtitle') : t('auth.signInSubtitle')}
        </p>
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
            autoComplete={isSignup ? 'new-password' : 'current-password'}
            required
            minLength={6}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          {isSignup && <p className="text-[12px] text-white/35">{t('auth.passwordHint')}</p>}
        </div>

        {info && <p className="text-[13px] text-success">{info}</p>}
        {error && <p className="text-[13px] text-danger">{error}</p>}

        <Button type="submit" className="w-full" disabled={pending}>
          {pending ? t('auth.pending') : isSignup ? t('auth.signUp') : t('auth.signIn')}
        </Button>
      </form>

      <button
        type="button"
        onClick={() => switchMode(isSignup ? 'signin' : 'signup')}
        className="mt-4 w-full text-center text-[13px] text-white/45 hover:text-white/70 transition-colors"
      >
        {isSignup ? t('auth.toSignIn') : t('auth.toSignUp')}
      </button>
    </Card>
  )
}
