'use client'

import { useState } from 'react'
import { Page, PageHeader } from '@/components/ui/Page'
import { Card } from '@/components/ui/Card'
import { Stat } from '@/components/ui/Stat'
import { Tabs } from '@/components/ui/Tabs'
import { Badge } from '@/components/ui/Badge'

type Period = '3m' | '6m' | '12m'

// ─── Mock data ────────────────────────────────────────────────────────────────

const MONTHLY: Record<Period, { month: string; vol: number; batches: number; cost: number }[]> = {
  '3m': [
    { month: 'Мар', vol: 120, batches: 4, cost: 5200 },
    { month: 'Апр', vol: 175, batches: 6, cost: 7100 },
    { month: 'Май', vol: 210, batches: 7, cost: 8400 },
  ],
  '6m': [
    { month: 'Дек', vol:  80, batches: 3, cost: 3600 },
    { month: 'Янв', vol: 100, batches: 3, cost: 4200 },
    { month: 'Фев', vol: 130, batches: 4, cost: 5100 },
    { month: 'Мар', vol: 120, batches: 4, cost: 5200 },
    { month: 'Апр', vol: 175, batches: 6, cost: 7100 },
    { month: 'Май', vol: 210, batches: 7, cost: 8400 },
  ],
  '12m': [
    { month: 'Июн', vol:  60, batches: 2, cost: 2400 },
    { month: 'Июл', vol:  70, batches: 2, cost: 2900 },
    { month: 'Авг', vol:  75, batches: 2, cost: 3100 },
    { month: 'Сен', vol:  90, batches: 3, cost: 3800 },
    { month: 'Окт', vol: 100, batches: 3, cost: 4000 },
    { month: 'Ноя', vol:  95, batches: 3, cost: 3900 },
    { month: 'Дек', vol:  80, batches: 3, cost: 3600 },
    { month: 'Янв', vol: 100, batches: 3, cost: 4200 },
    { month: 'Фев', vol: 130, batches: 4, cost: 5100 },
    { month: 'Мар', vol: 120, batches: 4, cost: 5200 },
    { month: 'Апр', vol: 175, batches: 6, cost: 7100 },
    { month: 'Май', vol: 210, batches: 7, cost: 8400 },
  ],
}

const STYLES = [
  { label: 'IPA / NEIPA',  vol: 420, color: '#fbbf24' },
  { label: 'Stout',        vol: 200, color: '#7c3aed' },
  { label: 'Lager / Pils', vol: 280, color: '#60a5fa' },
  { label: 'Kombucha',     vol:  80, color: '#34d399' },
  { label: 'Lemonade',     vol:  60, color: '#f97316' },
  { label: 'Другие',       vol: 120, color: '#6b7280' },
]

const BATCHES = [
  { name: 'West Coast IPA',  batch: '#042', vol: 25, og: 1.068, abv: null,  eff: 82, cost_l: 44, status: 'fermenting' },
  { name: 'Oatmeal Stout',   batch: '#041', vol: 20, og: 1.072, abv: 7.3,   eff: 78, cost_l: 58, status: 'conditioning' },
  { name: 'Belgian Tripel',  batch: '#040', vol: 25, og: 1.082, abv: 9.4,   eff: 85, cost_l: 72, status: 'ready' },
  { name: 'Pilsner Classic', batch: '#039', vol: 30, og: 1.048, abv: 5.0,   eff: 80, cost_l: 36, status: 'ready' },
  { name: 'Манго Комбуча',   batch: '#K01', vol: 10, og: 1.030, abv: null,  eff: null, cost_l: 28, status: 'fermenting' },
]

// ─── Bar Chart ────────────────────────────────────────────────────────────────

