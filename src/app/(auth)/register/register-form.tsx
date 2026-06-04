'use client'

import { useState, type FormEvent } from 'react'
import { useRouter } from 'next/navigation'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input, Label } from '@/components/ui/input'
import { useI18n } from '@/i18n/provider'
import { createClient } from '@/lib/supabase/client'

type RpcFn = (fn: string, args: Record<string, unknown>) => Promise<{ error: { message: string } | null }>

export function RegisterForm({ token, role }: { token: string; role: string | null }) {
  const { t } = useI18n()
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [pending, setPending] = useState(false)

  // No valid invite → can't register.
  if (!role) {
    return (
      <Card className="p-6 text-center">
        <span className="text-accent text-sm font-semibold tracking-[0.2em]">FRONTIER&nbsp;OS</span>
        <p className="mt-4 text-[13px] leading-relaxed text-white/60">{t('auth.invalidInvite')}</p>
      </Card>
    )
  }

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError(null)

    // Read straight from the form so browser/password-manager autofill works even
    // when React's onChange never fired (a common mobile cause of a "dead" button).
    const fd = new FormData(e.currentTarget)
    const emailValue = String(fd.get('email') ?? '').trim()
    const passwordValue = String(fd.get('password') ?? '')

    if (!emailValue || !/.+@.+/.test(emailValue)) {
      setError(t('auth.invalidEmail'))
      return
    }
    if (passwordValue.length < 6) {
      setError(t('auth.passwordShort'))
      return
    }

    setPending(true)

    const supabase = createClient()
    if (!supabase) {
      setError(t('auth.genericError'))
      setPending(false)
      return
    }

    // 1) create the account (lands as 'pending' via the DB trigger)
    const { data, error: signUpError } = await supabase.auth.signUp({
      email: emailValue,
      password: passwordValue,
    })
    if (signUpError) {
      setError(signUpError.message || t('auth.genericError'))
      setPending(false)
      return
    }
    if (!data.session) {
      setError(t('auth.checkEmail'))
      setPending(false)
      return
    }

    // 2) redeem the invite → sets the real role on the new profile
    const rpc = supabase.rpc.bind(supabase) as unknown as RpcFn
    const { error: claimError } = await rpc('claim_invite', { p_token: token })
    if (claimError) {
      setError(t('auth.invalidInvite'))
      setPending(false)
      return
    }

    router.push('/dashboard')
    router.refresh()
  }

  return (
    <Card className="p-6">
      <div className="mb-5 text-center">
        <span className="text-accent text-sm font-semibold tracking-[0.2em]">FRONTIER&nbsp;OS</span>
        <h1 className="mt-4 text-lg font-semibold text-white">{t('auth.registerTitle')}</h1>
        <p className="mt-1 text-[13px] text-white/45">{t('auth.registerSubtitle')}</p>
        <div className="mt-3 flex items-center justify-center gap-1.5 text-[12px] text-white/40">
          {t('auth.invitedAs')}
          <Badge variant="accent">{t(`roles.${role}`)}</Badge>
        </div>
      </div>

      <form onSubmit={onSubmit} className="space-y-4">
        <div className="space-y-1.5">
          <Label htmlFor="email">{t('auth.email')}</Label>
          <Input
            id="email"
            name="email"
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
            name="password"
            type="password"
            autoComplete="new-password"
            required
            minLength={6}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          <p className="text-[12px] text-white/35">{t('auth.passwordHint')}</p>
        </div>

        {error && <p className="text-[13px] text-danger">{error}</p>}

        <Button type="submit" className="w-full" disabled={pending}>
          {pending ? t('auth.pending') : t('auth.activate')}
        </Button>
      </form>
    </Card>
  )
}
