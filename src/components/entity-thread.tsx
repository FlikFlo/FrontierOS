'use client'

import { useRef, useState, type FormEvent } from 'react'
import { useRouter } from 'next/navigation'
import { Trash2, Upload, FileText, Send, Paperclip, ExternalLink } from 'lucide-react'
import { Card, CardHeader, CardTitle, CardContent } from './ui/card'
import { Button } from './ui/button'
import { Modal } from './ui/modal'
import { Textarea } from './ui/input'
import { useI18n } from '@/i18n/provider'
import { useRealtime } from '@/lib/use-realtime'
import { formatDate } from '@/lib/utils'
import { addComment, removeComment, uploadAttachment, removeAttachment } from '@/app/(app)/thread-actions'
import type { Comment, EntityKind } from '@/types/database'

const RT_TABLES = ['comments', 'attachments']

export type AttachmentView = {
  id: string
  name: string
  path: string
  mime: string | null
  url: string | null
}

const isImage = (m: string | null) => Boolean(m && m.startsWith('image/'))
const isPdf = (m: string | null) => m === 'application/pdf'

export function EntityThread({
  entity,
  entityId,
  comments,
  attachments,
}: {
  entity: EntityKind
  entityId: string
  comments: Comment[]
  attachments: AttachmentView[]
}) {
  const { t, locale } = useI18n()
  const router = useRouter()
  useRealtime(RT_TABLES)
  const fileRef = useRef<HTMLInputElement | null>(null)

  const [comment, setComment] = useState('')
  const [posting, setPosting] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [preview, setPreview] = useState<AttachmentView | null>(null)

  async function onPost(e: FormEvent) {
    e.preventDefault()
    if (!comment.trim()) return
    setPosting(true)
    await addComment(entity, entityId, comment)
    setComment('')
    setPosting(false)
    router.refresh()
  }

  async function onUpload(file: File) {
    setUploading(true)
    const fd = new FormData()
    fd.append('entity', entity)
    fd.append('entityId', entityId)
    fd.append('file', file)
    await uploadAttachment(fd)
    setUploading(false)
    if (fileRef.current) fileRef.current.value = ''
    router.refresh()
  }

  return (
    <div className="space-y-4">
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
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-4 lg:grid-cols-6">
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
                    onClick={() => removeAttachment(a.id, entity, entityId, a.path).then(() => router.refresh())}
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
                        onClick={() => removeComment(c.id, entity, entityId).then(() => router.refresh())}
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
