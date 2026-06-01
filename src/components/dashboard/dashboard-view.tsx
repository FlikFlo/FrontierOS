'use client'

import { Card, CardContent, CardHeader, CardTitle } from '../ui/card'
import { DataState } from '../data-state'
import { useI18n } from '@/i18n/provider'
import { formatMoney, cn } from '@/lib/utils'
import type { DealStage } from '@/types/database'

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
  pipeline: { stage: DealStage; count: number; value: number }[]
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

  return (
    <div className="space-y-4">
      {header}

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
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
          label={t('dashboard.kpi.revenue')}
          value={formatMoney(m.revenue, 'MAD', locale)}
          sub={tn('dashboard.kpi.revenueSub', m.ordersCount)}
        />
      </div>

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
    </div>
  )
}
