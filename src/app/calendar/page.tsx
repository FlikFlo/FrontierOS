'use client'

import { useState, useMemo } from 'react'
import { ChevronLeft, ChevronRight, Plus, Calendar as CalendarIcon } from 'lucide-react'
import { Page, PageHeader } from '@/components/ui/Page'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Tabs } from '@/components/ui/Tabs'
import { Badge } from '@/components/ui/Badge'
import { BEVERAGE_CATEGORIES } from '@/types/database'
import type { BeverageCategory } from '@/types/database'

interface ScheduledBrew {
  id: string
  name: string
  batch: string
  category: BeverageCategory
  stage: 'planned' | 'brew' | 'fermentation' | 'conditioning' | 'package'
  start: string  // ISO
  end: string    // ISO
  vessel?: string
}

const SCHEDULE: ScheduledBrew[] = [
  { id: '1', name: 'West Coast IPA',  batch: '#042', category: 'beer',    stage: 'fermentation',  start: '2026-04-28', end: '2026-05-12', vessel: 'FV-01' },
  { id: '2', name: 'Oatmeal Stout',   batch: '#041', category: 'beer',    stage: 'conditioning',  start: '2026-04-15', end: '2026-05-08', vessel: 'FV-02' },
  { id: '3', name: 'Belgian Tripel',  batch: '#040', category: 'beer',    stage: 'package',       start: '2026-05-01', end: '2026-05-09', vessel: 'BBT-01' },
  { id: '4', name: 'Pilsner Classic', batch: '#039', category: 'beer',    stage: 'planned',       start: '2026-05-12', end: '2026-06-09', vessel: 'FV-04' },
  { id: '5', name: 'Манго Комбуча',   batch: '#K01', category: 'kombucha',stage: 'fermentation',  start: '2026-05-01', end: '2026-05-14' },
  { id: '6', name: 'Лимонад Citrus',  batch: '#L01', category: 'lemonade',stage: 'package',       start: '2026-04-20', end: '2026-04-23' },
  { id: '7', name: 'NEIPA Hazy',      batch: '#043', category: 'beer',    stage: 'planned',       start: '2026-05-18', end: '2026-06-08', vessel: 'FV-05' },
]

const STAGE_TONE: Record<ScheduledBrew['stage'], 'neutral' | 'warn' | 'info' | 'accent' | 'ok'> = {
  planned: 'neutral', brew: 'warn', fermentation: 'info', conditioning: 'accent', package: 'ok',
}
const STAGE_LABEL: Record<ScheduledBrew['stage'], string> = {
  planned: 'Запланировано', brew: 'Варка', fermentation: 'Брожение', conditioning: 'Дображивание', package: 'Розлив',
}
const STAGE_BAR: Record<ScheduledBrew['stage'], string> = {
  planned: 'rgba(148,163,184,0.5)',
  brew: 'linear-gradient(90deg, #fbbf24, #f59e0b)',
  fermentation: 'linear-gradient(90deg, #60a5fa, #818cf8)',
  conditioning: 'linear-gradient(90deg, #fcd34d, #f59e0b)',
  package: 'linear-gradient(90deg, #34d399, #10b981)',
}

type ViewMode = 'month' | 'timeline'

const TODAY = new Date('2026-05-07')

