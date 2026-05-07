'use client'

import { useState, useTransition } from 'react'
import { Plus, Search, Wrench } from 'lucide-react'
import type { Equipment, EquipmentStatus, EquipmentType } from '@/types/database'
import { EQUIPMENT_TYPES, EQUIPMENT_STATUSES } from '@/types/database'
import { updateEquipmentStatus } from '@/app/actions/equipment'

const typeMap = new Map(EQUIPMENT_TYPES.map(t => [t.value, t]))
const statusMap = new Map(EQUIPMENT_STATUSES.map(s => [s.value, s]))

export default function EquipmentView({ items, isMock }: { items: Equipment[]; isMock: boolean }) {
  const [search, setSearch] = useState('')
  const [filterType, setFilterType] = useState<EquipmentType | 'all'>('all')
  const [filterStatus, setFilterStatus] = useState<EquipmentStatus | 'all'>('all')
  const [isPending, startTransition] = useTransition()

  const filtered = items.filter(it => {
    if (filterType !== 'all' && it.type !== filterType) return false
    if (filterStatus !== 'all' && it.status !== filterStatus) return false
    if (search && !it.name.toLowerCase().includes(search.toLowerCase())) return false
    return true
  })

  const totalCapacity = items
    .filter(it => it.capacity_l != null && it.status !== 'retired')
    .reduce((s, it) => s + (it.capacity_l ?? 0), 0)

  const inUseCount = items.filter(it => it.status === 'in_use').length
  const dirtyCount = items.filter(it => it.status === 'dirty').length

  const cycleStatus = (current: EquipmentStatus): EquipmentStatus => {
    const order: EquipmentStatus[] = ['clean', 'in_use', 'dirty', 'cleaning', 'maintenance', 'retired']
    return order[(order.indexOf(current) + 1) % order.length]
  }

  const onCycleStatus = (id: string, status: EquipmentStatus) => {
    if (isMock) return
    startTransition(async () => {
      await updateEquipmentStatus(id, cycleStatus(status))
    })
  }

  return (
    <div className="max-w-7xl mx-auto space-y-6 fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-white">Оборудование</h1>
          <p className="text-sm text-white/40 mt-0.5">
            {items.length} единиц · {totalCapacity.toFixed(0)} л суммарно · {inUseCount} в работе · {dirtyCount} требуют мойки
            {isMock && <span className="ml-2 badge badge-gray">демо-данные</span>}
          </p>
        </div>
        <button className="btn-primary">
          <Plus size={16} /> Добавить
        </button>
      </div>

      {/* Status overview */}
      <div className="grid grid-cols-3 lg:grid-cols-6 gap-3">
        {EQUIPMENT_STATUSES.map(s => {
          const count = items.filter(it => it.status === s.value).length
          return (
            <button
              key={s.value}
              onClick={() => setFilterStatus(filterStatus === s.value ? 'all' : s.value)}
              className={`glass-sm p-3 text-left transition-all ${filterStatus === s.value ? 'ring-1 ring-amber-400/40' : 'hover:bg-white/5'}`}
            >
              <p className="text-2xl font-bold text-white">{count}</p>
              <span className={`badge ${s.badge} mt-1 text-[10px]`}>{s.label}</span>
            </button>
          )
        })}
      </div>

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
          >Все типы</button>
          {EQUIPMENT_TYPES.filter(t => items.some(it => it.type === t.value)).map(t => (
            <button
              key={t.value}
              onClick={() => setFilterType(filterType === t.value ? 'all' : t.value)}
              className={`badge cursor-pointer ${filterType === t.value ? 'badge-blue' : 'badge-gray'}`}
            >{t.emoji} {t.label}</button>
          ))}
        </div>
      </div>

      {/* Cards grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {filtered.map(it => {
          const type = typeMap.get(it.type)
          const status = statusMap.get(it.status)
          return (
            <div key={it.id} className="glass p-4 flex items-start gap-3 glass-hover">
              <div className="w-12 h-12 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-2xl flex-shrink-0">
                {type?.emoji}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2">
                  <h3 className="font-medium text-white text-sm truncate">{it.name}</h3>
                  <button
                    onClick={() => onCycleStatus(it.id, it.status)}
                    disabled={isPending || isMock}
                    className={`badge ${status?.badge} text-[10px] ${isMock ? 'cursor-default' : 'cursor-pointer hover:opacity-80'}`}
                    title={isMock ? 'Подключите Supabase для смены статуса' : 'Кликни чтобы переключить статус'}
                  >
                    {status?.label}
                  </button>
                </div>
                <p className="text-xs text-white/40 mt-0.5">{type?.label}</p>
                <div className="flex items-center gap-3 mt-2 text-xs text-white/50">
                  {it.capacity_l != null && (
                    <span>{it.capacity_l} л</span>
                  )}
                  {it.notes && (
                    <span className="text-white/40 truncate">{it.notes}</span>
                  )}
                </div>
              </div>
            </div>
          )
        })}
        {filtered.length === 0 && (
          <div className="col-span-full glass p-8 text-center text-white/30">
            <Wrench size={28} className="mx-auto opacity-40 mb-2" />
            <p className="text-sm">Ничего не найдено</p>
          </div>
        )}
      </div>
    </div>
  )
}
