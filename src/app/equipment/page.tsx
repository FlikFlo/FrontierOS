'use client'

import { useState, useMemo } from 'react'
import { Plus, Layers, LayoutGrid, Move, Save, Lock, X, Thermometer, Calendar, FileText, Activity } from 'lucide-react'
import { Page, PageHeader } from '@/components/ui/Page'
import { Card } from '@/components/ui/Card'
import { Tabs } from '@/components/ui/Tabs'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Stat } from '@/components/ui/Stat'
import { FloorPlan, getEquipmentIcon } from '@/components/equipment/FloorPlan'
import {
  MOCK_EQUIPMENT, EQUIPMENT_TYPE_META, STATUS_META,
  type Equipment, type EquipmentType,
} from '@/lib/equipment-mock'

type View = 'plan' | 'registry'

const CATEGORY_LABEL: Record<string, string> = {
  hot_side:     'Варочное',
  cold_side:    'Охлаждение',
  fermentation: 'Брожение',
  packaging:    'Розлив',
  utility:      'Сервис',
}

export default function EquipmentPage() {
  const [view, setView] = useState<View>('plan')
  const [items, setItems] = useState<Equipment[]>(MOCK_EQUIPMENT)
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [editable, setEditable] = useState(true)

  const selected = items.find(i => i.id === selectedId) ?? null

  const stats = useMemo(() => {
    const total = items.length
    const inUse = items.filter(i => i.status === 'in_use').length
    const idle = items.filter(i => i.status === 'idle').length
    const cip = items.filter(i => i.status === 'cip' || i.status === 'dirty').length
    const totalVol = items.filter(i => i.type === 'fv' || i.type === 'bbt').reduce((s, i) => s + i.volume_l, 0)
    return { total, inUse, idle, cip, totalVol }
  }, [items])

  const grouped = useMemo(() => {
    const map: Record<string, Equipment[]> = {}
    for (const it of items) {
      const cat = EQUIPMENT_TYPE_META[it.type].category
      ;(map[cat] ??= []).push(it)
    }
    return map
  }, [items])

  const handleMove = (id: string, position: { x: number; y: number }) => {
    setItems(prev => prev.map(it => it.id === id ? { ...it, position } : it))
  }

  return (
    <Page>
      <PageHeader
        title="Парк оборудования"
        subtitle={`${items.length} единиц · ${stats.totalVol} л общей ёмкости брожения`}
        actions={
          <>
            {view === 'plan' && (
              <Button
                variant={editable ? 'ghost' : 'primary'}
                onClick={() => setEditable(!editable)}
              >
                {editable ? <><Lock size={14} strokeWidth={2.2} />Зафиксировать</> : <><Move size={14} strokeWidth={2.2} />Редактировать</>}
              </Button>
            )}
            <Button variant="primary"><Plus size={15} strokeWidth={2.5} />Добавить</Button>
          </>
        }
      />

      {/* KPI */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 14 }}>
        <Stat label="Всего" value={stats.total} />
        <Stat label="В работе" value={stats.inUse} sub={`${Math.round(stats.inUse / stats.total * 100)}%`} />
        <Stat label="Свободны" value={stats.idle} />
        <Stat label="Уход / CIP" value={stats.cip} />
      </div>

      {/* View switcher */}
      <Tabs<View>
        value={view}
        onChange={setView}
        size="lg"
        items={[
          { value: 'plan',     label: 'План цеха', icon: <LayoutGrid size={13} /> },
          { value: 'registry', label: 'Реестр',    icon: <Layers size={13} /> },
        ]}
      />

      {view === 'plan' ? (
        <div style={{ display: 'grid', gridTemplateColumns: selected ? 'minmax(0, 1fr) 360px' : 'minmax(0, 1fr)', gap: 16 }}>
          <div>
            <FloorPlan
              equipment={items}
              cols={18}
              rows={10}
              minCell={36}
              maxCell={64}
              editable={editable}
              selectedId={selectedId}
              onSelect={setSelectedId}
              onMove={handleMove}
            />
            <div style={{ marginTop: 10, display: 'flex', alignItems: 'center', gap: 14, flexWrap: 'wrap' }}>
              <p className="t-meta">
                {editable ? 'Перетаскивай блоки по сетке для расстановки' : 'Кликни на блок чтобы посмотреть детали'}
              </p>
              <div style={{ display: 'flex', gap: 14, marginLeft: 'auto' }}>
                {(['idle','in_use','cip','maintenance'] as const).map(s => (
                  <span key={s} style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                    <span style={{
                      width: 7, height: 7, borderRadius: '50%',
                      background: s === 'idle' ? 'var(--ok)' : s === 'in_use' ? 'var(--info)' : s === 'cip' ? 'var(--warn)' : 'var(--bad)',
                    }} />
                    <span className="t-meta">{STATUS_META[s].label}</span>
                  </span>
                ))}
              </div>
            </div>
          </div>

          {selected && <DetailPanel equipment={selected} onClose={() => setSelectedId(null)} />}
        </div>
      ) : (
        <RegistryView grouped={grouped} onSelect={setSelectedId} selectedId={selectedId} />
      )}
    </Page>
  )
}

