'use client'

import { useState, type FormEvent } from 'react'
import { useRouter } from 'next/navigation'
import { Trash2 } from 'lucide-react'
import { Modal } from '../ui/modal'
import { Button } from '../ui/button'
import { Input, Label } from '../ui/input'
import { useI18n } from '@/i18n/provider'
import { addContact, editContact, removeContact, type ContactInput } from '@/app/(app)/clients/actions'
import type { Contact } from '@/types/database'

export function ContactFormModal({
  open,
  onClose,
  clientId,
  contact,
}: {
  open: boolean
  onClose: () => void
  clientId: string
  contact?: Contact | null
}) {
  const { t } = useI18n()
  const router = useRouter()
  const editing = Boolean(contact)

  const [form, setForm] = useState({
    first_name: contact?.first_name ?? '',
    last_name: contact?.last_name ?? '',
    title: contact?.title ?? '',
    email: contact?.email ?? '',
    phone: contact?.phone ?? '',
    is_primary: contact?.is_primary ?? false,
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
    const payload: ContactInput = {
      client_id: clientId,
      first_name: form.first_name.trim(),
      last_name: form.last_name.trim() || null,
      title: form.title.trim() || null,
      email: form.email.trim() || null,
      phone: form.phone.trim() || null,
      is_primary: form.is_primary,
    }
    const res = editing ? await editContact(contact!.id, payload) : await addContact(payload)
    if (res.error) {
      setError(res.error)
      setPending(false)
      return
    }
    setPending(false)
    onClose()
    router.refresh()
  }

  async function onDelete() {
    if (!contact) return
    setPending(true)
    await removeContact(contact.id, clientId)
    setPending(false)
    onClose()
    router.refresh()
  }

  return (
    <Modal open={open} onClose={onClose} title={t(editing ? 'contacts.form.editTitle' : 'contacts.form.newTitle')}>
      <form onSubmit={onSubmit} className="space-y-3">
        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label htmlFor="ct-first">{t('contacts.form.firstName')}</Label>
            <Input id="ct-first" required value={form.first_name} onChange={(e) => set('first_name', e.target.value)} />
          </div>
          <div>
            <Label htmlFor="ct-last">{t('contacts.form.lastName')}</Label>
            <Input id="ct-last" value={form.last_name} onChange={(e) => set('last_name', e.target.value)} />
          </div>
        </div>

        <div>
          <Label htmlFor="ct-title">{t('contacts.form.jobTitle')}</Label>
          <Input id="ct-title" value={form.title} onChange={(e) => set('title', e.target.value)} />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label htmlFor="ct-email">{t('contacts.columns.email')}</Label>
            <Input id="ct-email" type="email" value={form.email} onChange={(e) => set('email', e.target.value)} />
          </div>
          <div>
            <Label htmlFor="ct-phone">{t('contacts.columns.phone')}</Label>
            <Input id="ct-phone" value={form.phone} onChange={(e) => set('phone', e.target.value)} />
          </div>
        </div>

        <label className="flex items-center gap-2 text-sm text-white/70">
          <input
            type="checkbox"
            checked={form.is_primary}
            onChange={(e) => set('is_primary', e.target.checked)}
            className="h-4 w-4 rounded border-white/20 bg-white/[0.07] accent-primary"
          />
          {t('contacts.form.isPrimary')}
        </label>

        {error && <p className="text-[13px] text-danger">{error}</p>}

        <div className="flex items-center justify-between gap-2 pt-2">
          {editing ? (
            <Button type="button" variant="danger" size="sm" onClick={onDelete} disabled={pending}>
              <Trash2 size={14} />
              {t('common.delete')}
            </Button>
          ) : (
            <span />
          )}
          <div className="flex gap-2">
            <Button type="button" variant="ghost" onClick={onClose}>
              {t('common.cancel')}
            </Button>
            <Button type="submit" disabled={pending || !form.first_name.trim()}>
              {pending ? t('common.saving') : t('common.save')}
            </Button>
          </div>
        </div>
      </form>
    </Modal>
  )
}
