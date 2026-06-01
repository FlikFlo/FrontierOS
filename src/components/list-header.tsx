'use client'

import { Badge } from './ui/badge'
import { useI18n } from '@/i18n/provider'

/**
 * ListHeader — shared page title + subtitle + optional total badge for list
 * screens. All inputs are translation keys; `count` drives the total badge.
 */
export function ListHeader({
  titleKey,
  subtitleKey,
  totalKey,
  count,
}: {
  titleKey: string
  subtitleKey: string
  totalKey: string
  count?: number
}) {
  const { t } = useI18n()

  return (
    <div className="flex items-end justify-between gap-3">
      <div>
        <h1 className="text-2xl font-semibold text-white">{t(titleKey)}</h1>
        <p className="mt-1 text-sm text-white/45">{t(subtitleKey)}</p>
      </div>
      {typeof count === 'number' && count > 0 && (
        <Badge variant="accent">{t(totalKey, { count })}</Badge>
      )}
    </div>
  )
}
