import { LucideIcon } from 'lucide-react'

interface StatCardProps {
  label: string
  value: string | number
  sub?: string
  icon: LucideIcon
  color?: 'amber' | 'blue' | 'green' | 'purple' | 'red'
  glow?: boolean
}

const colorMap = {
  amber:  { icon: 'text-amber-400',  bg: 'from-amber-500/20 to-orange-500/10',  border: 'border-amber-500/20' },
  blue:   { icon: 'text-blue-400',   bg: 'from-blue-500/20 to-indigo-500/10',   border: 'border-blue-500/20' },
  green:  { icon: 'text-emerald-400',bg: 'from-emerald-500/20 to-teal-500/10', border: 'border-emerald-500/20' },
  purple: { icon: 'text-purple-400', bg: 'from-purple-500/20 to-pink-500/10',   border: 'border-purple-500/20' },
  red:    { icon: 'text-red-400',    bg: 'from-red-500/20 to-rose-500/10',      border: 'border-red-500/20' },
}

export default function StatCard({ label, value, sub, icon: Icon, color = 'amber', glow }: StatCardProps) {
  const c = colorMap[color]
  return (
    <div className={`glass p-5 flex items-center gap-4 fade-in ${glow ? 'glow-amber' : ''}`}>
      <div className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${c.bg} border ${c.border} flex items-center justify-center flex-shrink-0`}>
        <Icon size={22} className={c.icon} />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-xs text-white/40 uppercase tracking-wider font-medium">{label}</p>
        <p className="text-2xl font-bold text-white mt-0.5">{value}</p>
        {sub && <p className="text-xs text-white/40 mt-0.5">{sub}</p>}
      </div>
    </div>
  )
}