export default function CalendarPage() {
  const [view, setView] = useState<ViewMode>('timeline')
  const [anchor, setAnchor] = useState(new Date(TODAY.getFullYear(), TODAY.getMonth(), 1))

  const monthLabel = anchor.toLocaleDateString('ru', { month: 'long', year: 'numeric' })

  const upcoming = useMemo(() => {
    return SCHEDULE
      .filter(b => new Date(b.end) >= TODAY)
      .sort((a, b) => new Date(a.start).getTime() - new Date(b.start).getTime())
      .slice(0, 5)
  }, [])

  const shift = (n: number) => setAnchor(prev => new Date(prev.getFullYear(), prev.getMonth() + n, 1))

  return (
    <Page>
      <PageHeader
        title="Календарь варок"
        subtitle="Планирование и таймлайн партий"
        actions={
          <Button variant="primary"><Plus size={15} strokeWidth={2.5} />Запланировать</Button>
        }
      />

      {/* Toolbar */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
        <Tabs<ViewMode>
          value={view}
          onChange={setView}
          size="lg"
          items={[
            { value: 'timeline', label: 'Таймлайн' },
            { value: 'month',    label: 'Месяц' },
          ]}
        />
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <Button size="sm" variant="ghost" icon onClick={() => shift(-1)}><ChevronLeft size={14} /></Button>
          <span style={{ fontSize: 13.5, fontWeight: 600, color: 'var(--t-1)', minWidth: 160, textAlign: 'center', textTransform: 'capitalize' }}>{monthLabel}</span>
          <Button size="sm" variant="ghost" icon onClick={() => shift(1)}><ChevronRight size={14} /></Button>
          <Button size="sm" variant="ghost" onClick={() => setAnchor(new Date(TODAY.getFullYear(), TODAY.getMonth(), 1))}>Сегодня</Button>
        </div>
      </div>

      {view === 'timeline' ? <Timeline anchor={anchor} schedule={SCHEDULE} /> : <MonthGrid anchor={anchor} schedule={SCHEDULE} />}

      {/* Upcoming */}
      <Card pad="lg">
        <p className="t-eyebrow" style={{ marginBottom: 12 }}>Ближайшие события</p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {upcoming.map(b => {
            const start = new Date(b.start)
            const end = new Date(b.end)
            const cat = BEVERAGE_CATEGORIES.find(c => c.value === b.category)
            return (
              <div key={b.id} style={{
                display: 'flex', alignItems: 'center', gap: 14,
                padding: '12px 14px',
                background: 'var(--surface-1)', border: '1px solid var(--hairline)',
                borderRadius: 'var(--r-md)',
              }}>
                <div style={{
                  width: 38, height: 38, borderRadius: 10, flexShrink: 0,
                  background: 'var(--surface-2)', border: '1px solid var(--hairline)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 18,
                }}>
                  {cat?.emoji}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ fontSize: 13.5, fontWeight: 600, color: 'var(--t-1)' }}>{b.name} <span style={{ color: 'var(--t-4)', fontWeight: 500 }}>{b.batch}</span></p>
                  <p className="t-meta" style={{ marginTop: 2 }}>
                    {start.toLocaleDateString('ru', { day: 'numeric', month: 'short' })} → {end.toLocaleDateString('ru', { day: 'numeric', month: 'short' })}
                    {b.vessel && ` · ${b.vessel}`}
                  </p>
                </div>
                <Badge tone={STAGE_TONE[b.stage]}>{STAGE_LABEL[b.stage]}</Badge>
              </div>
            )
          })}
        </div>
      </Card>
    </Page>
  )
}

// ─── Timeline (Gantt-style) ────────────────────────────────────────────────

