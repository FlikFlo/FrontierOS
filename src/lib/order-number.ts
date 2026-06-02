// Sequential order-number generation: PREFIX-YYYY-NNNN.
// Continues whatever scheme existing orders already use (prefix inferred from
// the latest order), resetting the counter per calendar year.

const DEFAULT_PREFIX = 'FOS'
const PATTERN = /^(.+)-(\d{4})-(\d+)$/

type Parsed = { prefix: string; year: number; seq: number }

function parse(value: string): Parsed | null {
  const m = PATTERN.exec(value.trim())
  if (!m) return null
  return { prefix: m[1], year: Number(m[2]), seq: Number(m[3]) }
}

/**
 * Next order number for `year`, given the existing order numbers.
 * - prefix follows the most recent existing order (else DEFAULT_PREFIX)
 * - counter is the max sequence for that prefix+year, plus one (else 0001)
 */
export function nextOrderNumber(existing: string[], year: number): string {
  const parsed = existing.map(parse).filter((p): p is Parsed => p !== null)

  const latest = parsed.reduce<Parsed | null>((best, p) => {
    if (!best) return p
    if (p.year !== best.year) return p.year > best.year ? p : best
    return p.seq > best.seq ? p : best
  }, null)
  const prefix = latest?.prefix ?? DEFAULT_PREFIX

  const maxSeq = parsed
    .filter((p) => p.prefix === prefix && p.year === year)
    .reduce((max, p) => Math.max(max, p.seq), 0)

  return `${prefix}-${year}-${String(maxSeq + 1).padStart(4, '0')}`
}
