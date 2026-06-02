'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Bell } from 'lucide-react'
import { useI18n } from '@/i18n/provider'
import { formatDate } from '@/lib/utils'

export type NotificationItem = {
  id: string
  title: string
  dueDate: string
  overdue: boolean
  clientName: string | null
}

/**
 * Notification center — bell with a dropdown of due/overdue follow-ups.
 * Closes on outside click (transparent backdrop). Items deep-link to /calendar.
 */
export function NotificationBell({ items }: { items: NotificationItem[] }) {
  const { t, locale } = useI18n()
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const count = items.length

  return (
    <div className="relative">
      <button
        onClick={() => setOpen((o) => !o)}
        className="relative flex h-8 w-8 items-center justify-center rounded-lg text-white/60 transition-colors hover:bg-white/[0.06] hover:text-white"
        aria-label={t('a11y.notifications')}
      >
        <Bell size={18} />
        {count > 0 && (
          <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-danger px-1 text-[9px] font-bold leading-none text-white">
            {count > 9 ? '9+' : count}
          </span>
        )}
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="absolute right-0 top-10 z-50 w-80 overflow-hidden rounded-xl border border-white/10 bg-[#0c1f2b] shadow-2xl shadow-black/40">
            <div className="flex items-center justify-between border-b border-white/[0.06] px-3.5 py-2.5">
              <span className="text-[13px] font-semibold text-white/85">{t('notifications.title')}</span>
              {count > 0 && <span className="text-[11px] text-white/40">{count}</span>}
            </div>
            {count === 0 ? (
              <p className="px-3.5 py-6 text-center text-[13px] text-white/40">{t('notifications.empty')}</p>
            ) : (
              <ul className="max-h-80 divide-y divide-white/[0.05] overflow-y-auto">
                {items.map((n) => (
                  <li key={n.id}>
                    <button
                      onClick={() => {
                        setOpen(false)
                        router.push('/calendar')
                      }}
                      className="flex w-full items-start justify-between gap-3 px-3.5 py-2.5 text-left transition-colors hover:bg-white/[0.04]"
                    >
                      <div className="min-w-0">
                        <p className="truncate text-[13px] text-white/85">{n.title}</p>
                        <p className="truncate text-[11px] text-white/40">{n.clientName ?? '—'}</p>
                      </div>
                      <span
                        className={
                          'flex-shrink-0 rounded-full px-1.5 py-0.5 text-[10px] font-medium ' +
                          (n.overdue ? 'bg-danger/15 text-danger' : 'bg-white/[0.06] text-white/50')
                        }
                      >
                        {n.overdue ? t('dashboard.overdue') : formatDate(n.dueDate, locale)}
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
            )}
            <button
              onClick={() => {
                setOpen(false)
                router.push('/calendar')
              }}
              className="block w-full border-t border-white/[0.06] px-3.5 py-2.5 text-center text-[12px] text-primary-light hover:bg-white/[0.03]"
            >
              {t('notifications.viewAll')}
            </button>
          </div>
        </>
      )}
    </div>
  )
}
