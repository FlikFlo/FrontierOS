'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Plus, Trash2, ArrowLeft } from 'lucide-react'
import type { BeverageCategory, RecipeMalt, RecipeHop, RecipeYeast, RecipeAdjunct } from '@/types/database'
import { BEVERAGE_CATEGORIES } from '@/types/database'
import { calcUniversalStats, COMMON_MALTS, COMMON_HOPS, COMMON_YEASTS, COMMON_ADJUNCTS } from '@/lib/beverage-calc'
import RecipeStatsPanel from './RecipeStatsPanel'
import { IngredientPicker } from './IngredientPicker'
import type { InventoryItem } from '@/lib/inventory-mock'
import { Page, PageHeader } from '@/components/ui/Page'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Tabs } from '@/components/ui/Tabs'
import { Field, Input, Select } from '@/components/ui/Field'

const uid = () => Math.random().toString(36).slice(2)

const isBeerLike = (c: BeverageCategory) => c === 'beer' || c === 'kvass'
const hasAlcohol = (c: BeverageCategory) => !['lemonade'].includes(c)
const hasMash    = (c: BeverageCategory) => c === 'beer' || c === 'kvass'

const hopUseLabels: Record<string, string> = {
  bittering: 'Горечь', flavor: 'Вкус', aroma: 'Аромат', whirlpool: 'Вирпул', dry_hop: 'Сухое охмеление',
}

type Tab = 'ingredients' | 'process' | 'notes'

