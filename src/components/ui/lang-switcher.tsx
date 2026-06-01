'use client'

import { locales } from '@/i18n/config'
import { useI18n } from '@/i18n/provider'
import { cn } from '@/lib/utils'

/**
 * LangSwitcher — a compact EN | FR segmented toggle for the topbar. Switching
 * is instant (client locale state); the choice persists via the `locale` cookie.
 */
export function LangSwitcher() {
  const { locale, setLocale, t } = useI18n()

  return (
    <div
      role="group"
      aria-label={t('a11y.language')}
      className="flex items-center gap-0.5 rounded-lg bg-white/[0.06] p-0.5"
    >
      {locales.map((code) => {
        const active = locale === code
        return (
          <button
            key={code}
            type="button"
            onClick={() => setLocale(code)}
            aria-pressed={active}
            className={cn(
              'px-2 py-1 rounded-md text-[11px] font-semibold uppercase tracking-wide transition-colors',
              active ? 'bg-white/[0.14] text-white' : 'text-white/45 hover:text-white/80',
            )}
          >
            {code}
          </button>
        )
      })}
    </div>
  )
}
