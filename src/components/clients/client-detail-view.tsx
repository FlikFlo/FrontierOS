'use client'

import { useState } from 'react'
import Link from 'next/link'
import { ArrowLeft, Pencil, Plus, Globe, Star } from 'lucide-react'
import { WhatsAppMenu } from '../whatsapp-menu'
import { Card, CardHeader, CardTitle, CardContent } from '../ui/card'
import { Badge } from '../ui/badge'
import { Button } from '../ui/button'
import { ClientFormModal, type MemberOption } from './client-form-modal'
import { ContactFormModal } from './contact-form-modal'
import { EntityThread, type AttachmentView } from '../entity-thread'
import { useI18n } from '@/i18n/provider'
import { useRealtime } from '@/lib/use-realtime'
import { formatDate, formatMoney } from '@/lib/utils'

const RT_TABLES = ['clients', 'contacts']
import type {
  Client,
  Contact,
  Comment,
  ClientStatus,
  DealStage,
  OrderStatus,
} from '@/types/database'

export type DealMini = { id: string; title: string; stage: DealStage; amount: number; currency: string }
export type OrderMini = {
  id: string
  order_number: string
  status: OrderStatus
  order_date: string
  currency: string
  total: number
}

const CLIENT_VARIANT: Record<ClientStatus, 'success' | 'warning' | 'default'> = {
  active: 'success',
  lead: 'warning',
  inactive: 'default',
}
const STAGE_VARIANT: Record<DealStage, 'default' | 'warning' | 'success' | 'danger'> = {
  lead: 'default',
  qualified: 'default',
  proposal: 'warning',
  negotiation: 'warning',
  won: 'success',
  lost: 'danger',
}
const ORDER_VARIANT: Record<OrderStatus, 'default' | 'warning' | 'success' | 'danger' | 'accent'> = {
  draft: 'default',
  confirmed: 'accent',
  shipped: 'warning',
  delivered: 'success',
  cancelled: 'danger',
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-start justify-between gap-3 py-1.5">
      <span className="text-[13px] text-white/40">{label}</span>
      <span className="text-right text-[13px] text-white/80">{children}</span>
    </div>
  )
}

function siteUrl(website: string | null): string | null {
  if (!website) return null
  return /^https?:\/\//i.test(website) ? website : `https://${website}`
}