export default function RecipeEditor() {
  const router = useRouter()

  const [name, setName] = useState('')
  const [category, setCategory] = useState<BeverageCategory>('beer')
  const [style, setStyle] = useState('')
  const [description, setDescription] = useState('')
  const [batchSize, setBatchSize] = useState(25)
  const [efficiency, setEfficiency] = useState(75)
  const [boilTime, setBoilTime] = useState(60)

  const [malts, setMalts] = useState<RecipeMalt[]>([])
  const [hops, setHops] = useState<RecipeHop[]>([])
  const [yeasts, setYeasts] = useState<RecipeYeast[]>([])
  const [adjuncts, setAdjuncts] = useState<RecipeAdjunct[]>([])

  const [tab, setTab] = useState<Tab>('ingredients')

  const stats = calcUniversalStats(category, malts, hops, yeasts, adjuncts, batchSize, efficiency, boilTime)

  // Malts
  const addMalt = () => setMalts(p => [...p, { id: uid(), name: '', amount_kg: 1, color_ebc: 5, extract_potential: 78 }])
  const updateMalt = (id: string, field: keyof RecipeMalt, v: string | number) =>
    setMalts(p => p.map(m => m.id === id ? { ...m, [field]: v } : m))
  const removeMalt = (id: string) => setMalts(p => p.filter(m => m.id !== id))

  // Hops
  const addHop = () => setHops(p => [...p, { id: uid(), name: '', amount_g: 20, alpha_acid: 8, use: 'bittering', time_min: 60 }])
  const updateHop = (id: string, field: keyof RecipeHop, v: string | number) =>
    setHops(p => p.map(h => h.id === id ? { ...h, [field]: v } : h))
  const removeHop = (id: string) => setHops(p => p.filter(h => h.id !== id))

  // Yeasts
  const addYeast = () => setYeasts(p => [...p, { id: uid(), name: '', brand: '', attenuation: 75, temp_min: 18, temp_max: 24 }])
  const updateYeast = (id: string, field: keyof RecipeYeast, v: string | number) =>
    setYeasts(p => p.map(y => y.id === id ? { ...y, [field]: v } : y))
  const removeYeast = (id: string) => setYeasts(p => p.filter(y => y.id !== id))

  // Adjuncts
  const addAdjunct = () => setAdjuncts(p => [...p, { id: uid(), name: '', amount: 1, unit: 'kg', use: '', time_min: null, sugar_content: null }])
  const updateAdjunct = (id: string, field: keyof RecipeAdjunct, v: string | number | null) =>
    setAdjuncts(p => p.map(a => a.id === id ? { ...a, [field]: v } : a))
  const removeAdjunct = (id: string) => setAdjuncts(p => p.filter(a => a.id !== id))

  return (
    <Page>
      <PageHeader
        title="Новый рецепт"
        subtitle="Параметры пересчитываются в реальном времени"
        actions={
          <>
            <Button variant="ghost" onClick={() => router.back()}><ArrowLeft size={14} />Назад</Button>
            <Button variant="primary">Сохранить рецепт</Button>
          </>
        }
      />

      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) 340px', gap: 20 }}>
        {/* Left column */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {/* Base info */}
          <Card pad="lg">
            <p className="t-eyebrow" style={{ marginBottom: 12 }}>Основная информация</p>

            <Field label="Тип напитка">
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                {BEVERAGE_CATEGORIES.map(cat => (
                  <button
                    key={cat.value}
                    type="button"
                    onClick={() => setCategory(cat.value)}
                    className="btn btn-sm"
                    style={{
                      background: category === cat.value ? 'var(--accent-soft)' : 'var(--surface-1)',
                      border: `1px solid ${category === cat.value ? 'var(--accent-edge)' : 'var(--hairline)'}`,
                      color: category === cat.value ? 'var(--accent)' : 'var(--t-2)',
                    }}
                  >
                    <span>{cat.emoji}</span>
                    {cat.label}
                  </button>
                ))}
              </div>
            </Field>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginTop: 14 }}>
              <Field label="Название *">
                <Input placeholder="West Coast IPA" value={name} onChange={e => setName(e.target.value)} />
              </Field>
              <Field label="Стиль / подвид">
                <Input placeholder="American IPA, Kombucha с манго..." value={style} onChange={e => setStyle(e.target.value)} />
              </Field>
            </div>

            <div style={{ marginTop: 12 }}>
              <Field label="Описание">
                <textarea
                  className="textarea"
                  rows={3}
                  placeholder="Описание рецепта..."
                  value={description}
                  onChange={e => setDescription(e.target.value)}
                />
              </Field>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12, marginTop: 14 }}>
              <Field label="Объём, л">
                <Input type="number" suffix="л" min={1} max={10000} value={batchSize} onChange={e => setBatchSize(+e.target.value)} />
              </Field>
              {hasMash(category) && (
                <Field label="КПД затирания">
                  <Input type="number" suffix="%" min={1} max={100} value={efficiency} onChange={e => setEfficiency(+e.target.value)} />
                </Field>
              )}
              {(isBeerLike(category) || category === 'mead') && (
                <Field label="Кипячение">
                  <Input type="number" suffix="мин" min={0} max={300} value={boilTime} onChange={e => setBoilTime(+e.target.value)} />
                </Field>
              )}
            </div>
          </Card>

          {/* Ingredient sections */}
          <Card pad="none">
            <div style={{ padding: '14px 20px', borderBottom: '1px solid var(--hairline)' }}>
              <Tabs<Tab>
                value={tab}
                onChange={setTab}
                items={[
                  { value: 'ingredients', label: 'Ингредиенты' },
                  { value: 'process',     label: 'Процесс' },
                  { value: 'notes',       label: 'Заметки' },
                ]}
              />
            </div>

            <div style={{ padding: 20, display: 'flex', flexDirection: 'column', gap: 20 }}>
              {tab === 'ingredients' && (
                <>
                  {hasMash(category) && (
                    <IngredientSection title="Солод / зерно" onAdd={addMalt} empty="Нет солода — нажмите «Добавить»" hasItems={malts.length > 0}>
                      {malts.map(malt => (
                        <RowGrid key={malt.id}>
                          <div style={{ gridColumn: 'span 5' }}>
                            <IngredientPicker
                              type="malt"
                              value={malt.name}
                              popular={COMMON_MALTS}
                              onPick={(src, choice) => {
                                if (!choice) { updateMalt(malt.id, 'name', ''); return }
                                if (src === 'popular') {
                                  const p = choice as typeof COMMON_MALTS[number]
                                  updateMalt(malt.id, 'name', p.name)
                                  updateMalt(malt.id, 'color_ebc', p.color_ebc)
                                  updateMalt(malt.id, 'extract_potential', p.extract_potential)
                                } else {
                                  updateMalt(malt.id, 'name', (choice as InventoryItem).name)
                                }
                              }}
                              placeholder="— выберите солод —"
                            />
                          </div>
                          <NumCell span={2} suffix="кг" step={0.1} value={malt.amount_kg} onChange={v => updateMalt(malt.id, 'amount_kg', v)} />
                          <NumCell span={2} suffix="EBC" value={malt.color_ebc} onChange={v => updateMalt(malt.id, 'color_ebc', v)} />
                          <NumCell span={2} suffix="%" step={0.5} value={malt.extract_potential} onChange={v => updateMalt(malt.id, 'extract_potential', v)} />
                          <DeleteCell onClick={() => removeMalt(malt.id)} />
                        </RowGrid>
                      ))}
                      {malts.length > 0 && (
                        <ColumnsHeader cols={[
                          { span: 5, label: 'Наименование' },
                          { span: 2, label: 'кг' },
                          { span: 2, label: 'EBC' },
                          { span: 2, label: 'Экстракт %' },
                        ]} />
                      )}
                    </IngredientSection>
                  )}

                  {category === 'beer' && (
                    <IngredientSection title="Хмель" onAdd={addHop} empty="Хмель не добавлен" hasItems={hops.length > 0}>
                      {hops.map(hop => (
                        <RowGrid key={hop.id}>
                          <div style={{ gridColumn: 'span 3' }}>
                            <IngredientPicker
                              type="hop"
                              value={hop.name}
                              popular={COMMON_HOPS}
                              onPick={(src, choice) => {
                                if (!choice) { updateHop(hop.id, 'name', ''); return }
                                if (src === 'popular') {
                                  const p = choice as typeof COMMON_HOPS[number]
                                  updateHop(hop.id, 'name', p.name)
                                  updateHop(hop.id, 'alpha_acid', p.alpha_acid)
                                } else {
                                  updateHop(hop.id, 'name', (choice as InventoryItem).name)
                                }
                              }}
                              placeholder="— хмель —"
                            />
                          </div>
                          <NumCell span={2} suffix="г" step={5} value={hop.amount_g} onChange={v => updateHop(hop.id, 'amount_g', v)} />
                          <NumCell span={1} suffix="α%" step={0.5} value={hop.alpha_acid} onChange={v => updateHop(hop.id, 'alpha_acid', v)} />
                          <div style={{ gridColumn: 'span 3' }}>
                            <Select value={hop.use} onChange={e => updateHop(hop.id, 'use', e.target.value as RecipeHop['use'])}>
                              {Object.entries(hopUseLabels).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
                            </Select>
                          </div>
                          <NumCell span={2} suffix="мин" step={5} value={hop.time_min} onChange={v => updateHop(hop.id, 'time_min', v)} />
                          <DeleteCell onClick={() => removeHop(hop.id)} />
                        </RowGrid>
                      ))}
                      {hops.length > 0 && (
                        <ColumnsHeader cols={[
                          { span: 3, label: 'Хмель' },
                          { span: 2, label: 'г' },
                          { span: 1, label: 'α%' },
                          { span: 3, label: 'Применение' },
                          { span: 2, label: 'Время' },
                        ]} />
                      )}
                    </IngredientSection>
                  )}

                  {hasAlcohol(category) && (
                    <IngredientSection
                      title={category === 'kombucha' ? 'SCOBY / культура' : 'Дрожжи'}
                      onAdd={addYeast}
                      empty="Не добавлено"
                      hasItems={yeasts.length > 0}
                    >
                      {yeasts.map(yeast => (
                        <RowGrid key={yeast.id}>
                          <div style={{ gridColumn: 'span 4' }}>
                            <IngredientPicker
                              type="yeast"
                              value={yeast.name}
                              popular={COMMON_YEASTS}
                              onPick={(src, choice) => {
                                if (!choice) { updateYeast(yeast.id, 'name', ''); return }
                                if (src === 'popular') {
                                  const p = choice as typeof COMMON_YEASTS[number]
                                  setYeasts(prev => prev.map(y => y.id === yeast.id ? { ...y, ...p, id: yeast.id } : y))
                                } else {
                                  updateYeast(yeast.id, 'name', (choice as InventoryItem).name)
                                }
                              }}
                              placeholder="— дрожжи —"
                            />
                          </div>
                          <NumCell span={2} suffix="%" value={yeast.attenuation} onChange={v => updateYeast(yeast.id, 'attenuation', v)} />
                          <NumCell span={2} suffix="°C мин" value={yeast.temp_min} onChange={v => updateYeast(yeast.id, 'temp_min', v)} />
                          <NumCell span={2} suffix="°C макс" value={yeast.temp_max} onChange={v => updateYeast(yeast.id, 'temp_max', v)} />
                          <DeleteCell onClick={() => removeYeast(yeast.id)} span={2} />
                        </RowGrid>
                      ))}
                      {yeasts.length > 0 && (
                        <ColumnsHeader cols={[
                          { span: 4, label: 'Штамм' },
                          { span: 2, label: 'Сбражив.' },
                          { span: 2, label: 'T мин' },
                          { span: 2, label: 'T макс' },
                        ]} />
                      )}
                    </IngredientSection>
                  )}

                  <IngredientSection title="Добавки / ингредиенты" onAdd={addAdjunct} empty={
                    category === 'lemonade' ? 'Сахар, соки, кислоты...' :
                    category === 'kombucha' ? 'Чай, сахар, флавуринг...' :
                    category === 'mead' ? 'Мёд, специи, фрукты...' :
                    'Сахар, фрукты, специи...'
                  } hasItems={adjuncts.length > 0}>
                    {adjuncts.length === 0 && (
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 6 }}>
                        {(category === 'kombucha' ? ['Чай чёрный (листовой)', 'Сахар-песок (сахароза)'] :
                          category === 'lemonade' ? ['Сахар-песок (сахароза)', 'Лимонный сок'] :
                          category === 'mead' ? ['Мёд'] :
                          category === 'cider' ? ['Яблочный сок'] :
                          category === 'ginger_beer' ? ['Имбирь тёртый', 'Сахар-песок (сахароза)', 'Лимонный сок'] : []
                        ).map(preset => (
                          <button
                            key={preset}
                            type="button"
                            className="btn btn-sm btn-ghost"
                            onClick={() => {
                              const all = Object.values(COMMON_ADJUNCTS).flat()
                              const found = all.find(a => a.name === preset)
                              if (found) {
                                setAdjuncts(prev => [...prev, { id: uid(), name: found.name, amount: 1, unit: found.unit, use: '', time_min: null, sugar_content: found.sugar_content }])
                              }
                            }}
                          >
                            <Plus size={11} />{preset}
                          </button>
                        ))}
                      </div>
                    )}

                    {adjuncts.map(adj => (
                      <RowGrid key={adj.id}>
                        <div style={{ gridColumn: 'span 4' }}>
                          <Input placeholder="Название" value={adj.name} onChange={e => updateAdjunct(adj.id, 'name', e.target.value)} />
                        </div>
                        <NumCell span={2} step={0.1} value={adj.amount} onChange={v => updateAdjunct(adj.id, 'amount', v)} />
                        <div style={{ gridColumn: 'span 2' }}>
                          <Select value={adj.unit} onChange={e => updateAdjunct(adj.id, 'unit', e.target.value)}>
                            {['kg', 'g', 'L', 'ml', 'шт', 'ст.л', 'ч.л'].map(u => <option key={u} value={u}>{u}</option>)}
                          </Select>
                        </div>
                        <div style={{ gridColumn: 'span 2' }}>
                          <Input placeholder="Применение" value={adj.use} onChange={e => updateAdjunct(adj.id, 'use', e.target.value)} />
                        </div>
                        <NumCell span={1} suffix="%" value={adj.sugar_content ?? 0} onChange={v => updateAdjunct(adj.id, 'sugar_content', v)} />
                        <DeleteCell onClick={() => removeAdjunct(adj.id)} />
                      </RowGrid>
                    ))}
                    {adjuncts.length > 0 && (
                      <ColumnsHeader cols={[
                        { span: 4, label: 'Название' },
                        { span: 2, label: 'Кол-во' },
                        { span: 2, label: 'Ед.' },
                        { span: 2, label: 'Применение' },
                        { span: 1, label: 'Сахар %' },
                      ]} />
                    )}
                  </IngredientSection>
                </>
              )}

              {tab === 'process' && (
                <p style={{ fontSize: 13, color: 'var(--t-3)', textAlign: 'center', padding: '32px 0' }}>
                  Шаги процесса будут добавлены после сохранения рецепта
                </p>
              )}

              {tab === 'notes' && (
                <Field label="Заметки пивовара">
                  <textarea
                    className="textarea"
                    rows={8}
                    placeholder="Личные заметки, наблюдения, изменения..."
                  />
                </Field>
              )}
            </div>
          </Card>
        </div>

        {/* Right: Stats panel */}
        <div>
          <div style={{ position: 'sticky', top: 80 }}>
            <RecipeStatsPanel stats={stats} category={category} />
          </div>
        </div>
      </div>
    </Page>
  )
}

