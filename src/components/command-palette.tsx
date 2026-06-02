'use client'

import { useEffect, useRef, useState, type KeyboardEvent } from 'react'
import { useRouter } from 'next/navigation'
import {
  Search,
  LayoutDashboard,
  CalendarDays,
  Users,
  Handshake,
  ShoppingCart,
  Package,
  Settings,
  CornerDownLeft,
  type LucideIcon,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { useI18n } from '@/i18n/provider'
import { globalSearch, type SearchHit } from '@/app/(app)/search-actions'

type Item = { key: string; label: string; sub: string | null; href: string; icon: LucideIcon }

const TYPE_ICON: Record<SearchHit['type'], LucideIcon> = {
  client: Users,
  deal: Handshake,
  order: ShoppingCart,
  product: Package,
}
const hitHref = (h: SearchHit) =>
  h.type === 'client'
    ? `/clients/${h.id}`
    : h.type === 'deal'
      ? `/deals/${h.id}`
      : h.type === 'order'
        ? `/orders/${h.id}`
        : '/products'

export function CommandPalette() {
  const { t } = useI18n()
  const router = useRouter()
  const inputRef = useRef<HTMLInputElement | null>(null)

  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const [hits, setHits] = useState<SearchHit[]>([])
  const [active, setActive] = useState(0)

  // ⌘K / Ctrl+K toggles the palette.
  useEffect(() => {
    function onKey(e: globalThis.KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault()
        setOpen((v) => !v)
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  // Open via the topbar button (custom event).
  useEffect(() => {
    function onOpen() {
      setOpen(true)
    }
    window.addEventListener('fos:open-command', onOpen)
    return () => window.removeEventListener('fos:open-command', onOpen)
  }, [])

  useEffect(() => {
    if (!open) return
    const id = setTimeout(() => {
      setQuery('')
      setHits([])
      setActive(0)
      inputRef.current?.focus()
    }, 0)
    return () => clearTimeout(id)
  }, [open])

  // Debounced search (setState only inside the async timeout → no effect lint).
  useEffect(() => {
    if (!open) return
    const id = setTimeout(async () => {
      const q = query.trim()
      if (!q) {
        setHits([])
        return
      }
      setHits(await globalSearch(q))
      setActive(0)
    }, 180)
    return () => clearTimeout(id)
  }, [query, open])

  const NAV: Item[] = [
    { key: 'dashboard', label: t('nav.dashboard'), sub: null, href: '/dashboard', icon: LayoutDashboard },
    { key: 'calendar', label: t('nav.calendar'), sub: null, href: '/calendar', icon: CalendarDays },
    { key: 'clients', label: t('nav.clients'), sub: null, href: '/clients', icon: Users },
    { key: 'deals', label: t('nav.deals'), sub: null, href: '/deals', icon: Handshake },
    { key: 'orders', label: t('nav.orders'), sub: null, href: '/orders', icon: ShoppingCart },
    { key: 'products', label: t('nav.products'), sub: null, href: '/products', icon: Package },
    { key: 'settings', label: t('nav.settings'), sub: null, href: '/settings', icon: Settings },
  ]

  const q = query.trim().toLowerCase()
  const navItems = q ? NAV.filter((n) => n.label.toLowerCase().includes(q)) : NAV
  const hitItems: Item[] = hits.map((h) => ({
    key: `${h.type}:${h.id}`,
    label: h.label,
    sub: h.sub,
    href: hitHref(h),
    icon: TYPE_ICON[h.type],
  }))
  const items = [...navItems, ...hitItems]

  function go(item: Item) {
    setOpen(false)
    router.push(item.href)
  }

  function onInputKey(e: KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Escape') setOpen(false)
    else if (e.key === 'ArrowDown') {
      e.preventDefault()
      setActive((i) => Math.min(i + 1, items.length - 1))
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setActive((i) => Math.max(i - 1, 0))
    } else if (e.key === 'Enter' && items[active]) {
      e.preventDefault()
      go(items[active])
    }
  }

  if (!open) return null

  return (
    <div className="fixed inset-0 z-[80] flex items-start justify-center p-4 pt-[12vh]">
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={() => setOpen(false)}
        aria-hidden="true"
      />
      <div
        role="dialog"
        aria-modal="true"
        className="relative w-full max-w-xl overflow-hidden rounded-2xl border border-white/[0.10] shadow-2xl animate-fade-up"
        style={{ background: 'rgba(13,15,20,0.99)' }}
      >
        <div className="flex items-center gap-2 border-b border-white/[0.07] px-4">
          <Search size={16} className="text-white/35" />
          <input
            ref={inputRef}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={onInputKey}
            placeholder={t('command.placeholder')}
            className="w-full bg-transparent py-3.5 text-sm text-white placeholder:text-white/30 focus:outline-none"
          />
        </div>

        <div className="max-h-[55vh] overflow-y-auto p-1.5">
          {items.length === 0 ? (
            <p className="px-3 py-6 text-center text-[13px] text-white/40">{t('command.empty')}</p>
          ) : (
            items.map((item, i) => {
              const Icon = item.icon
              return (
                <button
                  key={item.key}
                  onMouseEnter={() => setActive(i)}
                  onClick={() => go(item)}
                  className={cn(
                    'flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left transition-colors',
                    i === active ? 'bg-white/[0.07]' : 'hover:bg-white/[0.04]',
                  )}
                >
                  <Icon size={15} className="flex-shrink-0 text-white/45" />
                  <span className="min-w-0 flex-1 truncate text-sm text-white">{item.label}</span>
                  {item.sub && <span className="flex-shrink-0 text-[11px] text-white/35">{item.sub}</span>}
                  {i === active && <CornerDownLeft size={13} className="flex-shrink-0 text-white/30" />}
                </button>
              )
            })
          )}
        </div>
      </div>
    </div>
  )
}
