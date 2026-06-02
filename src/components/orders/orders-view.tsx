'use client'

import { useMemo, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Plus, Pencil, Trash2 } from 'lucide-react'
import { Card } from '../ui/card'
import { Badge } from '../ui/badge'
import { Button } from '../ui/button'
import { Table, THead, TBody, TR, TH, TD } from '../ui/table'
import { ConfirmDialog } from '../ui/confirm-dialog'
import { DataState } from '../data-state'
import { OrderFormModal, type ClientOpt, type ProductOpt } from './order-form-modal'
import { FilterSelect, Pager, SearchInput, SortHeader, useListControls } from '../list-controls'
import { useI18n } from '@/i18n/provider'
import { formatDate, formatMoney } from '@/lib/utils'
import { removeOrder } from '@/app/(app)/orders/actions'
import type { OrderStatus } from '@/types/database'

export type OrderLine = {
  product_id: string | null
  description: string | null
  quantity: number
  unit_price: number
}

export type OrderRow = {
  id: string
  order_number: string
  client_id: string | null
  clientName: string | null
  status: OrderStatus
  order_date: string
  currency: string
  notes: string | null
  total: number
  itemCount: number
  lines: OrderLine[]
}

type OrdersViewProps =
  | { status: 'unconfigured' }
  | { status: 'error' }
  | { status: 'ok'; rows: OrderRow[]; clients: ClientOpt[]; products: ProductOpt[] }

const STATUS_VARIANT: Record<OrderStatus, 'default' | 'warning' | 'success' | 'danger' | 'accent'> = {
  draft: 'default',
  confirmed: 'accent',
  shipped: 'warning',
  delivered: 'success',
  cancelled: 'danger',
}

const NO_OPTS: never[] = []
const ORDER_STATUSES: OrderStatus[] = ['draft', 'confirmed', 'shipped', 'delivered', 'cancelled']
const NO_ROWS: OrderRow[] = []

const orderSearch = (o: OrderRow) => `${o.order_number} ${o.clientName ?? ''}`
const ORDER_SORTS: Record<string, (o: OrderRow) => string | number> = {
  number: (o) => o.order_number.toLowerCase(),
  client: (o) => (o.clientName ?? '').toLowerCase(),
  status: (o) => o.status,
  date: (o) => o.order_date,
  items: (o) => o.itemCount,
  total: (o) => o.total,
}

export function OrdersView(props: OrdersViewProps) {
  const { t, locale } = useI18n()
  const router = useRouter()
  const rows = props.status === 'ok' ? props.rows : NO_ROWS
  const [statusFilter, setStatusFilter] = useState('all')
  const visible = useMemo(
    () => (statusFilter === 'all' ? rows : rows.filter((o) => o.status === statusFilter)),
    [rows, statusFilter],
  )
  const ctrl = useListControls(visible, orderSearch, ORDER_SORTS, 'date', 'desc')
  const clients = props.status === 'ok' ? props.clients : (NO_OPTS as ClientOpt[])
  const products = props.status === 'ok' ? props.products : (NO_OPTS as ProductOpt[])
  const today = new Date().toISOString().slice(0, 10)

  const [form, setForm] = useState<{ open: boolean; order: OrderRow | null }>({ open: false, order: null })
  const [toDelete, setToDelete] = useState<OrderRow | null>(null)
  const [deleting, setDeleting] = useState(false)

  async function confirmDelete() {
    if (!toDelete) return
    setDeleting(true)
    await removeOrder(toDelete.id)
    setDeleting(false)
    setToDelete(null)
    router.refresh()
  }

  return (
    <div className="space-y-4">
      <div className="flex items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold text-white">{t('nav.orders')}</h1>
          <p className="mt-1 text-sm text-white/45">{t('pages.orders.subtitle')}</p>
        </div>
        <div className="flex items-center gap-2">
          {props.status === 'ok' && rows.length > 0 && (
            <Badge variant="accent">{t('orders.total', { count: rows.length })}</Badge>
          )}
          {props.status === 'ok' && (
            <Button size="sm" onClick={() => setForm({ open: true, order: null })}>
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
              value={statusFilter}
              onChange={setStatusFilter}
              options={[
                { value: 'all', label: t('common.all') },
                ...ORDER_STATUSES.map((s) => ({ value: s, label: t(`orders.status.${s}`) })),
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
                        <SortHeader label={t('orders.columns.number')} sortKey="number" current={ctrl.sortKey} dir={ctrl.dir} onSort={ctrl.onSort} />
                      </TH>
                      <TH>
                        <SortHeader label={t('orders.columns.client')} sortKey="client" current={ctrl.sortKey} dir={ctrl.dir} onSort={ctrl.onSort} />
                      </TH>
                      <TH>
                        <SortHeader label={t('orders.columns.status')} sortKey="status" current={ctrl.sortKey} dir={ctrl.dir} onSort={ctrl.onSort} />
                      </TH>
                      <TH>
                        <SortHeader label={t('orders.columns.date')} sortKey="date" current={ctrl.sortKey} dir={ctrl.dir} onSort={ctrl.onSort} />
                      </TH>
                      <TH className="text-right">
                        <SortHeader label={t('orders.columns.items')} sortKey="items" current={ctrl.sortKey} dir={ctrl.dir} onSort={ctrl.onSort} align="right" />
                      </TH>
                      <TH className="text-right">
                        <SortHeader label={t('orders.columns.total')} sortKey="total" current={ctrl.sortKey} dir={ctrl.dir} onSort={ctrl.onSort} align="right" />
                      </TH>
                      <TH className="text-right">{t('common.actions')}</TH>
                    </TR>
                  </THead>
                  <TBody>
                    {ctrl.pageRows.map((o) => (
                  <TR key={o.id}>
                    <TD className="font-mono text-[13px] font-medium">
                      <Link href={`/orders/${o.id}`} className="text-white hover:text-primary-light transition-colors">
                        {o.order_number}
                      </Link>
                    </TD>
                    <TD>{o.clientName ?? '—'}</TD>
                    <TD>
                      <Badge variant={STATUS_VARIANT[o.status]}>{t(`orders.status.${o.status}`)}</Badge>
                    </TD>
                    <TD className="text-white/60">{formatDate(o.order_date, locale)}</TD>
                    <TD className="text-right font-mono tabular-nums text-white/60">{o.itemCount}</TD>
                    <TD className="text-right font-mono tabular-nums text-white">
                      {formatMoney(o.total, o.currency, locale)}
                    </TD>
                    <TD className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => setForm({ open: true, order: o })}
                          aria-label={t('common.edit')}
                          className="inline-flex h-7 w-7 items-center justify-center rounded-lg text-white/40 hover:bg-white/[0.06] hover:text-white transition-colors"
                        >
                          <Pencil size={14} />
                        </button>
                        <button
                          onClick={() => setToDelete(o)}
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
        <OrderFormModal
          key={form.order?.id ?? 'new'}
          open
          clients={clients}
          products={products}
          order={form.order}
          today={today}
          onClose={() => setForm({ open: false, order: null })}
        />
      )}

      <ConfirmDialog
        open={Boolean(toDelete)}
        title={t('orders.delete.title')}
        body={toDelete ? t('orders.delete.body', { number: toDelete.order_number }) : undefined}
        confirmLabel={deleting ? t('common.saving') : t('common.delete')}
        cancelLabel={t('common.cancel')}
        onConfirm={confirmDelete}
        onCancel={() => setToDelete(null)}
      />
    </div>
  )
}
