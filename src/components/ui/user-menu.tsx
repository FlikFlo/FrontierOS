'use client'

import { LogOut, ShieldCheck } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { Dropdown } from './dropdown'
import { Avatar } from './avatar'
import { useRole } from '@/rbac/provider'
import { useI18n } from '@/i18n/provider'
import { createClient } from '@/lib/supabase/client'

/**
 * UserMenu — topbar account control. Shows the signed-in user's role + an
 * avatar; the dropdown surfaces the email and a Sign out action.
 */
export function UserMenu({ email }: { email: string | null }) {
  const { role } = useRole()
  const { t } = useI18n()
  const router = useRouter()
  const initials = (email?.[0] ?? 'U').toUpperCase()

  async function signOut() {
    const supabase = createClient()
    if (supabase) await supabase.auth.signOut()
    router.push('/login')
    router.refresh()
  }

  return (
    <Dropdown
      align="right"
      trigger={
        <span className="flex items-center gap-2">
          <span className="hidden sm:flex items-center gap-1 text-[11px] font-medium text-white/50">
            <ShieldCheck size={12} className="text-accent" />
            {t(`roles.${role}`)}
          </span>
          <Avatar initials={initials} size={28} bg="rgba(21,96,189,0.35)" />
        </span>
      }
      items={[
        { label: email ?? '—', onSelect: () => {}, disabled: true },
        {
          label: t('auth.signOut'),
          onSelect: signOut,
          icon: <LogOut size={14} />,
          destructive: true,
        },
      ]}
    />
  )
}
