'use client'

import { Card } from '../ui/card'
import { Badge } from '../ui/badge'
import { Table, THead, TBody, TR, TH, TD } from '../ui/table'
import { ListHeader } from '../list-header'
import { DataState } from '../data-state'
import { useI18n } from '@/i18n/provider'
import type { Client, ClientStatus } from '@/types/database'

type ClientsViewProps =
  | { status: 'unconfigured' }
  | { status: 'error' }
  | { status: 'ok'; rows: Client[] }

const STATUS_VARIANT: Record<ClientStatus, 'success' | 'warning' | 'default'> = {
  active: 'success',
  lead: 'warning',
  inactive: 'default',
}

/**
 * ClientsView — presentational client list. The server page fetches the rows
 * (typed Supabase client) and hands them here; this owns layout, i18n and the
 * empty / not-configured / error states.
 */
export function ClientsView(props: ClientsViewProps) {
  const { t } = useI18n()
  const rows = props.status === 'ok' ? props.rows : []

  return (
    <div className="space-y-4">
      <ListHeader
        titleKey="nav.clients"
        subtitleKey="pages.clients.subtitle"
        totalKey="clients.total"
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
                  <TH>{t('clients.columns.name')}</TH>
                  <TH>{t('clients.columns.industry')}</TH>
                  <TH>{t('clients.columns.email')}</TH>
                  <TH>{t('clients.columns.phone')}</TH>
                  <TH>{t('clients.columns.status')}</TH>
                </TR>
              </THead>
              <TBody>
                {rows.map((c) => (
                  <TR key={c.id}>
                    <TD className="font-medium text-white">{c.name}</TD>
                    <TD>{c.industry ?? '—'}</TD>
                    <TD className="font-mono text-[13px] text-white/60">{c.email ?? '—'}</TD>
                    <TD className="font-mono text-[13px] text-white/60">{c.phone ?? '—'}</TD>
                    <TD>
                      <Badge variant={STATUS_VARIANT[c.status]}>{t(`clients.status.${c.status}`)}</Badge>
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