function BarChart({ data, field, color, unit }: {
  data: { month: string; vol: number; batches: number; cost: number }[]
  field: 'vol' | 'batches' | 'cost'
  color: string
  unit: string
}) {
  const [hover, setHover] = useState<number | null>(null)
  const values = data.map(d => d[field] as number)
  const max = Math.max(...values)
  const W = 600, H = 150, padL = 44, padR = 12, padT = 14, padB = 28
  const cW = W - padL - padR, cH = H - padT - padB
  const gap = cW / data.length
  const barW = Math.max(18, gap * 0.58)
  const yTicks = [0, Math.round(max * 0.5), max]

  return (
    <svg viewBox={`0 0 ${W} ${H}`} style={{ width: '100%', overflow: 'visible' }}>
      {yTicks.map((v, i) => {
        const y = padT + ((max - v) / max) * cH
        return (
          <g key={i}>
            <line x1={padL} y1={y} x2={W - padR} y2={y} stroke="var(--hairline)" strokeWidth="0.7" />
            <text x={padL - 6} y={y + 4} textAnchor="end" fontSize="9" fill="var(--t-4)" fontFamily="ui-monospace,monospace">
              {v >= 1000 ? `${(v / 1000).toFixed(0)}k` : v}
            </text>
          </g>
        )
      })}
      {data.map((d, i) => {
        const v = d[field] as number
        const barH = Math.max(2, (v / max) * cH)
        const x = padL + i * gap + (gap - barW) / 2
        const y = padT + cH - barH
        const isHov = hover === i
        return (
          <g key={i} style={{ cursor: 'pointer' }}
             onMouseEnter={() => setHover(i)} onMouseLeave={() => setHover(null)}>
            <rect x={x} y={padT} width={barW} height={cH} fill="transparent" />
            <rect x={x} y={y} width={barW} height={barH} rx="3" fill={color}
                  opacity={isHov ? 1 : 0.72} style={{ transition: 'opacity .12s' }} />
            {isHov && (
              <text x={x + barW / 2} y={y - 5} textAnchor="middle" fontSize="9" fontWeight="700"
                    fill="var(--t-1)" fontFamily="ui-monospace,monospace">
                {v}{unit && ` ${unit}`}
              </text>
            )}
            <text x={x + barW / 2} y={padT + cH + 16} textAnchor="middle" fontSize="9" fill="var(--t-4)">
              {d.month}
            </text>
          </g>
        )
      })}
    </svg>
  )
}

// ─── Donut Chart ──────────────────────────────────────────────────────────────

