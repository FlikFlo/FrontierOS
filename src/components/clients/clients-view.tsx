'use client'

import { Card, CardContent, CardHeader, CardTitle } from '../ui/card'
import { Badge } from '../ui/badge'
import { Table, THead, TBody, TR, TH, TD } from '../ui/table'
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
 * (typed Supabase client) and hands them here; this component owns layout,
 * i18n and the empty / not-configured / error states.
 */
export function ClientsView(props: ClientsViewProps) {
  const { t } = useI18n()
  const rows = props.status === 'ok' ? props.rows : []

  return (
    <div className="space-y-4">
      <div className="flex items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold text-white">{t('nav.clients')}</h1>
          <p className="mt-1 text-sm text-white/45">{t('pages.clients.subtitle')}</p>
        </div>
        {props.status === 'ok' && rows.length > 0 && (
          <Badge variant="accent">{t('clients.total', { count: rows.length })}</Badge>
        )}
      </div>

      {props.status === 'unconfigured' && (
        <Card>
          <CardHeader>
            <CardTitle>{t('clients.unconfigured.title')}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-[13px] leading-relaxed text-white/50">{t('clients.unconfigured.body')}</p>
          </CardContent>
        </Card>
      )}

      {props.status === 'error' && (
        <Card>
          <CardContent>
            <p className="text-[13px] leading-relaxed text-danger">{t('clients.error')}</p>
          </CardContent>
        </Card>
      )}

      {props.status === 'ok' && rows.length === 0 && (
        <Card>
          <CardHeader>
            <CardTitle>{t('clients.empty.title')}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-[13px] leading-relaxed text-white/50">{t('clients.empty.body')}</p>
          </CardContent>
        </Card>
      )}

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
