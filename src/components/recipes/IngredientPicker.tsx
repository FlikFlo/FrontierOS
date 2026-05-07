'use client'

import { useState, useMemo } from 'react'
import { Star, Package } from 'lucide-react'
import type { IngredientType } from '@/types/database'
import { inventoryByType, type InventoryItem } from '@/lib/inventory-mock'

export type IngredientSource = 'popular' | 'inventory'

interface PopularItem {
  name: string
  // arbitrary preset payload to apply (color_ebc, alpha_acid, etc.)
}

interface Props<P extends PopularItem> {
  type: IngredientType
  value: string
  popular: P[]
  onPick: (source: IngredientSource, choice: P | InventoryItem | null) => void
  placeholder?: string
}

export function IngredientPicker<P extends PopularItem>({
  type, value, popular, onPick, placeholder = '— выберите —',
}: Props<P>) {
  const [source, setSource] = useState<IngredientSource>('popular')
  const stock = useMemo(() => inventoryByType(type), [type])

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      {/* Source toggle */}
      <div style={{
        display: 'inline-flex', alignSelf: 'flex-start',
        background: 'var(--surface-1)',
        border: '1px solid var(--hairline)',
        borderRadius: 8,
        padding: 2,
        gap: 1,
      }}>
        <button
          type="button"
          onClick={() => setSource('popular')}
          style={{
            display: 'inline-flex', alignItems: 'center', gap: 5,
            padding: '4px 10px',
            borderRadius: 6,
            background: source === 'popular' ? 'var(--surface-3)' : 'transparent',
            color: source === 'popular' ? 'var(--t-1)' : 'var(--t-3)',
            fontSize: 11, fontWeight: 600,
            border: 'none', cursor: 'pointer',
            transition: 'all .15s ease',
          }}
        >
          <Star size={11} strokeWidth={2.2} />
          Популярные
        </button>
        <button
          type="button"
          onClick={() => setSource('inventory')}
          style={{
            display: 'inline-flex', alignItems: 'center', gap: 5,
            padding: '4px 10px',
            borderRadius: 6,
            background: source === 'inventory' ? 'var(--surface-3)' : 'transparent',
            color: source === 'inventory' ? 'var(--t-1)' : 'var(--t-3)',
            fontSize: 11, fontWeight: 600,
            border: 'none', cursor: 'pointer',
            transition: 'all .15s ease',
          }}
        >
          <Package size={11} strokeWidth={2.2} />
          Со склада {stock.length > 0 && <span style={{ color: 'var(--accent)', fontWeight: 700 }}>{stock.length}</span>}
        </button>
      </div>

      <select
        className="select"
        value={value}
        onChange={e => {
          const v = e.target.value
          if (!v) { onPick(source, null); return }
          if (source === 'popular') {
            const p = popular.find(x => x.name === v) ?? null
            onPick('popular', p)
          } else {
            const i = stock.find(x => x.name === v) ?? null
            onPick('inventory', i)
          }
        }}
      >
        <option value="">{placeholder}</option>
        {source === 'popular'
          ? popular.map(p => <option key={p.name} value={p.name}>{p.name}</option>)
          : stock.length === 0
            ? <option disabled>На складе пусто — добавьте позиции</option>
            : stock.map(i => (
                <option key={i.id} value={i.name}>
                  {i.name} — {i.quantity} {i.unit}
                </option>
              ))
        }
      </select>
    </div>
  )
}
