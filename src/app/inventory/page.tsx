'use client'

import { useState } from 'react'
import { Plus, Package, AlertTriangle, Search, Filter } from 'lucide-react'
import { getIngredientTypeLabel } from '@/lib/utils'
import type { IngredientType } from '@/types/database'

interface InventoryItem {
  id: string
  name: string
  type: IngredientType
  quantity: number
  unit: string
  min_stock: number | null
  cost_per_unit: number | null
  supplier: string | null
}

const mockInventory: InventoryItem[] = [
  { id: '1', name: 'Pale Ale Malt (Maris Otter)', type: 'malt',     quantity: 25.0, unit: 'кг', min_stock: 5,   cost_per_unit: 1.80,  supplier: 'Crisp Malting' },
  { id: '2', name: 'Pilsner Malt',                type: 'malt',     quantity: 15.5, unit: 'кг', min_stock: 5,   cost_per_unit: 1.60,  supplier: 'Weyermann' },
  { id: '3', name: 'Caramel 60L',                 type: 'malt',     quantity: 8.0,  unit: 'кг', min_stock: 2,   cost_per_unit: 2.20,  supplier: 'Briess' },
  { id: '4', name: 'Roasted Barley',              type: 'malt',     quantity: 3.0,  unit: 'кг', min_stock: 1,   cost_per_unit: 2.50,  supplier: 'Crisp Malting' },
  { id: '5', name: 'Centennial Hops',             type: 'hop',      quantity: 500,  unit: 'г',  min_stock: 100, cost_per_unit: 0.035, supplier: 'Yakima Chief' },
  { id: '6', name: 'Cascade Hops',               type: 'hop',      quantity: 300,  unit: 'г',  min_stock: 100, cost_per_unit: 0.030, supplier: 'Yakima Chief' },
  { id: '7', name: 'Citra Hops',                 type: 'hop',      quantity: 200,  unit: 'г',  min_stock: 300, cost_per_unit: 0.055, supplier: 'Hopunion' },
  { id: '8', name: 'Saaz Hops',                  type: 'hop',      quantity: 400,  unit: 'г',  min_stock: 100, cost_per_unit: 0.028, supplier: 'Select Botanicals' },
  { id: '9', name: 'US-05 American Ale',          type: 'yeast',    quantity: 10,   unit: 'пак',min_stock: 2,   cost_per_unit: 4.50,  supplier: 'Fermentis' },
  { id: '10',name: 'S-04 English Ale',            type: 'yeast',    quantity: 2,    unit: 'пак',min_stock: 3,   cost_per_unit: 4.50,  supplier: 'Fermentis' },
  { id: '11',name: 'Сахар тростниковый',          type: 'sugar',    quantity: 10.0, unit: 'кг', min_stock: 2,   cost_per_unit: 0.80,  supplier: 'Местный поставщик' },
  { id: '12',name: 'Чай чёрный (для комбучи)',   type: 'tea',      quantity: 500,  unit: 'г',  min_stock: 100, cost_per_unit: 0.04,  supplier: 'Чайный мир' },
  { id: '13',name: 'Имбирь свежий',              type: 'fruit',    quantity: 2.0,  unit: 'кг', min_stock: 0.5, cost_per_unit: 2.20,  supplier: 'Рынок' },
  { id: '14',name: 'Gypsum (CaSO4)',             type: 'chemical', quantity: 500,  unit: 'г',  min_stock: 100, cost_per_unit: 0.008, supplier: 'BrewLab' },
  { id: '15',name: 'Lactic Acid 88%',            type: 'chemical', quantity: 250,  unit: 'мл', min_stock: 50,  cost_per_unit: 0.012, supplier: 'BrewLab' },
]

const typeColors: Record<string, string> = {
  malt: 'badge-amber', hop: 'badge-green', yeast: 'badge-blue',
  adjunct: 'badge-gray', chemical: 'badge-purple', fruit: 'badge-orange',
  sugar: 'badge-amber', spice: 'badge-orange', tea: 'badge-green',
  juice: 'badge-blue', other: 'badge-gray',
}

const allTypes: IngredientType[] = ['malt', 'hop', 'yeast', 'sugar', 'fruit', 'tea', 'chemical', 'adjunct', 'spice', 'juice', 'other']

