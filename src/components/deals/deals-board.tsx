'use client'

import { useState, type DragEvent } from 'react'
import { useRouter } from 'next/navigation'
import { Pencil, Trash2 } from 'lucide-react'
import { useI18n } from '@/i18n/provider'
import { formatMoney, cn } from '@/lib/utils'
import type { DealStage } from '@/types/database'
import type { DealRow } from './deals-view'

const STAGES: DealStage[] = ['lead', 'qualified', 'proposal', 'negotiation', 'won', 'lost']

const STAGE_DOT: Record<DealStage, string> = {
  lead: 'bg-white/40',
  qualified: 'bg-info',
  proposal: 'bg-warning',
  negotiation: 'bg-primary-light',
  won: 'bg-success',
  lost: 'bg-danger',
}

export function DealsBoard({
  deals,
  onMove,
  onEdit,
  onDelete,
}: {
  deals: DealRow[]
  onMove: (id: string, stage: DealStage) => void
  onEdit: (deal: DealRow) => void
  onDelete: (deal: DealRow) => void
}) {
  const { t, locale } = useI18n()
  const router = useRouter()
  const [dragId, setDragId] = useState<string | null>(null)
  const [overStage, setOverStage] = useState<DealStage | null>(null)

  function onDrop(e: DragEvent, stage: DealStage) {
    e.preventDefault()
    const id = e.dataTransfer.getData('text/plain') || dragId
    setOverStage(null)
    setDragId(null)
    if (id) onMove(id, stage)
  }

  return (
    <div className="overflow-x-auto no-scrollbar -mx-1 px-1 pb-2">
      <div className="flex gap-3 min-w-max">
        {STAGES.map((stage) => {
          const cards = deals.filter((d) => d.stage === stage)
          const total = cards.reduce((sum, d) => sum + d.amount, 0)
          return (
            <div
              key={stage}
              onDragOver={(e) => {
                e.preventDefault()
                setOverStage(stage)
              }}
              onDragLeave={() => setOverStage((s) => (s === stage ? null : s))}
              onDrop={(e) => onDrop(e, stage)}
              className={cn(
                'w-64 flex-shrink-0 rounded-2xl border p-2 transition-colors',
                overStage === stage
                  ? 'border-primary/50 bg-primary/[0.06]'
                  : 'border-white/[0.06] bg-white/[0.02]'
              )}
            >
              <div className="flex items-center gap-2 px-2 py-1.5">
                <span className={cn('h-2 w-2 rounded-full', STAGE_DOT[stage])} />
                <span className="text-[11px] font-semibold uppercase tracking-[0.1em] text-white/60">
                  {t(`deals.stage.${stage}`)}
                </span>
                <span className="text-[11px] text-white/30">{cards.length}</span>
                <span className="ml-auto font-mono text-[11px] text-white/40">
                  {formatMoney(total, 'MAD', locale)}
                </span>
              </div>

              <div className="mt-1 space-y-2 min-h-[40px]">
                {cards.map((deal) => (
                  <div
                    key={deal.id}
                    draggable
                    onClick={() => router.push(`/deals/${deal.id}`)}
                    onDragStart={(e) => {
                      e.dataTransfer.setData('text/plain', deal.id)
                      e.dataTransfer.effectAllowed = 'move'
                      setDragId(deal.id)
                    }}
                    onDragEnd={() => {
                      setDragId(null)
                      setOverStage(null)
                    }}
                    className={cn(
                      'group rounded-xl border border-white/[0.08] bg-white/[0.06] p-3 cursor-pointer active:cursor-grabbing',
                      'shadow-[0_1px_0_rgba(255,255,255,0.06)_inset] transition-opacity hover:border-white/[0.16]',
                      dragId === deal.id && 'opacity-40'
                    )}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <span className="text-[13px] font-medium leading-snug text-white">
                        {deal.title}
                      </span>
                      <div className="flex flex-shrink-0 items-center gap-0.5 opacity-100 transition-opacity lg:opacity-0 lg:group-hover:opacity-100">
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            onEdit(deal)
                          }}
                          aria-label={t('common.edit')}
                          className="inline-flex h-6 w-6 items-center justify-center rounded-md text-white/40 hover:bg-white/[0.08] hover:text-white"
                        >
                          <Pencil size={12} />
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            onDelete(deal)
                          }}
                          aria-label={t('common.delete')}
                          className="inline-flex h-6 w-6 items-center justify-center rounded-md text-white/40 hover:bg-danger/10 hover:text-danger"
                        >
                          <Trash2 size={12} />
                        </button>
                      </div>
                    </div>
                    {deal.clientName && (
                      <p className="mt-1 text-[11px] text-white/45">{deal.clientName}</p>
                    )}
                    <div className="mt-2 flex items-center justify-between">
                      <span className="font-mono text-[12px] tabular-nums text-white">
                        {formatMoney(deal.amount, deal.currency, locale)}
                      </span>
                      <span className="text-[10px] text-white/40">{deal.probability}%</span>
                    </div>
                    {/* Touch-friendly stage move (drag is desktop-only). */}
                    <select
                      value={deal.stage}
                      onClick={(e) => e.stopPropagation()}
                      onChange={(e) => {
                        e.stopPropagation()
                        onMove(deal.id, e.target.value as DealStage)
                      }}
                      aria-label={t('deals.columns.stage')}
                      className="mt-2 w-full rounded-lg border border-white/[0.10] bg-white/[0.06] px-2 py-1.5 text-[11px] text-white/80 focus:outline-none focus:border-primary/50 lg:hidden"
                    >
                      {STAGES.map((s) => (
                        <option key={s} value={s}>
                          {t(`deals.stage.${s}`)}
                        </option>
                      ))}
                    </select>
                  </div>
                ))}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
