'use client'

import { useState } from 'react'
import { LogOut, ShieldCheck, Check, Plus, Copy, Trash2 } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { Card, CardHeader, CardTitle, CardContent } from '../ui/card'
import { Badge } from '../ui/badge'
import { Button } from '../ui/button'
import { Input, Select } from '../ui/input'
import { LangSwitcher } from '../ui/lang-switcher'
import { ConfirmDialog } from '../ui/confirm-dialog'
import { useI18n } from '@/i18n/provider'
import { createClient } from '@/lib/supabase/client'
import { updateMyProfile, updateMember, removeMember } from '@/app/(app)/settings/actions'
import { createInvite, revokeInvite, type InviteRow } from '@/app/(app)/settings/invite-actions'
import { ROLES, type Role } from '@/rbac/config'

export type TeamMember = { id: string; email: string | null; full_name: string | null; role: Role }

export function SettingsView({
  email,
  role,
  fullName,
  userId,
  members = [],
  invites = [],
}: {
  email: string | null
  role: Role
  fullName?: string | null
  userId?: string | null
  members?: TeamMember[]
  invites?: InviteRow[]
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

      {role === 'owner' && <InviteSection invites={invites} onChange={() => router.refresh()} />}

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

function InviteSection({ invites, onChange }: { invites: InviteRow[]; onChange: () => void }) {
  const { t } = useI18n()
  const [role, setRole] = useState<Role>('sales_manager')
  const [busy, setBusy] = useState(false)
  const [link, setLink] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)

  function linkFor(token: string) {
    const origin = typeof window !== 'undefined' ? window.location.origin : ''
    return `${origin}/register?invite=${token}`
  }

  async function generate() {
    setBusy(true)
    setCopied(false)
    const res = await createInvite(role)
    setBusy(false)
    if (res.id) {
      setLink(linkFor(res.id))
      onChange()
    }
  }

  async function copy(value: string) {
    try {
      await navigator.clipboard.writeText(value)
      setCopied(true)
      setTimeout(() => setCopied(false), 1500)
    } catch {
      /* clipboard blocked — user can select manually */
    }
  }

  const active = invites.filter((i) => !i.revoked)

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t('settings.invites')}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <p className="text-[13px] text-white/45">{t('settings.invitesHint')}</p>

        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
          <Select value={role} onChange={(e) => setRole(e.target.value as Role)} className="sm:w-48">
            {ROLES.map((r) => (
              <option key={r} value={r}>
                {t(`roles.${r}`)}
              </option>
            ))}
          </Select>
          <Button size="sm" onClick={generate} disabled={busy}>
            <Plus size={15} />
            {busy ? t('common.saving') : t('settings.createInvite')}
          </Button>
        </div>

        {link && (
          <div className="flex items-center gap-2 rounded-xl border border-primary/30 bg-primary/[0.06] p-2">
            <code className="min-w-0 flex-1 truncate font-mono text-[12px] text-white/80">{link}</code>
            <Button size="sm" variant="outline" onClick={() => copy(link)}>
              {copied ? <Check size={14} /> : <Copy size={14} />}
              {copied ? t('settings.copied') : t('settings.copy')}
            </Button>
          </div>
        )}

        {active.length > 0 && (
          <ul className="divide-y divide-white/[0.06] border-t border-white/[0.06] pt-1">
            {active.map((inv) => (
              <li key={inv.id} className="flex items-center gap-3 py-2 text-sm">
                <Badge variant="accent">{t(`roles.${inv.role}`)}</Badge>
                <code className="min-w-0 flex-1 truncate font-mono text-[11px] text-white/40">
                  {linkFor(inv.id)}
                </code>
                <button
                  type="button"
                  onClick={() => copy(linkFor(inv.id))}
                  aria-label={t('settings.copy')}
                  className="inline-flex h-7 w-7 items-center justify-center rounded-lg text-white/40 hover:bg-white/[0.06] hover:text-white"
                >
                  <Copy size={14} />
                </button>
                <button
                  type="button"
                  onClick={async () => {
                    await revokeInvite(inv.id)
                    onChange()
                  }}
                  aria-label={t('settings.revoke')}
                  className="inline-flex h-7 w-7 items-center justify-center rounded-lg text-white/40 hover:bg-danger/10 hover:text-danger"
                >
                  <Trash2 size={14} />
                </button>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
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
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [removing, setRemoving] = useState(false)

  const dirty = name !== (member.full_name ?? '') || role !== member.role
  const label = member.full_name?.trim() || member.email || t('settings.unnamed')

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

  async function remove() {
    setRemoving(true)
    const res = await removeMember(member.id)
    setRemoving(false)
    setConfirmOpen(false)
    if (!res.error) onSaved()
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
      {!isSelf && (
        <button
          type="button"
          onClick={() => setConfirmOpen(true)}
          aria-label={t('settings.removeMember')}
          title={t('settings.removeMember')}
          className="inline-flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg text-white/40 transition-colors hover:bg-danger/10 hover:text-danger"
        >
          <Trash2 size={15} />
        </button>
      )}

      <ConfirmDialog
        open={confirmOpen}
        title={t('settings.removeMember')}
        body={t('settings.removeMemberBody', { name: label })}
        confirmLabel={removing ? t('common.saving') : t('settings.removeMember')}
        cancelLabel={t('common.cancel')}
        onConfirm={remove}
        onCancel={() => setConfirmOpen(false)}
      />
    </li>
  )
}
