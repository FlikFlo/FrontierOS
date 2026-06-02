'use client'

import { useMemo, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Plus, Pencil, Trash2, MessageCircle, Globe } from 'lucide-react'
import { Card } from '../ui/card'
import { Badge } from '../ui/badge'
import { Button } from '../ui/button'
import { Table, THead, TBody, TR, TH, TD } from '../ui/table'
import { ConfirmDialog } from '../ui/confirm-dialog'
import { DataState } from '../data-state'
import { ClientFormModal } from './client-form-modal'
import { FilterSelect, Pager, SearchInput, SortHeader, useListControls } from '../list-controls'
import { useI18n } from '@/i18n/provider'
import { useRealtime } from '@/lib/use-realtime'
import { removeClient } from '@/app/(app)/clients/actions'
import { waLink } from '@/lib/utils'
import type { Client, ClientStatus } from '@/types/database'

const RT_TABLES = ['clients']

type ClientsViewProps =
  | { status: 'unconfigured' }
  | { status: 'error' }
  | { status: 'ok'; rows: Client[] }

const STATUS_VARIANT: Record<ClientStatus, 'success' | 'warning' | 'default'> = {
  active: 'success',
  lead: 'warning',
  inactive: 'default',
}

const CLIENT_STATUSES: ClientStatus[] = ['lead', 'active', 'inactive']
const NO_ROWS: Client[] = []

const clientSearch = (c: Client) =>
  `${c.name} ${c.industry ?? ''} ${c.website ?? ''} ${c.email ?? ''} ${c.phone ?? ''} ${c.address ?? ''}`

function siteUrl(website: string | null): string | null {
  if (!website) return null
  return /^https?:\/\//i.test(website) ? website : `https://${website}`
}
const CLIENT_SORTS: Record<string, (c: Client) => string | number> = {
  name: (c) => c.name.toLowerCase(),
  industry: (c) => (c.industry ?? '').toLowerCase(),
  status: (c) => c.status,
}

