'use client'

import { useState } from 'react'
import { Thermometer, Plus, TrendingDown, FlaskConical } from 'lucide-react'
import { formatDate } from '@/lib/utils'
import { BEVERAGE_CATEGORIES } from '@/types/database'
import type { BeverageCategory } from '@/types/database'
import { Page, PageHeader } from '@/components/ui/Page'
import { Card } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Field, Input } from '@/components/ui/Field'

interface FermBatch {
  id: string
  name: string
  batch_number: string
  category: BeverageCategory
  stage: string
  og: number
  current_sg: number
  target_fg: number
  temp_c: number
  ph: number | null
  start_date: string
  days_in: number
  readings: { date: string; sg: number; temp: number; ph: number | null }[]
}

const mockBatches: FermBatch[] = [
  {
    id: '1', name: 'West Coast IPA', batch_number: '#042', category: 'beer',
    stage: 'primary', og: 1.068, current_sg: 1.022, target_fg: 1.012, temp_c: 20.5, ph: 4.2,
    start_date: '2026-04-28', days_in: 7,
    readings: [
      { date: '2026-04-28', sg: 1.068, temp: 18.0, ph: null },
      { date: '2026-04-30', sg: 1.042, temp: 20.0, ph: null },
      { date: '2026-05-02', sg: 1.028, temp: 20.5, ph: 4.3 },
      { date: '2026-05-04', sg: 1.022, temp: 20.5, ph: 4.2 },
    ],
  },
  {
    id: '2', name: 'Oatmeal Stout', batch_number: '#041', category: 'beer',
    stage: 'secondary', og: 1.072, current_sg: 1.016, target_fg: 1.018, temp_c: 18.0, ph: 4.0,
    start_date: '2026-04-15', days_in: 20,
    readings: [
      { date: '2026-04-15', sg: 1.072, temp: 18.0, ph: null },
      { date: '2026-04-18', sg: 1.040, temp: 18.5, ph: null },
      { date: '2026-04-22', sg: 1.024, temp: 18.0, ph: 4.1 },
      { date: '2026-04-27', sg: 1.018, temp: 18.0, ph: 4.0 },
      { date: '2026-05-02', sg: 1.016, temp: 18.0, ph: 4.0 },
    ],
  },
  {
    id: '3', name: 'Манго Комбуча', batch_number: '#K01', category: 'kombucha',
    stage: 'primary', og: 1.030, current_sg: 1.008, target_fg: 1.004, temp_c: 26.0, ph: 3.2,
    start_date: '2026-05-01', days_in: 4,
    readings: [
      { date: '2026-05-01', sg: 1.030, temp: 25.0, ph: 6.5 },
      { date: '2026-05-03', sg: 1.015, temp: 26.0, ph: 4.2 },
      { date: '2026-05-05', sg: 1.008, temp: 26.0, ph: 3.2 },
    ],
  },
]

const calcAttenuation = (og: number, c: number) => Math.round(((og - c) / (og - 1)) * 100)
const calcABV = (og: number, fg: number) => Math.round((og - fg) * 131.25 * 10) / 10

function MiniChart({ readings }: { readings: FermBatch['readings'] }) {
  if (readings.length < 2) return null
  const sgValues = readings.map(r => r.sg)
  const min = Math.min(...sgValues) - 0.002
  const max = Math.max(...sgValues) + 0.002
  const range = max - min
  const w = 320, h = 80
  const points = readings.map((r, i) => {
    const x = (i / (readings.length - 1)) * w
    const y = h - ((r.sg - min) / range) * h
    return `${x},${y}`
  }).join(' ')
  return (
    <svg width="100%" viewBox={`0 0 ${w} ${h}`} preserveAspectRatio="none" style={{ overflow: 'visible' }}>
      <polyline points={points} fill="none" stroke="var(--info)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      {readings.map((r, i) => {
        const x = (i / (readings.length - 1)) * w
        const y = h - ((r.sg - min) / range) * h
        return <circle key={i} cx={x} cy={y} r="3" fill="var(--info)" />
      })}
    </svg>
  )
}

