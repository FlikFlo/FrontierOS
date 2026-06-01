'use client'

import { useState, type FormEvent } from 'react'
import { useRouter } from 'next/navigation'
import { Modal } from '../ui/modal'
import { Button } from '../ui/button'
import { Input, Label, Select, Textarea } from '../ui/input'
import { useI18n } from '@/i18n/provider'
import { addClient, editClient, type ClientInput } from '@/app/(app)/clients/actions'
import type { Client, ClientStatus } from '@/types/database'

const STATUSES: ClientStatus[] = ['lead', 'active', 'inactive']

/**
 * ClientFormModal — create or edit a client. Submits through the server actions
 * (which run with the right Supabase credentials) and refreshes the list.
 * Mount it fresh per target (key by client id) so the fields reset.
 */
export function ClientFormModal({
  open,
  onClose,
  client,
}: {
  open: boolean
  onClose: () => void
  client?: Client | null
}) {
  const { t } = useI18n()
  const router = useRouter()
  const editing = Boolean(client)

  const [form, setForm] = useState({
    name: client?.name ?? '',
    industry: client?.industry ?? '',
    website: client?.website ?? '',
    email: client?.email ?? '',
    phone: client?.phone ?? '',
    address: client?.address ?? '',
    status: (client?.status ?? 'lead') as ClientStatus,
    notes: client?.notes ?? '',
  })
  const [error, setError] = useState<string | null>(null)
  const [pending, setPending] = useState(false)

  function set<K extends keyof typeof form>(key: K, value: (typeof form)[K]) {
    setForm((f) => ({ ...f, [key]: value }))
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault()
    setError(null)
    setPending(true)

    const payload: ClientInput = {
      name: form.name.trim(),
      industry: form.industry.trim() || null,
      website: form.website.trim() || null,
      email: form.email.trim() || null,
      phone: form.phone.trim() || null,
      address: form.address.trim() || null,
      status: form.status,
      notes: form.notes.trim() || null,
    }

    const res = editing ? await editClient(client!.id, payload) : await addClient(payload)
    if (res.error) {
      setError(res.error)
      setPending(false)
      return
    }

    setPending(false)
    onClose()
    router.refresh()
  }

  return (
    <Modal open={open} onClose={onClose} title={t(editing ? 'clients.form.editTitle' : 'clients.form.newTitle')}>
      <form onSubmit={onSubmit} className="space-y-3">
        <div>
          <Label htmlFor="c-name">{t('clients.columns.name')}</Label>
          <Input id="c-name" required value={form.name} onChange={(e) => set('name', e.target.value)} />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label htmlFor="c-industry">{t('clients.columns.industry')}</Label>
            <Input id="c-industry" value={form.industry} onChange={(e) => set('industry', e.target.value)} />
          </div>
          <div>
            <Label htmlFor="c-status">{t('clients.columns.status')}</Label>
            <Select
              id="c-status"
              value={form.status}
              onChange={(e) => set('status', e.target.value as ClientStatus)}
            >
              {STATUSES.map((s) => (
                <option key={s} value={s}>
                  {t(`clients.status.${s}`)}
                </option>
              ))}
            </Select>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label htmlFor="c-email">{t('clients.columns.email')}</Label>
            <Input id="c-email" type="email" value={form.email} onChange={(e) => set('email', e.target.value)} />
          </div>
          <div>
            <Label htmlFor="c-phone">{t('clients.columns.phone')}</Label>
            <Input id="c-phone" value={form.phone} onChange={(e) => set('phone', e.target.value)} />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label htmlFor="c-website">{t('clients.columns.website')}</Label>
            <Input id="c-website" value={form.website} onChange={(e) => set('website', e.target.value)} />
          </div>
          <div>
            <Label htmlFor="c-address">{t('clients.columns.address')}</Label>
            <Input id="c-address" value={form.address} onChange={(e) => set('address', e.target.value)} />
          </div>
        </div>

        <div>
          <Label htmlFor="c-notes">{t('clients.columns.notes')}</Label>
          <Textarea id="c-notes" rows={2} value={form.notes} onChange={(e) => set('notes', e.target.value)} />
        </div>

        {error && <p className="text-[13px] text-danger">{error}</p>}

        <div className="flex justify-end gap-2 pt-2">
          <Button type="button" variant="ghost" onClick={onClose}>
            {t('common.cancel')}
          </Button>
          <Button type="submit" disabled={pending || !form.name.trim()}>
            {pending ? t('common.saving') : t('common.save')}
          </Button>
        </div>
      </form>
    </Modal>
  )
}
