/**
 * Issuing company — Amazigh Brewing Company (brand: Chamalia).
 * Single source of truth for legal identifiers used on the proforma and other
 * customer-facing documents. Edit here if registration details change.
 */
export const COMPANY = {
  legalName: 'AMAZIGH BREWING COMPANY',
  brand: 'CHAMALIA',
  ice: '002909236000064',
  rc: '32807',
  if: '51620390',
  address: 'Zone Industrielle Tétouan Park, Maroc',
  tagline: {
    en: 'Hopped non-alcoholic beer — from the North of Morocco',
    fr: 'Bière sans alcool houblonnée — du Nord du Maroc',
  },
} as const
