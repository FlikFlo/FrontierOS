import { BarChart3, TrendingUp, DollarSign, Percent } from 'lucide-react'
import StatCard from '@/components/ui/StatCard'

export default function AnalyticsPage() {
  return (
    <div className="max-w-7xl mx-auto space-y-6 fade-in">
      <div>
        <h1 className="text-xl font-bold text-white">Аналитика</h1>
        <p className="text-sm text-white/40 mt-0.5">Себестоимость, выход, эффективность</p>
      </div>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Себест. литра"   value="42 ₽"   icon={DollarSign}  color="amber" />
        <StatCard label="Выход пива"      value="87%"    icon={Percent}     color="green" />
        <StatCard label="Рост за месяц"   value="+18%"   icon={TrendingUp}  color="blue"  />
        <StatCard label="Выпущено всего"  value="1 420 л" icon={BarChart3}   color="purple"/>
      </div>
      <div className="glass p-8 text-center text-white/30">
        <BarChart3 size={40} className="mx-auto mb-3 opacity-30" />
        <p>Графики и аналитика в разработке</p>
        <p className="text-sm mt-1">Динамика по партиям, сравнение рецептов, анализ потерь</p>
      </div>
    </div>
  )
}
