'use client'

import { useMemo, useState } from 'react'
import { ChevronLeft, ChevronRight, Plus } from 'lucide-react'
import { Card } from '../ui/card'
import { Button } from '../ui/button'
import { DataState } from '../data-state'
import { ReminderFormModal, type ClientOpt } from './reminder-form-modal'
import { useI18n } from '@/i18n/provider'
import { useRealtime } from '@/lib/use-realtime'
import { cn } from '@/lib/utils'
import type { Reminder } from '@/types/database'

const RT_TABLES = ['reminders']

type CalendarViewProps =
  | { status: 'unconfigured' }
  | { status: 'error' }
  | { status: 'ok'; reminders: Reminder[]; clients: ClientOpt[] }

const pad = (n: number) => String(n).padStart(2, '0')
const dateKey = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
const addDays = (d: Date, n: number) => new Date(d.getFullYear(), d.getMonth(), d.getDate() + n)
const localeTag = (l: string) => (l === 'fr' ? 'fr-MA' : 'en-US')
const NO: never[] = []

export function CalendarView(props: CalendarViewProps) {
  const { t, locale } = useI18n()
  useRealtime(RT_TABLES)
  const reminders = props.status === 'ok' ? props.reminders : (NO as Reminder[])
  const clients = props.status === 'ok' ? props.clients : (NO as ClientOpt[])

  const now = new Date()
  const [cursor, setCursor] = useState(new Date(now.getFullYear(), now.getMonth(), 1))
  const [form, setForm] = useState<{ open: boolean; reminder: Reminder | null; date: string }>({
    open: false,
    reminder: null,
    date: dateKey(now),
  })

  const todayKey = dateKey(now)
  const tag = localeTag(locale)

  const byDate = useMemo(() => {
    const map = new Map<string, Reminder[]>()
    for (const r of reminders) {
      const list = map.get(r.due_date) ?? []
      list.push(r)
      map.set(r.due_date, list)
    }
    return map
  }, [reminders])

  const cells = useMemo(() => {
    const first = new Date(cursor.getFullYear(), cursor.getMonth(), 1)
    const startDow = (first.getDay() + 6) % 7 // Monday = 0
    const start = addDays(first, -startDow)
    return Array.from({ length: 42 }, (_, i) => addDays(start, i))
  }, [cursor])

  const monthLabel = new Intl.DateTimeFormat(tag, { month: 'long', year: 'numeric' }).format(cursor)
  const weekdays = useMemo(() => {
    const monday = new Date(2024, 0, 1) // a Monday
    const fmt = new Intl.DateTimeFormat(tag, { weekday: 'short' })
    return Array.from({ length: 7 }, (_, i) => fmt.format(addDays(monday, i)))
  }, [tag])

  const month = cursor.getMonth()

  return (
    <div className="space-y-4">
      <div className="flex items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold text-white">{t('nav.calendar')}</h1>
          <p className="mt-1 text-sm text-white/45">{t('calendar.subtitle')}</p>
        </div>
        {props.status === 'ok' && (
          <Button size="sm" onClick={() => setForm({ open: true, reminder: null, date: todayKey })}>
            <Plus size={15} />
            {t('common.new')}
          </Button>
        )}
      </div>

      {props.status === 'unconfigured' && <DataState state="unconfigured" />}
      {props.status === 'error' && <DataState state="error" />}

      {props.status === 'ok' && (
        <Card>
          <div className="mb-3 flex items-center gap-2">
            <button
              onClick={() => setCursor(new Date(cursor.getFullYear(), cursor.getMonth() - 1, 1))}
              aria-label="Previous month"
              className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-white/50 hover:bg-white/[0.06] hover:text-white"
            >
              <ChevronLeft size={18} />
            </button>
            <button
              onClick={() => setCursor(new Date(cursor.getFullYear(), cursor.getMonth() + 1, 1))}
              aria-label="Next month"
              className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-white/50 hover:bg-white/[0.06] hover:text-white"
            >
              <ChevronRight size={18} />
            </button>
            <span className="ml-1 text-base font-semibold capitalize text-white">{monthLabel}</span>
            <button
              onClick={() => setCursor(new Date(now.getFullYear(), now.getMonth(), 1))}
              className="ml-auto rounded-lg px-2.5 py-1 text-[12px] font-medium text-white/55 hover:bg-white/[0.06] hover:text-white"
            >
              {t('calendar.today')}
            </button>
          </div>

          <div className="grid grid-cols-7 gap-1">
            {weekdays.map((w) => (
              <div key={w} className="px-1 pb-1 text-center text-[10px] font-semibold uppercase tracking-wide text-white/35">
                {w}
              </div>
            ))}

            {cells.map((day) => {
              const key = dateKey(day)
              const items = byDate.get(key) ?? []
              const inMonth = day.getMonth() === month
              const isToday = key === todayKey
              return (
                <div
                  key={key}
                  className={cn(
                    'group min-h-[92px] rounded-lg border p-1.5 transition-colors',
                    inMonth ? 'border-white/[0.07] bg-white/[0.02]' : 'border-transparent bg-transparent opacity-45'
                  )}
                >
                  <div className="flex items-center justify-between">
                    <span
                      className={cn(
                        'inline-flex h-5 min-w-5 items-center justify-center rounded-full px-1 text-[11px] tabular-nums',
                        isToday ? 'bg-primary font-semibold text-white' : 'text-white/55'
                      )}
                    >
                      {day.getDate()}
                    </span>
                    <button
                      onClick={() => setForm({ open: true, reminder: null, date: key })}
                      aria-label={t('common.new')}
                      className="inline-flex h-5 w-5 items-center justify-center rounded text-white/40 opacity-0 transition-opacity hover:bg-white/[0.08] hover:text-white group-hover:opacity-100"
                    >
                      <Plus size={13} />
                    </button>
                  </div>
                  <div className="mt-1 space-y-1">
                    {items.map((r) => {
                      const overdue = !r.done && r.due_date < todayKey
                      return (
                        <button
                          key={r.id}
                          onClick={() => setForm({ open: true, reminder: r, date: r.due_date })}
                          title={r.title}
                          className={cn(
                            'block w-full truncate rounded-md px-1.5 py-0.5 text-left text-[11px] leading-tight',
                            r.done
                              ? 'bg-white/[0.05] text-white/35 line-through'
                              : overdue
                                ? 'bg-danger/15 text-danger'
                                : 'bg-primary/15 text-primary-light'
                          )}
                        >
                          {r.title}
                        </button>
                      )
                    })}
                  </div>
                </div>
              )
            })}
          </div>
        </Card>
      )}

      {form.open && (
        <ReminderFormModal
          key={form.reminder?.id ?? `new-${form.date}`}
          open
          clients={clients}
          reminder={form.reminder}
          defaultDate={form.date}
          onClose={() => setForm((f) => ({ ...f, open: false }))}
        />
      )}
    </div>
  )
}
