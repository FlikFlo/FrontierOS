'use client'

import { Card } from '../ui/card'
import { Badge } from '../ui/badge'
import { Table, THead, TBody, TR, TH, TD } from '../ui/table'
import { ListHeader } from '../list-header'
import { DataState } from '../data-state'
import { useI18n } from '@/i18n/provider'
import { formatMoney } from '@/lib/utils'
import type { Product } from '@/types/database'

type ProductsViewProps =
  | { status: 'unconfigured' }
  | { status: 'error' }
  | { status: 'ok'; rows: Product[] }

export function ProductsView(props: ProductsViewProps) {
  const { t, locale } = useI18n()
  const rows = props.status === 'ok' ? props.rows : []

  return (
    <div className="space-y-4">
      <ListHeader
        titleKey="nav.products"
        subtitleKey="pages.products.subtitle"
        totalKey="products.total"
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
                  <TH>{t('products.columns.sku')}</TH>
                  <TH>{t('products.columns.name')}</TH>
                  <TH className="text-right">{t('products.columns.price')}</TH>
                  <TH>{t('products.columns.unit')}</TH>
                  <TH>{t('products.columns.state')}</TH>
                </TR>
              </THead>
              <TBody>
                {rows.map((p) => (
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
