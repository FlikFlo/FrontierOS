'use client'

import { useState } from 'react'
import Link from 'next/link'
import { ArrowLeft, Pencil, FileText } from 'lucide-react'
import { Card, CardHeader, CardTitle, CardContent } from '../ui/card'
import { Badge } from '../ui/badge'
import { Button } from '../ui/button'
import { Table, THead, TBody, TR, TH, TD } from '../ui/table'
import { EntityThread, type AttachmentView } from '../entity-thread'
import { OrderFormModal, type ClientOpt, type ProductOpt } from './order-form-modal'
import { useI18n } from '@/i18n/provider'
import { useRealtime } from '@/lib/use-realtime'
import { formatDate, formatMoney } from '@/lib/utils'

const RT_TABLES = ['orders', 'order_items']
import type { OrderRow } from './orders-view'
import type { Comment, OrderStatus } from '@/types/database'

const STATUS_VARIANT: Record<OrderStatus, 'default' | 'warning' | 'success' | 'danger' | 'accent'> = {
  draft: 'default',
  confirmed: 'accent',
  shipped: 'warning',
  delivered: 'success',
  cancelled: 'danger',
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-3 py-1.5">
      <span className="text-[13px] text-white/40">{label}</span>
      <span className="text-right text-[13px] text-white/80">{children}</span>
    </div>
  )
}

export function OrderDetailView({
  order,
  clients,
  products,
  comments,
  attachments,
}: {
  order: OrderRow
  clients: ClientOpt[]
  products: ProductOpt[]
  comments: Comment[]
  attachments: AttachmentView[]
}) {
  const { t, locale } = useI18n()
  useRealtime(RT_TABLES)
  const [editOpen, setEditOpen] = useState(false)
  const today = new Date().toISOString().slice(0, 10)

  return (
    <div className="space-y-4">
      <Link
        href="/orders"
        className="inline-flex items-center gap-1.5 text-[13px] text-white/45 hover:text-white/80 transition-colors"
      >
        <ArrowLeft size={15} />
        {t('orders.columns.number')}
      </Link>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <h1 className="font-mono text-2xl font-semibold text-white">{order.order_number}</h1>
          <Badge variant={STATUS_VARIANT[order.status]}>{t(`orders.status.${order.status}`)}</Badge>
        </div>
        <div className="flex items-center gap-2">
          <a
            href={`/proforma/${order.id}`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex h-8 items-center gap-1.5 rounded-lg border border-white/15 px-3 text-[13px] font-medium text-white/80 transition-colors hover:bg-white/[0.06] hover:text-white"
          >
            <FileText size={14} />
            {t('orders.proforma')}
          </a>
          <Button size="sm" variant="outline" onClick={() => setEditOpen(true)}>
            <Pencil size={14} />
            {t('common.edit')}
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{t('clients.detail.info')}</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 gap-x-8 sm:grid-cols-2 sm:divide-x sm:divide-white/[0.06]">
          <div className="divide-y divide-white/[0.06] sm:pr-8">
            <Field label={t('orders.columns.client')}>{order.clientName ?? '—'}</Field>
            <Field label={t('orders.columns.date')}>{formatDate(order.order_date, locale)}</Field>
          </div>
          <div className="divide-y divide-white/[0.06]">
            <Field label={t('orders.columns.items')}>{order.itemCount}</Field>
            <Field label={t('orders.columns.total')}>
              <span className="font-mono tabular-nums text-white">
                {formatMoney(order.total, order.currency, locale)}
              </span>
            </Field>
          </div>
        </CardContent>
      </Card>

      <Card className="p-0 overflow-hidden">
        <div className="overflow-x-auto no-scrollbar">
          <Table>
            <THead>
              <TR className="hover:bg-transparent">
                <TH>{t('orders.form.product')}</TH>
                <TH className="text-right">{t('orders.form.qty')}</TH>
                <TH className="text-right">{t('orders.form.price')}</TH>
                <TH className="text-right">{t('orders.columns.total')}</TH>
              </TR>
            </THead>
            <TBody>
              {order.lines.map((l, i) => (
                <TR key={i}>
                  <TD className="text-white/85">{l.description ?? '—'}</TD>
                  <TD className="text-right font-mono tabular-nums text-white/60">{l.quantity}</TD>
                  <TD className="text-right font-mono tabular-nums text-white/60">
                    {formatMoney(l.unit_price, order.currency, locale)}
                  </TD>
                  <TD className="text-right font-mono tabular-nums text-white">
                    {formatMoney(l.quantity * l.unit_price, order.currency, locale)}
                  </TD>
                </TR>
              ))}
            </TBody>
          </Table>
        </div>
      </Card>

      <EntityThread entity="order" entityId={order.id} comments={comments} attachments={attachments} />

      {editOpen && (
        <OrderFormModal
          open
          clients={clients}
          products={products}
          order={order}
          today={today}
          onClose={() => setEditOpen(false)}
        />
      )}
    </div>
  )
}
