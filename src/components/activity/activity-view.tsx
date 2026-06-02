'use client'

import Link from 'next/link'
import { Plus, Pencil, Trash2, UserPlus, type LucideIcon } from 'lucide-react'
import { Card } from '../ui/card'
import { DataState } from '../data-state'
import { useI18n } from '@/i18n/provider'
import { useRealtime } from '@/lib/use-realtime'
import { cn } from '@/lib/utils'
import type { Activity, ActivityAction } from '@/types/database'

const RT_TABLES = ['activity_log']

const ACTION_ICON: Record<ActivityAction, LucideIcon> = {
  created: Plus,
  updated: Pencil,
  deleted: Trash2,
  joined: UserPlus,
}
const ACTION_STYLE: Record<ActivityAction, string> = {
  created: 'bg-success/15 text-success',
  updated: 'bg-info/15 text-info',
  deleted: 'bg-danger/15 text-danger',
  joined: 'bg-accent/15 text-accent',
}

const ENTITY_PATH: Record<string, string> = {
  client: '/clients',
  deal: '/deals',
  order: '/orders',
  product: '/products',
}

type ActivityViewProps =
  | { status: 'unconfigured'; rows: Activity[] }
  | { status: 'error'; rows: Activity[] }
  | { status: 'ok'; rows: Activity[] }

export function ActivityView(props: ActivityViewProps) {
  const { t, locale } = useI18n()
  useRealtime(RT_TABLES)

  const tag = locale === 'fr' ? 'fr-FR' : 'en-US'
  const dayFmt = new Intl.DateTimeFormat(tag, { weekday: 'short', day: 'numeric', month: 'long' })
  const timeFmt = new Intl.DateTimeFormat(tag, { hour: '2-digit', minute: '2-digit' })

  const header = (
    <div>
      <h1 className="text-2xl font-semibold text-white">{t('nav.activity')}</h1>
      <p className="mt-1 text-sm text-white/45">{t('activity.subtitle')}</p>
    </div>
  )

  if (props.status !== 'ok') {
    return (
      <div className="space-y-4">
        {header}
        <DataState state={props.status === 'unconfigured' ? 'unconfigured' : 'error'} />
      </div>
    )
  }

  if (props.rows.length === 0) {
    return (
      <div className="space-y-4">
        {header}
        <Card>
          <p className="text-[13px] text-white/45">{t('activity.empty')}</p>
        </Card>
      </div>
    )
  }

  // Group the feed by calendar day.
  const groups: { day: string; items: Activity[] }[] = []
  for (const row of props.rows) {
    const day = dayFmt.format(new Date(row.created_at))
    const last = groups[groups.length - 1]
    if (last && last.day === day) last.items.push(row)
    else groups.push({ day, items: [row] })
  }

  const entityLabel = (entity: string) => {
    const key = `activity.entity.${entity}`
    const translated = t(key)
    return translated === key ? entity : translated
  }

  return (
    <div className="space-y-4">
      {header}

      {groups.map((g) => (
        <div key={g.day} className="space-y-2">
          <p className="px-1 text-[11px] font-semibold uppercase tracking-[0.12em] text-white/35">{g.day}</p>
          <Card className="p-0 overflow-hidden">
            <ul className="divide-y divide-white/[0.05]">
              {g.items.map((row) => {
                const Icon = ACTION_ICON[row.action] ?? Pencil
                const path = ENTITY_PATH[row.entity]
                const href = path && row.entity_id ? `${path}/${row.entity_id}` : null
                const actor = row.actor ? row.actor.split('@')[0] : 'system'
                // For a 'joined' row the entity holds the role → show it localised.
                const subject =
                  row.action === 'joined' ? t(`roles.${row.entity}`) : entityLabel(row.entity)
                const body = (
                  <div className="flex min-w-0 flex-1 items-center gap-2">
                    <span className="text-[13px] text-white/80">
                      <span className="font-medium text-white">{actor}</span> {t(`activity.${row.action}`)}{' '}
                      <span className={row.action === 'joined' ? 'font-medium text-white/90' : 'text-white/45'}>
                        {subject}
                      </span>{' '}
                      {row.label && <span className="font-medium text-white/90">{row.label}</span>}
                    </span>
                  </div>
                )
                return (
                  <li key={row.id}>
                    {href ? (
                      <Link href={href} className="flex items-center gap-3 px-3 py-2.5 hover:bg-white/[0.03]">
                        <span className={cn('flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-lg', ACTION_STYLE[row.action])}>
                          <Icon size={14} />
                        </span>
                        {body}
                        <span className="flex-shrink-0 font-mono text-[11px] text-white/35">
                          {timeFmt.format(new Date(row.created_at))}
                        </span>
                      </Link>
                    ) : (
                      <div className="flex items-center gap-3 px-3 py-2.5">
                        <span className={cn('flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-lg', ACTION_STYLE[row.action])}>
                          <Icon size={14} />
                        </span>
                        {body}
                        <span className="flex-shrink-0 font-mono text-[11px] text-white/35">
                          {timeFmt.format(new Date(row.created_at))}
                        </span>
                      </div>
                    )}
                  </li>
                )
              })}
            </ul>
          </Card>
        </div>
      ))}
    </div>
  )
}