function DetailPanel({ equipment, onClose }: { equipment: Equipment; onClose: () => void }) {
  const meta = EQUIPMENT_TYPE_META[equipment.type]
  const Icon = getEquipmentIcon(equipment.type)
  const status = STATUS_META[equipment.status]
  return (
    <Card pad="lg" style={{ height: 'fit-content', position: 'sticky', top: 80 }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 14 }}>
        <div style={{
          width: 44, height: 44, borderRadius: 12, flexShrink: 0,
          background: 'var(--surface-2)', border: '1px solid var(--hairline)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <Icon size={20} strokeWidth={1.9} />
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <h3 style={{ fontSize: 17, fontWeight: 600, color: 'var(--t-1)', letterSpacing: '-0.01em' }}>{equipment.name}</h3>
          <p className="t-meta" style={{ marginTop: 2 }}>{meta.label}</p>
        </div>
        <button
          onClick={onClose}
          style={{
            background: 'transparent', border: 'none', cursor: 'pointer',
            color: 'var(--t-3)', padding: 4, borderRadius: 8,
          }}
        >
          <X size={16} />
        </button>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 14, marginBottom: 18 }}>
        <Badge tone={status.tone}>{status.label}</Badge>
        {equipment.volume_l > 0 && (
          <span className="t-meta t-mono">{equipment.volume_l} л</span>
        )}
      </div>

      {equipment.contents ? (
        <div style={{
          padding: 14, borderRadius: 'var(--r-md)',
          background: 'var(--surface-1)', border: '1px solid var(--hairline)',
          marginBottom: 14,
        }}>
          <p className="t-eyebrow" style={{ marginBottom: 8 }}>Содержимое</p>
          <p style={{ fontSize: 14, fontWeight: 600, color: 'var(--t-1)' }}>{equipment.contents.brew_name}</p>
          <p className="t-meta" style={{ marginTop: 2 }}>{equipment.contents.batch_number} · {equipment.contents.stage}</p>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 8, marginTop: 12 }}>
            <Detail label="Дни" value={`${equipment.contents.days}`} icon={<Calendar size={11} />} />
            {equipment.contents.temp_c != null && <Detail label="Темп." value={`${equipment.contents.temp_c}°C`} icon={<Thermometer size={11} />} />}
            {equipment.contents.sg != null && <Detail label="SG" value={equipment.contents.sg.toFixed(3)} mono icon={<Activity size={11} />} />}
            {equipment.contents.fill_pct != null && <Detail label="Заполнение" value={`${equipment.contents.fill_pct}%`} icon={<FileText size={11} />} />}
          </div>

          <div style={{ marginTop: 14 }}>
            <Button size="sm" variant="ghost" style={{ width: '100%' }}>Открыть варку →</Button>
          </div>
        </div>
      ) : (
        <div style={{
          padding: 18, borderRadius: 'var(--r-md)',
          background: 'var(--surface-1)', border: '1px dashed var(--hairline)',
          textAlign: 'center', marginBottom: 14,
        }}>
          <p className="t-meta">Емкость свободна</p>
          <Button size="sm" variant="primary" style={{ marginTop: 10 }}>Назначить варку</Button>
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 8 }}>
        {equipment.last_cip && <Detail label="Последний CIP" value={new Date(equipment.last_cip).toLocaleDateString('ru')} />}
        {equipment.installed && <Detail label="Установлена" value={new Date(equipment.installed).toLocaleDateString('ru')} />}
        {equipment.diameter_mm && <Detail label="Диаметр" value={`${equipment.diameter_mm} мм`} />}
        {equipment.height_mm && <Detail label="Высота" value={`${equipment.height_mm} мм`} />}
      </div>

      {equipment.notes && (
        <div style={{ marginTop: 14 }}>
          <p className="t-eyebrow" style={{ marginBottom: 6 }}>Заметки</p>
          <p style={{ fontSize: 13, color: 'var(--t-2)', lineHeight: 1.5 }}>{equipment.notes}</p>
        </div>
      )}

      <div style={{ display: 'flex', gap: 8, marginTop: 18 }}>
        <Button size="sm" variant="ghost" style={{ flex: 1 }}><Save size={12} />Сохранить</Button>
        <Button size="sm" variant="ghost" style={{ flex: 1 }}>CIP</Button>
      </div>
    </Card>
  )
}

