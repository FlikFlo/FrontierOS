'use client'

import { Card, CardContent, CardHeader, CardTitle } from './ui/card'
import { useI18n } from '@/i18n/provider'

/**
 * DataState — shared empty / not-configured / error card for list screens.
 * Copy comes from the `data.*` dictionary keys.
 */
export function DataState({ state }: { state: 'unconfigured' | 'error' | 'empty' }) {
  const { t } = useI18n()

  if (state === 'error') {
    return (
      <Card>
        <CardContent>
          <p className="text-[13px] leading-relaxed text-danger">{t('data.error')}</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t(`data.${state}.title`)}</CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-[13px] leading-relaxed text-white/50">{t(`data.${state}.body`)}</p>
      </CardContent>
    </Card>
  )
}
