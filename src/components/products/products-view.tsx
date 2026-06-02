'use client'

import { useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Plus, Pencil, Trash2 } from 'lucide-react'
import { Card } from '../ui/card'
import { Badge } from '../ui/badge'
import { Button } from '../ui/button'
import { Table, THead, TBody, TR, TH, TD } from '../ui/table'
import { ConfirmDialog } from '../ui/confirm-dialog'
import { DataState } from '../data-state'
import { ProductFormModal } from './product-form-modal'
import { FilterSelect, Pager, SearchInput, SortHeader, useListControls } from '../list-controls'
import { useI18n } from '@/i18n/provider'
import { useRealtime } from '@/lib/use-realtime'
import { formatMoney } from '@/lib/utils'
import { removeProduct } from '@/app/(app)/products/actions'
import type { Product } from '@/types/database'

const RT_TABLES = ['products']

type ProductsViewProps =
  | { status: 'unconfigured' }
  | { status: 'error' }
  | { status: 'ok'; rows: Product[] }

const productSearch = (p: Product) => `${p.name} ${p.sku ?? ''}`
const NO_ROWS: Product[] = []
const PRODUCT_SORTS: Record<string, (p: Product) => string | number> = {
  sku: (p) => (p.sku ?? '').toLowerCase(),
  name: (p) => p.name.toLowerCase(),
  price: (p) => p.price,
  unit: (p) => p.unit,
  state: (p) => (p.active ? 1 : 0),
}

export function ProductsView(props: ProductsViewProps) {
  const { t, locale } = useI18n()
  const router = useRouter()
  useRealtime(RT_TABLES)
  const rows = props.status === 'ok' ? props.rows : NO_ROWS
  const [stateFilter, setStateFilter] = useState('all')
  const visible = useMemo(
    () =>
      stateFilter === 'all' ? rows : rows.filter((p) => p.active === (stateFilter === 'active')),
    [rows, stateFilter],
  )
  const ctrl = useListControls(visible, productSearch, PRODUCT_SORTS, 'name')

  const [form, setForm] = useState<{ open: boolean; product: Product | null }>({ open: false, product: null })
  const [toDelete, setToDelete] = useState<Product | null>(null)
  const [deleting, setDeleting] = useState(false)

  async function confirmDelete() {
    if (!toDelete) return
    setDeleting(true)
    await removeProduct(toDelete.id)
    setDeleting(false)
    setToDelete(null)
    router.refresh()
  }

  return (
    <div className="space-y-4">
      <div className="flex items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold text-white">{t('nav.products')}</h1>
          <p className="mt-1 text-sm text-white/45">{t('pages.products.subtitle')}</p>
        </div>
        <div className="flex items-center gap-2">
          {props.status === 'ok' && rows.length > 0 && (
            <Badge variant="accent">{t('products.total', { count: rows.length })}</Badge>
          )}
          {props.status === 'ok' && (
            <Button size="sm" onClick={() => setForm({ open: true, product: null })}>
              <Plus size={15} />
              {t('common.new')}
            </Button>
          )}
        </div>
      </div>

      {props.status === 'unconfigured' && <DataState state="unconfigured" />}
      {props.status === 'error' && <DataState state="error" />}
      {props.status === 'ok' && rows.length === 0 && <DataState state="empty" />}

      {props.status === 'ok' && rows.length > 0 && (
        <>
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
            <SearchInput value={ctrl.query} onChange={ctrl.setQuery} />
            <FilterSelect
              value={stateFilter}
              onChange={setStateFilter}
              options={[
                { value: 'all', label: t('common.all') },
                { value: 'active', label: t('products.state.active') },
                { value: 'inactive', label: t('products.state.inactive') },
              ]}
            />
          </div>
          {ctrl.rows.length === 0 ? (
            <Card>
              <p className="text-[13px] text-white/45">{t('common.noResults')}</p>
            </Card>
          ) : (
            <Card className="p-0 overflow-hidden">
              <div className="overflow-x-auto no-scrollbar">
                <Table>
                  <THead>
                    <TR className="hover:bg-transparent">
                      <TH>
                        <SortHeader label={t('products.columns.sku')} sortKey="sku" current={ctrl.sortKey} dir={ctrl.dir} onSort={ctrl.onSort} />
                      </TH>
                      <TH>
                        <SortHeader label={t('products.columns.name')} sortKey="name" current={ctrl.sortKey} dir={ctrl.dir} onSort={ctrl.onSort} />
                      </TH>
                      <TH className="text-right">
                        <SortHeader label={t('products.columns.price')} sortKey="price" current={ctrl.sortKey} dir={ctrl.dir} onSort={ctrl.onSort} align="right" />
                      </TH>
                      <TH>
                        <SortHeader label={t('products.columns.unit')} sortKey="unit" current={ctrl.sortKey} dir={ctrl.dir} onSort={ctrl.onSort} />
                      </TH>
                      <TH>
                        <SortHeader label={t('products.columns.state')} sortKey="state" current={ctrl.sortKey} dir={ctrl.dir} onSort={ctrl.onSort} />
                      </TH>
                      <TH className="text-right">{t('common.actions')}</TH>
                    </TR>
                  </THead>
                  <TBody>
                    {ctrl.pageRows.map((p) => (
                  <TR key={p.id}>
                    <TD className="font-mono text-[13px] text-white/60">{p.sku ?? '—'}</TD>
                    <TD className="font-medium text-white">{p.name}</TD>
                    <TD className="text-right font-mono tabular-nums text-white">
                      {formatMoney(p.price, p.currency, locale)}
                    </TD>
                    <TD className="text-white/60">{p.unit}</TD>
                    <TD>
                      <Badge variant={p.active ? 'success' : 'default'}>
                        {t(`products.state.${p.active ? 'active' : 'inactive'}`)}
                      </Badge>
                    </TD>
                    <TD className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => setForm({ open: true, product: p })}
                          aria-label={t('common.edit')}
                          className="inline-flex h-7 w-7 items-center justify-center rounded-lg text-white/40 hover:bg-white/[0.06] hover:text-white transition-colors"
                        >
                          <Pencil size={14} />
                        </button>
                        <button
                          onClick={() => setToDelete(p)}
                          aria-label={t('common.delete')}
                          className="inline-flex h-7 w-7 items-center justify-center rounded-lg text-white/40 hover:bg-danger/10 hover:text-danger transition-colors"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </TD>
                  </TR>
                    ))}
                  </TBody>
                </Table>
              </div>
              <Pager page={ctrl.page} pageCount={ctrl.pageCount} onPage={ctrl.setPage} />
            </Card>
          )}
        </>
      )}

      {form.open && (
        <ProductFormModal
          key={form.product?.id ?? 'new'}
          open
          product={form.product}
          onClose={() => setForm({ open: false, product: null })}
        />
      )}

      <ConfirmDialog
        open={Boolean(toDelete)}
        title={t('products.delete.title')}
        body={toDelete ? t('products.delete.body', { name: toDelete.name }) : undefined}
        confirmLabel={deleting ? t('common.saving') : t('common.delete')}
        cancelLabel={t('common.cancel')}
        onConfirm={confirmDelete}
        onCancel={() => setToDelete(null)}
      />
    </div>
  )
}
