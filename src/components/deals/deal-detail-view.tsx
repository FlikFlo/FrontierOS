'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { ArrowLeft, Pencil } from 'lucide-react'
import { Card, CardHeader, CardTitle, CardContent } from '../ui/card'
import { Badge } from '../ui/badge'
import { Button } from '../ui/button'
import { EntityThread, type AttachmentView } from '../entity-thread'
import { DealFormModal, type ClientOption } from './deal-form-modal'
import { useI18n } from '@/i18n/provider'
import { formatDate, formatMoney } from '@/lib/utils'
import type { Comment, Deal, DealStage } from '@/types/database'

export type DealDetail = Deal & { clientName: string | null }
export type { AttachmentView }

const STAGE_VARIANT: Record<DealStage, 'default' | 'warning' | 'success' | 'danger'> = {
  lead: 'default',
  qualified: 'default',
  proposal: 'warning',
  negotiation: 'warning',
  won: 'success',
  lost: 'danger',
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-3 py-1.5">
      <span className="text-[13px] text-white/40">{label}</span>
      <span className="text-right text-[13px] text-white/80">{children}</span>
    </div>
  )
}

export function DealDetailView({
  deal,
  clients,
  comments,
  attachments,
}: {
  deal: DealDetail
  clients: ClientOption[]
  comments: Comment[]
  attachments: AttachmentView[]
}) {
  const { t, locale } = useI18n()
  const router = useRouter()
  const [editOpen, setEditOpen] = useState(false)

  return (
    <div className="space-y-4">
      <Link
        href="/deals"
        className="inline-flex items-center gap-1.5 text-[13px] text-white/45 hover:text-white/80 transition-colors"
      >
        <ArrowLeft size={15} />
        {t('deals.detail.back')}
      </Link>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-semibold text-white">{deal.title}</h1>
          <Badge variant={STAGE_VARIANT[deal.stage]}>{t(`deals.stage.${deal.stage}`)}</Badge>
        </div>
        <Button size="sm" variant="outline" onClick={() => setEditOpen(true)}>
          <Pencil size={14} />
          {t('common.edit')}
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{t('deals.detail.info')}</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 gap-x-8 divide-white/[0.06] sm:grid-cols-2 sm:divide-x">
          <div className="divide-y divide-white/[0.06] sm:pr-8">
            <Field label={t('deals.columns.client')}>{deal.clientName ?? '—'}</Field>
            <Field label={t('deals.columns.amount')}>{formatMoney(deal.amount, deal.currency, locale)}</Field>
          </div>
          <div className="divide-y divide-white/[0.06]">
            <Field label={t('deals.columns.probability')}>{deal.probability}%</Field>
            <Field label={t('deals.columns.close')}>{formatDate(deal.expected_close_date, locale)}</Field>
          </div>
        </CardContent>
      </Card>

      <EntityThread entity="deal" entityId={deal.id} comments={comments} attachments={attachments} />

      {editOpen && (
        <DealFormModal
          open
          clients={clients}
          deal={deal}
          onClose={() => setEditOpen(false)}
          onSaved={() => router.refresh()}
        />
      )}
    </div>
  )
}
