'use client'

import { useState } from 'react'
import { LogOut, ShieldCheck, Check } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { Card, CardHeader, CardTitle, CardContent } from '../ui/card'
import { Badge } from '../ui/badge'
import { Button } from '../ui/button'
import { Input, Select } from '../ui/input'
import { LangSwitcher } from '../ui/lang-switcher'
import { useI18n } from '@/i18n/provider'
import { createClient } from '@/lib/supabase/client'
import { updateMyProfile, updateMember } from '@/app/(app)/settings/actions'
import { ROLES, type Role } from '@/rbac/config'

export type TeamMember = { id: string; email: string | null; full_name: string | null; role: Role }

export function SettingsView({
  email,
  role,
  fullName,
  userId,
  members = [],
}: {
  email: string | null
  role: Role
  fullName?: string | null
  userId?: string | null
  members?: TeamMember[]
}) {
  const { t } = useI18n()
  const router = useRouter()

  const [name, setName] = useState(fullName ?? '')
  const [savingName, setSavingName] = useState(false)
  const [nameSaved, setNameSaved] = useState(false)

  async function saveName() {
    setSavingName(true)
    setNameSaved(false)
    const res = await updateMyProfile(name)
    setSavingName(false)
    if (!res.error) {
      setNameSaved(true)
      router.refresh()
    }
  }

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
          <CardContent className="space-y-4 text-sm">
            <div>
              <label className="mb-1.5 block text-[13px] text-white/45">{t('settings.fullName')}</label>
              <div className="flex items-center gap-2">
                <Input
                  value={name}
                  onChange={(e) => {
                    setName(e.target.value)
                    setNameSaved(false)
                  }}
                  placeholder={t('settings.namePlaceholder')}
                />
                <Button size="sm" onClick={saveName} disabled={savingName}>
                  {nameSaved ? <Check size={15} /> : null}
                  {savingName ? t('common.saving') : nameSaved ? t('settings.saved') : t('common.save')}
                </Button>
              </div>
            </div>
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
            <p className="mb-3 text-[13px] text-white/45">{t('settings.teamHint')}</p>
            {members.length === 0 ? (
              <p className="text-[13px] text-white/45">{t('settings.noMembers')}</p>
            ) : (
              <ul className="space-y-2">
                {members.map((m) => (
                  <MemberRow
                    key={`${m.id}:${m.full_name ?? ''}:${m.role}`}
                    member={m}
                    isSelf={m.id === userId}
                    onSaved={() => router.refresh()}
                  />
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

function MemberRow({
  member,
  isSelf,
  onSaved,
}: {
  member: TeamMember
  isSelf: boolean
  onSaved: () => void
}) {
  const { t } = useI18n()
  const [name, setName] = useState(member.full_name ?? '')
  const [role, setRole] = useState<Role>(member.role)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  const dirty = name !== (member.full_name ?? '') || role !== member.role

  async function save() {
    setSaving(true)
    setSaved(false)
    const res = await updateMember(member.id, name, role)
    setSaving(false)
    if (!res.error) {
      setSaved(true)
      onSaved()
    }
  }

  return (
    <li className="flex flex-col gap-2 rounded-xl border border-white/[0.06] bg-white/[0.02] p-3 sm:flex-row sm:items-center">
      <div className="min-w-0 flex-1">
        <Input
          value={name}
          onChange={(e) => {
            setName(e.target.value)
            setSaved(false)
          }}
          placeholder={t('settings.unnamed')}
        />
        <p className="mt-1 truncate font-mono text-[11px] text-white/40">{member.email ?? '—'}</p>
      </div>
      <Select
        value={role}
        disabled={isSelf}
        onChange={(e) => {
          setRole(e.target.value as Role)
          setSaved(false)
        }}
        className="sm:w-44"
      >
        {ROLES.map((r) => (
          <option key={r} value={r}>
            {t(`roles.${r}`)}
          </option>
        ))}
      </Select>
      <Button size="sm" variant="outline" onClick={save} disabled={saving || !dirty}>
        {saved ? <Check size={15} /> : null}
        {saving ? t('common.saving') : saved ? t('settings.saved') : t('common.save')}
      </Button>
    </li>
  )
}
