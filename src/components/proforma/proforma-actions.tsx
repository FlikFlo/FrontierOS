'use client'

import Link from 'next/link'
import { ArrowLeft, Printer } from 'lucide-react'

/**
 * Print + back controls for the proforma sheet. Hidden when printing (print:hidden)
 * so the generated PDF/paper shows only the document.
 */
export function ProformaActions({ backHref, printLabel, backLabel }: { backHref: string; printLabel: string; backLabel: string }) {
  return (
    <div className="print:hidden mb-6 flex items-center justify-between">
      <Link href={backHref} className="inline-flex items-center gap-1.5 text-sm text-neutral-500 hover:text-neutral-800">
        <ArrowLeft size={15} />
        {backLabel}
      </Link>
      <button
        onClick={() => window.print()}
        className="inline-flex items-center gap-2 rounded-lg bg-neutral-900 px-4 py-2 text-sm font-medium text-white hover:bg-neutral-700"
      >
        <Printer size={15} />
        {printLabel}
      </button>
    </div>
  )
}
