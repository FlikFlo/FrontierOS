'use client'

import { useRef, useState, type FormEvent } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import {
  ArrowLeft,
  Pencil,
  Trash2,
  Upload,
  FileText,
  Send,
  Paperclip,
  ExternalLink,
} from 'lucide-react'
import { Card, CardHeader, CardTitle, CardContent } from '../ui/card'
import { Badge } from '../ui/badge'
import { Button } from '../ui/button'
import { Modal } from '../ui/modal'
import { Textarea } from '../ui/input'
import { DealFormModal, type ClientOption } from './deal-form-modal'
import { useI18n } from '@/i18n/provider'
import { formatDate, formatMoney } from '@/lib/utils'
import {
  addComment,
  removeComment,
  uploadAttachment,
  removeAttachment,
} from '@/app/(app)/deals/[id]/actions'
import type { Deal, DealComment, DealStage } from '@/types/database'

export type DealDetail = Deal & { clientName: string | null }
export type AttachmentView = {
  id: string
  name: string
  path: string
  mime: string | null
  url: string | null
}

const STAGE_VARIANT: Record<DealStage, 'default' | 'warning' | 'success' | 'danger'> = {
  lead: 'default',
  qualified: 'default',
  proposal: 'warning',
  negotiation: 'warning',
  won: 'success',
  lost: 'danger',
}

const isImage = (m: string | null) => Boolean(m && m.startsWith('image/'))
const isPdf = (m: string | null) => m === 'application/pdf'

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
  comments: DealComment[]
  attachments: AttachmentView[]
}) {
  const { t, locale } = useI18n()
  const router = useRouter()
  const fileRef = useRef<HTMLInputElement | null>(null)

  const [editOpen, setEditOpen] = useState(false)
  const [comment, setComment] = useState('')
  const [posting, setPosting] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [preview, setPreview] = useState<AttachmentView | null>(null)

  async function onPost(e: FormEvent) {
    e.preventDefault()
    if (!comment.trim()) return
    setPosting(true)
    await addComment(deal.id, comment)
    setComment('')
    setPosting(false)
    router.refresh()
  }

  async function onUpload(file: File) {
    setUploading(true)
    const fd = new FormData()
    fd.append('dealId', deal.id)
    fd.append('file', file)
    await uploadAttachment(fd)
    setUploading(false)
    if (fileRef.current) fileRef.current.value = ''
    router.refresh()
  }

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

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        {/* Details */}
        <Card>
          <CardHeader>
            <CardTitle>{t('deals.detail.info')}</CardTitle>
          </CardHeader>
          <CardContent className="divide-y divide-white/[0.06]">
            <Field label={t('deals.columns.client')}>{deal.clientName ?? '—'}</Field>
            <Field label={t('deals.columns.amount')}>{formatMoney(deal.amount, deal.currency, locale)}</Field>
            <Field label={t('deals.columns.probability')}>{deal.probability}%</Field>
            <Field label={t('deals.columns.close')}>{formatDate(deal.expected_close_date, locale)}</Field>
          </CardContent>
        </Card>

        {/* Attachments */}
        <Card>
          <CardHeader className="flex items-center justify-between">
            <CardTitle>
              <span className="inline-flex items-center gap-2">
                <Paperclip size={16} />
                {t('deals.detail.attachments')}
              </span>
            </CardTitle>
            <Button size="sm" disabled={uploading} onClick={() => fileRef.current?.click()}>
              <Upload size={14} />
              {uploading ? t('common.saving') : t('deals.detail.upload')}
            </Button>
            <input
              ref={fileRef}
              type="file"
              className="hidden"
              onChange={(e) => {
                const f = e.target.files?.[0]
                if (f) onUpload(f)
              }}
            />
          </CardHeader>
          <CardContent>
            {attachments.length === 0 ? (
              <p className="text-[13px] text-white/45">{t('deals.detail.noAttachments')}</p>
            ) : (
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                {attachments.map((a) => (
                  <div key={a.id} className="group relative">
                    <button
                      onClick={() => setPreview(a)}
                      className="block w-full overflow-hidden rounded-lg border border-white/[0.08] bg-white/[0.04] text-left transition-colors hover:border-primary/40"
                    >
                      {isImage(a.mime) && a.url ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={a.url} alt={a.name} className="h-20 w-full object-cover" />
                      ) : (
                        <div className="flex h-20 items-center justify-center text-white/40">
                          <FileText size={22} />
                        </div>
                      )}
                      <span className="block truncate px-2 py-1 text-[11px] text-white/70">{a.name}</span>
                    </button>
                    <button
                      onClick={() => removeAttachment(a.id, deal.id, a.path).then(() => router.refresh())}
                      aria-label={t('common.delete')}
                      className="absolute right-1 top-1 inline-flex h-6 w-6 items-center justify-center rounded-md bg-black/50 text-white/60 opacity-0 transition-opacity hover:text-danger group-hover:opacity-100"
                    >
                      <Trash2 size={12} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Comments */}
      <Card>
        <CardHeader>
          <CardTitle>{t('deals.detail.comments')}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <form onSubmit={onPost} className="space-y-2">
            <Textarea
              rows={2}
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder={t('deals.detail.addComment')}
            />
            <div className="flex justify-end">
              <Button type="submit" size="sm" disabled={posting || !comment.trim()}>
                <Send size={14} />
                {posting ? t('common.saving') : t('deals.detail.post')}
              </Button>
            </div>
          </form>

          {comments.length === 0 ? (
            <p className="text-[13px] text-white/45">{t('deals.detail.noComments')}</p>
          ) : (
            <ul className="space-y-3">
              {comments.map((c) => (
                <li key={c.id} className="group rounded-xl border border-white/[0.06] bg-white/[0.02] p-3">
                  <div className="mb-1 flex items-center justify-between gap-3">
                    <span className="text-[12px] font-medium text-white/70">{c.author ?? '—'}</span>
                    <span className="flex items-center gap-2">
                      <span className="text-[11px] text-white/35">{formatDate(c.created_at, locale)}</span>
                      <button
                        onClick={() => removeComment(c.id, deal.id).then(() => router.refresh())}
                        aria-label={t('common.delete')}
                        className="text-white/30 opacity-0 transition-opacity hover:text-danger group-hover:opacity-100"
                      >
                        <Trash2 size={12} />
                      </button>
                    </span>
                  </div>
                  <p className="whitespace-pre-wrap text-[13px] leading-relaxed text-white/85">{c.body}</p>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>

      {editOpen && (
        <DealFormModal
          open
          clients={clients}
          deal={deal}
          onClose={() => setEditOpen(false)}
          onSaved={() => router.refresh()}
        />
      )}

      {/* In-app attachment preview (no download). */}
      {preview && (
        <Modal open onClose={() => setPreview(null)} title={preview.name} widthClassName="max-w-4xl">
          {preview.url && isImage(preview.mime) ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={preview.url} alt={preview.name} className="mx-auto max-h-[75vh] w-auto rounded-lg" />
          ) : preview.url && isPdf(preview.mime) ? (
            <iframe src={preview.url} title={preview.name} className="h-[75vh] w-full rounded-lg bg-white" />
          ) : (
            <div className="py-8 text-center">
              <p className="mb-3 text-[13px] text-white/50">{t('deals.detail.previewUnavailable')}</p>
              {preview.url && (
                <a
                  href={preview.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 text-sm text-primary-light hover:text-primary"
                >
                  <ExternalLink size={15} />
                  {preview.name}
                </a>
              )}
            </div>
          )}
        </Modal>
      )}
    </div>
  )
}
