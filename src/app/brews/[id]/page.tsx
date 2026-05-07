'use client'

import { useState } from 'react'
import Link from 'next/link'
import {
  ArrowLeft, Check, Circle, Thermometer, FlaskConical,
  TrendingDown, Droplets, Calendar, BookOpen, ChevronRight,
  ClipboardList, Plus, Cylinder,
} from 'lucide-react'
import { Page } from '@/components/ui/Page'
import { Card } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Field, Input } from '@/components/ui/Field'

// ─── Types ──────────────────────────────────────────────────────────────────

type BrewStage =
  | 'planned' | 'mashing' | 'boiling' | 'cooling'
  | 'fermenting' | 'conditioning' | 'packaging' | 'ready'

interface CheckItem { id: string; label: string; done: boolean }

interface SgReading { date: string; sg: number; temp: number; ph: number | null }

interface BrewDetail {
  id: string
  recipe_name: string
  batch_number: string
  category: string
  stage: BrewStage
  batch_size_l: number
  brew_date: string
  days_in: number
  og: number | null
  current_sg: number | null
  target_fg: number | null
  fg: number | null
  temp_c: number | null
  vessel: string | null
  recipe_id: string
  notes: string
  readings: SgReading[]
  checklists: Record<BrewStage, CheckItem[]>
}

// ─── Mock data ───────────────────────────────────────────────────────────────

