'use client'

import { useState } from 'react'
import { Plus, AlertTriangle, Search } from 'lucide-react'
import { getIngredientTypeLabel } from '@/lib/utils'
import type { IngredientType } from '@/types/database'
import { Page, PageHeader } from '@/components/ui/Page'
import { Card } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Field'

import { MOCK_INVENTORY as mockInventory } from '@/lib/inventory-mock'

const allTypes: IngredientType[] = ['malt', 'hop', 'yeast', 'sugar', 'fruit', 'tea', 'chemical', 'adjunct', 'spice', 'juice', 'other']

export default function InventoryPage() {
  const [search, setSearch] = useState('')
  const [filterType, setFilterType] = useState<IngredientType | 'all'>('all')
  const [showLowOnly, setShowLowOnly] = useState(false)

  const filtered = mockInventory.filter(item => {
    const ms = item.name.toLowerCase().includes(search.toLowerCase())
    const mt = filterType === 'all' || item.type === filterType
    const ml = !showLowOnly || (item.min_stock != null && item.quantity < item.min_stock)
    return ms && mt && ml
  })

  const lowStockCount = mockInventory.filter(i => i.min_stock != null && i.quantity < i.min_stock).length

  return (
    <Page>
      <PageHeader
        title="Склад"
        subtitle={`${mockInventory.length} позиций · ${lowStockCount} заканчивается`}
        actions={
          <Button variant="primary"><Plus size={15} strokeWidth={2.5} />Добавить позицию</Button>
        }
      />

      {lowStockCount > 0 && (
        <Card pad="md" style={{ display: 'flex', alignItems: 'center', gap: 14, borderColor: 'rgba(251,146,60,0.25)', background: 'rgba(251,146,60,0.04)' }}>
          <AlertTriangle size={18} style={{ color: 'var(--warn)', flexShrink: 0 }} />
          <div style={{ flex: 1 }}>
            <p style={{ fontSize: 13.5, fontWeight: 600, color: '#fdba74' }}>{lowStockCount} позиций ниже минимального остатка</p>
            <p className="t-meta" style={{ marginTop: 2 }}>Рекомендуется пополнить запасы перед следующей варкой</p>
          </div>
          <Button size="sm" variant="ghost" onClick={() => setShowLowOnly(!showLowOnly)}>
            {showLowOnly ? 'Показать все' : 'Только эти'}
          </Button>
        </Card>
      )}

      {/* Filters */}
      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center' }}>
        <div style={{ position: 'relative', flex: '1 1 240px', minWidth: 200 }}>
          <Search size={14} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: 'var(--t-4)', zIndex: 1 }} />
          <Input placeholder="Поиск по названию..." value={search} onChange={e => setSearch(e.target.value)} style={{ paddingLeft: 38 }} />
        </div>
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
          <button
            onClick={() => setFilterType('all')}
            className="btn btn-sm"
            style={{
              background: filterType === 'all' ? 'var(--surface-3)' : 'var(--surface-1)',
              border: `1px solid ${filterType === 'all' ? 'var(--hairline-strong)' : 'var(--hairline)'}`,
              color: filterType === 'all' ? 'var(--t-1)' : 'var(--t-3)',
            }}
          >Все</button>
          {allTypes.filter(t => mockInventory.some(i => i.type === t)).map(t => (
            <button
              key={t}
              onClick={() => setFilterType(filterType === t ? 'all' : t)}
              className="btn btn-sm"
              style={{
                background: filterType === t ? 'var(--surface-3)' : 'var(--surface-1)',
                border: `1px solid ${filterType === t ? 'var(--hairline-strong)' : 'var(--hairline)'}`,
                color: filterType === t ? 'var(--t-1)' : 'var(--t-3)',
              }}
            >{getIngredientTypeLabel(t)}</button>
          ))}
        </div>
      </div>

      <Card pad="none" style={{ overflow: 'hidden' }}>
        <div style={{ overflowX: 'auto' }}>
          <table className="table">
            <thead>
              <tr>
                <th>Наименование</th>
                <th>Тип</th>
                <th>Остаток</th>
                <th>Минимум</th>
                <th>Цена</th>
                <th>Поставщик</th>
                <th>Статус</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(item => {
                const isLow = item.min_stock != null && item.quantity < item.min_stock
                const pct = item.min_stock ? Math.min(100, (item.quantity / item.min_stock) * 100) : 100
                return (
                  <tr key={item.id}>
                    <td>{item.name}</td>
                    <td><Badge tone="neutral">{getIngredientTypeLabel(item.type)}</Badge></td>
                    <td className="t-mono" style={{ color: isLow ? 'var(--bad)' : 'var(--t-1)', fontWeight: 600 }}>
                      {item.quantity} {item.unit}
                    </td>
                    <td className="t-mono" style={{ color: 'var(--t-3)' }}>
                      {item.min_stock ? `${item.min_stock} ${item.unit}` : '—'}
                    </td>
                    <td className="t-mono" style={{ color: 'var(--t-2)' }}>
                      {item.cost_per_unit ? `${item.cost_per_unit.toFixed(3)} €` : '—'}
                    </td>
                    <td style={{ color: 'var(--t-3)' }}>{item.supplier ?? '—'}</td>
                    <td>
                      <div style={{ width: 80 }}>
                        <div className="progress">
                          <div className="progress-bar" style={{
                            width: `${pct}%`,
                            background: pct < 50 ? 'var(--bad)' : pct < 80 ? 'var(--warn)' : 'var(--ok)',
                          }} />
                        </div>
                        <p className="t-meta t-mono" style={{ marginTop: 4, fontSize: 10.5 }}>{Math.round(pct)}%</p>
                      </div>
                    </td>
                    <td><Button size="sm" variant="ghost">Ред.</Button></td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
        {filtered.length === 0 && (
          <div style={{ padding: 48, textAlign: 'center', color: 'var(--t-3)' }}>Ничего не найдено</div>
        )}
      </Card>
    </Page>
  )
}
