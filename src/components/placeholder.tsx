'use client'

import { Card, CardContent, CardHeader, CardTitle } from './ui/card'
import { useI18n } from '@/i18n/provider'

/**
 * Placeholder — the single empty-state page used by every stub CRM route while
 * the rebuild is in progress. Takes translation keys (not literal text) so the
 * content re-localizes instantly when the language is switched.
 */
export function Placeholder({ titleKey, subtitleKey }: { titleKey: string; subtitleKey?: string }) {
  const { t } = useI18n()
  const title = t(titleKey)

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-semibold text-white">{title}</h1>
        {subtitleKey && <p className="mt-1 text-sm text-white/45">{t(subtitleKey)}</p>}
      </div>
      <Card>
        <CardHeader>
          <CardTitle>{t('placeholder.title')}</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-[13px] leading-relaxed text-white/50">{t('placeholder.body', { title })}</p>
        </CardContent>
      </Card>
    </div>
  )
}
