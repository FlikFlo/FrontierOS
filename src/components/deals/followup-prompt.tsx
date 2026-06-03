'use client'

import { useState } from 'react'
import { CalendarClock } from 'lucide-react'
import { Modal } from '../ui/modal'
import { Button } from '../ui/button'
import { Input, Label } from '../ui/input'
import { useI18n } from '@/i18n/provider'

/**
 * Schedule-next-step dialog. Opened after a stage change (when the deal has no
 * upcoming follow-up) or from the deal's "next step" section. Keeps planning in
 * the same flow as moving the deal — no separate calendar bookkeeping.
 */
export function FollowupPrompt({
  open,
  dealTitle,
  defaultDate,
  busy = false,
  onSchedule,
  onSkip,
}: {
  open: boolean
  dealTitle: string
  defaultDate: string
  busy?: boolean
  onSchedule: (dueDate: string, note: string) => void
  onSkip: () => void
}) {
  const { t } = useI18n()
  const [date, setDate] = useState(defaultDate)
  const [note, setNote] = useState('')

  return (
    <Modal open={open} onClose={onSkip} title={t('deals.followup.title')}>
      <div className="space-y-3">
        <p className="flex items-center gap-2 text-[13px] text-white/55">
          <CalendarClock size={15} className="text-primary-light" />
          {t('deals.followup.body', { title: dealTitle })}
        </p>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label htmlFor="fp-date">{t('deals.followup.date')}</Label>
            <Input id="fp-date" type="date" value={date} onChange={(e) => setDate(e.target.value)} />
          </div>
          <div>
            <Label htmlFor="fp-note">{t('deals.followup.note')}</Label>
            <Input
              id="fp-note"
              value={note}
              placeholder={t('deals.followup.notePlaceholder')}
              onChange={(e) => setNote(e.target.value)}
            />
          </div>
        </div>
        <div className="flex justify-end gap-2 pt-1">
          <Button type="button" variant="ghost" onClick={onSkip} disabled={busy}>
            {t('deals.followup.skip')}
          </Button>
          <Button type="button" onClick={() => onSchedule(date, note)} disabled={busy || !date}>
            {busy ? t('common.saving') : t('deals.followup.schedule')}
          </Button>
        </div>
      </div>
    </Modal>
  )
}