const BREWS: Record<string, BrewDetail> = {
  '1': {
    id: '1', recipe_name: 'West Coast IPA', batch_number: '#042',
    category: 'beer', stage: 'fermenting',
    batch_size_l: 25, brew_date: '2026-04-28', days_in: 9,
    og: 1.068, current_sg: 1.020, target_fg: 1.012, fg: null,
    temp_c: 20.5, vessel: 'FV-01', recipe_id: 'r1',
    notes: 'Chico yeast. DDH 200g Citra + 100g Mosaic on day 5.',
    readings: [
      { date: '2026-04-28', sg: 1.068, temp: 18.0, ph: null },
      { date: '2026-04-30', sg: 1.042, temp: 20.0, ph: null },
      { date: '2026-05-02', sg: 1.028, temp: 20.5, ph: 4.3 },
      { date: '2026-05-04', sg: 1.022, temp: 20.5, ph: 4.2 },
      { date: '2026-05-07', sg: 1.020, temp: 20.5, ph: 4.1 },
    ],
    checklists: {
      planned: [
        { id: 'p1', label: 'Рецепт утверждён', done: true },
        { id: 'p2', label: 'Ингредиенты заказаны', done: true },
        { id: 'p3', label: 'Оборудование зарезервировано', done: true },
      ],
      mashing: [
        { id: 'm1', label: 'Вода нагрета до 72°C', done: true },
        { id: 'm2', label: 'Солод засыпан в MLT', done: true },
        { id: 'm3', label: 'Температура затирания 67°C ± 1°C', done: true },
        { id: 'm4', label: 'Йод-тест — полная конверсия', done: true },
        { id: 'm5', label: 'Спарджинг завершён', done: true },
        { id: 'm6', label: 'Объём до кипячения', done: true },
      ],
      boiling: [
        { id: 'b1', label: 'Кипячение началось', done: true },
        { id: 'b2', label: 'Хмель горечь (60 мин) внесён', done: true },
        { id: 'b3', label: 'Ирландский мох (15 мин)', done: true },
        { id: 'b4', label: 'Хмель аромат (10 мин) внесён', done: true },
        { id: 'b5', label: 'Хмель вирпул-хоп внесён', done: true },
        { id: 'b6', label: 'OG замерена', done: true },
      ],
      cooling: [
        { id: 'c1', label: 'Охлаждение через HEX до 18°C', done: true },
        { id: 'c2', label: 'Ферментер санирован', done: true },
        { id: 'c3', label: 'Перекачка в FV', done: true },
        { id: 'c4', label: 'Аэрация сусла', done: true },
      ],
      fermenting: [
        { id: 'f1', label: 'Дрожжи внесены', done: true },
        { id: 'f2', label: 'Активное брожение началось', done: true },
        { id: 'f3', label: 'Замер SG день 3', done: true },
        { id: 'f4', label: 'Сухое охмеление (DDH) день 5', done: true },
        { id: 'f5', label: 'Замер SG день 7', done: true },
        { id: 'f6', label: 'SG стабильна 2 дня подряд', done: false },
        { id: 'f7', label: 'Протокол ферментации закрыт', done: false },
      ],
      conditioning: [
        { id: 'co1', label: 'Перевод в BBT', done: false },
        { id: 'co2', label: 'Карбонизация CO₂', done: false },
        { id: 'co3', label: 'Финальный SG замерен', done: false },
        { id: 'co4', label: 'Дегустация пройдена', done: false },
      ],
      packaging: [
        { id: 'pk1', label: 'Санитарная обработка кег', done: false },
        { id: 'pk2', label: 'Розлив', done: false },
        { id: 'pk3', label: 'Контроль качества', done: false },
        { id: 'pk4', label: 'Этикетировка', done: false },
      ],
      ready: [
        { id: 'r1', label: 'Партия архивирована', done: false },
      ],
    },
  },
  '2': {
    id: '2', recipe_name: 'Oatmeal Stout', batch_number: '#041',
    category: 'beer', stage: 'conditioning',
    batch_size_l: 20, brew_date: '2026-04-15', days_in: 22,
    og: 1.072, current_sg: 1.016, target_fg: 1.018, fg: 1.016,
    temp_c: 4.0, vessel: 'FV-02', recipe_id: 'r2',
    notes: 'WLP004 Irish Ale. Cold crash начат 5 мая.',
    readings: [
      { date: '2026-04-15', sg: 1.072, temp: 18.0, ph: null },
      { date: '2026-04-18', sg: 1.040, temp: 18.5, ph: null },
      { date: '2026-04-22', sg: 1.024, temp: 18.0, ph: 4.1 },
      { date: '2026-04-27', sg: 1.018, temp: 18.0, ph: 4.0 },
      { date: '2026-05-02', sg: 1.016, temp: 18.0, ph: 4.0 },
    ],
    checklists: {
      planned: [
        { id: 'p1', label: 'Рецепт утверждён', done: true },
        { id: 'p2', label: 'Ингредиенты заказаны', done: true },
        { id: 'p3', label: 'Оборудование зарезервировано', done: true },
      ],
      mashing: [
        { id: 'm1', label: 'Вода нагрета до 72°C', done: true },
        { id: 'm2', label: 'Солод засыпан в MLT', done: true },
        { id: 'm3', label: 'Температура затирания 66°C', done: true },
        { id: 'm4', label: 'Йод-тест — полная конверсия', done: true },
        { id: 'm5', label: 'Спарджинг завершён', done: true },
        { id: 'm6', label: 'Объём до кипячения', done: true },
      ],
      boiling: [
        { id: 'b1', label: 'Кипячение началось', done: true },
        { id: 'b2', label: 'Хмель горечь (60 мин) внесён', done: true },
        { id: 'b3', label: 'Ирландский мох (15 мин)', done: true },
        { id: 'b4', label: 'OG замерена', done: true },
      ],
      cooling: [
        { id: 'c1', label: 'Охлаждение через HEX до 18°C', done: true },
        { id: 'c2', label: 'Ферментер санирован', done: true },
        { id: 'c3', label: 'Перекачка в FV', done: true },
        { id: 'c4', label: 'Аэрация сусла', done: true },
      ],
      fermenting: [
        { id: 'f1', label: 'Дрожжи внесены', done: true },
        { id: 'f2', label: 'Активное брожение началось', done: true },
        { id: 'f3', label: 'Замер SG день 3', done: true },
        { id: 'f4', label: 'Замер SG день 7', done: true },
        { id: 'f5', label: 'SG стабильна 2 дня подряд', done: true },
        { id: 'f6', label: 'Cold crash старт', done: true },
      ],
      conditioning: [
        { id: 'co1', label: 'Перевод в BBT', done: false },
        { id: 'co2', label: 'Карбонизация CO₂', done: false },
        { id: 'co3', label: 'Финальный SG замерен', done: true },
        { id: 'co4', label: 'Дегустация пройдена', done: false },
      ],
      packaging: [
        { id: 'pk1', label: 'Санитарная обработка кег', done: false },
        { id: 'pk2', label: 'Розлив', done: false },
        { id: 'pk3', label: 'Контроль качества', done: false },
        { id: 'pk4', label: 'Этикетировка', done: false },
      ],
      ready: [{ id: 'r1', label: 'Партия архивирована', done: false }],
    },
  },
}

