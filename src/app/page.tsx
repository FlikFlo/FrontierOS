import {
  Beer, FlaskConical, Package, TrendingUp,
  Clock, CheckCircle2, AlertTriangle, ArrowRight
} from 'lucide-react'
import StatCard from '@/components/ui/StatCard'
import Link from 'next/link'

const recentBrews = [
  { name: 'West Coast IPA', batch: '#042', status: 'fermenting', date: '28 апр', og: '1.068', progress: 65 },
  { name: 'Oatmeal Stout', batch: '#041', status: 'conditioning', date: '15 апр', og: '1.072', progress: 85 },
  { name: 'Belgian Tripel', batch: '#040', status: 'ready', date: '1 апр', og: '1.082', progress: 100 },
  { name: 'Pilsner Classic', batch: '#039', status: 'planned', date: '12 май', og: '—', progress: 0 },
]

const statusConfig: Record<string, { label: string; badge: string; barColor: string }> = {
  planned:     { label: 'Запланировано', badge: 'badge-gray',   barColor: 'bg-slate-500' },
  mashing:     { label: 'Затирание',     badge: 'badge-amber',  barColor: 'bg-amber-500' },
  boiling:     { label: 'Кипячение',     badge: 'badge-orange', barColor: 'bg-orange-500' },
  fermenting:  { label: 'Брожение',      badge: 'badge-blue',   barColor: 'bg-blue-500' },
  conditioning:{ label: 'Дображивание',  badge: 'badge-purple', barColor: 'bg-purple-500' },
  ready:       { label: 'Готово',        badge: 'badge-green',  barColor: 'bg-emerald-500' },
}

const lowStock = [
  { name: 'Citra Hops', qty: '200g', min: '300g', type: 'hop' },
  { name: 'S-04 English Ale', qty: '2 пак', min: '3 пак', type: 'yeast' },
]

export default function Dashboard() {
  return (
    <div className="space-y-6 fade-in max-w-7xl mx-auto">

      {/* KPI Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Активных варок"  value="3"      sub="1 запланирована"         icon={Beer}        color="amber" glow />
        <StatCard label="Рецептов"        value="18"     sub="5 в разработке"          icon={FlaskConical} color="blue" />
        <StatCard label="Остаток сырья"   value="12 поз" sub="2 ниже минимума"         icon={Package}     color="green" />
        <StatCard label="Выпущено (апр)"  value="420 л"  sub="+18% к прошлому месяцу" icon={TrendingUp}   color="purple" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* Recent brews */}
        <div className="lg:col-span-2 glass p-6">
          <div className="flex items-center justify-between mb-5">
            <h2 className="font-semibold text-white text-sm flex items-center gap-2">
              <Clock size={16} className="text-amber-400" />
              Последние варки
            </h2>
            <Link href="/brews" className="text-xs text-amber-400/70 hover:text-amber-400 flex items-center gap-1">
              Все варки <ArrowRight size={12} />
            </Link>
          </div>

          <div className="space-y-3">
            {recentBrews.map((brew) => {
              const s = statusConfig[brew.status]
              return (
                <div key={brew.batch} className="glass-sm p-4 flex items-center gap-4 glass-hover cursor-pointer">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-medium text-white text-sm">{brew.name}</span>
                      <span className="text-white/30 text-xs">{brew.batch}</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className={`badge ${s.badge}`}>{s.label}</span>
                      <span className="text-xs text-white/30">{brew.date}</span>
                      {brew.og !== '—' && (
                        <span className="text-xs text-white/30">OG {brew.og}</span>
                      )}
                    </div>
                  </div>
                  <div className="w-24 flex flex-col items-end gap-1.5">
                    <span className="text-xs text-white/40">{brew.progress}%</span>
                    <div className="progress-track w-full h-1.5">
                      <div
                        className={`progress-bar ${s.barColor === 'bg-blue-500' ? '' : ''}`}
                        style={{ width: `${brew.progress}%`, background: brew.progress === 100 ? 'linear-gradient(90deg, #34d399, #10b981)' : undefined }}
                      />
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* Right column */}
        <div className="space-y-4">

          {/* Low stock alert */}
          <div className="glass p-5">
            <h2 className="font-semibold text-white text-sm flex items-center gap-2 mb-4">
              <AlertTriangle size={16} className="text-amber-400" />
              Низкий остаток
            </h2>
            <div className="space-y-2.5">
              {lowStock.map((item) => (
                <div key={item.name} className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-white/80">{item.name}</p>
                    <p className="text-xs text-white/30">Мин: {item.min}</p>
                  </div>
                  <span className="badge badge-red">{item.qty}</span>
                </div>
              ))}
              <Link href="/inventory" className="mt-2 flex items-center gap-1 text-xs text-amber-400/70 hover:text-amber-400">
                Управление складом <ArrowRight size={11} />
              </Link>
            </div>
          </div>

          {/* Quick actions */}
          <div className="glass p-5">
            <h2 className="font-semibold text-white text-sm mb-4">Быстрые действия</h2>
            <div className="space-y-2">
              <Link href="/recipes/new" className="btn-primary w-full justify-center py-2.5">
                <FlaskConical size={15} />
                Новый рецепт
              </Link>
              <Link href="/brews/new" className="btn-glass w-full justify-center py-2.5">
                <Beer size={15} />
                Начать варку
              </Link>
              <Link href="/inventory" className="btn-glass w-full justify-center py-2.5">
                <Package size={15} />
                Пополнить склад
              </Link>
            </div>
          </div>

          {/* Today */}
          <div className="glass p-5">
            <h2 className="font-semibold text-white text-sm flex items-center gap-2 mb-3">
              <CheckCircle2 size={16} className="text-emerald-400" />
              Сегодня
            </h2>
            <ul className="space-y-2 text-sm text-white/60">
              <li className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-blue-400 flex-shrink-0" />
                Замер SG — West Coast IPA
              </li>
              <li className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-purple-400 flex-shrink-0" />
                Перелив — Oatmeal Stout
              </li>
              <li className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 flex-shrink-0" />
                Розлив — Belgian Tripel
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  )
}