function Detail({ label, value, mono = false, icon }: { label: string; value: string; mono?: boolean; icon?: React.ReactNode }) {
  return (
    <div style={{
      padding: '8px 10px', borderRadius: 'var(--r-sm)',
      background: 'var(--surface-2)', border: '1px solid var(--hairline)',
    }}>
      <p className="t-eyebrow" style={{ fontSize: 9, display: 'flex', alignItems: 'center', gap: 4 }}>
        {icon}{label}
      </p>
      <p className={mono ? 't-mono' : ''} style={{ fontSize: 12.5, fontWeight: 600, color: 'var(--t-1)', marginTop: 3 }}>
        {value}
      </p>
    </div>
  )
}

function RegistryView({
  grouped, selectedId, onSelect,
}: {
  grouped: Record<string, Equipment[]>
  selectedId: string | null
  onSelect: (id: string | null) => void
}) {
  const order = ['hot_side', 'cold_side', 'fermentation', 'packaging', 'utility']
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      {order.filter(c => grouped[c]?.length).map(cat => (
        <div key={cat}>
          <p className="t-eyebrow" style={{ marginBottom: 10 }}>{CATEGORY_LABEL[cat]}</p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 12 }}>
            {grouped[cat].map(it => {
              const meta = EQUIPMENT_TYPE_META[it.type]
              const Icon = getEquipmentIcon(it.type)
              const status = STATUS_META[it.status]
              const isSel = selectedId === it.id
              return (
                <Card
                  key={it.id}
                  hover
                  pad="md"
                  onClick={() => onSelect(isSel ? null : it.id)}
                  style={{
                    cursor: 'pointer',
                    borderColor: isSel ? 'var(--accent-edge)' : undefined,
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
                    <div style={{
                      width: 36, height: 36, borderRadius: 10, flexShrink: 0,
                      background: 'var(--surface-2)', border: '1px solid var(--hairline)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}>
                      <Icon size={16} strokeWidth={1.9} />
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 6 }}>
                        <p style={{ fontSize: 13.5, fontWeight: 600, color: 'var(--t-1)' }}>{it.name}</p>
                        <Badge tone={status.tone}>{status.label}</Badge>
                      </div>
                      <p className="t-meta" style={{ marginTop: 2 }}>
                        {meta.label} {it.volume_l > 0 && `· ${it.volume_l} л`}
                      </p>
                      {it.contents && (
                        <div style={{ marginTop: 8, paddingTop: 8, borderTop: '1px solid var(--hairline)' }}>
                          <p style={{ fontSize: 12, color: 'var(--t-2)', fontWeight: 500 }}>
                            {it.contents.brew_name} <span style={{ color: 'var(--t-4)' }}>· {it.contents.batch_number}</span>
                          </p>
                          <div style={{ display: 'flex', gap: 10, marginTop: 4, flexWrap: 'wrap' }}>
                            <span className="t-meta">{it.contents.stage}</span>
                            <span className="t-meta">{it.contents.days}д</span>
                            {it.contents.temp_c != null && <span className="t-meta t-mono">{it.contents.temp_c}°C</span>}
                            {it.contents.sg != null && <span className="t-meta t-mono">SG {it.contents.sg.toFixed(3)}</span>}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </Card>
              )
            })}
          </div>
        </div>
      ))}
    </div>
  )
}
