'use client'

import { useMemo, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Plus, Pencil, Trash2, Download } from 'lucide-react'
import { Card } from '../ui/card'
import { Badge } from '../ui/badge'
import { Button } from '../ui/button'
import { Select } from '../ui/input'
import { Tabs } from '../ui/tabs'
import { Table, THead, TBody, TR, TH, TD } from '../ui/table'
import { ConfirmDialog } from '../ui/confirm-dialog'
import { DataState } from '../data-state'
import { DealsBoard } from './deals-board'
import { DealFormModal, type ClientOption, type MemberOption } from './deal-form-modal'
import { BulkBar, Checkbox, FilterSelect, Pager, SearchInput, SortHeader, useListControls, useSelection } from '../list-controls'
import { useI18n } from '@/i18n/provider'
import { useRealtime } from '@/lib/use-realtime'
import { formatDate, formatMoney } from '@/lib/utils'
import { downloadCsv, type CsvColumn } from '@/lib/csv'
import { moveDeal, removeDeal } from '@/app/(app)/deals/actions'
import { bulkDelete, bulkUpdateStage } from '@/app/(app)/bulk-actions'
import type { Deal, DealStage } from '@/types/database'

const RT_TABLES = ['deals']

export type DealRow = Deal & { clientName: string | null }

type DealsViewProps =
  | { status: 'unconfigured' }
  | { status: 'error' }
  | { status: 'ok'; rows: DealRow[]; clients: ClientOption[]; members: MemberOption[] }

const NO_CLIENTS: ClientOption[] = []
const NO_MEMBERS: MemberOption[] = []
const NO_ROWS: DealRow[] = []

const STAGE_VARIANT: Record<DealStage, 'default' | 'warning' | 'success' | 'danger'> = {
  lead: 'default',
  qualified: 'default',
  proposal: 'warning',
  negotiation: 'warning',
  won: 'success',
  lost: 'danger',
}

const DEAL_STAGES: DealStage[] = ['lead', 'qualified', 'proposal', 'negotiation', 'won', 'lost']
const DEAL_CSV: CsvColumn<DealRow>[] = [
  { header: 'Title', value: (d) => d.title },
  { header: 'Client', value: (d) => d.clientName },
  { header: 'Stage', value: (d) => d.stage },
  { header: 'Amount', value: (d) => d.amount },
  { header: 'Currency', value: (d) => d.currency },
  { header: 'Probability', value: (d) => d.probability },
  { header: 'Cases/mo', value: (d) => d.est_cases_per_month },
  { header: 'Outlets', value: (d) => d.outlets },
  { header: 'Expected close', value: (d) => d.expected_close_date },
]

const dealSearch = (d: DealRow) => `${d.title} ${d.clientName ?? ''}`
const DEAL_SORTS: Record<string, (d: DealRow) => string | number> = {
  title: (d) => d.title.toLowerCase(),
  client: (d) => (d.clientName ?? '').toLowerCase(),
  stage: (d) => d.stage,
  amount: (d) => d.amount,
  probability: (d) => d.probability,
  close: (d) => d.expected_close_date ?? '',
}

