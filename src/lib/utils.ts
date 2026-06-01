import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

/**
 * `cn` — merge conditional class names with Tailwind conflict resolution.
 * This is the kit's recommended `cn` (twMerge over clsx); the Croat
 * components import it from `@/lib/utils`.
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// Morocco: French formatting uses the fr-MA locale; MAD is the currency.
const LOCALE_TAG: Record<string, string> = { en: 'en-US', fr: 'fr-MA' }

/** Currency amount formatted for the active UI locale. */
export function formatMoney(amount: number, currency: string, locale: string): string {
  return new Intl.NumberFormat(LOCALE_TAG[locale] ?? 'en-US', {
    style: 'currency',
    currency,
  }).format(amount)
}

/** Build a WhatsApp click-to-chat link from a phone number (null if none). */
export function waLink(phone: string | null | undefined): string | null {
  if (!phone) return null
  const digits = phone.replace(/\D/g, '')
  return digits ? `https://wa.me/${digits}` : null
}

/** Short date (e.g. 12 Jun 2026) for the active UI locale; null → em dash. */
export function formatDate(value: string | null, locale: string): string {
  if (!value) return '—'
  return new Date(value).toLocaleDateString(LOCALE_TAG[locale] ?? 'en-US', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  })
}