export default function InventoryPage() {
  const [search, setSearch] = useState('')
  const [filterType, setFilterType] = useState<IngredientType | 'all'>('all')
  const [showLowOnly, setShowLowOnly] = useState(false)

  const filtered = mockInventory.filter(item => {
    const matchSearch = item.name.toLowerCase().includes(search.toLowerCase())
    const matchType = filterType === 'all' || item.type === filterType
    const matchLow = !showLowOnly || (item.min_stock != null && item.quantity < item.min_stock)
    return matchSearch && matchType && matchLow
  })

  const lowStockCount = mockInventory.filter(i => i.min_stock != null && i.quantity < i.min_stock).length

  return (
    <div className="max-w-7xl mx-auto space-y-6 fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-white">Склад сырья</h1>
          <p className="text-sm text-white/40 mt-0.5">{mockInventory.length} позиций · {lowStockCount} заканчивается</p>
        </div>
        <button className="btn-primary">
          <Plus size={16} />
          Добавить позицию
        </button>
      </div>

      {/* Alert */}
      {lowStockCount > 0 && (
        <div className="glass-sm p-4 flex items-center gap-3 border border-amber-500/20 bg-amber-500/5">
          <AlertTriangle size={18} className="text-amber-400 flex-shrink-0" />
          <div>
            <p className="text-sm font-medium text-amber-300">{lowStockCount} позиции ниже минимального остатка</p>
            <p className="text-xs text-white/40 mt-0.5">Рекомендуется пополнить запасы перед следующей варкой</p>
          </div>
          <button
            className="ml-auto badge badge-amber cursor-pointer"
            onClick={() => setShowLowOnly(!showLowOnly)}
          >
            {showLowOnly ? 'Показать все' : 'Показать только'}
          </button>
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-48">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30" />
          <input
            className="glass-input pl-8 h-10"
            placeholder="Поиск по названию..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
        <div className="flex gap-2 flex-wrap">
          <button
            onClick={() => setFilterType('all')}
            className={`badge cursor-pointer ${filterType === 'all' ? 'badge-amber' : 'badge-gray'}`}
          >
            Все
          </button>
          {allTypes.filter(t => mockInventory.some(i => i.type === t)).map(t => (
            <button
              key={t}
              onClick={() => setFilterType(filterType === t ? 'all' : t)}
              className={`badge cursor-pointer ${filterType === t ? typeColors[t] : 'badge-gray'}`}
            >
              {getIngredientTypeLabel(t)}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="glass overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-white/10">
                {['Наименование', 'Тип', 'Остаток', 'Минимум', 'Цена/ед.', 'Поставщик', 'Статус', ''].map(h => (
                  <th key={h} className="px-4 py-3 text-left text-[11px] font-medium text-white/30 uppercase tracking-wider">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {filtered.map(item => {
                const isLow = item.min_stock != null && item.quantity < item.min_stock
                const pct = item.min_stock ? Math.min(100, (item.quantity / item.min_stock) * 100) : 100
                return (
                  <tr key={item.id} className={`hover:bg-white/3 transition-colors ${isLow ? 'bg-red-500/5' : ''}`}>
                    <td className="px-4 py-3">
                      <span className="text-sm text-white font-medium">{item.name}</span>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`badge ${typeColors[item.type] ?? 'badge-gray'} text-[11px]`}>
                        {getIngredientTypeLabel(item.type)}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`text-sm font-semibold ${isLow ? 'text-red-400' : 'text-white'}`}>
                        {item.quantity} {item.unit}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-white/40">
                      {item.min_stock ? `${item.min_stock} ${item.unit}` : '—'}
                    </td>
                    <td className="px-4 py-3 text-sm text-white/60">
                      {item.cost_per_unit ? `${item.cost_per_unit.toFixed(3)} €` : '—'}
                    </td>
                    <td className="px-4 py-3 text-sm text-white/50">{item.supplier ?? '—'}</td>
                    <td className="px-4 py-3">
                      <div className="w-20">
                        <div className="progress-track h-1.5">
                          <div
                            className="h-1.5 rounded-full"
                            style={{
                              width: `${pct}%`,
                              background: pct < 50 ? '#ef4444' : pct < 80 ? '#f59e0b' : '#34d399'
                            }}
                          />
                        </div>
                        <p className="text-[10px] text-white/30 mt-0.5">{Math.round(pct)}%</p>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <button className="btn-glass py-1 px-3 text-xs">Ред.</button>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
        {filtered.length === 0 && (
          <div className="py-12 text-center text-white/30">Ничего не найдено</div>
        )}
      </div>
    </div>
  )
}
