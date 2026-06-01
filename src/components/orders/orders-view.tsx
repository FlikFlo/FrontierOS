'use client'

import { Card } from '../ui/card'
import { Badge } from '../ui/badge'
import { Table, THead, TBody, TR, TH, TD } from '../ui/table'
import { ListHeader } from '../list-header'
import { DataState } from '../data-state'
import { useI18n } from '@/i18n/provider'
import { formatDate, formatMoney } from '@/lib/utils'
import type { OrderStatus } from '@/types/database'

export type OrderRow = {
  id: string
  order_number: string
  clientName: string | null
  status: OrderStatus
  order_date: string
  currency: string
  total: number
  itemCount: number
}

type OrdersViewProps =
  | { status: 'unconfigured' }
  | { status: 'error' }
  | { status: 'ok'; rows: OrderRow[] }

const STATUS_VARIANT: Record<OrderStatus, 'default' | 'warning' | 'success' | 'danger' | 'accent'> = {
  draft: 'default',
  confirmed: 'accent',
  shipped: 'warning',
  delivered: 'success',
  cancelled: 'danger',
}

export function OrdersView(props: OrdersViewProps) {
  const { t, locale } = useI18n()
  const rows = props.status === 'ok' ? props.rows : []

  return (
    <div className="space-y-4">
      <ListHeader
        titleKey="nav.orders"
        subtitleKey="pages.orders.subtitle"
        totalKey="orders.total"
        count={props.status === 'ok' ? rows.length : undefined}
      />

      {props.status === 'unconfigured' && <DataState state="unconfigured" />}
      {props.status === 'error' && <DataState state="error" />}
      {props.status === 'ok' && rows.length === 0 && <DataState state="empty" />}

      {props.status === 'ok' && rows.length > 0 && (
        <Card className="p-0 overflow-hidden">
          <div className="overflow-x-auto no-scrollbar">
            <Table>
              <THead>
                <TR className="hover:bg-transparent">
                  <TH>{t('orders.columns.number')}</TH>
                  <TH>{t('orders.columns.client')}</TH>
                  <TH>{t('orders.columns.status')}</TH>
                  <TH>{t('orders.columns.date')}</TH>
                  <TH className="text-right">{t('orders.columns.items')}</TH>
                  <TH className="text-right">{t('orders.columns.total')}</TH>
                </TR>
              </THead>
              <TBody>
                {rows.map((o) => (
                  <TR key={o.id}>
                    <TD className="font-mono text-[13px] font-medium text-white">{o.order_number}</TD>
                    <TD>{o.clientName ?? '—'}</TD>
                    <TD>
                      <Badge variant={STATUS_VARIANT[o.status]}>{t(`orders.status.${o.status}`)}</Badge>
                    </TD>
                    <TD className="text-white/60">{formatDate(o.order_date, locale)}</TD>
                    <TD className="text-right font-mono tabular-nums text-white/60">{o.itemCount}</TD>
                    <TD className="text-right font-mono tabular-nums text-white">
                      {formatMoney(o.total, o.currency, locale)}
                    </TD>
                  </TR>
                ))}
              </TBody>
            </Table>
          </div>
        </Card>
      )}
    </div>
  )
}
