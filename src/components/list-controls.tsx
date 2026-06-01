'use client'

import { useMemo, useState } from 'react'
import { Search, X, ChevronUp, ChevronDown } from 'lucide-react'
import { Input } from './ui/input'
import { useI18n } from '@/i18n/provider'
import { cn } from '@/lib/utils'

export type SortDir = 'asc' | 'desc'

/**
 * useListControls — client-side search + sort over a row list. `search` and
 * `sorts` should be stable (module-level) so memoization holds.
 */
export function useListControls<T>(
  rows: T[],
  search: (row: T) => string,
  sorts: Record<string, (row: T) => string | number>,
  defaultSort: string,
  defaultDir: SortDir = 'asc',
) {
  const [query, setQuery] = useState('')
  const [sortKey, setSortKey] = useState(defaultSort)
  const [dir, setDir] = useState<SortDir>(defaultDir)

  function onSort(key: string) {
    if (sortKey === key) setDir((d) => (d === 'asc' ? 'desc' : 'asc'))
    else {
      setSortKey(key)
      setDir('asc')
    }
  }

  const result = useMemo(() => {
    const q = query.trim().toLowerCase()
    let r = q ? rows.filter((row) => search(row).toLowerCase().includes(q)) : rows
    const acc = sorts[sortKey]
    if (acc) {
      r = [...r].sort((a, b) => {
        const av = acc(a)
        const bv = acc(b)
        const cmp =
          typeof av === 'number' && typeof bv === 'number' ? av - bv : String(av).localeCompare(String(bv))
        return dir === 'asc' ? cmp : -cmp
      })
    }
    return r
  }, [rows, query, sortKey, dir, search, sorts])

  return { query, setQuery, sortKey, dir, onSort, rows: result }
}

export function SearchInput({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const { t } = useI18n()
  return (
    <div className="relative w-full sm:w-64">
      <Search size={15} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-white/35" />
      <Input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={t('common.search')}
        className="pl-9 pr-8"
      />
      {value && (
        <button
          type="button"
          onClick={() => onChange('')}
          aria-label={t('common.cancel')}
          className="absolute right-2.5 top-1/2 -translate-y-1/2 text-white/35 hover:text-white"
        >
          <X size={15} />
        </button>
      )}
    </div>
  )
}

export function SortHeader({
  label,
  sortKey,
  current,
  dir,
  onSort,
  align = 'left',
}: {
  label: string
  sortKey: string
  current: string
  dir: SortDir
  onSort: (key: string) => void
  align?: 'left' | 'right'
}) {
  const active = current === sortKey
  return (
    <button
      type="button"
      onClick={() => onSort(sortKey)}
      className={cn(
        'inline-flex items-center gap-1 uppercase tracking-[0.1em] transition-colors hover:text-white/70',
        align === 'right' && 'flex-row-reverse'
      )}
    >
      {label}
      {active ? (
        dir === 'asc' ? (
          <ChevronUp size={12} className="text-primary-light" />
        ) : (
          <ChevronDown size={12} className="text-primary-light" />
        )
      ) : (
        <ChevronUp size={12} className="opacity-0" />
      )}
    </button>
  )
}
