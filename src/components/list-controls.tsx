'use client'

import { useMemo, useState } from 'react'
import { Search, X, ChevronUp, ChevronDown, ChevronLeft, ChevronRight } from 'lucide-react'
import { Input, Select } from './ui/input'
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
  pageSize = 12,
) {
  const [query, setQueryState] = useState('')
  const [sortKey, setSortKey] = useState(defaultSort)
  const [dir, setDir] = useState<SortDir>(defaultDir)
  const [page, setPage] = useState(0)

  // Changing the filter/sort resets to the first page.
  function setQuery(v: string) {
    setQueryState(v)
    setPage(0)
  }

  function onSort(key: string) {
    if (sortKey === key) setDir((d) => (d === 'asc' ? 'desc' : 'asc'))
    else {
      setSortKey(key)
      setDir('asc')
    }
    setPage(0)
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

  const pageCount = Math.max(1, Math.ceil(result.length / pageSize))
  const safePage = Math.min(page, pageCount - 1)
  const pageRows = useMemo(
    () => result.slice(safePage * pageSize, safePage * pageSize + pageSize),
    [result, safePage, pageSize],
  )

  return { query, setQuery, sortKey, dir, onSort, rows: result, pageRows, page: safePage, pageCount, setPage }
}

export function Pager({
  page,
  pageCount,
  onPage,
}: {
  page: number
  pageCount: number
  onPage: (p: number) => void
}) {
  if (pageCount <= 1) return null
  return (
    <div className="flex items-center justify-end gap-2 border-t border-white/[0.06] px-3 py-2 text-[12px] text-white/50">
      <button
        type="button"
        disabled={page <= 0}
        onClick={() => onPage(page - 1)}
        className="inline-flex h-7 w-7 items-center justify-center rounded-lg hover:bg-white/[0.06] hover:text-white disabled:opacity-30 disabled:pointer-events-none"
      >
        <ChevronLeft size={16} />
      </button>
      <span className="tabular-nums">
        {page + 1} / {pageCount}
      </span>
      <button
        type="button"
        disabled={page >= pageCount - 1}
        onClick={() => onPage(page + 1)}
        className="inline-flex h-7 w-7 items-center justify-center rounded-lg hover:bg-white/[0.06] hover:text-white disabled:opacity-30 disabled:pointer-events-none"
      >
        <ChevronRight size={16} />
      </button>
    </div>
  )
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

export function FilterSelect({
  value,
  onChange,
  options,
}: {
  value: string
  onChange: (v: string) => void
  options: { value: string; label: string }[]
}) {
  return (
    <Select value={value} onChange={(e) => onChange(e.target.value)} className="sm:w-48">
      {options.map((o) => (
        <option key={o.value} value={o.value}>
          {o.label}
        </option>
      ))}
    </Select>
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