function Timeline({ anchor, schedule }: { anchor: Date; schedule: ScheduledBrew[] }) {
  const days = 42  // 6 weeks
  const startDate = new Date(anchor)
  startDate.setDate(1)
  // Align to Monday
  const offset = (startDate.getDay() + 6) % 7
  startDate.setDate(startDate.getDate() - offset)

  const dates = Array.from({ length: days }, (_, i) => {
    const d = new Date(startDate)
    d.setDate(d.getDate() + i)
    return d
  })

  const dayWidth = 32
  const rowHeight = 40

  const visibleBrews = schedule.filter(b => {
    const e = new Date(b.end)
    const s = new Date(b.start)
    return e >= startDate && s <= dates[days - 1]
  })

  return (
    <Card pad="none" style={{ overflow: 'hidden' }}>
      <div style={{ overflow: 'auto', maxWidth: '100%' }}>
        <div style={{ minWidth: days * dayWidth + 220 }}>
          {/* Header */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: `220px repeat(${days}, ${dayWidth}px)`,
            borderBottom: '1px solid var(--hairline)',
            background: 'var(--surface-1)',
            position: 'sticky', top: 0, zIndex: 2,
          }}>
            <div style={{ padding: '10px 16px', fontSize: 11, fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--t-3)' }}>
              Партия
            </div>
            {dates.map((d, i) => {
              const isToday = d.toDateString() === TODAY.toDateString()
              const isWeekend = d.getDay() === 0 || d.getDay() === 6
              const isFirst = d.getDate() === 1
              return (
                <div
                  key={i}
                  style={{
                    padding: '8px 0', textAlign: 'center',
                    borderLeft: isFirst ? '1px solid var(--hairline-strong)' : '1px solid var(--hairline)',
                    background: isToday ? 'var(--accent-soft)' : isWeekend ? 'rgba(255,255,255,0.015)' : 'transparent',
                  }}
                >
                  <p style={{ fontSize: 9.5, color: 'var(--t-4)', textTransform: 'uppercase', fontWeight: 600 }}>
                    {d.toLocaleDateString('ru', { weekday: 'short' }).slice(0, 2)}
                  </p>
                  <p className="t-mono" style={{ fontSize: 12, fontWeight: isToday ? 700 : 500, color: isToday ? 'var(--accent)' : 'var(--t-2)', marginTop: 2 }}>
                    {d.getDate()}
                  </p>
                </div>
              )
            })}
          </div>

          {/* Rows */}
          {visibleBrews.map(b => {
            const s = new Date(b.start)
            const e = new Date(b.end)
            const startIdx = Math.max(0, Math.floor((s.getTime() - startDate.getTime()) / 86400000))
            const endIdx = Math.min(days, Math.ceil((e.getTime() - startDate.getTime()) / 86400000) + 1)
            const span = endIdx - startIdx
            const cat = BEVERAGE_CATEGORIES.find(c => c.value === b.category)

            return (
              <div
                key={b.id}
                style={{
                  display: 'grid',
                  gridTemplateColumns: `220px repeat(${days}, ${dayWidth}px)`,
                  height: rowHeight,
                  borderBottom: '1px solid var(--hairline)',
                  position: 'relative',
                }}
              >
                <div style={{
                  padding: '0 16px',
                  display: 'flex', alignItems: 'center', gap: 8,
                  borderRight: '1px solid var(--hairline)',
                  background: 'var(--surface-1)',
                  position: 'sticky', left: 0, zIndex: 1,
                }}>
                  <span style={{ fontSize: 14 }}>{cat?.emoji}</span>
                  <div style={{ minWidth: 0 }}>
                    <p style={{ fontSize: 12.5, fontWeight: 600, color: 'var(--t-1)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {b.name}
                    </p>
                    <p className="t-meta" style={{ fontSize: 10.5 }}>{b.batch}{b.vessel && ` · ${b.vessel}`}</p>
                  </div>
                </div>

                {/* Day cells (background) */}
                {Array.from({ length: days }).map((_, i) => {
                  const d = dates[i]
                  const isToday = d.toDateString() === TODAY.toDateString()
                  const isWeekend = d.getDay() === 0 || d.getDay() === 6
                  return (
                    <div
                      key={i}
                      style={{
                        borderLeft: '1px solid var(--hairline)',
                        background: isToday ? 'var(--accent-soft)' : isWeekend ? 'rgba(255,255,255,0.015)' : 'transparent',
                      }}
                    />
                  )
                })}

                {/* Bar */}
                <div
                  style={{
                    position: 'absolute',
                    left: 220 + startIdx * dayWidth + 2,
                    top: 6,
                    width: span * dayWidth - 4,
                    height: rowHeight - 12,
                    borderRadius: 8,
                    background: STAGE_BAR[b.stage],
                    boxShadow: '0 2px 8px rgba(0,0,0,0.25), inset 0 1px 0 rgba(255,255,255,0.2)',
                    display: 'flex', alignItems: 'center', padding: '0 10px',
                    fontSize: 11.5, fontWeight: 600, color: '#0a0a0f',
                    overflow: 'hidden', whiteSpace: 'nowrap', textOverflow: 'ellipsis',
                  }}
                >
                  {STAGE_LABEL[b.stage]}
                </div>
              </div>
            )
          })}

          {visibleBrews.length === 0 && (
            <div style={{ padding: 40, textAlign: 'center', color: 'var(--t-3)' }}>
              <CalendarIcon size={24} style={{ margin: '0 auto', opacity: 0.5 }} />
              <p style={{ marginTop: 10, fontSize: 13 }}>Нет варок в этом периоде</p>
            </div>
          )}
        </div>
      </div>
    </Card>
  )
}

// ─── Month grid ────────────────────────────────────────────────────────────

function MonthGrid({ anchor, schedule }: { anchor: Date; schedule: ScheduledBrew[] }) {
  const start = new Date(anchor)
  start.setDate(1)
  const offset = (start.getDay() + 6) % 7
  start.setDate(start.getDate() - offset)

  const cells = Array.from({ length: 42 }, (_, i) => {
    const d = new Date(start)
    d.setDate(d.getDate() + i)
    return d
  })

  const month = anchor.getMonth()

  return (
    <Card pad="none" style={{ overflow: 'hidden' }}>
      <div style={{
        display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)',
        borderBottom: '1px solid var(--hairline)',
        background: 'var(--surface-1)',
      }}>
        {['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'].map(d => (
          <div key={d} style={{ padding: '10px', fontSize: 11, fontWeight: 600, color: 'var(--t-3)', letterSpacing: '0.08em', textTransform: 'uppercase', textAlign: 'center' }}>
            {d}
          </div>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gridAutoRows: 'minmax(110px, 1fr)' }}>
        {cells.map((d, i) => {
          const isToday = d.toDateString() === TODAY.toDateString()
          const isOutside = d.getMonth() !== month
          const dayEvents = schedule.filter(b => {
            const s = new Date(b.start)
            const e = new Date(b.end)
            return d >= s && d <= e
          })

          return (
            <div
              key={i}
              style={{
                padding: 8,
                borderRight: (i + 1) % 7 === 0 ? 'none' : '1px solid var(--hairline)',
                borderTop: i >= 7 ? '1px solid var(--hairline)' : 'none',
                background: isToday ? 'var(--accent-soft)' : 'transparent',
                opacity: isOutside ? 0.4 : 1,
                display: 'flex', flexDirection: 'column', gap: 4, minHeight: 0,
              }}
            >
              <p className="t-mono" style={{
                fontSize: 12, fontWeight: isToday ? 700 : 500,
                color: isToday ? 'var(--accent)' : 'var(--t-2)',
              }}>
                {d.getDate()}
              </p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 3, overflow: 'hidden' }}>
                {dayEvents.slice(0, 3).map(b => (
                  <div
                    key={b.id}
                    style={{
                      padding: '3px 7px',
                      fontSize: 10.5, fontWeight: 600,
                      borderRadius: 5,
                      background: STAGE_BAR[b.stage],
                      color: '#0a0a0f',
                      overflow: 'hidden', whiteSpace: 'nowrap', textOverflow: 'ellipsis',
                    }}
                    title={`${b.name} — ${STAGE_LABEL[b.stage]}`}
                  >
                    {b.name}
                  </div>
                ))}
                {dayEvents.length > 3 && (
                  <p className="t-meta" style={{ fontSize: 10 }}>+{dayEvents.length - 3} ещё</p>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </Card>
  )
}