export function ClientDetailView({
  client,
  contacts,
  deals,
  orders,
  comments,
  attachments,
  members = [],
}: {
  client: Client
  contacts: Contact[]
  deals: DealMini[]
  orders: OrderMini[]
  comments: Comment[]
  attachments: AttachmentView[]
  members?: MemberOption[]
}) {
  const { t, locale } = useI18n()
  useRealtime(RT_TABLES)
  const ownerName = client.owner_id ? members.find((m) => m.id === client.owner_id)?.name ?? null : null
  const [editOpen, setEditOpen] = useState(false)
  const [contactForm, setContactForm] = useState<{ open: boolean; contact: Contact | null }>({
    open: false,
    contact: null,
  })

  const site = siteUrl(client.website)

  return (
    <div className="space-y-4">
      <Link
        href="/clients"
        className="inline-flex items-center gap-1.5 text-[13px] text-white/45 hover:text-white/80 transition-colors"
      >
        <ArrowLeft size={15} />
        {t('clients.detail.back')}
      </Link>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-semibold text-white">{client.name}</h1>
          <Badge variant={CLIENT_VARIANT[client.status]}>{t(`clients.status.${client.status}`)}</Badge>
        </div>
        <div className="flex items-center gap-2">
          {site && (
            <a
              href={site}
              target="_blank"
              rel="noopener noreferrer"
              aria-label={t('clients.columns.website')}
              className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-white/50 hover:bg-white/[0.06] hover:text-white"
            >
              <Globe size={16} />
            </a>
          )}
          <WhatsAppMenu phone={client.phone} clientName={client.name} />
          <Button size="sm" variant="outline" onClick={() => setEditOpen(true)}>
            <Pencil size={14} />
            {t('common.edit')}
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>{t('clients.detail.info')}</CardTitle>
          </CardHeader>
          <CardContent className="divide-y divide-white/[0.06]">
            <Field label={t('clients.columns.industry')}>{client.industry ?? '—'}</Field>
            <Field label={t('clients.columns.channel')}>
              {client.channel ? t(`clients.channel.${client.channel}`) : '—'}
            </Field>
            <Field label={t('clients.columns.owner')}>{ownerName ?? t('common.unassigned')}</Field>
            <Field label={t('clients.columns.email')}>{client.email ?? '—'}</Field>
            <Field label={t('clients.columns.phone')}>{client.phone ?? '—'}</Field>
            <Field label={t('clients.columns.website')}>{client.website ?? '—'}</Field>
            <Field label={t('clients.columns.address')}>{client.address ?? '—'}</Field>
            {client.notes && <Field label={t('clients.columns.notes')}>{client.notes}</Field>}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex items-center justify-between">
            <CardTitle>{t('contacts.title')}</CardTitle>
            <Button size="sm" onClick={() => setContactForm({ open: true, contact: null })}>
              <Plus size={14} />
              {t('common.new')}
            </Button>
          </CardHeader>
          <CardContent>
            {contacts.length === 0 ? (
              <p className="text-[13px] text-white/45">{t('contacts.empty')}</p>
            ) : (
              <ul className="divide-y divide-white/[0.06]">
                {contacts.map((c) => (
                  <li key={c.id}>
                    <button
                      onClick={() => setContactForm({ open: true, contact: c })}
                      className="flex w-full items-center justify-between gap-3 py-2 text-left transition-colors hover:bg-white/[0.03] rounded-lg px-1 -mx-1"
                    >
                      <div className="min-w-0">
                        <p className="flex items-center gap-1.5 text-sm font-medium text-white">
                          {c.first_name} {c.last_name}
                          {c.is_primary && <Star size={12} className="text-accent" />}
                        </p>
                        <p className="text-[12px] text-white/45">
                          {[c.title, c.email].filter(Boolean).join(' · ') || '—'}
                        </p>
                      </div>
                      <Pencil size={13} className="flex-shrink-0 text-white/30" />
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>{t('clients.detail.deals')}</CardTitle>
          </CardHeader>
          <CardContent>
            {deals.length === 0 ? (
              <p className="text-[13px] text-white/45">—</p>
            ) : (
              <ul className="divide-y divide-white/[0.06]">
                {deals.map((d) => (
                  <li key={d.id} className="flex items-center justify-between gap-3 py-2 text-sm">
                    <span className="min-w-0 truncate text-white/85">{d.title}</span>
                    <span className="flex flex-shrink-0 items-center gap-3">
                      <Badge variant={STAGE_VARIANT[d.stage]}>{t(`deals.stage.${d.stage}`)}</Badge>
                      <span className="font-mono tabular-nums text-white/70">
                        {formatMoney(d.amount, d.currency, locale)}
                      </span>
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>{t('clients.detail.orders')}</CardTitle>
          </CardHeader>
          <CardContent>
            {orders.length === 0 ? (
              <p className="text-[13px] text-white/45">—</p>
            ) : (
              <ul className="divide-y divide-white/[0.06]">
                {orders.map((o) => (
                  <li key={o.id} className="flex items-center justify-between gap-3 py-2 text-sm">
                    <span className="font-mono text-[13px] text-white/85">{o.order_number}</span>
                    <span className="flex flex-shrink-0 items-center gap-3">
                      <Badge variant={ORDER_VARIANT[o.status]}>{t(`orders.status.${o.status}`)}</Badge>
                      <span className="text-[12px] text-white/40">{formatDate(o.order_date, locale)}</span>
                      <span className="font-mono tabular-nums text-white/70">
                        {formatMoney(o.total, o.currency, locale)}
                      </span>
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>

      <EntityThread entity="client" entityId={client.id} comments={comments} attachments={attachments} />

      {editOpen && (
        <ClientFormModal open client={client} members={members} onClose={() => setEditOpen(false)} />
      )}
      {contactForm.open && (
        <ContactFormModal
          key={contactForm.contact?.id ?? 'new'}
          open
          clientId={client.id}
          contact={contactForm.contact}
          onClose={() => setContactForm({ open: false, contact: null })}
        />
      )}
    </div>
  )
}
