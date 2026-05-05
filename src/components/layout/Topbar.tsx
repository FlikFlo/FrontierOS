'use client'

import { Bell, Search } from 'lucide-react'
import { usePathname } from 'next/navigation'

const pageLabels: Record<string, string> = {
  '/': 'Дашборд',
  '/recipes': 'Рецепты',
  '/brews': 'Варочный журнал',
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
    <header className="glass-nav sticky top-0 z-30 h-16 flex items-center px-6 gap-4">
      <div className="flex-1">
        <h1 className="text-base font-semibold text-white/90">{label}</h1>
      </div>

      {/* Search */}
      <div className="relative hidden md:flex items-center">
        <Search size={14} className="absolute left-3 text-white/30" />
        <input
          type="text"
          placeholder="Поиск..."
          className="glass-input pl-8 h-9 w-52 text-sm"
          style={{ paddingTop: '0', paddingBottom: '0' }}
        />
      </div>

      {/* Notifications */}
      <button className="btn-glass w-9 h-9 p-0 justify-center relative">
        <Bell size={16} />
        <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-amber-400 rounded-full" />
      </button>
    </header>
  )
}
