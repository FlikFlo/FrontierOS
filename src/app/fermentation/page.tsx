'use client'

import { useState } from 'react'
import { Thermometer, Plus, TrendingDown, Droplets, FlaskConical } from 'lucide-react'
import { formatDate } from '@/lib/utils'
import { BEVERAGE_CATEGORIES } from '@/types/database'
import type { BeverageCategory } from '@/types/database'

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
    ]
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
    ]
  },
  {
    id: '3', name: 'Манго Комбуча', batch_number: '#K01', category: 'kombucha',
    stage: 'primary', og: 1.030, current_sg: 1.008, target_fg: 1.004, temp_c: 26.0, ph: 3.2,
    start_date: '2026-05-01', days_in: 4,
    readings: [
      { date: '2026-05-01', sg: 1.030, temp: 25.0, ph: 6.5 },
      { date: '2026-05-03', sg: 1.015, temp: 26.0, ph: 4.2 },
      { date: '2026-05-05', sg: 1.008, temp: 26.0, ph: 3.2 },
    ]
  },
]

function calcAttenuation(og: number, current: number): number {
  return Math.round(((og - current) / (og - 1)) * 100)
}

function calcABV(og: number, fg: number): number {
  return Math.round((og - fg) * 131.25 * 10) / 10
}

function MiniChart({ readings }: { readings: FermBatch['readings'] }) {
  if (readings.length < 2) return null
  const sgValues = readings.map(r => r.sg)
  const min = Math.min(...sgValues) - 0.002
  const max = Math.max(...sgValues) + 0.002
  const range = max - min
  const w = 200
  const h = 60
  const points = readings.map((r, i) => {
    const x = (i / (readings.length - 1)) * w
    const y = h - ((r.sg - min) / range) * h
    return `${x},${y}`
  }).join(' ')

  return (
    <svg width={w} height={h} className="opacity-80">
      <defs>
        <linearGradient id={`grad-${readings[0].date}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#60a5fa" stopOpacity="0.3" />
          <stop offset="100%" stopColor="#60a5fa" stopOpacity="0" />
        </linearGradient>
      </defs>
      <polyline points={points} fill="none" stroke="#60a5fa" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      {readings.map((r, i) => {
        const x = (i / (readings.length - 1)) * w
        const y = h - ((r.sg - min) / range) * h
        return <circle key={i} cx={x} cy={y} r="3" fill="#60a5fa" />
      })}
    </svg>
  )
}

export default function FermentationPage() {
  const [selectedBatch, setSelectedBatch] = useState<string | null>(mockBatches[0].id)
  const [logForm, setLogForm] = useState({ sg: '', temp: '', ph: '', notes: '' })

  const selected = mockBatches.find(b => b.id === selectedBatch)

  return (
    <div className="max-w-7xl mx-auto space-y-6 fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-white">Ферментация</h1>
          <p className="text-sm text-white/40 mt-0.5">{mockBatches.length} активных партий</p>
        </div>
        <button className="btn-glass">
          <Plus size={15} />
          Записать замер
        </button>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Batch list */}
        <div className="space-y-3">
          <h2 className="text-sm font-semibold text-white/50 uppercase tracking-wider">Партии</h2>
          {mockBatches.map(batch => {
            const cat = BEVERAGE_CATEGORIES.find(c => c.value === batch.category)
            const att = calcAttenuation(batch.og, batch.current_sg)
            const isSelected = selectedBatch === batch.id
            return (
              <button
                key={batch.id}
                onClick={() => setSelectedBatch(batch.id)}
                className={`w-full text-left glass p-4 transition-all duration-200 ${
                  isSelected
                    ? 'border-amber-500/30 bg-amber-500/5'
                    : 'hover:bg-white/5'
                }`}
              >
                <div className="flex items-center gap-2 mb-2">
                  <span>{cat?.emoji}</span>
                  <span className="font-medium text-white text-sm">{batch.name}</span>
                  <span className="text-white/30 text-xs">{batch.batch_number}</span>
                </div>
                <div className="flex items-center gap-3 text-xs text-white/40 mb-2">
                  <span className="flex items-center gap-1"><Thermometer size={10} />{batch.temp_c}°C</span>
                  <span>SG {batch.current_sg.toFixed(3)}</span>
                  <span>{batch.days_in} дн.</span>
                </div>
                <div className="progress-track h-1.5">
                  <div className="h-1.5 rounded-full bg-gradient-to-r from-blue-400 to-purple-400" style={{ width: `${att}%` }} />
                </div>
                <p className="text-[10px] text-white/30 mt-1">Сбраживание {att}%</p>
              </button>
            )
          })}
        </div>

        {/* Detail panel */}
        {selected && (
          <div className="xl:col-span-2 space-y-4">
            {/* Stats */}
            <div className="glass p-6">
              <div className="flex items-start justify-between mb-5">
                <div>
                  <h2 className="text-lg font-semibold text-white">{selected.name}</h2>
                  <p className="text-sm text-white/40">{selected.batch_number} · {selected.days_in} дней в ферментере</p>
                </div>
                <span className="badge badge-blue">
                  {selected.stage === 'primary' ? 'Первичная' : selected.stage === 'secondary' ? 'Вторичная' : 'Кондиционирование'}
                </span>
              </div>

              <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
                {[
                  { label: 'OG', value: selected.og.toFixed(3), color: 'text-amber-300' },
                  { label: 'Текущий SG', value: selected.current_sg.toFixed(3), color: 'text-blue-300' },
                  { label: 'Цель FG', value: selected.target_fg.toFixed(3), color: 'text-white' },
                  { label: 'ABV сейчас', value: `${calcABV(selected.og, selected.current_sg)}%`, color: 'text-purple-300' },
                ].map(({ label, value, color }) => (
                  <div key={label} className="glass-sm p-3 text-center">
                    <p className="text-[10px] text-white/30 uppercase tracking-wider mb-1">{label}</p>
                    <p className={`text-xl font-bold ${color}`}>{value}</p>
                  </div>
                ))}
              </div>

              <div className="grid grid-cols-3 gap-3 mb-6">
                {[
                  { label: 'Температура', value: `${selected.temp_c}°C`, icon: Thermometer, ok: selected.temp_c >= 16 && selected.temp_c <= 28 },
                  { label: 'pH', value: selected.ph ? selected.ph.toFixed(1) : '—', icon: FlaskConical, ok: selected.ph ? selected.ph >= 3 && selected.ph <= 5 : true },
                  { label: 'Сбраживание', value: `${calcAttenuation(selected.og, selected.current_sg)}%`, icon: TrendingDown, ok: true },
                ].map(({ label, value, icon: Icon, ok }) => (
                  <div key={label} className={`glass-sm p-3 flex items-center gap-3 ${ok ? '' : 'border-red-500/30 bg-red-500/5'}`}>
                    <Icon size={16} className={ok ? 'text-emerald-400' : 'text-red-400'} />
                    <div>
                      <p className="text-[10px] text-white/30 uppercase">{label}</p>
                      <p className="text-sm font-semibold text-white">{value}</p>
                    </div>
                  </div>
                ))}
              </div>

              {/* Gravity chart */}
              <div>
                <h3 className="text-xs text-white/40 uppercase tracking-wider mb-3">График плотности</h3>
                <div className="overflow-x-auto">
                  <MiniChart readings={selected.readings} />
                </div>
              </div>
            </div>

            {/* Readings table */}
            <div className="glass p-6">
              <h3 className="text-sm font-semibold text-white mb-4">История замеров</h3>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-white/10">
                      {['Дата', 'SG', 'Темп.', 'pH', 'Заметки'].map(h => (
                        <th key={h} className="pb-2 text-left text-[11px] text-white/30 uppercase tracking-wider pr-4">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {selected.readings.slice().reverse().map((r, i) => (
                      <tr key={i}>
                        <td className="py-2 pr-4 text-sm text-white/60">{formatDate(r.date)}</td>
                        <td className="py-2 pr-4 text-sm font-medium text-white">{r.sg.toFixed(3)}</td>
                        <td className="py-2 pr-4 text-sm text-white/60">{r.temp}°C</td>
                        <td className="py-2 pr-4 text-sm text-white/60">{r.ph?.toFixed(1) ?? '—'}</td>
                        <td className="py-2 pr-4 text-sm text-white/30">—</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Log new reading */}
            <div className="glass p-6">
              <h3 className="text-sm font-semibold text-white mb-4 flex items-center gap-2">
                <Plus size={15} className="text-amber-400" />
                Записать новый замер
              </h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-3">
                {[
                  { key: 'sg', label: 'SG', placeholder: '1.020' },
                  { key: 'temp', label: 'Темп. °C', placeholder: '20.0' },
                  { key: 'ph', label: 'pH', placeholder: '4.2' },
                ].map(({ key, label, placeholder }) => (
                  <div key={key}>
                    <label className="block text-[10px] text-white/30 mb-1 uppercase tracking-wider">{label}</label>
                    <input
                      type="number"
                      step="0.001"
                      className="glass-input text-sm py-2"
                      placeholder={placeholder}
                      value={(logForm as Record<string, string>)[key]}
                      onChange={e => setLogForm(prev => ({ ...prev, [key]: e.target.value }))}
                    />
                  </div>
                ))}
                <div className="md:col-span-1 flex items-end">
                  <button className="btn-primary w-full py-2.5 justify-center">Сохранить</button>
                </div>
              </div>
              <input
                className="glass-input text-sm py-2"
                placeholder="Заметки к замеру..."
                value={logForm.notes}
                onChange={e => setLogForm(prev => ({ ...prev, notes: e.target.value }))}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
