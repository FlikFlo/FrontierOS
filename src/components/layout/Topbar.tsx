'use client'

import { Bell, Search } from 'lucide-react'
import { usePathname } from 'next/navigation'

const pageLabels: Record<string, string> = {
  '/': 'Дашборд',
  '/recipes': 'Рецепты',
  '/calculator': 'Калькулятор',
  '/brews': 'Варки',
  '/fermentation': 'Ферментация',
  '/inventory': 'Склад',
  '/sales': 'Продажи',
  '/analytics': 'Аналитика',
  '/settings': 'Настройки',
}

export default function Topbar() {
  const pathname = usePathname()
  const base = '/' + pathname.split('/')[1]
  const label = pageLabels[base] ?? 'BrewMaster'

  return (
    <header
      className="chrome-topbar"
      style={{
        position: 'sticky', top: 0, zIndex: 30, height: 60,
        display: 'flex', alignItems: 'center',
        padding: '0 32px', gap: 16,
      }}
    >
      <div style={{ flex: 1 }}>
        <h2 style={{ fontSize: 13.5, fontWeight: 600, color: 'var(--t-2)', letterSpacing: '-0.005em' }}>{label}</h2>
      </div>

      <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
        <Search size={14} style={{ position: 'absolute', left: 12, color: 'var(--t-4)' }} />
        <input
          className="input"
          placeholder="Поиск..."
          style={{ height: 36, width: 240, paddingLeft: 34, fontSize: 13 }}
        />
      </div>

      <button className="btn btn-ghost btn-icon" style={{ height: 36, width: 36, position: 'relative' }}>
        <Bell size={15} />
        <span style={{
          position: 'absolute', top: 9, right: 9,
          width: 7, height: 7, borderRadius: '50%',
          background: 'var(--accent)',
          boxShadow: '0 0 0 2px var(--bg)',
        }} />
      </button>
    </header>
  )
}
