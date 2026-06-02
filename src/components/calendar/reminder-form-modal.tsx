'use client'

import { useState, type FormEvent } from 'react'
import { useRouter } from 'next/navigation'
import { Trash2 } from 'lucide-react'
import { Modal } from '../ui/modal'
import { Button } from '../ui/button'
import { Input, Label, Select } from '../ui/input'
import { useI18n } from '@/i18n/provider'
import {
  addReminder,
  editReminder,
  removeReminder,
  type ReminderInput,
} from '@/app/(app)/calendar/actions'
import type { Reminder } from '@/types/database'

export type ClientOpt = { id: string; name: string }
export type MemberOpt = { id: string; name: string }

export function ReminderFormModal({
  open,
  onClose,
  clients,
  members = [],
  reminder,
  defaultDate,
}: {
  open: boolean
  onClose: () => void
  clients: ClientOpt[]
  members?: MemberOpt[]
  reminder?: Reminder | null
  defaultDate: string
}) {
  const { t } = useI18n()
  const router = useRouter()
  const editing = Boolean(reminder)

  const [form, setForm] = useState({
    title: reminder?.title ?? '',
    due_date: reminder?.due_date ?? defaultDate,
    client_id: reminder?.client_id ?? '',
    assignee_id: reminder?.assignee_id ?? '',
    done: reminder?.done ?? false,
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
    const payload: ReminderInput = {
      title: form.title.trim(),
      due_date: form.due_date,
      client_id: form.client_id || null,
      assignee_id: form.assignee_id || null,
      done: form.done,
    }
    const res = editing ? await editReminder(reminder!.id, payload) : await addReminder(payload)
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
    if (!reminder) return
    setPending(true)
    await removeReminder(reminder.id)
    setPending(false)
    onClose()
    router.refresh()
  }

  return (
    <Modal open={open} onClose={onClose} title={t(editing ? 'calendar.form.editTitle' : 'calendar.form.newTitle')}>
      <form onSubmit={onSubmit} className="space-y-3">
        <div>
          <Label htmlFor="r-title">{t('calendar.form.title')}</Label>
          <Input id="r-title" required value={form.title} onChange={(e) => set('title', e.target.value)} />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label htmlFor="r-date">{t('calendar.form.date')}</Label>
            <Input id="r-date" type="date" required value={form.due_date} onChange={(e) => set('due_date', e.target.value)} />
          </div>
          <div>
            <Label htmlFor="r-client">{t('calendar.form.client')}</Label>
            <Select id="r-client" value={form.client_id} onChange={(e) => set('client_id', e.target.value)}>
              <option value="">{t('calendar.form.noClient')}</option>
              {clients.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </Select>
          </div>
        </div>

        <div>
          <Label htmlFor="r-assignee">{t('calendar.form.assignee')}</Label>
          <Select id="r-assignee" value={form.assignee_id} onChange={(e) => set('assignee_id', e.target.value)}>
            <option value="">{t('common.unassigned')}</option>
            {members.map((m) => (
              <option key={m.id} value={m.id}>
                {m.name}
              </option>
            ))}
          </Select>
        </div>

        <label className="flex items-center gap-2 text-sm text-white/70">
          <input
            type="checkbox"
            checked={form.done}
            onChange={(e) => set('done', e.target.checked)}
            className="h-4 w-4 rounded border-white/20 bg-white/[0.07] accent-primary"
          />
          {t('calendar.form.done')}
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
            <Button type="submit" disabled={pending || !form.title.trim()}>
              {pending ? t('common.saving') : t('common.save')}
            </Button>
          </div>
        </div>
      </form>
    </Modal>
  )
}