export function ClientsView(props: ClientsViewProps) {
  const { t } = useI18n()
  const router = useRouter()
  useRealtime(RT_TABLES)
  const rows = props.status === 'ok' ? props.rows : NO_ROWS
  const [statusFilter, setStatusFilter] = useState('all')
  const visible = useMemo(
    () => (statusFilter === 'all' ? rows : rows.filter((c) => c.status === statusFilter)),
    [rows, statusFilter],
  )
  const ctrl = useListControls(visible, clientSearch, CLIENT_SORTS, 'name')

  const [form, setForm] = useState<{ open: boolean; client: Client | null }>({ open: false, client: null })
  const [toDelete, setToDelete] = useState<Client | null>(null)
  const [deleting, setDeleting] = useState(false)

  async function confirmDelete() {
    if (!toDelete) return
    setDeleting(true)
    await removeClient(toDelete.id)
    setDeleting(false)
    setToDelete(null)
    router.refresh()
  }

  return (
    <div className="space-y-4">
      <div className="flex items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold text-white">{t('nav.clients')}</h1>
          <p className="mt-1 text-sm text-white/45">{t('pages.clients.subtitle')}</p>
        </div>
        <div className="flex items-center gap-2">
          {props.status === 'ok' && rows.length > 0 && (
            <Badge variant="accent">{t('clients.total', { count: rows.length })}</Badge>
          )}
          {props.status === 'ok' && (
            <Button size="sm" onClick={() => setForm({ open: true, client: null })}>
              <Plus size={15} />
              {t('common.new')}
            </Button>
          )}
        </div>
      </div>

      {props.status === 'unconfigured' && <DataState state="unconfigured" />}
      {props.status === 'error' && <DataState state="error" />}
      {props.status === 'ok' && rows.length === 0 && <DataState state="empty" />}

      {props.status === 'ok' && rows.length > 0 && (
        <>
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
            <SearchInput value={ctrl.query} onChange={ctrl.setQuery} />
            <FilterSelect
              value={statusFilter}
              onChange={setStatusFilter}
              options={[
                { value: 'all', label: t('common.all') },
                ...CLIENT_STATUSES.map((s) => ({ value: s, label: t(`clients.status.${s}`) })),
              ]}
            />
          </div>
          {ctrl.rows.length === 0 ? (
            <Card>
              <p className="text-[13px] text-white/45">{t('common.noResults')}</p>
            </Card>
          ) : (
            <Card className="p-0 overflow-hidden">
              <div className="overflow-x-auto no-scrollbar">
                <Table>
                  <THead>
                    <TR className="hover:bg-transparent">
                      <TH>
                        <SortHeader label={t('clients.columns.name')} sortKey="name" current={ctrl.sortKey} dir={ctrl.dir} onSort={ctrl.onSort} />
                      </TH>
                      <TH className="hidden md:table-cell">
                        <SortHeader label={t('clients.columns.industry')} sortKey="industry" current={ctrl.sortKey} dir={ctrl.dir} onSort={ctrl.onSort} />
                      </TH>
                      <TH className="hidden lg:table-cell">{t('clients.columns.email')}</TH>
                      <TH className="hidden md:table-cell">{t('clients.columns.phone')}</TH>
                      <TH>
                        <SortHeader label={t('clients.columns.status')} sortKey="status" current={ctrl.sortKey} dir={ctrl.dir} onSort={ctrl.onSort} />
                      </TH>
                      <TH className="text-right">{t('common.actions')}</TH>
                    </TR>
                  </THead>
                  <TBody>
                    {ctrl.pageRows.map((c) => (
                  <TR key={c.id}>
                    <TD className="font-medium">
                      <Link href={`/clients/${c.id}`} className="text-white hover:text-primary-light transition-colors">
                        {c.name}
                      </Link>
                    </TD>
                    <TD className="hidden md:table-cell">{c.industry ?? '—'}</TD>
                    <TD className="hidden font-mono text-[13px] text-white/60 lg:table-cell">{c.email ?? '—'}</TD>
                    <TD className="hidden font-mono text-[13px] text-white/60 md:table-cell">{c.phone ?? '—'}</TD>
                    <TD>
                      <Badge variant={STATUS_VARIANT[c.status]}>{t(`clients.status.${c.status}`)}</Badge>
                    </TD>
                    <TD className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        {siteUrl(c.website) && (
                          <a
                            href={siteUrl(c.website)!}
                            target="_blank"
                            rel="noopener noreferrer"
                            aria-label={t('clients.columns.website')}
                            title={c.website ?? ''}
                            className="inline-flex h-7 w-7 items-center justify-center rounded-lg text-white/40 hover:bg-white/[0.06] hover:text-white transition-colors"
                          >
                            <Globe size={14} />
                          </a>
                        )}
                        {waLink(c.phone) && (
                          <a
                            href={waLink(c.phone)!}
                            target="_blank"
                            rel="noopener noreferrer"
                            aria-label={t('common.whatsapp')}
                            title={t('common.whatsapp')}
                            className="inline-flex h-7 w-7 items-center justify-center rounded-lg text-white/40 hover:bg-success/10 hover:text-success transition-colors"
                          >
                            <MessageCircle size={14} />
                          </a>
                        )}
                        <button
                          onClick={() => setForm({ open: true, client: c })}
                          aria-label={t('common.edit')}
                          className="inline-flex h-7 w-7 items-center justify-center rounded-lg text-white/40 hover:bg-white/[0.06] hover:text-white transition-colors"
                        >
                          <Pencil size={14} />
                        </button>
                        <button
                          onClick={() => setToDelete(c)}
                          aria-label={t('common.delete')}
                          className="inline-flex h-7 w-7 items-center justify-center rounded-lg text-white/40 hover:bg-danger/10 hover:text-danger transition-colors"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </TD>
                  </TR>
                    ))}
                  </TBody>
                </Table>
              </div>
              <Pager page={ctrl.page} pageCount={ctrl.pageCount} onPage={ctrl.setPage} />
            </Card>
          )}
        </>
      )}

      {form.open && (
        <ClientFormModal
          key={form.client?.id ?? 'new'}
          open
          client={form.client}
          onClose={() => setForm({ open: false, client: null })}
        />
      )}

      <ConfirmDialog
        open={Boolean(toDelete)}
        title={t('clients.delete.title')}
        body={toDelete ? t('clients.delete.body', { name: toDelete.name }) : undefined}
        confirmLabel={deleting ? t('common.saving') : t('common.delete')}
        cancelLabel={t('common.cancel')}
        onConfirm={confirmDelete}
        onCancel={() => setToDelete(null)}
      />
    </div>
  )
}
