'use client'

import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card'
import { Badge } from '../ui/badge'
import { DataState } from '../data-state'
import { useI18n } from '@/i18n/provider'
import { useRealtime } from '@/lib/use-realtime'
import { formatMoney, formatDate, cn } from '@/lib/utils'
import type { DealStage } from '@/types/database'

const RT_TABLES = ['deals', 'orders', 'order_items', 'clients', 'products']

export type DashboardMetrics = {
  clientsTotal: number
  clientsActive: number
  productsCount: number
  ordersCount: number
  revenue: number
  openValue: number
  openCount: number
  wonValue: number
  wonCount: number
  winRate: number
  pipeline: { stage: DealStage; count: number; value: number }[]
  revenueByMonth: { month: string; value: number }[]
  topClients: { name: string; value: number }[]
  volume: { casesMonth: number; weightedCasesMonth: number; outlets: number }
  followups: {
    id: string
    title: string
    dueDate: string
    overdue: boolean
    clientName: string | null
    assigneeName: string | null
  }[]
  staleDeals: { id: string; title: string; daysStale: number; ownerName: string | null }[]
}

type DashboardViewProps = { status: 'unconfigured' } | { status: 'ok'; metrics: DashboardMetrics }

const STAGE_BAR: Record<DealStage, string> = {
  lead: 'bg-white/40',
  qualified: 'bg-info',
  proposal: 'bg-warning',
  negotiation: 'bg-primary-light',
  won: 'bg-success',
  lost: 'bg-danger',
}

function Kpi({ label, value, sub }: { label: string; value: string; sub: string }) {
  return (
    <Card>
      <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-white/40">{label}</p>
      <p className="mt-1.5 text-2xl font-semibold text-white tabular-nums">{value}</p>
      <p className="mt-0.5 text-[12px] text-white/40">{sub}</p>
    </Card>
  )
}

