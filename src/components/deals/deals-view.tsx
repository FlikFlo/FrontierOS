'use client'

import { Card } from '../ui/card'
import { Badge } from '../ui/badge'
import { Table, THead, TBody, TR, TH, TD } from '../ui/table'
import { ListHeader } from '../list-header'
import { DataState } from '../data-state'
import { useI18n } from '@/i18n/provider'
import { formatDate, formatMoney } from '@/lib/utils'
import type { Deal, DealStage } from '@/types/database'

export type DealRow = Deal & { clientName: string | null }

type DealsViewProps =
  | { status: 'unconfigured' }
  | { status: 'error' }
  | { status: 'ok'; rows: DealRow[] }

const STAGE_VARIANT: Record<DealStage, 'default' | 'warning' | 'success' | 'danger'> = {
  lead: 'default',
  qualified: 'default',
  proposal: 'warning',
  negotiation: 'warning',
  won: 'success',
  lost: 'danger',
}

export function DealsView(props: DealsViewProps) {
  const { t, locale } = useI18n()
  const rows = props.status === 'ok' ? props.rows : []

  return (
    <div className="space-y-4">
      <ListHeader
        titleKey="nav.deals"
        subtitleKey="pages.deals.subtitle"
        totalKey="deals.total"
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
                  <TH>{t('deals.columns.title')}</TH>
                  <TH>{t('deals.columns.client')}</TH>
                  <TH>{t('deals.columns.stage')}</TH>
                  <TH className="text-right">{t('deals.columns.amount')}</TH>
                  <TH className="text-right">{t('deals.columns.probability')}</TH>
                  <TH>{t('deals.columns.close')}</TH>
                </TR>
              </THead>
              <TBody>
                {rows.map((d) => (
                  <TR key={d.id}>
                    <TD className="font-medium text-white">{d.title}</TD>
                    <TD>{d.clientName ?? '—'}</TD>
                    <TD>
                      <Badge variant={STAGE_VARIANT[d.stage]}>{t(`deals.stage.${d.stage}`)}</Badge>
                    </TD>
                    <TD className="text-right font-mono tabular-nums text-white">
                      {formatMoney(d.amount, d.currency, locale)}
                    </TD>
                    <TD className="text-right font-mono tabular-nums text-white/60">{d.probability}%</TD>
                    <TD className="text-white/60">{formatDate(d.expected_close_date, locale)}</TD>
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
