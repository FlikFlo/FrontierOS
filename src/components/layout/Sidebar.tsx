'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  LayoutDashboard,
  FlaskConical,
  BookOpen,
  Package,
  Thermometer,
  ShoppingCart,
  BarChart3,
  Settings,
  Calculator,
  Beer,
  ChevronRight,
} from 'lucide-react'

const navItems = [
  { href: '/', label: 'Дашборд', icon: LayoutDashboard },
  { href: '/recipes', label: 'Рецепты', icon: FlaskConical },
  { href: '/calculator', label: 'Калькулятор', icon: Calculator },
  { href: '/brews', label: 'Варки', icon: BookOpen },
  { href: '/fermentation', label: 'Ферментация', icon: Thermometer },
  { href: '/inventory', label: 'Склад', icon: Package },
  { href: '/sales', label: 'Продажи', icon: ShoppingCart },
  { href: '/analytics', label: 'Аналитика', icon: BarChart3 },
  { href: '/settings', label: 'Настройки', icon: Settings },
]

export default function Sidebar() {
  const pathname = usePathname()

  return (
    <aside
      className="glass-sidebar flex flex-col w-64"
      style={{ position: 'sticky', top: 0, height: '100vh', alignSelf: 'start', zIndex: 40 }}
    >
      {/* Logo */}
      <div className="flex items-center gap-3 px-6 py-6 border-b border-white/10">
        <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center glow-amber">
          <Beer size={20} className="text-black" />
        </div>
        <div>
          <p className="font-bold text-white text-[15px] leading-none">BrewMaster</p>
          <p className="text-[11px] text-white/40 mt-0.5">Craft Brewery OS</p>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 py-4 px-3 space-y-0.5 overflow-y-auto">
        {navItems.map(({ href, label, icon: Icon }) => {
          const active = pathname === href || (href !== '/' && pathname.startsWith(href))
          return (
            <Link
              key={href}
              href={href}
              className={`
                flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium
                transition-all duration-200 group relative
                ${active
                  ? 'bg-gradient-to-r from-amber-500/20 to-orange-500/10 text-amber-300 border border-amber-500/20'
                  : 'text-white/50 hover:text-white/90 hover:bg-white/6'
                }
              `}
            >
              <Icon
                size={17}
                className={active ? 'text-amber-400' : 'text-white/40 group-hover:text-white/70'}
              />
              <span className="flex-1">{label}</span>
              {active && <ChevronRight size={13} className="text-amber-400/60" />}
            </Link>
          )
        })}
      </nav>

      {/* Footer */}
      <div className="px-4 py-4 border-t border-white/10">
        <div className="glass-sm px-3 py-2.5 flex items-center gap-3">
          <div className="w-7 h-7 rounded-full bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center text-xs font-bold text-white">
            B
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-medium text-white/80 truncate">Brewery Admin</p>
            <p className="text-[10px] text-white/30 truncate">admin@brewery.com</p>
          </div>
        </div>
      </div>
    </aside>
  )
}