export function DealsView(props: DealsViewProps) {
  const { t, locale } = useI18n()
  const router = useRouter()
  useRealtime(RT_TABLES)
  const sel = useSelection()
  const clients = props.status === 'ok' ? props.clients : NO_CLIENTS
  const members = props.status === 'ok' ? props.members : NO_MEMBERS
  const memberById = useMemo(() => new Map(members.map((m) => [m.id, m.name])), [members])

  // Local state powers optimistic kanban drag, but must re-sync whenever the
  // server sends fresh rows (navigation OR a realtime router.refresh()).
  // Render-phase reset (vs. an effect) keeps it instant and lint-clean.
  const incoming = props.status === 'ok' ? props.rows : NO_ROWS
  const [deals, setDeals] = useState<DealRow[]>(incoming)
  const [syncedRows, setSyncedRows] = useState<DealRow[]>(incoming)
  if (incoming !== syncedRows) {
    setSyncedRows(incoming)
    setDeals(incoming)
  }

  const [view, setView] = useState<'board' | 'table'>('board')
  const [stageFilter, setStageFilter] = useState('all')
  const [form, setForm] = useState<{ open: boolean; deal: Deal | null }>({ open: false, deal: null })
  const [toDelete, setToDelete] = useState<DealRow | null>(null)
  const [deleting, setDeleting] = useState(false)

  // Stage filter applies in the table view only (the board is already split by stage).
  const visible = useMemo(
    () => (view === 'table' && stageFilter !== 'all' ? deals.filter((d) => d.stage === stageFilter) : deals),
    [deals, view, stageFilter],
  )
  const ctrl = useListControls(visible, dealSearch, DEAL_SORTS, 'amount', 'desc')

  const dealCsvCols = useMemo<CsvColumn<DealRow>[]>(
    () => [
      ...DEAL_CSV,
      { header: 'Owner', value: (d) => (d.owner_id ? memberById.get(d.owner_id) ?? '' : '') },
      { header: 'Lost reason', value: (d) => d.lost_reason ?? '' },
    ],
    [memberById],
  )

  const nameById = useMemo(() => new Map(clients.map((c) => [c.id, c.name])), [clients])
  const enrich = (d: Deal): DealRow => ({
    ...d,
    clientName: d.client_id ? nameById.get(d.client_id) ?? null : null,
  })

  async function handleMove(id: string, stage: DealStage) {
    const prev = deals
    setDeals((ds) => ds.map((d) => (d.id === id ? { ...d, stage } : d)))
    const res = await moveDeal(id, stage)
    if (res.error) setDeals(prev)
  }

  function handleSaved(deal: Deal) {
    const row = enrich(deal)
    setDeals((ds) => (ds.some((d) => d.id === row.id) ? ds.map((d) => (d.id === row.id ? row : d)) : [row, ...ds]))
  }

  async function handleDelete() {
    if (!toDelete) return
    setDeleting(true)
    const id = toDelete.id
    await removeDeal(id)
    setDeals((ds) => ds.filter((d) => d.id !== id))
    setDeleting(false)
    setToDelete(null)
  }

  const pageIds = ctrl.pageRows.map((d) => d.id)
  const allOnPage = pageIds.length > 0 && pageIds.every((id) => sel.selected.has(id))
  const [bulkConfirm, setBulkConfirm] = useState(false)
  const [bulkBusy, setBulkBusy] = useState(false)

  async function confirmBulkDelete() {
    setBulkBusy(true)
    await bulkDelete('deals', [...sel.selected])
    setBulkBusy(false)
    setBulkConfirm(false)
    sel.clear()
    router.refresh()
  }

  async function applyBulkStage(stage: DealStage) {
    setBulkBusy(true)
    await bulkUpdateStage([...sel.selected], stage)
    setBulkBusy(false)
    sel.clear()
    router.refresh()
  }

  return (
    <div className="space-y-4">
      <div className="flex items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold text-white">{t('nav.deals')}</h1>
          <p className="mt-1 text-sm text-white/45">{t('pages.deals.subtitle')}</p>
        </div>
        {props.status === 'ok' && (
          <div className="flex items-center gap-2">
            {deals.length > 0 && (
              <Button size="sm" variant="outline" onClick={() => downloadCsv('deals.csv', ctrl.rows, dealCsvCols)}>
                <Download size={15} />
                {t('common.export')}
              </Button>
            )}
            <Button size="sm" onClick={() => setForm({ open: true, deal: null })}>
              <Plus size={15} />
              {t('common.new')}
            </Button>
          </div>
        )}
      </div>

      {props.status === 'unconfigured' && <DataState state="unconfigured" />}
      {props.status === 'error' && <DataState state="error" />}

      {props.status === 'ok' && (
        <>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <Tabs
              value={view}
              onChange={(v) => setView(v as 'board' | 'table')}
              variant="segmented"
              items={[
                { value: 'board', label: t('deals.view.board') },
                { value: 'table', label: t('deals.view.table'), count: deals.length },
              ]}
            />
            {deals.length > 0 && (
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                <SearchInput value={ctrl.query} onChange={ctrl.setQuery} />
                {view === 'table' && (
                  <FilterSelect
                    value={stageFilter}
                    onChange={setStageFilter}
                    options={[
                      { value: 'all', label: t('common.all') },
                      ...DEAL_STAGES.map((s) => ({ value: s, label: t(`deals.stage.${s}`) })),
                    ]}
                  />
                )}
              </div>
            )}
          </div>

          {view === 'table' && (
            <BulkBar count={sel.selected.size} onClear={sel.clear}>
              <Select
                value=""
                disabled={bulkBusy}
                onChange={(e) => e.target.value && applyBulkStage(e.target.value as DealStage)}
                className="w-40"
              >
                <option value="">{t('common.changeStage')}</option>
                {DEAL_STAGES.map((s) => (
                  <option key={s} value={s}>
                    {t(`deals.stage.${s}`)}
                  </option>
                ))}
              </Select>
              <Button size="sm" variant="danger" onClick={() => setBulkConfirm(true)} disabled={bulkBusy}>
                <Trash2 size={14} />
                {t('common.deleteSelected')}
              </Button>
            </BulkBar>
          )}

          {deals.length === 0 ? (
            <DataState state="empty" />
          ) : ctrl.rows.length === 0 ? (
            <Card>
              <p className="text-[13px] text-white/45">{t('common.noResults')}</p>
            </Card>
          ) : view === 'board' ? (
            <DealsBoard
              deals={ctrl.rows}
              onMove={handleMove}
              onEdit={(d) => setForm({ open: true, deal: d })}
              onDelete={(d) => setToDelete(d)}
            />
          ) : (
            <Card className="p-0 overflow-hidden">
              <div className="overflow-x-auto no-scrollbar">
                <Table>
                  <THead>
                    <TR className="hover:bg-transparent">
                      <TH className="w-10">
                        <Checkbox
                          checked={allOnPage}
                          onChange={() => sel.setMany(pageIds, !allOnPage)}
                          aria-label={t('common.selected', { n: sel.selected.size })}
                        />
                      </TH>
                      <TH>
                        <SortHeader label={t('deals.columns.title')} sortKey="title" current={ctrl.sortKey} dir={ctrl.dir} onSort={ctrl.onSort} />
                      </TH>
                      <TH>
                        <SortHeader label={t('deals.columns.client')} sortKey="client" current={ctrl.sortKey} dir={ctrl.dir} onSort={ctrl.onSort} />
                      </TH>
                      <TH>
                        <SortHeader label={t('deals.columns.stage')} sortKey="stage" current={ctrl.sortKey} dir={ctrl.dir} onSort={ctrl.onSort} />
                      </TH>
                      <TH>{t('deals.columns.owner')}</TH>
                      <TH className="text-right">
                        <SortHeader label={t('deals.columns.amount')} sortKey="amount" current={ctrl.sortKey} dir={ctrl.dir} onSort={ctrl.onSort} align="right" />
                      </TH>
                      <TH className="text-right">
                        <SortHeader label={t('deals.columns.probability')} sortKey="probability" current={ctrl.sortKey} dir={ctrl.dir} onSort={ctrl.onSort} align="right" />
                      </TH>
                      <TH>
                        <SortHeader label={t('deals.columns.close')} sortKey="close" current={ctrl.sortKey} dir={ctrl.dir} onSort={ctrl.onSort} />
                      </TH>
                      <TH className="text-right">{t('common.actions')}</TH>
                    </TR>
                  </THead>
                  <TBody>
                    {ctrl.pageRows.map((d) => (
                      <TR key={d.id}>
                        <TD className="w-10">
                          <Checkbox checked={sel.selected.has(d.id)} onChange={() => sel.toggle(d.id)} />
                        </TD>
                        <TD className="font-medium">
                          <Link href={`/deals/${d.id}`} className="text-white hover:text-primary-light transition-colors">
                            {d.title}
                          </Link>
                        </TD>
                        <TD>{d.clientName ?? '—'}</TD>
                        <TD>
                          <Badge variant={STAGE_VARIANT[d.stage]}>{t(`deals.stage.${d.stage}`)}</Badge>
                        </TD>
                        <TD className="text-white/60">{d.owner_id ? memberById.get(d.owner_id) ?? '—' : '—'}</TD>
                        <TD className="text-right font-mono tabular-nums text-white">
                          {formatMoney(d.amount, d.currency, locale)}
                        </TD>
                        <TD className="text-right font-mono tabular-nums text-white/60">{d.probability}%</TD>
                        <TD className="text-white/60">{formatDate(d.expected_close_date, locale)}</TD>
                        <TD className="text-right">
                          <div className="flex items-center justify-end gap-1">
                            <button
                              onClick={() => setForm({ open: true, deal: d })}
                              aria-label={t('common.edit')}
                              className="inline-flex h-7 w-7 items-center justify-center rounded-lg text-white/40 hover:bg-white/[0.06] hover:text-white transition-colors"
                            >
                              <Pencil size={14} />
                            </button>
                            <button
                              onClick={() => setToDelete(d)}
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
        <DealFormModal
          key={form.deal?.id ?? 'new'}
          open
          clients={clients}
          members={members}
          deal={form.deal}
          onClose={() => setForm({ open: false, deal: null })}
          onSaved={handleSaved}
        />
      )}

      <ConfirmDialog
        open={Boolean(toDelete)}
        title={t('deals.delete.title')}
        body={toDelete ? t('deals.delete.body', { title: toDelete.title }) : undefined}
        confirmLabel={deleting ? t('common.saving') : t('common.delete')}
        cancelLabel={t('common.cancel')}
        onConfirm={handleDelete}
        onCancel={() => setToDelete(null)}
      />

      <ConfirmDialog
        open={bulkConfirm}
        title={t('common.deleteSelected')}
        body={t('common.bulkDeleteBody', { n: sel.selected.size })}
        confirmLabel={bulkBusy ? t('common.saving') : t('common.delete')}
        cancelLabel={t('common.cancel')}
        onConfirm={confirmBulkDelete}
        onCancel={() => setBulkConfirm(false)}
      />
    </div>
  )
}
