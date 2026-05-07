'use client'

import { useEffect, useMemo, useRef, useState, useTransition } from 'react'
import { Save, Undo2, Trash2, Plus, X, ZoomIn, ZoomOut, RotateCcw, Info } from 'lucide-react'
import type { Equipment, EquipmentStatus, EquipmentType } from '@/types/database'
import { EQUIPMENT_TYPES, EQUIPMENT_STATUSES } from '@/types/database'
import { updateEquipmentPosition, updateEquipmentStatus, saveEquipment } from '@/app/actions/equipment'

const COLS = 16
const ROWS = 10
const STORAGE_KEY = 'brewmaster:floor-layout-v1'

const typeMap = new Map(EQUIPMENT_TYPES.map(t => [t.value, t]))
const statusMap = new Map(EQUIPMENT_STATUSES.map(s => [s.value, s]))

const statusColors: Record<EquipmentStatus, string> = {
  clean:       'border-emerald-400/50 bg-emerald-500/10',
  in_use:      'border-blue-400/60   bg-blue-500/15',
  dirty:       'border-orange-400/60 bg-orange-500/10',
  cleaning:    'border-amber-400/50  bg-amber-500/10',
  maintenance: 'border-purple-400/50 bg-purple-500/10',
  retired:     'border-white/20      bg-white/5',
}

interface PlacedItem extends Equipment {
  position_x: number
  position_y: number
}

interface DragData {
  kind: 'palette' | 'placed'
  paletteType?: EquipmentType
  placedId?: string
}

