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
} from 'lucide-react'

const navItems = [
  { href: '/',            label: 'Дашборд',    icon: LayoutDashboard },
  { href: '/recipes',     label: 'Рецепты',    icon: FlaskConical },
  { href: '/calculator',  label: 'Калькулятор',icon: Calculator },
  { href: '/brews',       label: 'Варки',      icon: BookOpen },
  { href: '/fermentation',label: 'Ферментация',icon: Thermometer },
  { href: '/inventory',   label: 'Склад',      icon: Package },
  { href: '/sales',       label: 'Продажи',    icon: ShoppingCart },
  { href: '/analytics',   label: 'Аналитика',  icon: BarChart3 },
  { href: '/settings',    label: 'Настройки',  icon: Settings },
]

export default function Sidebar() {
  const pathname = usePathname()

  return (
    <aside
      className="chrome-sidebar"
      style={{
        position: 'sticky', top: 0, height: '100vh', alignSelf: 'start', zIndex: 40,
        display: 'flex', flexDirection: 'column', width: 248,
      }}
    >
      {/* Logo */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '20px 22px 18px', borderBottom: '1px solid var(--hairline)' }}>
        <div style={{
          width: 34, height: 34, borderRadius: 10,
          background: 'linear-gradient(135deg, #fcd34d, #f59e0b)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.4), 0 4px 14px rgba(245,158,11,0.3)',
        }}>
          <Beer size={18} className="text-black" strokeWidth={2.4} />
        </div>
        <div>
          <p style={{ fontSize: 14, fontWeight: 700, letterSpacing: '-0.01em', color: 'var(--t-1)', lineHeight: 1 }}>BrewMaster</p>
          <p style={{ fontSize: 10.5, color: 'var(--t-3)', marginTop: 4, letterSpacing: '0.04em' }}>Craft Brewery OS</p>
        </div>
      </div>

      {/* Nav */}
      <nav style={{ flex: 1, padding: '12px 12px', display: 'flex', flexDirection: 'column', gap: 1, overflowY: 'auto' }}>
        {navItems.map(({ href, label, icon: Icon }) => {
          const active = href === '/' ? pathname === '/' : pathname.startsWith(href)
          return (
            <Link
              key={href}
              href={href}
              style={{
                display: 'flex', alignItems: 'center', gap: 11,
                padding: '9px 12px',
                borderRadius: 10,
                fontSize: 13, fontWeight: 500,
                color: active ? 'var(--t-1)' : 'var(--t-2)',
                background: active ? 'var(--surface-2)' : 'transparent',
                border: active ? '1px solid var(--hairline)' : '1px solid transparent',
                transition: 'all .15s ease',
                position: 'relative',
              }}
              className="sidebar-link"
            >
              {active && (
                <span style={{
                  position: 'absolute', left: -12, top: '50%', transform: 'translateY(-50%)',
                  width: 3, height: 18, borderRadius: 2,
                  background: 'var(--accent)',
                  boxShadow: '0 0 12px rgba(251,191,36,0.6)',
                }} />
              )}
              <Icon size={16} strokeWidth={active ? 2.2 : 1.8} style={{ color: active ? 'var(--accent)' : 'var(--t-3)' }} />
              <span>{label}</span>
            </Link>
          )
        })}
      </nav>

      {/* Footer */}
      <div style={{ padding: '14px 14px 18px', borderTop: '1px solid var(--hairline)' }}>
        <div style={{
          display: 'flex', alignItems: 'center', gap: 10,
          padding: '8px 10px',
          borderRadius: 10,
          background: 'var(--surface-1)',
          border: '1px solid var(--hairline)',
        }}>
          <div style={{
            width: 28, height: 28, borderRadius: '50%',
            background: 'linear-gradient(135deg, #60a5fa, #a78bfa)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 11, fontWeight: 700, color: '#fff',
          }}>B</div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <p style={{ fontSize: 12, fontWeight: 600, color: 'var(--t-1)', lineHeight: 1.2 }}>Brewery Admin</p>
            <p style={{ fontSize: 10.5, color: 'var(--t-3)', marginTop: 2 }}>admin@brewery.com</p>
          </div>
        </div>
      </div>
    </aside>
  )
}