function DonutChart({ data }: { data: typeof STYLES }) {
  const [hover, setHover] = useState<number | null>(null)
  const total = data.reduce((s, d) => s + d.vol, 0)
  const R = 64, r = 40, cx = 80, cy = 80

  let angle = -Math.PI / 2
  const slices = data.map((d, i) => {
    const pct = d.vol / total
    const start = angle
    const end = angle + pct * Math.PI * 2
    angle = end
    const x1 = cx + R * Math.cos(start), y1 = cy + R * Math.sin(start)
    const x2 = cx + R * Math.cos(end),   y2 = cy + R * Math.sin(end)
    const ix1 = cx + r * Math.cos(start), iy1 = cy + r * Math.sin(start)
    const ix2 = cx + r * Math.cos(end),   iy2 = cy + r * Math.sin(end)
    const lg = pct > 0.5 ? 1 : 0
    const path = `M ${x1} ${y1} A ${R} ${R} 0 ${lg} 1 ${x2} ${y2} L ${ix2} ${iy2} A ${r} ${r} 0 ${lg} 0 ${ix1} ${iy1} Z`
    return { ...d, path, pct }
  })

  const hov = hover !== null ? slices[hover] : null

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 20, flexWrap: 'wrap' }}>
      <svg viewBox={`0 0 ${cx * 2} ${cy * 2}`} style={{ width: 160, flexShrink: 0 }}>
        {slices.map((s, i) => (
          <path key={i} d={s.path} fill={s.color}
                opacity={hover === null || hover === i ? 1 : 0.35}
                style={{ cursor: 'pointer', transition: 'opacity .15s' }}
                onMouseEnter={() => setHover(i)} onMouseLeave={() => setHover(null)} />
        ))}
        <text x={cx} y={cy - 6} textAnchor="middle" fontSize="18" fontWeight="700" fill="var(--t-1)" fontFamily="ui-monospace,monospace">
          {hov ? hov.vol : total}
        </text>
        <text x={cx} y={cy + 10} textAnchor="middle" fontSize="8" fill="var(--t-3)" fontFamily="system-ui">
          {hov ? hov.label.split(' ')[0] : 'литров'}
        </text>
      </svg>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 7, flex: 1, minWidth: 0 }}>
        {slices.map((s, i) => (
          <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}
               onMouseEnter={() => setHover(i)} onMouseLeave={() => setHover(null)}>
            <span style={{ width: 9, height: 9, borderRadius: 2, background: s.color, flexShrink: 0 }} />
            <span style={{ fontSize: 11.5, color: hover === i ? 'var(--t-1)' : 'var(--t-2)', flex: 1, fontWeight: hover === i ? 600 : 400 }}>{s.label}</span>
            <span className="t-mono" style={{ fontSize: 10.5, color: 'var(--t-3)' }}>{Math.round(s.pct * 100)}%</span>
          </div>
        ))}
      </div>
    </div>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function AnalyticsPage() {
  const [period, setPeriod] = useState<Period>('6m')
  const data = MONTHLY[period]
  const totalVol = data.reduce((s, d) => s + d.vol, 0)
  const totalBatches = data.reduce((s, d) => s + d.batches, 0)
  const totalCost = data.reduce((s, d) => s + d.cost, 0)
  const avgCostL = Math.round(totalCost / totalVol)
  const prev3 = MONTHLY['3m']
  const prev3Vol = prev3.reduce((s, d) => s + d.vol, 0)

  const statusTone: Record<string, 'neutral'|'ok'|'info'|'accent'|'warn'> = {
    ready: 'ok', fermenting: 'info', conditioning: 'accent', planned: 'neutral',
  }

  return (
    <Page>
      <PageHeader title="Аналитика" subtitle="Производство, себестоимость, эффективность" />

      {/* KPIs */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 14 }}>
        <Stat label="Объём за период" value={`${totalVol} л`}
              trend={{ value: `+${Math.round(((210 - 120) / 120) * 100)}%`, direction: 'up' }} />
        <Stat label="Партий" value={totalBatches} sub={`за ${period}`} />
        <Stat label="Себест. литра" value={`${avgCostL} ₽`} sub="ср. по периоду" />
        <Stat label="Затраты" value={`${(totalCost / 1000).toFixed(0)}k ₽`} />
      </div>

      <Tabs<Period>
        value={period} onChange={setPeriod} size="md"
        items={[
          { value: '3m',  label: '3 мес' },
          { value: '6m',  label: '6 мес' },
          { value: '12m', label: '12 мес' },
        ]}
      />

      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0,1fr) 320px', gap: 20 }}>
        {/* Bar charts */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <Card pad="md">
            <p className="t-eyebrow" style={{ marginBottom: 12 }}>Объём производства, л</p>
            <BarChart data={data} field="vol" color="var(--accent)" unit="л" />
          </Card>
          <Card pad="md">
            <p className="t-eyebrow" style={{ marginBottom: 12 }}>Количество партий</p>
            <BarChart data={data} field="batches" color="var(--info)" unit="" />
          </Card>
          <Card pad="md">
            <p className="t-eyebrow" style={{ marginBottom: 12 }}>Затраты, ₽</p>
            <BarChart data={data} field="cost" color="#a78bfa" unit="₽" />
          </Card>
        </div>

        {/* Right column */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <Card pad="md">
            <p className="t-eyebrow" style={{ marginBottom: 14 }}>По стилям</p>
            <DonutChart data={STYLES} />
          </Card>

          <Card pad="md">
            <p className="t-eyebrow" style={{ marginBottom: 12 }}>Партии</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {BATCHES.map(b => (
                <div key={b.batch} style={{
                  padding: '10px 12px', borderRadius: 'var(--r-sm)',
                  background: 'var(--surface-2)', border: '1px solid var(--hairline)',
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 7 }}>
                    <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--t-1)', flex: 1 }}>{b.name}</span>
                    <Badge tone={statusTone[b.status] ?? 'neutral'}>
                      {b.status === 'ready' ? 'Готов' : b.status === 'fermenting' ? 'Брожение' : 'Кондиц.'}
                    </Badge>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 3 }}>
                    {[
                      { l: 'OG',   v: b.og.toFixed(3) },
                      { l: 'ABV',  v: b.abv ? `${b.abv}%` : '—' },
                      { l: 'Выход', v: b.eff ? `${b.eff}%` : '—' },
                      { l: '₽/л',  v: `${b.cost_l}` },
                    ].map(it => (
                      <div key={it.l} style={{ textAlign: 'center', padding: '4px 0' }}>
                        <p style={{ fontSize: 8, color: 'var(--t-4)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>{it.l}</p>
                        <p className="t-mono" style={{ fontSize: 12, fontWeight: 700, color: 'var(--t-1)', marginTop: 2 }}>{it.v}</p>
                      </div>
                    ))}
                  </div>
                  {b.eff != null && (
                    <div className="progress" style={{ height: 3, marginTop: 7 }}>
                      <div className="progress-bar" style={{ width: `${b.eff}%`, opacity: 0.65 }} />
                    </div>
                  )}
                </div>
              ))}
            </div>
          </Card>
        </div>
      </div>
    </Page>
  )
}
