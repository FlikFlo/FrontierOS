'use client'

import { useState, type FormEvent } from 'react'
import { useRouter } from 'next/navigation'
import { Plus, X } from 'lucide-react'
import { Modal } from '../ui/modal'
import { Button } from '../ui/button'
import { Input, Label, Select } from '../ui/input'
import { useI18n } from '@/i18n/provider'
import { formatMoney } from '@/lib/utils'
import { addOrder, editOrder, type OrderInput, type OrderLineInput } from '@/app/(app)/orders/actions'
import type { OrderStatus } from '@/types/database'
import type { OrderRow } from './orders-view'

const STATUSES: OrderStatus[] = ['draft', 'confirmed', 'shipped', 'delivered', 'cancelled']

export type ClientOpt = { id: string; name: string }
export type ProductOpt = { id: string; name: string; price: number }

type LineState = { product_id: string; description: string; quantity: string; unit_price: string }

const emptyLine = (): LineState => ({ product_id: '', description: '', quantity: '1', unit_price: '0' })

export function OrderFormModal({
  open,
  onClose,
  clients,
  products,
  order,
  today,
  nextNumber = '',
}: {
  open: boolean
  onClose: () => void
  clients: ClientOpt[]
  products: ProductOpt[]
  order?: OrderRow | null
  today: string
  nextNumber?: string
}) {
  const { t, locale } = useI18n()
  const router = useRouter()
  const editing = Boolean(order)

  const [form, setForm] = useState({
    order_number: order?.order_number ?? nextNumber,
    client_id: order?.client_id ?? '',
    status: (order?.status ?? 'draft') as OrderStatus,
    order_date: order?.order_date ?? today,
    notes: order?.notes ?? '',
  })
  const [lines, setLines] = useState<LineState[]>(
    order && order.lines.length
      ? order.lines.map((l) => ({
          product_id: l.product_id ?? '',
          description: l.description ?? '',
          quantity: String(l.quantity),
          unit_price: String(l.unit_price),
        }))
      : [emptyLine()]
  )
  const [error, setError] = useState<string | null>(null)
  const [pending, setPending] = useState(false)

  function setField<K extends keyof typeof form>(key: K, value: (typeof form)[K]) {
    setForm((f) => ({ ...f, [key]: value }))
  }

  function setLine(i: number, patch: Partial<LineState>) {
    setLines((ls) => ls.map((l, idx) => (idx === i ? { ...l, ...patch } : l)))
  }

  function onPickProduct(i: number, productId: string) {
    const p = products.find((x) => x.id === productId)
    setLine(i, {
      product_id: productId,
      description: p ? p.name : lines[i].description,
      unit_price: p ? String(p.price) : lines[i].unit_price,
    })
  }

  const total = lines.reduce((s, l) => s + (Number(l.quantity) || 0) * (Number(l.unit_price) || 0), 0)

  async function onSubmit(e: FormEvent) {
    e.preventDefault()
    setError(null)
    setPending(true)

    const input: OrderInput = {
      order_number: form.order_number.trim(),
      client_id: form.client_id || null,
      status: form.status,
      order_date: form.order_date,
      notes: form.notes.trim() || null,
    }
    const payloadLines: OrderLineInput[] = lines
      .filter((l) => (Number(l.quantity) || 0) > 0)
      .map((l) => ({
        product_id: l.product_id || null,
        description: l.description.trim() || null,
        quantity: Number(l.quantity) || 0,
        unit_price: Number(l.unit_price) || 0,
      }))

    const res = editing
      ? await editOrder(order!.id, input, payloadLines)
      : await addOrder(input, payloadLines)
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
    <Modal
      open={open}
      onClose={onClose}
      widthClassName="max-w-2xl"
      title={t(editing ? 'orders.form.editTitle' : 'orders.form.newTitle')}
    >
      <form onSubmit={onSubmit} className="space-y-3">
        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label htmlFor="o-number">{t('orders.form.number')}</Label>
            <Input id="o-number" required value={form.order_number} onChange={(e) => setField('order_number', e.target.value)} />
            {!editing && <p className="mt-1 text-[11px] text-white/35">{t('orders.form.autoNumber')}</p>}
          </div>
          <div>
            <Label htmlFor="o-date">{t('orders.columns.date')}</Label>
            <Input id="o-date" type="date" value={form.order_date} onChange={(e) => setField('order_date', e.target.value)} />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label htmlFor="o-client">{t('orders.columns.client')}</Label>
            <Select id="o-client" value={form.client_id} onChange={(e) => setField('client_id', e.target.value)}>
              <option value="">{t('deals.form.noClient')}</option>
              {clients.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </Select>
          </div>
          <div>
            <Label htmlFor="o-status">{t('orders.columns.status')}</Label>
            <Select id="o-status" value={form.status} onChange={(e) => setField('status', e.target.value as OrderStatus)}>
              {STATUSES.map((s) => (
                <option key={s} value={s}>
                  {t(`orders.status.${s}`)}
                </option>
              ))}
            </Select>
          </div>
        </div>

        <div>
          <div className="mb-1 flex items-center justify-between">
            <Label className="mb-0">{t('orders.form.items')}</Label>
            <button
              type="button"
              onClick={() => setLines((ls) => [...ls, emptyLine()])}
              className="inline-flex items-center gap-1 text-[12px] text-primary-light hover:text-primary"
            >
              <Plus size={13} />
              {t('orders.form.addLine')}
            </button>
          </div>

          <div className="space-y-2">
            {lines.map((l, i) => (
              <div key={i} className="grid grid-cols-12 items-center gap-2">
                <Select
                  className="col-span-4 py-2"
                  value={l.product_id}
                  onChange={(e) => onPickProduct(i, e.target.value)}
                  aria-label={t('orders.form.product')}
                >
                  <option value="">{t('orders.form.noProduct')}</option>
                  {products.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name}
                    </option>
                  ))}
                </Select>
                <Input
                  className="col-span-3 py-2"
                  value={l.description}
                  placeholder={t('orders.form.product')}
                  onChange={(e) => setLine(i, { description: e.target.value })}
                />
                <Input
                  className="col-span-2 py-2 text-right"
                  type="number"
                  min={0}
                  value={l.quantity}
                  aria-label={t('orders.form.qty')}
                  onChange={(e) => setLine(i, { quantity: e.target.value })}
                />
                <Input
                  className="col-span-2 py-2 text-right"
                  type="number"
                  min={0}
                  step="0.01"
                  value={l.unit_price}
                  aria-label={t('orders.form.price')}
                  onChange={(e) => setLine(i, { unit_price: e.target.value })}
                />
                <button
                  type="button"
                  onClick={() => setLines((ls) => ls.filter((_, idx) => idx !== i))}
                  aria-label={t('common.delete')}
                  className="col-span-1 inline-flex h-8 w-8 items-center justify-center rounded-lg text-white/40 hover:bg-danger/10 hover:text-danger"
                >
                  <X size={14} />
                </button>
              </div>
            ))}
          </div>

          <div className="mt-2 flex items-center justify-between border-t border-white/[0.08] pt-2">
            <span className="text-[12px] text-white/45">{t('orders.form.grandTotal')}</span>
            <span className="font-mono text-sm font-semibold tabular-nums text-white">
              {formatMoney(total, 'MAD', locale)}
            </span>
          </div>
        </div>

        {error && <p className="text-[13px] text-danger">{error}</p>}

        <div className="flex justify-end gap-2 pt-1">
          <Button type="button" variant="ghost" onClick={onClose}>
            {t('common.cancel')}
          </Button>
          <Button type="submit" disabled={pending || !form.order_number.trim()}>
            {pending ? t('common.saving') : t('common.save')}
          </Button>
        </div>
      </form>
    </Modal>
  )
}
