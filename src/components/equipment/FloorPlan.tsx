'use client'

import { useEffect, useRef, useState, type CSSProperties } from 'react'
import type { Equipment, EquipmentType, EquipmentStatus } from '@/lib/equipment-mock'
import { EQUIPMENT_TYPE_META, STATUS_META } from '@/lib/equipment-mock'
import { VesselGraphic, liquidColorForStage } from './VesselGraphic'
import {
  Flame, Wheat, Wind, Snowflake, Cylinder, Beer, Container,
  Activity, Droplets, Cpu, Package, type LucideIcon,
} from 'lucide-react'

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
  cols?: number
  rows?: number
  minCell?: number
  maxCell?: number
  selectedId?: string | null
  editable?: boolean
  onSelect?: (id: string | null) => void
  onMove?: (id: string, position: { x: number; y: number }) => void
}

export function FloorPlan({
  equipment, cols = 18, rows = 10,
  minCell = 36, maxCell = 72,
  selectedId, editable = true, onSelect, onMove,
}: Props) {
  const wrapRef = useRef<HTMLDivElement>(null)
  const ref = useRef<HTMLDivElement>(null)
  const [cellSize, setCellSize] = useState(56)
  const [drag, setDrag] = useState<{
    id: string
    offsetX: number; offsetY: number
    previewX: number; previewY: number
  } | null>(null)

  // Responsive cell size — fit container width
  useEffect(() => {
    const el = wrapRef.current
    if (!el) return
    const update = () => {
      const w = el.clientWidth
      const ideal = Math.floor(w / cols)
      setCellSize(Math.max(minCell, Math.min(maxCell, ideal)))
    }
    update()
    const ro = new ResizeObserver(update)
    ro.observe(el)
    return () => ro.disconnect()
  }, [cols, minCell, maxCell])

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

    const onMoveEv = (ev: MouseEvent) => {
      const x = ev.clientX - gridRect.left - offsetX
      const y = ev.clientY - gridRect.top - offsetY
      const cellX = Math.max(0, Math.min(cols - item.size.w, Math.round(x / cellSize)))
      const cellY = Math.max(0, Math.min(rows - item.size.h, Math.round(y / cellSize)))
      setDrag(d => d ? { ...d, previewX: cellX, previewY: cellY } : d)
    }
    const onUp = () => {
      window.removeEventListener('mousemove', onMoveEv)
      window.removeEventListener('mouseup', onUp)
      setDrag(d => {
        if (d) commit(d.id, { x: d.previewX, y: d.previewY })
        return null
      })
    }
    setDrag({ id: item.id, offsetX, offsetY, previewX: item.position.x, previewY: item.position.y })
    window.addEventListener('mousemove', onMoveEv)
    window.addEventListener('mouseup', onUp)
  }

  const commit = (id: string, pos: { x: number; y: number }) => {
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
    <div ref={wrapRef} style={{ width: '100%' }}>
      <div ref={ref} className="floor-grid floor-grid-static" style={gridStyle} onClick={handleBgClick}>
        {equipment.map(item => {
          const isDragging = drag?.id === item.id
          const x = isDragging ? drag.previewX : item.position.x
          const y = isDragging ? drag.previewY : item.position.y
          const isSelected = selectedId === item.id

          const cardW = item.size.w * cellSize - 6
          const cardH = item.size.h * cellSize - 6
          const small = cardW < 90 || cardH < 80

          const liquidColor = liquidColorForStage(item.contents?.stage)
          const fillPct = item.contents?.fill_pct ?? 0

          return (
            <div
              key={item.id}
              className={`equip-card ${item.status === 'in_use' ? 'in-use' : ''} ${item.status === 'cip' ? 'cip' : ''} ${item.status === 'maintenance' ? 'maintenance' : ''} ${isDragging ? 'dragging' : ''} ${isSelected ? 'selected' : ''}`}
              style={{
                left: x * cellSize + 3,
                top: y * cellSize + 3,
                width: cardW,
                height: cardH,
              }}
              onMouseDown={(e) => handleMouseDown(e, item)}
              onClick={(e) => { e.stopPropagation(); onSelect?.(item.id) }}
            >
              {/* Header */}
              <div className="equip-header">
                <span className="equip-name" style={{ fontSize: small ? 10 : 11.5 }}>{item.name}</span>
                <span className="equip-dot" style={{ background: STATUS_DOT[item.status], boxShadow: `0 0 5px ${STATUS_DOT[item.status]}` }} />
              </div>

              {/* Vessel illustration */}
              <div className="equip-vessel">
                <VesselGraphic
                  type={item.type}
                  fillPct={fillPct}
                  liquidColor={liquidColor}
                  status={item.status}
                  animate
                />
              </div>

              {/* Footer (only if in use and big enough) */}
              {!small && item.contents && (
                <div className="equip-footer">
                  <p className="equip-brew">{item.contents.brew_name}</p>
                  <p className="equip-meta">
                    {item.contents.stage} · {item.contents.days}д
                    {item.contents.temp_c != null && <> · <span className="t-mono">{item.contents.temp_c}°C</span></>}
                  </p>
                </div>
              )}
              {!small && !item.contents && (
                <div className="equip-footer">
                  <p className="equip-meta">
                    {STATUS_META[item.status].label}
                    {item.volume_l > 0 && ` · ${item.volume_l} л`}
                  </p>
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
