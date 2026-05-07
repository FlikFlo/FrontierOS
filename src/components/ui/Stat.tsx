import type { ReactNode } from 'react'

export function Stat({
  label, value, sub, accent = false, trend,
}: {
  label: string
  value: ReactNode
  sub?: string
  accent?: boolean
  trend?: { value: string; direction: 'up' | 'down' | 'flat' }
}) {
  return (
    <div className={`card stat ${accent ? 'stat-accent' : ''}`} style={{ padding: '20px 22px' }}>
      <span className="stat-label">{label}</span>
      <span className="stat-value">{value}</span>
      {(sub || trend) && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          {trend && (
            <span className={`badge ${trend.direction === 'up' ? 'badge-ok' : trend.direction === 'down' ? 'badge-bad' : 'badge-neutral'}`}>
              {trend.direction === 'up' ? '↑' : trend.direction === 'down' ? '↓' : '→'} {trend.value}
            </span>
          )}
          {sub && <span className="stat-sub">{sub}</span>}
        </div>
      )}
    </div>
  )
}
