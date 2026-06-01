'use client'

import { ShieldCheck, Check } from 'lucide-react'
import { Dropdown } from './dropdown'
import { useRole } from '@/rbac/provider'
import { ROLES } from '@/rbac/config'
import { useI18n } from '@/i18n/provider'

/**
 * RoleSwitcher — DEV-ONLY role picker for the topbar. Lets you preview how the
 * app looks per role before auth exists. Once Supabase Auth is wired the role
 * comes from the user's profile and this control is removed.
 */
export function RoleSwitcher() {
  const { role, setRole } = useRole()
  const { t } = useI18n()

  return (
    <Dropdown
      align="right"
      trigger={
        <span className="flex items-center gap-1.5 rounded-lg bg-white/[0.06] px-2 py-1 text-[11px] font-medium text-white/70 transition-colors hover:text-white">
          <ShieldCheck size={13} className="text-accent" />
          <span className="hidden sm:inline">{t(`roles.${role}`)}</span>
          <span className="text-[8px] uppercase tracking-wide text-white/30">dev</span>
        </span>
      }
      items={ROLES.map((r) => ({
        label: t(`roles.${r}`),
        icon:
          r === role ? (
            <Check size={14} className="text-accent" />
          ) : (
            <span className="inline-block w-[14px]" />
          ),
        onSelect: () => setRole(r),
      }))}
    />
  )
}
