'use client'

import { useState } from 'react'
import { MessageCircle } from 'lucide-react'
import { useI18n } from '@/i18n/provider'
import { waLink } from '@/lib/utils'

const TEMPLATE_KEYS = ['intro', 'followup', 'sample', 'order'] as const

/**
 * WhatsApp quick-message menu. Opens wa.me with a pre-filled, localized template
 * (client name interpolated). The first option opens an empty chat.
 */
export function WhatsAppMenu({ phone, clientName }: { phone: string | null | undefined; clientName: string }) {
  const { t } = useI18n()
  const [open, setOpen] = useState(false)
  const base = waLink(phone)
  if (!base) return null

  const send = (text?: string) => {
    const url = text ? `${base}?text=${encodeURIComponent(text)}` : base
    window.open(url, '_blank', 'noopener,noreferrer')
    setOpen(false)
  }

  return (
    <div className="relative">
      <button
        onClick={() => setOpen((o) => !o)}
        aria-label={t('common.whatsapp')}
        className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-white/50 transition-colors hover:bg-success/10 hover:text-success"
      >
        <MessageCircle size={16} />
      </button>
      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="absolute right-0 top-10 z-50 w-64 overflow-hidden rounded-xl border border-white/10 bg-[#0c1f2b] shadow-2xl shadow-black/40">
            <div className="border-b border-white/[0.06] px-3.5 py-2 text-[11px] font-semibold uppercase tracking-wide text-white/40">
              {t('whatsapp.title')}
            </div>
            <button
              onClick={() => send()}
              className="block w-full px-3.5 py-2 text-left text-[13px] text-white/75 transition-colors hover:bg-white/[0.04]"
            >
              {t('whatsapp.openChat')}
            </button>
            {TEMPLATE_KEYS.map((k) => (
              <button
                key={k}
                onClick={() => send(t(`whatsapp.templates.${k}.body`, { client: clientName }))}
                className="block w-full px-3.5 py-2 text-left text-[13px] text-white/75 transition-colors hover:bg-white/[0.04]"
              >
                {t(`whatsapp.templates.${k}.label`)}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  )
}