// ─── Stage config ─────────────────────────────────────────────────────────────

const STAGES: { key: BrewStage; label: string }[] = [
  { key: 'planned',     label: 'Планирование' },
  { key: 'mashing',    label: 'Затирание' },
  { key: 'boiling',    label: 'Кипячение' },
  { key: 'cooling',    label: 'Охлаждение' },
  { key: 'fermenting', label: 'Ферментация' },
  { key: 'conditioning', label: 'Кондиционирование' },
  { key: 'packaging',  label: 'Розлив' },
  { key: 'ready',      label: 'Готово' },
]

const stageIndex = (s: BrewStage) => STAGES.findIndex(x => x.key === s)

const STATUS_TONE: Record<BrewStage, 'neutral' | 'warn' | 'info' | 'accent' | 'ok'> = {
  planned: 'neutral', mashing: 'warn', boiling: 'warn', cooling: 'warn',
  fermenting: 'info', conditioning: 'accent', packaging: 'accent', ready: 'ok',
}

// ─── SG chart ─────────────────────────────────────────────────────────────────

function SgChart({ readings, targetFg }: { readings: SgReading[]; targetFg: number | null }) {
  if (readings.length < 2) return null
  const w = 500, h = 120, padL = 52, padR = 16, padT = 12, padB = 28
  const cW = w - padL - padR, cH = h - padT - padB
  const sgs = readings.map(r => r.sg)
  const minSg = Math.min(...sgs, targetFg ?? 1.010) - 0.003
  const maxSg = Math.max(...sgs) + 0.004
  const range = maxSg - minSg

  const px = (i: number) => padL + (i / (readings.length - 1)) * cW
  const py = (sg: number) => padT + ((maxSg - sg) / range) * cH

  const linePath = readings.map((r, i) => `${i === 0 ? 'M' : 'L'} ${px(i)} ${py(r.sg)}`).join(' ')
  const areaPath = `${linePath} L ${px(readings.length - 1)} ${padT + cH} L ${padL} ${padT + cH} Z`

  const yTicks = [maxSg, (maxSg + minSg) / 2, minSg].map(v => Math.round(v * 1000) / 1000)
  const xLabels = readings.map(r => r.date.slice(5)) // MM-DD

  return (
    <svg viewBox={`0 0 ${w} ${h}`} style={{ width: '100%', overflow: 'visible' }}>
      {/* Grid */}
      {yTicks.map((v, i) => (
        <g key={i}>
          <line x1={padL} y1={py(v)} x2={w - padR} y2={py(v)} stroke="var(--hairline)" strokeWidth="0.7" />
          <text x={padL - 6} y={py(v) + 4} textAnchor="end" fontSize="8" fill="var(--t-4)" fontFamily="ui-monospace,monospace">
            {v.toFixed(3)}
          </text>
        </g>
      ))}
      {/* Target FG line */}
      {targetFg && (
        <line x1={padL} y1={py(targetFg)} x2={w - padR} y2={py(targetFg)}
              stroke="var(--ok)" strokeWidth="1" strokeDasharray="4 3" opacity="0.7" />
      )}
      {/* Area */}
      <path d={areaPath} fill="var(--info)" opacity="0.1" />
      {/* Line */}
      <path d={linePath} fill="none" stroke="var(--info)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      {/* Dots + x-labels */}
      {readings.map((r, i) => (
        <g key={i}>
          <circle cx={px(i)} cy={py(r.sg)} r="3.5" fill="var(--info)" />
          <text x={px(i)} y={padT + cH + 16} textAnchor="middle" fontSize="8" fill="var(--t-4)" fontFamily="ui-monospace,monospace">
            {xLabels[i]}
          </text>
        </g>
      ))}
    </svg>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function BrewDetailPage({ params }: { params: { id: string } }) {
  const brew = BREWS[params.id]
  const [checklists, setChecklists] = useState(brew?.checklists)
  const [logForm, setLogForm] = useState({ sg: '', temp: '', ph: '' })

  if (!brew) {
    return (
      <Page>
        <div style={{ textAlign: 'center', padding: 80 }}>
          <p style={{ color: 'var(--t-2)' }}>Варка не найдена</p>
          <Link href="/brews"><Button variant="ghost" style={{ marginTop: 16 }}>← Назад</Button></Link>
        </div>
      </Page>
    )
  }

  const currentIdx = stageIndex(brew.stage)
  const attenuation = brew.og && brew.current_sg
    ? Math.round(((brew.og - brew.current_sg) / (brew.og - 1)) * 100)
    : null
  const abvEst = brew.og && brew.current_sg
    ? ((brew.og - brew.current_sg) * 131.25).toFixed(1)
    : null

  const toggleCheck = (stage: BrewStage, itemId: string) => {
    setChecklists(prev => ({
      ...prev,
      [stage]: prev[stage].map(it => it.id === itemId ? { ...it, done: !it.done } : it),
    }))
  }

  const currentChecklist = checklists[brew.stage]
  const checkProgress = Math.round((currentChecklist.filter(i => i.done).length / currentChecklist.length) * 100)

  return (
    <Page>
      {/* Back + header */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        <Link href="/brews" style={{ display: 'inline-flex', alignItems: 'center', gap: 6, color: 'var(--t-3)', fontSize: 12.5, textDecoration: 'none' }}>
          <ArrowLeft size={13} />Все варки
        </Link>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <h1 style={{ fontSize: 24, fontWeight: 700, color: 'var(--t-1)', letterSpacing: '-0.02em' }}>{brew.recipe_name}</h1>
              <Badge tone={STATUS_TONE[brew.stage]}>{STAGES[currentIdx].label}</Badge>
            </div>
            <p className="t-meta" style={{ marginTop: 4 }}>
              {brew.batch_number} · {brew.batch_size_l} л · {brew.days_in} дней
            </p>
          </div>
          <Button variant="primary"><Plus size={14} />Записать замер</Button>
        </div>
      </div>

      {/* Stage pipeline */}
      <Card pad="md">
        <div style={{ display: 'flex', alignItems: 'center', gap: 0, overflowX: 'auto', padding: '2px 0' }}>
          {STAGES.map((s, i) => {
            const done = i < currentIdx
            const active = i === currentIdx
            const future = i > currentIdx
            return (
              <div key={s.key} style={{ display: 'flex', alignItems: 'center', flex: i < STAGES.length - 1 ? '1' : undefined, minWidth: 0 }}>
                <div style={{
                  display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 5, flexShrink: 0,
                }}>
                  <div style={{
                    width: 28, height: 28, borderRadius: '50%',
                    background: done ? 'var(--ok)' : active ? 'var(--accent)' : 'var(--surface-3)',
                    border: `2px solid ${done ? 'var(--ok)' : active ? 'var(--accent)' : 'var(--hairline)'}`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    boxShadow: active ? '0 0 12px rgba(251,191,36,0.5)' : undefined,
                    transition: 'all .2s ease',
                  }}>
                    {done
                      ? <Check size={13} color="#000" strokeWidth={2.5} />
                      : <span style={{ fontSize: 10, fontWeight: 700, color: active ? '#000' : 'var(--t-4)' }}>{i + 1}</span>
                    }
                  </div>
                  <span style={{ fontSize: 9.5, color: active ? 'var(--accent)' : done ? 'var(--ok)' : 'var(--t-4)', fontWeight: active ? 700 : 400, whiteSpace: 'nowrap', letterSpacing: '-0.01em' }}>
                    {s.label}
                  </span>
                </div>
                {i < STAGES.length - 1 && (
                  <div style={{
                    flex: 1, height: 2, margin: '-14px 4px 0',
                    background: done ? 'var(--ok)' : 'var(--hairline)',
                    borderRadius: 1,
                  }} />
                )}
              </div>
            )
          })}
        </div>
      </Card>

      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0,1fr) 300px', gap: 20 }}>
        {/* Left */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {/* KPIs */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(110px, 1fr))', gap: 10 }}>
            {[
              { label: 'OG',          value: brew.og?.toFixed(3) ?? '—',     mono: true },
              { label: 'SG текущий',  value: brew.current_sg?.toFixed(3) ?? '—', mono: true, accent: true },
              { label: 'Цель FG',     value: brew.target_fg?.toFixed(3) ?? '—',  mono: true },
              { label: 'ABV ~',       value: abvEst ? `${abvEst}%` : '—',    mono: true },
              { label: 'Сбраживание', value: attenuation ? `${attenuation}%` : '—', mono: false },
              { label: 'Температура', value: brew.temp_c ? `${brew.temp_c}°C` : '—', mono: false },
            ].map(it => (
              <div key={it.label} style={{
                padding: '12px 14px', borderRadius: 'var(--r-md)',
                background: 'var(--surface-2)', border: '1px solid var(--hairline)',
              }}>
                <p className="t-eyebrow" style={{ fontSize: 9.5 }}>{it.label}</p>
                <p className={it.mono ? 't-mono' : ''} style={{
                  fontSize: 17, fontWeight: 700, marginTop: 6, lineHeight: 1,
                  color: it.accent ? 'var(--accent)' : 'var(--t-1)',
                }}>{it.value}</p>
              </div>
            ))}
          </div>

          {/* SG chart */}
          <Card pad="md">
            <p className="t-eyebrow" style={{ marginBottom: 12 }}>График плотности</p>
            <SgChart readings={brew.readings} targetFg={brew.target_fg} />
            <div style={{ display: 'flex', gap: 16, marginTop: 8 }}>
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: 10.5, color: 'var(--t-3)' }}>
                <span style={{ width: 20, height: 2, background: 'var(--info)', display: 'inline-block', borderRadius: 1 }} />
                Плотность
              </span>
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: 10.5, color: 'var(--t-3)' }}>
                <span style={{ width: 20, height: 2, background: 'var(--ok)', display: 'inline-block', borderRadius: 1, opacity: 0.8 }} />
                Цель FG
              </span>
            </div>
          </Card>

          {/* Checklist */}
          <Card pad="md">
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <ClipboardList size={13} style={{ color: 'var(--t-3)' }} />
                <p className="t-eyebrow">Чеклист — {STAGES[currentIdx].label}</p>
              </div>
              <span className="t-mono" style={{ fontSize: 11, color: checkProgress === 100 ? 'var(--ok)' : 'var(--t-3)' }}>
                {checkProgress}%
              </span>
            </div>
            {/* Progress */}
            <div className="progress" style={{ height: 4, marginBottom: 14 }}>
              <div className="progress-bar" style={{ width: `${checkProgress}%`, background: checkProgress === 100 ? 'var(--ok)' : undefined }} />
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {currentChecklist.map(item => (
                <button
                  key={item.id}
                  onClick={() => toggleCheck(brew.stage, item.id)}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 10, padding: '9px 10px',
                    borderRadius: 'var(--r-sm)', background: 'transparent',
                    border: `1px solid ${item.done ? 'rgba(34,197,94,0.25)' : 'var(--hairline)'}`,
                    cursor: 'pointer', textAlign: 'left',
                    background: item.done ? 'rgba(34,197,94,0.06)' : 'var(--surface-2)',
                    transition: 'all .12s ease',
                  }}
                >
                  <div style={{
                    width: 18, height: 18, borderRadius: 5, flexShrink: 0,
                    background: item.done ? 'var(--ok)' : 'transparent',
                    border: `2px solid ${item.done ? 'var(--ok)' : 'var(--hairline-strong)'}`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}>
                    {item.done && <Check size={10} color="#000" strokeWidth={3} />}
                  </div>
                  <span style={{ fontSize: 13, color: item.done ? 'var(--t-3)' : 'var(--t-1)', textDecoration: item.done ? 'line-through' : 'none', textDecorationColor: 'var(--t-4)' }}>
                    {item.label}
                  </span>
                </button>
              ))}
            </div>
          </Card>

          {/* Log new reading */}
          <Card pad="md">
            <p className="t-eyebrow" style={{ marginBottom: 12 }}>Записать замер</p>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: 10, alignItems: 'flex-end' }}>
              <Field label="SG"><Input type="number" step="0.001" placeholder="1.016" value={logForm.sg} onChange={e => setLogForm({ ...logForm, sg: e.target.value })} /></Field>
              <Field label="Температура °C"><Input type="number" step="0.1" placeholder="20.0" value={logForm.temp} onChange={e => setLogForm({ ...logForm, temp: e.target.value })} /></Field>
              <Field label="pH"><Input type="number" step="0.1" placeholder="4.2" value={logForm.ph} onChange={e => setLogForm({ ...logForm, ph: e.target.value })} /></Field>
              <Button variant="primary">Сохранить</Button>
            </div>
          </Card>

          {/* Reading history */}
          <Card pad="md">
            <p className="t-eyebrow" style={{ marginBottom: 10 }}>История замеров</p>
            <table className="table">
              <thead><tr><th>Дата</th><th>SG</th><th>Т °C</th><th>pH</th></tr></thead>
              <tbody>
                {brew.readings.slice().reverse().map((r, i) => (
                  <tr key={i}>
                    <td>{r.date.slice(5)}</td>
                    <td className="t-mono" style={{ fontWeight: 600 }}>{r.sg.toFixed(3)}</td>
                    <td className="t-mono">{r.temp}</td>
                    <td className="t-mono">{r.ph?.toFixed(1) ?? '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Card>
        </div>

        {/* Right sidebar */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {/* Vessel */}
          <Card pad="md">
            <p className="t-eyebrow" style={{ marginBottom: 10 }}>Ферментер</p>
            {brew.vessel ? (
              <Link href="/equipment" style={{ textDecoration: 'none' }}>
                <div style={{
                  display: 'flex', alignItems: 'center', gap: 10, padding: '12px 14px',
                  borderRadius: 'var(--r-md)', background: 'var(--surface-2)', border: '1px solid var(--hairline)',
                  cursor: 'pointer', transition: 'border-color .15s',
                }}>
                  <Cylinder size={18} style={{ color: 'var(--info)' }} />
                  <div style={{ flex: 1 }}>
                    <p style={{ fontSize: 14, fontWeight: 600, color: 'var(--t-1)' }}>{brew.vessel}</p>
                    <p className="t-meta">В работе · {brew.temp_c}°C</p>
                  </div>
                  <ChevronRight size={13} style={{ color: 'var(--t-4)' }} />
                </div>
              </Link>
            ) : (
              <Button variant="ghost" style={{ width: '100%' }}>Назначить ферментер</Button>
            )}
          </Card>

          {/* Recipe link */}
          <Card pad="md">
            <p className="t-eyebrow" style={{ marginBottom: 10 }}>Рецепт</p>
            <Link href="/recipes" style={{ textDecoration: 'none' }}>
              <div style={{
                display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px',
                borderRadius: 'var(--r-sm)', background: 'var(--surface-2)', border: '1px solid var(--hairline)', cursor: 'pointer',
              }}>
                <BookOpen size={14} style={{ color: 'var(--t-3)' }} />
                <span style={{ fontSize: 13, color: 'var(--t-1)', flex: 1 }}>{brew.recipe_name}</span>
                <ChevronRight size={12} style={{ color: 'var(--t-4)' }} />
              </div>
            </Link>
          </Card>

          {/* Brew date + calendar */}
          <Card pad="md">
            <p className="t-eyebrow" style={{ marginBottom: 10 }}>Хронология</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <Calendar size={12} style={{ color: 'var(--t-4)' }} />
                <div style={{ flex: 1 }}>
                  <p style={{ fontSize: 11, color: 'var(--t-3)' }}>Дата варки</p>
                  <p style={{ fontSize: 13, fontWeight: 500, color: 'var(--t-1)' }}>{brew.brew_date}</p>
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <Thermometer size={12} style={{ color: 'var(--t-4)' }} />
                <div style={{ flex: 1 }}>
                  <p style={{ fontSize: 11, color: 'var(--t-3)' }}>Дней в процессе</p>
                  <p style={{ fontSize: 13, fontWeight: 500, color: 'var(--t-1)' }}>{brew.days_in}</p>
                </div>
              </div>
            </div>
          </Card>

          {/* Notes */}
          {brew.notes && (
            <Card pad="md">
              <p className="t-eyebrow" style={{ marginBottom: 8 }}>Заметки</p>
              <p style={{ fontSize: 12.5, color: 'var(--t-2)', lineHeight: 1.6 }}>{brew.notes}</p>
            </Card>
          )}

          {/* Actions */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            <Button variant="primary" style={{ width: '100%' }}>Перевести на следующую стадию</Button>
            <Button variant="ghost" style={{ width: '100%' }}>Экспорт данных</Button>
          </div>
        </div>
      </div>
    </Page>
  )
}
