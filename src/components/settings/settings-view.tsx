'use client'

import { LogOut, ShieldCheck } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { Card, CardHeader, CardTitle, CardContent } from '../ui/card'
import { Badge } from '../ui/badge'
import { Button } from '../ui/button'
import { LangSwitcher } from '../ui/lang-switcher'
import { useI18n } from '@/i18n/provider'
import { createClient } from '@/lib/supabase/client'
import type { Role } from '@/rbac/config'

export type TeamMember = { id: string; email: string | null; full_name: string | null; role: Role }

export function SettingsView({
  email,
  role,
  members = [],
}: {
  email: string | null
  role: Role
  members?: TeamMember[]
}) {
  const { t } = useI18n()
  const router = useRouter()

  async function signOut() {
    const supabase = createClient()
    if (supabase) await supabase.auth.signOut()
    router.push('/login')
    router.refresh()
  }

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-semibold text-white">{t('nav.settings')}</h1>
        <p className="mt-1 text-sm text-white/45">{t('pages.settings.subtitle')}</p>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>{t('settings.profile')}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <div className="flex items-center justify-between">
              <span className="text-white/45">{t('settings.email')}</span>
              <span className="font-mono text-[13px] text-white/80">{email ?? '—'}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-white/45">{t('settings.role')}</span>
              <Badge variant="accent">
                <ShieldCheck size={12} className="mr-1" />
                {t(`roles.${role}`)}
              </Badge>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>{t('settings.preferences')}</CardTitle>
          </CardHeader>
          <CardContent className="flex items-center justify-between text-sm">
            <span className="text-white/45">{t('settings.language')}</span>
            <LangSwitcher />
          </CardContent>
        </Card>
      </div>

      {role === 'owner' && (
        <Card>
          <CardHeader>
            <CardTitle>{t('settings.team')}</CardTitle>
          </CardHeader>
          <CardContent>
            {members.length === 0 ? (
              <p className="text-[13px] text-white/45">{t('settings.noMembers')}</p>
            ) : (
              <ul className="divide-y divide-white/[0.06]">
                {members.map((m) => (
                  <li key={m.id} className="flex items-center justify-between gap-3 py-2 text-sm">
                    <span className="font-mono text-[13px] text-white/80">{m.email ?? m.full_name ?? '—'}</span>
                    <Badge variant={m.role === 'owner' ? 'accent' : 'default'}>{t(`roles.${m.role}`)}</Badge>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>{t('settings.account')}</CardTitle>
        </CardHeader>
        <CardContent>
          <Button variant="danger" size="sm" onClick={signOut}>
            <LogOut size={15} />
            {t('auth.signOut')}
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
