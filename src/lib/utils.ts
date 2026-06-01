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

const LOCALE_TAG: Record<string, string> = { en: 'en-US', fr: 'fr-FR' }

/** Currency amount formatted for the active UI locale. */
export function formatMoney(amount: number, currency: string, locale: string): string {
  return new Intl.NumberFormat(LOCALE_TAG[locale] ?? 'en-US', {
    style: 'currency',
    currency,
  }).format(amount)
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
