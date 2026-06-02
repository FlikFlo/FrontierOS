'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { UploadCloud } from 'lucide-react'
import { Modal } from '../ui/modal'
import { Button } from '../ui/button'
import { useI18n } from '@/i18n/provider'
import { useToast } from '../ui/toast'
import { parseCsv } from '@/lib/csv'
import { importClients, type ClientImportRow } from '@/app/(app)/clients/actions'
import type { ClientStatus, SalesChannel } from '@/types/database'

// Header aliases (lowercased) → canonical field.
const FIELD_ALIASES: Record<string, keyof ClientImportRow> = {
  name: 'name', nom: 'name', company: 'name', client: 'name', société: 'name', societe: 'name',
  email: 'email', 'e-mail': 'email', mail: 'email', courriel: 'email',
  phone: 'phone', tel: 'phone', telephone: 'phone', téléphone: 'phone', mobile: 'phone', gsm: 'phone',
  industry: 'industry', secteur: 'industry',
  address: 'address', adresse: 'address',
  website: 'website', site: 'website', 'site web': 'website', url: 'website',
  status: 'status', statut: 'status',
  channel: 'channel', canal: 'channel',
}
const STATUSES: ClientStatus[] = ['lead', 'active', 'inactive']
const CHANNELS: SalesChannel[] = ['horeca', 'retail', 'gms', 'wholesale', 'other']

function toRows(headers: string[], raw: string[][]): ClientImportRow[] {
  const idx: Partial<Record<keyof ClientImportRow, number>> = {}
  headers.forEach((h, i) => {
    const f = FIELD_ALIASES[h.trim().toLowerCase()]
    if (f && idx[f] === undefined) idx[f] = i
  })
  const cell = (r: string[], f: keyof ClientImportRow) => {
    const i = idx[f]
    const v = i === undefined ? '' : (r[i] ?? '').trim()
    return v || null
  }
  return raw
    .map((r) => {
      const status = (cell(r, 'status') ?? '').toLowerCase() as ClientStatus
      const channel = (cell(r, 'channel') ?? '').toLowerCase() as SalesChannel
      return {
        name: cell(r, 'name') ?? '',
        email: cell(r, 'email'),
        phone: cell(r, 'phone'),
        industry: cell(r, 'industry'),
        address: cell(r, 'address'),
        website: cell(r, 'website'),
        status: STATUSES.includes(status) ? status : 'lead',
        channel: CHANNELS.includes(channel) ? channel : null,
      }
    })
    .filter((r) => r.name)
}

export function ImportModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { t } = useI18n()
  const router = useRouter()
  const { toast } = useToast()
  const [rows, setRows] = useState<ClientImportRow[]>([])
  const [fileName, setFileName] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  async function onFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setError(null)
    setFileName(file.name)
    try {
      const { headers, rows: raw } = parseCsv(await file.text())
      const parsed = toRows(headers, raw)
      if (!parsed.length) {
        setError(t('clients.import.noRows'))
        setRows([])
        return
      }
      setRows(parsed)
    } catch {
      setError(t('clients.import.parseError'))
      setRows([])
    }
  }

  async function onConfirm() {
    setBusy(true)
    const res = await importClients(rows)
    setBusy(false)
    if (res.error) {
      setError(res.error)
      return
    }
    toast({ title: t('clients.import.done', { n: res.inserted }), variant: 'success' })
    onClose()
    router.refresh()
  }

  return (
    <Modal open={open} onClose={onClose} title={t('clients.import.title')}>
      <div className="space-y-3">
        <p className="text-[13px] text-white/50">{t('clients.import.hint')}</p>

        <label className="flex cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-white/15 bg-white/[0.02] px-4 py-6 text-center transition-colors hover:border-white/25 hover:bg-white/[0.04]">
          <UploadCloud size={22} className="text-white/40" />
          <span className="text-[13px] text-white/70">{fileName || t('clients.import.choose')}</span>
          <input type="file" accept=".csv,text/csv" className="hidden" onChange={onFile} />
        </label>

        {error && <p className="text-[13px] text-danger">{error}</p>}

        {rows.length > 0 && (
          <div className="rounded-lg border border-white/[0.08]">
            <div className="border-b border-white/[0.08] px-3 py-2 text-[12px] text-white/60">
              {t('clients.import.preview', { n: rows.length })}
            </div>
            <ul className="max-h-40 divide-y divide-white/[0.05] overflow-y-auto">
              {rows.slice(0, 8).map((r, i) => (
                <li key={i} className="flex items-center justify-between gap-3 px-3 py-1.5 text-[13px]">
                  <span className="truncate text-white/85">{r.name}</span>
                  <span className="truncate text-[12px] text-white/40">{r.phone ?? r.email ?? '—'}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        <div className="flex justify-end gap-2 pt-1">
          <Button type="button" variant="ghost" onClick={onClose}>
            {t('common.cancel')}
          </Button>
          <Button type="button" onClick={onConfirm} disabled={busy || rows.length === 0}>
            {busy ? t('common.saving') : t('clients.import.confirm', { n: rows.length })}
          </Button>
        </div>
      </div>
    </Modal>
  )
}