export function DashboardView(props: DashboardViewProps) {
  const { t, tn, locale } = useI18n()
  useRealtime(RT_TABLES)

  const header = (
    <div>
      <h1 className="text-2xl font-semibold text-white">{t('nav.dashboard')}</h1>
      <p className="mt-1 text-sm text-white/45">{t('pages.dashboard.subtitle')}</p>
    </div>
  )

  if (props.status === 'unconfigured') {
    return (
      <div className="space-y-4">
        {header}
        <DataState state="unconfigured" />
      </div>
    )
  }

  const m = props.metrics
  const maxValue = Math.max(1, ...m.pipeline.map((p) => p.value))
  const maxRev = Math.max(1, ...m.revenueByMonth.map((r) => r.value))
  const maxClient = Math.max(1, ...m.topClients.map((c) => c.value))
  const tag = locale === 'fr' ? 'fr-MA' : 'en-US'
  const nf = new Intl.NumberFormat(tag)
  const monthLabel = (key: string) => {
    const [y, mm] = key.split('-').map(Number)
    return new Intl.DateTimeFormat(tag, { month: 'short' }).format(new Date(y, mm - 1, 1))
  }

  return (
    <div className="space-y-4">
      {header}

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-3 xl:grid-cols-5">
        <Kpi
          label={t('dashboard.kpi.clients')}
          value={String(m.clientsTotal)}
          sub={t('dashboard.kpi.clientsSub', { n: m.clientsActive })}
        />
        <Kpi
          label={t('dashboard.kpi.pipeline')}
          value={formatMoney(m.openValue, 'MAD', locale)}
          sub={tn('dashboard.kpi.pipelineSub', m.openCount)}
        />
        <Kpi
          label={t('dashboard.kpi.won')}
          value={formatMoney(m.wonValue, 'MAD', locale)}
          sub={tn('dashboard.kpi.wonSub', m.wonCount)}
        />
        <Kpi
          label={t('dashboard.kpi.winRate')}
          value={`${m.winRate}%`}
          sub={tn('dashboard.kpi.wonSub', m.wonCount)}
        />
        <Kpi
          label={t('dashboard.kpi.revenue')}
          value={formatMoney(m.revenue, 'MAD', locale)}
          sub={tn('dashboard.kpi.revenueSub', m.ordersCount)}
        />
      </div>

      <Card className="bg-primary/[0.06]">
        <CardHeader>
          <CardTitle>{t('dashboard.volumeTitle')}</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          <div>
            <p className="text-3xl font-semibold text-white tabular-nums">{nf.format(m.volume.weightedCasesMonth)}</p>
            <p className="mt-0.5 text-[12px] text-white/45">{t('dashboard.volume.weighted')}</p>
          </div>
          <div>
            <p className="text-3xl font-semibold text-white/80 tabular-nums">{nf.format(m.volume.casesMonth)}</p>
            <p className="mt-0.5 text-[12px] text-white/45">{t('dashboard.volume.total')}</p>
          </div>
          <div>
            <p className="text-3xl font-semibold text-white/80 tabular-nums">{nf.format(m.volume.weightedCasesMonth * 12)}</p>
            <p className="mt-0.5 text-[12px] text-white/45">{t('dashboard.volume.annual')}</p>
          </div>
          <div>
            <p className="text-3xl font-semibold text-white/80 tabular-nums">{nf.format(m.volume.outlets)}</p>
            <p className="mt-0.5 text-[12px] text-white/45">{t('dashboard.volume.outlets')}</p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{t('dashboard.pipelineTitle')}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {m.pipeline.map((p) => (
            <div key={p.stage}>
              <div className="mb-1 flex items-center justify-between text-[12px]">
                <span className="flex items-center gap-2 text-white/70">
                  <span className={cn('h-2 w-2 rounded-full', STAGE_BAR[p.stage])} />
                  {t(`deals.stage.${p.stage}`)}
                  <span className="text-white/30">{p.count}</span>
                </span>
                <span className="font-mono tabular-nums text-white/70">
                  {formatMoney(p.value, 'MAD', locale)}
                </span>
              </div>
              <div className="h-1.5 overflow-hidden rounded-full bg-white/[0.06]">
                <div
                  className={cn('h-full rounded-full', STAGE_BAR[p.stage])}
                  style={{ width: `${(p.value / maxValue) * 100}%` }}
                />
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>{t('dashboard.revenueTitle')}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex h-36 items-stretch gap-2">
              {m.revenueByMonth.map((r) => (
                <div key={r.month} className="flex flex-1 flex-col items-center gap-1.5">
                  <div className="flex w-full flex-1 items-end">
                    <div
                      title={formatMoney(r.value, 'MAD', locale)}
                      className="w-full rounded-t bg-gradient-to-t from-primary/40 to-primary-light/70 transition-all"
                      style={{ height: `${Math.max(2, (r.value / maxRev) * 100)}%` }}
                    />
                  </div>
                  <span className="text-[10px] capitalize text-white/40">{monthLabel(r.month)}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>{t('dashboard.topClientsTitle')}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2.5">
            {m.topClients.length === 0 ? (
              <p className="text-[13px] text-white/45">—</p>
            ) : (
              m.topClients.map((c) => (
                <div key={c.name}>
                  <div className="mb-1 flex items-center justify-between text-[12px]">
                    <span className="truncate text-white/75">{c.name}</span>
                    <span className="ml-2 flex-shrink-0 font-mono tabular-nums text-white/70">
                      {formatMoney(c.value, 'MAD', locale)}
                    </span>
                  </div>
                  <div className="h-1.5 overflow-hidden rounded-full bg-white/[0.06]">
                    <div
                      className="h-full rounded-full bg-accent/70"
                      style={{ width: `${(c.value / maxClient) * 100}%` }}
                    />
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>{t('dashboard.followupsTitle')}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-1">
            {m.followups.length === 0 ? (
              <p className="text-[13px] text-white/45">{t('dashboard.followupsEmpty')}</p>
            ) : (
              m.followups.map((f) => (
                <div key={f.id} className="flex items-center justify-between gap-3 py-1.5 text-sm">
                  <div className="min-w-0">
                    <p className="truncate text-white/85">{f.title}</p>
                    <p className="truncate text-[12px] text-white/40">
                      {[f.clientName, f.assigneeName].filter(Boolean).join(' · ') || '—'}
                    </p>
                  </div>
                  <Badge variant={f.overdue ? 'danger' : 'default'}>
                    {f.overdue ? t('dashboard.overdue') : formatDate(f.dueDate, locale)}
                  </Badge>
                </div>
              ))
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>{t('dashboard.staleTitle')}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-1">
            {m.staleDeals.length === 0 ? (
              <p className="text-[13px] text-white/45">{t('dashboard.staleEmpty')}</p>
            ) : (
              m.staleDeals.map((d) => (
                <Link
                  key={d.id}
                  href={`/deals/${d.id}`}
                  className="flex items-center justify-between gap-3 rounded-lg px-1 -mx-1 py-1.5 text-sm transition-colors hover:bg-white/[0.03]"
                >
                  <div className="min-w-0">
                    <p className="truncate text-white/85">{d.title}</p>
                    <p className="truncate text-[12px] text-white/40">{d.ownerName ?? t('common.unassigned')}</p>
                  </div>
                  <Badge variant="warning">{t('dashboard.daysStale', { n: d.daysStale })}</Badge>
                </Link>
              ))
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
