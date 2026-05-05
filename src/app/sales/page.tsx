import { ShoppingCart, TrendingUp, Package, Users } from 'lucide-react'
import StatCard from '@/components/ui/StatCard'

export default function SalesPage() {
  return (
    <div className="max-w-7xl mx-auto space-y-6 fade-in">
      <div>
        <h1 className="text-xl font-bold text-white">Продажи</h1>
        <p className="text-sm text-white/40 mt-0.5">Отгрузки, кеги, клиенты</p>
      </div>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Продано (май)"    value="320 л"  icon={ShoppingCart} color="amber" />
        <StatCard label="Выручка"          value="96 000 ₽" icon={TrendingUp}  color="green" />
        <StatCard label="Кеги в обороте"  value="12"     icon={Package}      color="blue"  />
        <StatCard label="Клиентов"         value="8"      icon={Users}        color="purple"/>
      </div>
      <div className="glass p-8 text-center text-white/30">
        <ShoppingCart size={40} className="mx-auto mb-3 opacity-30" />
        <p>Модуль продаж в разработке</p>
        <p className="text-sm mt-1">Здесь будут: отгрузки по клиентам, остатки кег, история заказов</p>
      </div>
    </div>
  )
}
