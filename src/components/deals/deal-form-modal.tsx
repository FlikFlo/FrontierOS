'use client'

import { useState, type FormEvent } from 'react'
import { Modal } from '../ui/modal'
import { Button } from '../ui/button'
import { Input, Label, Select } from '../ui/input'
import { useI18n } from '@/i18n/provider'
import { addDeal, editDeal, type DealInput } from '@/app/(app)/deals/actions'
import type { Deal, DealStage } from '@/types/database'

const STAGES: DealStage[] = ['lead', 'qualified', 'proposal', 'negotiation', 'won', 'lost']

export type ClientOption = { id: string; name: string }

export function DealFormModal({
  open,
  onClose,
  clients,
  deal,
  onSaved,
}: {
  open: boolean
  onClose: () => void
  clients: ClientOption[]
  deal?: Deal | null
  onSaved: (deal: Deal) => void
}) {
  const { t } = useI18n()
  const editing = Boolean(deal)

  const [form, setForm] = useState({
    title: deal?.title ?? '',
    client_id: deal?.client_id ?? '',
    stage: (deal?.stage ?? 'lead') as DealStage,
    amount: String(deal?.amount ?? ''),
    probability: String(deal?.probability ?? ''),
    expected_close_date: deal?.expected_close_date ?? '',
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

    const payload: DealInput = {
      title: form.title.trim(),
      client_id: form.client_id || null,
      stage: form.stage,
      amount: Number(form.amount) || 0,
      probability: Math.max(0, Math.min(100, Number(form.probability) || 0)),
      expected_close_date: form.expected_close_date || null,
    }

    const res = editing ? await editDeal(deal!.id, payload) : await addDeal(payload)
    if (res.error || !res.data) {
      setError(res.error ?? 'Error')
      setPending(false)
      return
    }

    setPending(false)
    onSaved(res.data)
    onClose()
  }

  return (
    <Modal open={open} onClose={onClose} title={t(editing ? 'deals.form.editTitle' : 'deals.form.newTitle')}>
      <form onSubmit={onSubmit} className="space-y-3">
        <div>
          <Label htmlFor="d-title">{t('deals.columns.title')}</Label>
          <Input id="d-title" required value={form.title} onChange={(e) => set('title', e.target.value)} />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label htmlFor="d-client">{t('deals.columns.client')}</Label>
            <Select id="d-client" value={form.client_id} onChange={(e) => set('client_id', e.target.value)}>
              <option value="">{t('deals.form.noClient')}</option>
              {clients.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </Select>
          </div>
          <div>
            <Label htmlFor="d-stage">{t('deals.columns.stage')}</Label>
            <Select id="d-stage" value={form.stage} onChange={(e) => set('stage', e.target.value as DealStage)}>
              {STAGES.map((s) => (
                <option key={s} value={s}>
                  {t(`deals.stage.${s}`)}
                </option>
              ))}
            </Select>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-3">
          <div>
            <Label htmlFor="d-amount">{t('deals.columns.amount')}</Label>
            <Input
              id="d-amount"
              type="number"
              min={0}
              step="0.01"
              value={form.amount}
              onChange={(e) => set('amount', e.target.value)}
            />
          </div>
          <div>
            <Label htmlFor="d-prob">{t('deals.columns.probability')}</Label>
            <Input
              id="d-prob"
              type="number"
              min={0}
              max={100}
              value={form.probability}
              onChange={(e) => set('probability', e.target.value)}
            />
          </div>
          <div>
            <Label htmlFor="d-close">{t('deals.columns.close')}</Label>
            <Input
              id="d-close"
              type="date"
              value={form.expected_close_date}
              onChange={(e) => set('expected_close_date', e.target.value)}
            />
          </div>
        </div>

        {error && <p className="text-[13px] text-danger">{error}</p>}

        <div className="flex justify-end gap-2 pt-2">
          <Button type="button" variant="ghost" onClick={onClose}>
            {t('common.cancel')}
          </Button>
          <Button type="submit" disabled={pending || !form.title.trim()}>
            {pending ? t('common.saving') : t('common.save')}
          </Button>
        </div>
      </form>
    </Modal>
  )
}