// ─── helpers ──────────────────────────────────────────────────────────────

function IngredientSection({
  title, onAdd, hasItems, empty, children,
}: {
  title: string
  onAdd: () => void
  hasItems: boolean
  empty: string
  children: React.ReactNode
}) {
  return (
    <section>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
        <p className="t-eyebrow">{title}</p>
        <Button size="sm" variant="ghost" onClick={onAdd}><Plus size={12} />Добавить</Button>
      </div>
      {!hasItems && (
        <p style={{ fontSize: 12.5, color: 'var(--t-3)', textAlign: 'center', padding: '12px 0' }}>{empty}</p>
      )}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>{children}</div>
    </section>
  )
}

function RowGrid({ children }: { children: React.ReactNode }) {
  return (
    <div style={{
      display: 'grid', gridTemplateColumns: 'repeat(12, 1fr)', gap: 6,
      padding: 10,
      borderRadius: 'var(--r-md)',
      background: 'var(--surface-1)',
      border: '1px solid var(--hairline)',
      alignItems: 'center',
    }}>
      {children}
    </div>
  )
}

function NumCell({ span, suffix, step = 1, value, onChange }: { span: number; suffix?: string; step?: number; value: number; onChange: (v: number) => void }) {
  return (
    <div style={{ gridColumn: `span ${span}` }}>
      <Input type="number" step={step} suffix={suffix} value={value} onChange={e => onChange(+e.target.value)} />
    </div>
  )
}

function DeleteCell({ onClick, span = 1 }: { onClick: () => void; span?: number }) {
  return (
    <div style={{ gridColumn: `span ${span}`, display: 'flex', justifyContent: 'flex-end' }}>
      <button
        type="button"
        onClick={onClick}
        style={{
          width: 32, height: 32, borderRadius: 8,
          background: 'rgba(248,113,113,0.08)',
          border: '1px solid rgba(248,113,113,0.2)',
          color: '#fca5a5',
          display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
          cursor: 'pointer', transition: 'all .15s ease',
        }}
        onMouseEnter={e => { e.currentTarget.style.background = 'rgba(248,113,113,0.16)' }}
        onMouseLeave={e => { e.currentTarget.style.background = 'rgba(248,113,113,0.08)' }}
      >
        <Trash2 size={13} />
      </button>
    </div>
  )
}

function ColumnsHeader({ cols }: { cols: { span: number; label: string }[] }) {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(12, 1fr)', gap: 6, padding: '0 10px' }}>
      {cols.map((c, i) => (
        <div key={i} className="t-eyebrow" style={{ gridColumn: `span ${c.span}`, fontSize: 9.5 }}>
          {c.label}
        </div>
      ))}
    </div>
  )
}
