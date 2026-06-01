'use client'

import { useState, type FormEvent } from 'react'
import { useRouter } from 'next/navigation'
import { Modal } from '../ui/modal'
import { Button } from '../ui/button'
import { Input, Label, Select, Textarea } from '../ui/input'
import { useI18n } from '@/i18n/provider'
import { addProduct, editProduct, type ProductInput } from '@/app/(app)/products/actions'
import type { Product } from '@/types/database'

export function ProductFormModal({
  open,
  onClose,
  product,
}: {
  open: boolean
  onClose: () => void
  product?: Product | null
}) {
  const { t } = useI18n()
  const router = useRouter()
  const editing = Boolean(product)

  const [form, setForm] = useState({
    name: product?.name ?? '',
    sku: product?.sku ?? '',
    price: String(product?.price ?? ''),
    unit: product?.unit ?? 'pcs',
    active: product?.active ?? true,
    description: product?.description ?? '',
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

    const payload: ProductInput = {
      name: form.name.trim(),
      sku: form.sku.trim() || null,
      description: form.description.trim() || null,
      price: Number(form.price) || 0,
      unit: form.unit.trim() || 'pcs',
      active: form.active,
    }

    const res = editing ? await editProduct(product!.id, payload) : await addProduct(payload)
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
    <Modal open={open} onClose={onClose} title={t(editing ? 'products.form.editTitle' : 'products.form.newTitle')}>
      <form onSubmit={onSubmit} className="space-y-3">
        <div>
          <Label htmlFor="p-name">{t('products.columns.name')}</Label>
          <Input id="p-name" required value={form.name} onChange={(e) => set('name', e.target.value)} />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label htmlFor="p-sku">{t('products.columns.sku')}</Label>
            <Input id="p-sku" value={form.sku} onChange={(e) => set('sku', e.target.value)} />
          </div>
          <div>
            <Label htmlFor="p-state">{t('products.columns.state')}</Label>
            <Select
              id="p-state"
              value={form.active ? 'active' : 'inactive'}
              onChange={(e) => set('active', e.target.value === 'active')}
            >
              <option value="active">{t('products.state.active')}</option>
              <option value="inactive">{t('products.state.inactive')}</option>
            </Select>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label htmlFor="p-price">{t('products.columns.price')} (MAD)</Label>
            <Input
              id="p-price"
              type="number"
              min={0}
              step="0.01"
              value={form.price}
              onChange={(e) => set('price', e.target.value)}
            />
          </div>
          <div>
            <Label htmlFor="p-unit">{t('products.columns.unit')}</Label>
            <Input id="p-unit" value={form.unit} onChange={(e) => set('unit', e.target.value)} />
          </div>
        </div>

        <div>
          <Label htmlFor="p-desc">{t('products.form.description')}</Label>
          <Textarea
            id="p-desc"
            rows={2}
            value={form.description}
            onChange={(e) => set('description', e.target.value)}
          />
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