export default function FermentationPage() {
  const [selectedId, setSelectedId] = useState<string>(mockBatches[0].id)
  const [logForm, setLogForm] = useState({ sg: '', temp: '', ph: '', notes: '' })
  const selected = mockBatches.find(b => b.id === selectedId)!

  return (
    <Page>
      <PageHeader
        title="Ферментация"
        subtitle={`${mockBatches.length} активных партий`}
        actions={<Button variant="primary"><Plus size={15} strokeWidth={2.5} />Записать замер</Button>}
      />

      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 320px) minmax(0, 1fr)', gap: 20 }}>
        {/* Batch list */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <p className="t-eyebrow">Партии</p>
          {mockBatches.map(batch => {
            const cat = BEVERAGE_CATEGORIES.find(c => c.value === batch.category)
            const att = calcAttenuation(batch.og, batch.current_sg)
            const isSelected = selectedId === batch.id
            return (
              <button
                key={batch.id}
                onClick={() => setSelectedId(batch.id)}
                style={{
                  textAlign: 'left',
                  padding: 14,
                  borderRadius: 'var(--r-md)',
                  background: isSelected ? 'var(--surface-2)' : 'var(--surface-1)',
                  border: `1px solid ${isSelected ? 'var(--accent-edge)' : 'var(--hairline)'}`,
                  cursor: 'pointer', transition: 'all .15s ease',
                  display: 'flex', flexDirection: 'column', gap: 8,
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span>{cat?.emoji}</span>
                  <span style={{ fontSize: 13.5, fontWeight: 600, color: 'var(--t-1)' }}>{batch.name}</span>
                  <span className="t-meta" style={{ marginLeft: 'auto' }}>{batch.batch_number}</span>
                </div>
                <div style={{ display: 'flex', gap: 12 }}>
                  <span className="t-meta" style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                    <Thermometer size={11} />{batch.temp_c}°C
                  </span>
                  <span className="t-meta t-mono">SG {batch.current_sg.toFixed(3)}</span>
                  <span className="t-meta">{batch.days_in} дн.</span>
                </div>
                <div className="progress">
                  <div className="progress-bar progress-bar-info" style={{ width: `${att}%` }} />
                </div>
                <p className="t-meta">Сбраживание {att}%</p>
              </button>
            )
          })}
        </div>

        {/* Detail */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <Card pad="lg">
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12, marginBottom: 18 }}>
              <div>
                <h2 style={{ fontSize: 18, fontWeight: 600, color: 'var(--t-1)' }}>{selected.name}</h2>
                <p className="t-meta" style={{ marginTop: 4 }}>{selected.batch_number} · {selected.days_in} дней в ферментере</p>
              </div>
              <Badge tone="info">
                {selected.stage === 'primary' ? 'Первичная' : selected.stage === 'secondary' ? 'Вторичная' : 'Кондиционирование'}
              </Badge>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))', gap: 8, marginBottom: 18 }}>
              {[
                { label: 'OG',     value: selected.og.toFixed(3) },
                { label: 'SG',     value: selected.current_sg.toFixed(3), accent: true },
                { label: 'Цель FG', value: selected.target_fg.toFixed(3) },
                { label: 'ABV',    value: `${calcABV(selected.og, selected.current_sg)}%` },
              ].map(it => (
                <div key={it.label} style={{
                  padding: 14, borderRadius: 'var(--r-sm)',
                  background: 'var(--surface-1)', border: '1px solid var(--hairline)',
                }}>
                  <p className="t-eyebrow" style={{ fontSize: 9.5 }}>{it.label}</p>
                  <p className="t-mono" style={{ fontSize: 18, fontWeight: 600, color: it.accent ? 'var(--accent)' : 'var(--t-1)', marginTop: 6 }}>{it.value}</p>
                </div>
              ))}
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 8, marginBottom: 18 }}>
              {[
                { label: 'Температура',  value: `${selected.temp_c}°C`, icon: Thermometer, ok: selected.temp_c >= 16 && selected.temp_c <= 28 },
                { label: 'pH',           value: selected.ph?.toFixed(1) ?? '—', icon: FlaskConical, ok: selected.ph ? selected.ph >= 3 && selected.ph <= 5 : true },
                { label: 'Сбраживание',  value: `${calcAttenuation(selected.og, selected.current_sg)}%`, icon: TrendingDown, ok: true },
              ].map(({ label, value, icon: Icon, ok }) => (
                <div key={label} style={{
                  padding: '12px 14px', borderRadius: 'var(--r-sm)',
                  background: 'var(--surface-1)',
                  border: `1px solid ${ok ? 'var(--hairline)' : 'rgba(248,113,113,0.25)'}`,
                  display: 'flex', alignItems: 'center', gap: 10,
                }}>
                  <Icon size={15} style={{ color: ok ? 'var(--ok)' : 'var(--bad)' }} />
                  <div>
                    <p className="t-eyebrow" style={{ fontSize: 9.5 }}>{label}</p>
                    <p className="t-mono" style={{ fontSize: 13.5, fontWeight: 600, color: 'var(--t-1)', marginTop: 3 }}>{value}</p>
                  </div>
                </div>
              ))}
            </div>

            <p className="t-eyebrow" style={{ marginBottom: 10 }}>График плотности</p>
            <MiniChart readings={selected.readings} />
          </Card>

          {/* History */}
          <Card pad="md">
            <p className="t-eyebrow" style={{ marginBottom: 10 }}>История замеров</p>
            <table className="table">
              <thead>
                <tr><th>Дата</th><th>SG</th><th>T</th><th>pH</th></tr>
              </thead>
              <tbody>
                {selected.readings.slice().reverse().map((r, i) => (
                  <tr key={i}>
                    <td>{formatDate(r.date)}</td>
                    <td className="t-mono" style={{ fontWeight: 600 }}>{r.sg.toFixed(3)}</td>
                    <td className="t-mono">{r.temp}°C</td>
                    <td className="t-mono">{r.ph?.toFixed(1) ?? '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Card>

          {/* Log */}
          <Card pad="md">
            <p className="t-eyebrow" style={{ marginBottom: 10 }}>Записать новый замер</p>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 10 }}>
              <Field label="SG"><Input type="number" step="0.001" placeholder="1.020" value={logForm.sg} onChange={e => setLogForm({ ...logForm, sg: e.target.value })} /></Field>
              <Field label="T °C"><Input type="number" step="0.1" placeholder="20.0" value={logForm.temp} onChange={e => setLogForm({ ...logForm, temp: e.target.value })} /></Field>
              <Field label="pH"><Input type="number" step="0.1" placeholder="4.2" value={logForm.ph} onChange={e => setLogForm({ ...logForm, ph: e.target.value })} /></Field>
              <div style={{ display: 'flex', alignItems: 'flex-end' }}>
                <Button variant="primary" style={{ width: '100%' }}>Сохранить</Button>
              </div>
            </div>
            <div style={{ marginTop: 10 }}>
              <Input placeholder="Заметки к замеру..." value={logForm.notes} onChange={e => setLogForm({ ...logForm, notes: e.target.value })} />
            </div>
          </Card>
        </div>
      </div>
    </Page>
  )
}