export default function FloorPlanCanvas({ items, isMock }: { items: Equipment[]; isMock: boolean }) {
  // Local state for positions (override from items on mount + restore from localStorage)
  const [layout, setLayout] = useState<Record<string, { x: number; y: number } | null>>({})
  const [virtualItems, setVirtualItems] = useState<Equipment[]>([])
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [zoom, setZoom] = useState(1)
  const [isPending, startTransition] = useTransition()
  const [draftName, setDraftName] = useState('')
  const dragRef = useRef<DragData | null>(null)

  // Restore layout + virtual items from localStorage on mount
  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY)
      if (raw) {
        const parsed = JSON.parse(raw)
        if (parsed.layout) setLayout(parsed.layout)
        if (parsed.virtualItems) setVirtualItems(parsed.virtualItems)
      }
    } catch {}
  }, [])

  // Save layout to localStorage on change
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ layout, virtualItems }))
    } catch {}
  }, [layout, virtualItems])

  const allItems = useMemo(() => [...items, ...virtualItems], [items, virtualItems])

  // Resolve placement: localStorage layout overrides DB position
  const placed = useMemo<PlacedItem[]>(() => {
    return allItems
      .map(it => {
        const override = layout[it.id]
        if (override === null) return null  // explicitly removed
        if (override) return { ...it, position_x: override.x, position_y: override.y }
        if (it.position_x != null && it.position_y != null) {
          return { ...it, position_x: it.position_x, position_y: it.position_y } as PlacedItem
        }
        return null
      })
      .filter((x): x is PlacedItem => x !== null)
  }, [allItems, layout])

  const palette = useMemo(() => {
    // items not yet placed
    return allItems.filter(it => {
      const o = layout[it.id]
      if (o === null) return true
      if (o) return false
      return it.position_x == null || it.position_y == null
    })
  }, [allItems, layout])

  const cellAt = (x: number, y: number) => placed.find(p => p.position_x === x && p.position_y === y)

  const handleDragStart = (data: DragData) => (e: React.DragEvent) => {
    dragRef.current = data
    e.dataTransfer.effectAllowed = 'move'
    e.dataTransfer.setData('text/plain', JSON.stringify(data))
  }

  const handleDrop = (x: number, y: number) => (e: React.DragEvent) => {
    e.preventDefault()
    const data = dragRef.current
    if (!data) return
    const occupied = cellAt(x, y)
    if (occupied && (data.kind === 'palette' || data.placedId !== occupied.id)) return  // can't stack
    if (data.kind === 'placed' && data.placedId) {
      setLayout(prev => ({ ...prev, [data.placedId!]: { x, y } }))
      if (!isMock) {
        startTransition(() => { updateEquipmentPosition(data.placedId!, x, y) })
      }
    }
    if (data.kind === 'palette' && data.paletteType) {
      // find first palette item of this type
      const target = palette.find(p => p.type === data.paletteType)
      if (target) {
        setLayout(prev => ({ ...prev, [target.id]: { x, y } }))
        if (!isMock) {
          startTransition(() => { updateEquipmentPosition(target.id, x, y) })
        }
      }
    }
    dragRef.current = null
  }

  const removeFromGrid = (id: string) => {
    setLayout(prev => ({ ...prev, [id]: null }))
    if (!isMock) {
      startTransition(() => { updateEquipmentPosition(id, null, null) })
    }
  }

  const resetLayout = () => {
    if (!confirm('Сбросить расстановку и удалить локальные позиции?')) return
    setLayout({})
    setVirtualItems([])
    try { localStorage.removeItem(STORAGE_KEY) } catch {}
  }

  const addVirtualEquipment = (type: EquipmentType) => {
    const def = typeMap.get(type)
    if (!def) return
    const name = draftName.trim() || `${def.label} ${virtualItems.filter(v => v.type === type).length + 1}`
    const newItem: Equipment = {
      id: `local-${type}-${Date.now()}`,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      name,
      type,
      capacity_l: def.defaultCapacity,
      status: 'clean',
      current_brew_id: null,
      position_x: null,
      position_y: null,
      notes: null,
    }
    setVirtualItems(prev => [...prev, newItem])
    setDraftName('')

    if (!isMock) {
      startTransition(async () => {
        const res = await saveEquipment({
          name: newItem.name, type, capacity_l: newItem.capacity_l,
          status: 'clean', current_brew_id: null,
          position_x: null, position_y: null, notes: null,
        })
        if (res.ok) {
          // swap virtual id to real
          setVirtualItems(prev => prev.filter(v => v.id !== newItem.id))
        }
      })
    }
  }

  const cycleStatus = (id: string, current: EquipmentStatus) => {
    const order: EquipmentStatus[] = ['clean', 'in_use', 'dirty', 'cleaning', 'maintenance']
    const next = order[(order.indexOf(current) + 1) % order.length]
    if (id.startsWith('local-')) {
      setVirtualItems(prev => prev.map(v => v.id === id ? { ...v, status: next } : v))
    }
    if (!isMock && !id.startsWith('local-') && !id.startsWith('mock-')) {
      startTransition(() => { updateEquipmentStatus(id, next) })
    }
  }

  const selected = selectedId ? allItems.find(i => i.id === selectedId) : null

  return (
    <div className="fade-in space-y-4">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-white">План варочного цеха</h1>
          <p className="text-sm text-white/40 mt-0.5">
            Перетащите оборудование на сетку · {placed.length} размещено · {palette.length} в палитре
            {isMock && <span className="ml-2 badge badge-gray">демо-режим (сохранение в браузере)</span>}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => setZoom(z => Math.max(0.6, z - 0.1))} className="btn-glass p-2" title="Уменьшить"><ZoomOut size={14} /></button>
          <span className="text-xs text-white/40 w-10 text-center tabular-nums">{Math.round(zoom * 100)}%</span>
          <button onClick={() => setZoom(z => Math.min(1.5, z + 0.1))} className="btn-glass p-2" title="Увеличить"><ZoomIn size={14} /></button>
          <button onClick={resetLayout} className="btn-glass p-2 text-amber-300" title="Сбросить"><RotateCcw size={14} /></button>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-[1fr_280px] gap-4">

        {/* Canvas */}
        <div
          className="glass p-3 overflow-auto"
          style={{ minHeight: 600 }}
        >
          <div
            className="relative inline-block origin-top-left transition-transform"
            style={{ transform: `scale(${zoom})` }}
          >
            <div
              className="grid gap-1"
              style={{
                gridTemplateColumns: `repeat(${COLS}, 88px)`,
                gridTemplateRows: `repeat(${ROWS}, 88px)`,
              }}
            >
              {Array.from({ length: COLS * ROWS }).map((_, idx) => {
                const x = idx % COLS
                const y = Math.floor(idx / COLS)
                const item = cellAt(x, y)
                const type = item ? typeMap.get(item.type) : null
                const status = item ? statusMap.get(item.status) : null
                const colorClass = item ? statusColors[item.status] : 'border-white/8'

                return (
                  <div
                    key={idx}
                    onDragOver={(e) => { if (!item) e.preventDefault() }}
                    onDrop={handleDrop(x, y)}
                    className={`relative rounded-xl border ${item ? colorClass : 'border-dashed border-white/8 hover:border-white/20'} transition-colors`}
                  >
                    {!item && (
                      <span className="absolute inset-0 flex items-center justify-center text-[10px] text-white/15 font-mono select-none">
                        {x + 1},{y + 1}
                      </span>
                    )}
                    {item && type && (
                      <div
                        draggable
                        onDragStart={handleDragStart({ kind: 'placed', placedId: item.id })}
                        onClick={() => setSelectedId(item.id)}
                        className={`absolute inset-0 flex flex-col items-center justify-center p-1 cursor-grab active:cursor-grabbing select-none ${selectedId === item.id ? 'ring-2 ring-amber-400/60' : ''}`}
                      >
                        <span className="text-2xl leading-none">{type.emoji}</span>
                        <span className="text-[9px] text-white/80 truncate max-w-full mt-1 px-1 text-center" title={item.name}>{item.name}</span>
                        {item.capacity_l != null && (
                          <span className="text-[9px] text-white/40 mt-0.5">{item.capacity_l} л</span>
                        )}
                        {status && (
                          <span className={`absolute top-1 right-1 w-2 h-2 rounded-full ${item.status === 'clean' ? 'bg-emerald-400' :
                            item.status === 'in_use' ? 'bg-blue-400' :
                            item.status === 'dirty' ? 'bg-orange-400' :
                            item.status === 'cleaning' ? 'bg-amber-400' :
                            item.status === 'maintenance' ? 'bg-purple-400' : 'bg-white/30'}`}
                            title={status.label}
                          />
                        )}
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          </div>
        </div>

        {/* Right panel */}
        <div className="space-y-4">

          {/* Selected item */}
          {selected && (
            <div className="glass p-4">
              <div className="flex items-start justify-between mb-3">
                <span className="text-3xl">{typeMap.get(selected.type)?.emoji}</span>
                <button onClick={() => setSelectedId(null)} className="btn-glass p-1.5"><X size={12} /></button>
              </div>
              <h3 className="font-semibold text-white">{selected.name}</h3>
              <p className="text-xs text-white/40 mt-0.5">{typeMap.get(selected.type)?.label}</p>

              {selected.capacity_l != null && (
                <p className="text-sm text-white/60 mt-3">Объём: {selected.capacity_l} л</p>
              )}

              <div className="mt-3">
                <p className="text-[10px] uppercase text-white/30 mb-1.5">Статус</p>
                <button
                  onClick={() => cycleStatus(selected.id, selected.status)}
                  className={`badge ${statusMap.get(selected.status)?.badge} cursor-pointer`}
                >
                  {statusMap.get(selected.status)?.label}
                </button>
                <p className="text-[10px] text-white/30 mt-1">Клик — следующий статус</p>
              </div>

              {selected.notes && (
                <p className="text-xs text-white/50 mt-3 p-2 glass-sm">{selected.notes}</p>
              )}

              <button
                onClick={() => removeFromGrid(selected.id)}
                className="btn-glass w-full justify-center mt-3 text-xs text-red-300"
              >
                <Trash2 size={11} /> Убрать с плана
              </button>
            </div>
          )}

          {/* Add new */}
          <div className="glass p-4">
            <h3 className="text-xs font-semibold text-white/60 uppercase tracking-wider mb-3 flex items-center gap-2">
              <Plus size={12} />Добавить оборудование
            </h3>
            <input
              className="glass-input text-sm h-9 mb-2"
              placeholder="Имя (опц.)"
              value={draftName}
              onChange={e => setDraftName(e.target.value)}
            />
            <div className="grid grid-cols-3 gap-1.5">
              {EQUIPMENT_TYPES.slice(0, 9).map(t => (
                <button
                  key={t.value}
                  onClick={() => addVirtualEquipment(t.value)}
                  className="glass-sm p-2 text-center hover:bg-white/10 transition-colors"
                  title={t.label}
                >
                  <span className="text-lg block">{t.emoji}</span>
                  <span className="text-[9px] text-white/50 block truncate">{t.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Palette */}
          {palette.length > 0 && (
            <div className="glass p-4">
              <h3 className="text-xs font-semibold text-white/60 uppercase tracking-wider mb-3">
                Не размещено ({palette.length})
              </h3>
              <div className="space-y-1.5 max-h-64 overflow-y-auto">
                {palette.map(it => {
                  const type = typeMap.get(it.type)
                  return (
                    <div
                      key={it.id}
                      draggable
                      onDragStart={handleDragStart({ kind: 'palette', paletteType: it.type })}
                      onClick={() => setSelectedId(it.id)}
                      className="glass-sm p-2 flex items-center gap-2 cursor-grab active:cursor-grabbing hover:bg-white/8"
                    >
                      <span className="text-lg">{type?.emoji}</span>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs text-white/80 truncate">{it.name}</p>
                        <p className="text-[10px] text-white/40">{type?.label}{it.capacity_l ? ` · ${it.capacity_l} л` : ''}</p>
                      </div>
                    </div>
                  )
                })}
              </div>
              <p className="text-[10px] text-white/30 mt-2">
                <Info size={10} className="inline mr-1" />
                Перетащи на сетку, чтобы разместить
              </p>
            </div>
          )}

          {/* Legend */}
          <div className="glass p-4">
            <h3 className="text-xs font-semibold text-white/60 uppercase tracking-wider mb-2">Легенда статусов</h3>
            <div className="space-y-1 text-xs">
              {EQUIPMENT_STATUSES.filter(s => s.value !== 'retired').map(s => (
                <div key={s.value} className="flex items-center gap-2">
                  <span className={`w-2 h-2 rounded-full ${s.value === 'clean' ? 'bg-emerald-400' :
                    s.value === 'in_use' ? 'bg-blue-400' :
                    s.value === 'dirty' ? 'bg-orange-400' :
                    s.value === 'cleaning' ? 'bg-amber-400' :
                    s.value === 'maintenance' ? 'bg-purple-400' : 'bg-white/30'}`} />
                  <span className="text-white/60">{s.label}</span>
                </div>
              ))}
            </div>
          </div>

        </div>
      </div>
    </div>
  )
}
