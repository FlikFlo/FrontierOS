// Tiny client-side CSV export — build a CSV string from rows + columns and
// trigger a browser download. No dependencies.

export type CsvColumn<T> = {
  header: string
  value: (row: T) => string | number | null | undefined
}

function escapeCell(value: unknown): string {
  const s = value == null ? '' : String(value)
  return /[",\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s
}

export function toCsv<T>(rows: T[], columns: CsvColumn<T>[]): string {
  const head = columns.map((c) => escapeCell(c.header)).join(',')
  const body = rows.map((r) => columns.map((c) => escapeCell(c.value(r))).join(',')).join('\r\n')
  return body ? `${head}\r\n${body}` : head
}

export function downloadCsv<T>(filename: string, rows: T[], columns: CsvColumn<T>[]): void {
  // Prepend a UTF-8 BOM so Excel reads accents (é, è, …) correctly.
  const blob = new Blob(['﻿' + toCsv(rows, columns)], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  a.remove()
  URL.revokeObjectURL(url)
}
