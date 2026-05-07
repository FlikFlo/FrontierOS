'use client'

import { useRef, useState, type CSSProperties } from 'react'
import {
  Flame, Wheat, Wind, Snowflake, Cylinder, Beer, Container,
  Activity, Droplets, Cpu, Package, type LucideIcon,
} from 'lucide-react'
import type { Equipment, EquipmentType, EquipmentStatus } from '@/lib/equipment-mock'
import { EQUIPMENT_TYPE_META, STATUS_META } from '@/lib/equipment-mock'

const ICONS: Record<string, LucideIcon> = {
  flame: Flame, wheat: Wheat, wind: Wind, snow: Snowflake,
  cylinder: Cylinder, beer: Beer, container: Container,
  activity: Activity, droplets: Droplets, cpu: Cpu, package: Package,
}

const STATUS_DOT: Record<EquipmentStatus, string> = {
  idle: 'var(--ok)', in_use: 'var(--info)', cip: 'var(--warn)',
  maintenance: 'var(--bad)', dirty: 'var(--warn)',
}

interface Props {
  equipment: Equipment[]
  cellSize?: number
  cols?: number
  rows?: number
  selectedId?: string | null
  editable?: boolean
  onSelect?: (id: string | null) => void
  onMove?: (id: string, position: { x: number; y: number }) => void
}

export function FloorPlan({
  equipment, cellSize = 50, cols = 20, rows = 12,
  selectedId, editable = true, onSelect, onMove,
}: Props) {
  const ref = useRef<HTMLDivElement>(null)
  const [drag, setDrag] = useState<{
    id: string
    offsetX: number; offsetY: number  // pointer offset within card (px)
    previewX: number; previewY: number  // current top-left in cells
  } | null>(null)

  const handleMouseDown = (e: React.MouseEvent, item: Equipment) => {
    if (!editable) return
    e.preventDefault()
    onSelect?.(item.id)
    const grid = ref.current
    if (!grid) return
    const gridRect = grid.getBoundingClientRect()
    const cardRect = (e.currentTarget as HTMLElement).getBoundingClientRect()
    const offsetX = e.clientX - cardRect.left
    const offsetY = e.clientY - cardRect.top

    const onMove = (ev: MouseEvent) => {
      const x = ev.clientX - gridRect.left + grid.scrollLeft - offsetX
      const y = ev.clientY - gridRect.top + grid.scrollTop - offsetY
      const cellX = Math.max(0, Math.min(cols - item.size.w, Math.round(x / cellSize)))
      const cellY = Math.max(0, Math.min(rows - item.size.h, Math.round(y / cellSize)))
      setDrag(d => d ? { ...d, previewX: cellX, previewY: cellY } : d)
    }
    const onUp = () => {
      window.removeEventListener('mousemove', onMove)
      window.removeEventListener('mouseup', onUp)
      setDrag(d => {
        if (d) onMoveCommit(d.id, { x: d.previewX, y: d.previewY })
        return null
      })
    }
    setDrag({ id: item.id, offsetX, offsetY, previewX: item.position.x, previewY: item.position.y })
    window.addEventListener('mousemove', onMove)
    window.addEventListener('mouseup', onUp)
  }

  const onMoveCommit = (id: string, pos: { x: number; y: number }) => {
    const target = equipment.find(e => e.id === id)
    if (target && (target.position.x !== pos.x || target.position.y !== pos.y)) {
      onMove?.(id, pos)
    }
  }

  const handleBgClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) onSelect?.(null)
  }

  const gridStyle: CSSProperties = {
    width: cols * cellSize,
    height: rows * cellSize,
    backgroundSize: `${cellSize}px ${cellSize}px`,
  }

  return (
    <div style={{ overflow: 'auto', borderRadius: 'var(--r-lg)', border: '1px solid var(--hairline)' }}>
      <div ref={ref} className="floor-grid" style={gridStyle} onClick={handleBgClick}>
        {equipment.map(item => {
          const isDragging = drag?.id === item.id
          const x = isDragging ? drag.previewX : item.position.x
          const y = isDragging ? drag.previewY : item.position.y
          const meta = EQUIPMENT_TYPE_META[item.type]
          const Icon = ICONS[meta.icon] ?? Container
          const isSelected = selectedId === item.id

          const small = item.size.w * cellSize < 90 || item.size.h * cellSize < 80

          return (
            <div
              key={item.id}
              className={`equip-card ${item.status === 'in_use' ? 'in-use' : ''} ${item.status === 'cip' ? 'cip' : ''} ${item.status === 'maintenance' ? 'maintenance' : ''} ${isDragging ? 'dragging' : ''} ${isSelected ? 'selected' : ''}`}
              style={{
                left: x * cellSize + 4,
                top: y * cellSize + 4,
                width: item.size.w * cellSize - 8,
                height: item.size.h * cellSize - 8,
              }}
              onMouseDown={(e) => handleMouseDown(e, item)}
              onClick={(e) => { e.stopPropagation(); onSelect?.(item.id) }}
            >
              {/* Header row */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: small ? 0 : 4 }}>
                <Icon size={small ? 13 : 15} strokeWidth={1.9} style={{ color: 'var(--t-2)', flexShrink: 0 }} />
                <span style={{ fontSize: small ? 11 : 12.5, fontWeight: 700, color: 'var(--t-1)', letterSpacing: '-0.005em' }}>
                  {item.name}
                </span>
                <span
                  style={{
                    width: 6, height: 6, borderRadius: '50%',
                    background: STATUS_DOT[item.status],
                    boxShadow: `0 0 6px ${STATUS_DOT[item.status]}`,
                    marginLeft: 'auto',
                  }}
                />
              </div>

              {/* Body */}
              {!small && (
                <>
                  {item.contents ? (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 2, minWidth: 0 }}>
                      <p style={{ fontSize: 10.5, color: 'var(--t-2)', fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {item.contents.brew_name}
                      </p>
                      <p style={{ fontSize: 9.5, color: 'var(--t-3)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {item.contents.stage} · {item.contents.days}д
                      </p>
                      {item.contents.temp_c != null && (
                        <p className="t-mono" style={{ fontSize: 10, color: 'var(--info)', fontWeight: 600 }}>
                          {item.contents.temp_c}°C{item.contents.sg ? ` · ${item.contents.sg.toFixed(3)}` : ''}
                        </p>
                      )}
                    </div>
                  ) : (
                    <p style={{ fontSize: 10.5, color: 'var(--t-3)' }}>
                      {STATUS_META[item.status].label}
                    </p>
                  )}

                  {item.volume_l > 0 && (
                    <p className="t-mono" style={{ fontSize: 9.5, color: 'var(--t-4)', marginTop: 'auto', alignSelf: 'flex-end' }}>
                      {item.volume_l} л
                    </p>
                  )}
                </>
              )}

              {item.contents?.fill_pct != null && (
                <div className="equip-fill-track">
                  <div className="equip-fill-bar" style={{ width: `${item.contents.fill_pct}%` }} />
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}

export const EQUIPMENT_ICONS = ICONS

export function getEquipmentIcon(type: EquipmentType): LucideIcon {
  return ICONS[EQUIPMENT_TYPE_META[type].icon] ?? Container
}
