import Link from 'next/link'
import { Plus, Beer, Calendar, ArrowRight } from 'lucide-react'
import { formatDate, getBrewStatusLabel, getBrewStatusBadge } from '@/lib/utils'
import { BEVERAGE_CATEGORIES } from '@/types/database'
import type { BrewStatus, BeverageCategory } from '@/types/database'

interface MockBrew {
  id: string
  recipe_name: string
  category: BeverageCategory
  batch_number: string
  status: BrewStatus
  brew_date: string
  batch_size_l: number
  og_actual: number | null
  fg_actual: number | null
  abv_actual: number | null
}

const mockBrews: MockBrew[] = [
  { id: '1', recipe_name: 'West Coast IPA',   category: 'beer',     batch_number: '#042', status: 'fermenting',   brew_date: '2026-04-28', batch_size_l: 25, og_actual: 1.068, fg_actual: null,  abv_actual: null },
  { id: '2', recipe_name: 'Oatmeal Stout',    category: 'beer',     batch_number: '#041', status: 'conditioning', brew_date: '2026-04-15', batch_size_l: 20, og_actual: 1.072, fg_actual: null,  abv_actual: null },
  { id: '3', recipe_name: 'Belgian Tripel',   category: 'beer',     batch_number: '#040', status: 'ready',        brew_date: '2026-04-01', batch_size_l: 25, og_actual: 1.082, fg_actual: 1.010, abv_actual: 9.4 },
  { id: '4', recipe_name: 'Pilsner Classic',  category: 'beer',     batch_number: '#039', status: 'planned',      brew_date: '2026-05-12', batch_size_l: 30, og_actual: null,  fg_actual: null,  abv_actual: null },
  { id: '5', recipe_name: 'Манго Комбуча',   category: 'kombucha', batch_number: '#K01', status: 'fermenting',   brew_date: '2026-05-01', batch_size_l: 10, og_actual: 1.030, fg_actual: null,  abv_actual: null },
  { id: '6', recipe_name: 'Лимонад Citrus',  category: 'lemonade', batch_number: '#L01', status: 'ready',        brew_date: '2026-04-20', batch_size_l: 15, og_actual: null,  fg_actual: null,  abv_actual: null },
]

const statusProgress: Record<BrewStatus, number> = {
  planned: 5, mashing: 20, boiling: 40, fermenting: 65, conditioning: 85, ready: 100, archived: 100
}

export default function BrewsPage() {
  const grouped = mockBrews.reduce((acc, brew) => {
    const s = brew.status
    if (!acc[s]) acc[s] = []
    acc[s].push(brew)
    return acc
  }, {} as Record<string, MockBrew[]>)

  const order: BrewStatus[] = ['fermenting', 'conditioning', 'mashing', 'boiling', 'ready', 'planned', 'archived']

  return (
    <div className="max-w-7xl mx-auto space-y-6 fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-white">Варочный журнал</h1>
          <p className="text-sm text-white/40 mt-0.5">{mockBrews.length} партий всего</p>
        </div>
        <Link href="/brews/new" className="btn-primary">
          <Plus size={16} />
          Новая партия
        </Link>
      </div>

      {/* Status overview */}
      <div className="grid grid-cols-3 lg:grid-cols-6 gap-3">
        {order.filter(s => s !== 'archived').map(status => {
          const count = grouped[status]?.length ?? 0
          const badge = getBrewStatusBadge(status)
          return (
            <div key={status} className="glass-sm p-3 text-center">
              <p className="text-2xl font-bold text-white">{count}</p>
              <span className={`badge ${badge} mt-1 text-[10px]`}>{getBrewStatusLabel(status)}</span>
            </div>
          )
        })}
      </div>

      {/* Brew cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {mockBrews.map(brew => {
          const cat = BEVERAGE_CATEGORIES.find(c => c.value === brew.category)
          const progress = statusProgress[brew.status]
          const badge = getBrewStatusBadge(brew.status)

          return (
            <Link key={brew.id} href={`/brews/${brew.id}`}>
              <div className="glass p-5 cursor-pointer glass-hover h-full space-y-4">
                {/* Top */}
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-lg">{cat?.emoji}</span>
                      <h3 className="font-semibold text-white truncate">{brew.recipe_name}</h3>
                    </div>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-xs text-white/40">{brew.batch_number}</span>
                      <span className="text-white/20">·</span>
                      <span className="text-xs text-white/40">{brew.batch_size_l} л</span>
                    </div>
                  </div>
                  <span className={`badge ${badge} flex-shrink-0`}>{getBrewStatusLabel(brew.status)}</span>
                </div>

                {/* Progress */}
                <div>
                  <div className="progress-track h-2">
                    <div
                      className="h-2 rounded-full transition-all duration-500"
                      style={{
                        width: `${progress}%`,
                        background: brew.status === 'ready' ? 'linear-gradient(90deg, #34d399, #10b981)' :
                                    brew.status === 'fermenting' ? 'linear-gradient(90deg, #60a5fa, #a78bfa)' :
                                    'linear-gradient(90deg, #f59e0b, #f97316)'
                      }}
                    />
                  </div>
                </div>

                {/* Metrics */}
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { label: 'OG', value: brew.og_actual ? brew.og_actual.toFixed(3) : '—' },
                    { label: 'FG', value: brew.fg_actual ? brew.fg_actual.toFixed(3) : '—' },
                    { label: 'ABV', value: brew.abv_actual ? `${brew.abv_actual}%` : '—' },
                  ].map(({ label, value }) => (
                    <div key={label} className="glass-sm p-2 text-center">
                      <p className="text-[10px] text-white/30 uppercase">{label}</p>
                      <p className="text-sm font-semibold text-white">{value}</p>
                    </div>
                  ))}
                </div>

                {/* Date */}
                <div className="flex items-center gap-1 text-xs text-white/30">
                  <Calendar size={11} />
                  {brew.status === 'planned' ? `Запланировано: ${formatDate(brew.brew_date)}` : `Начата: ${formatDate(brew.brew_date)}`}
                </div>
              </div>
            </Link>
          )
        })}
      </div>
    </div>
  )
}
