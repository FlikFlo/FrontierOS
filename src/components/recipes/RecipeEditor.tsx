'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Plus, Trash2, ArrowLeft, ChevronDown, Thermometer, Timer, Droplets, Wind } from 'lucide-react'
import type { BeverageCategory, RecipeMalt, RecipeHop, RecipeYeast, RecipeAdjunct } from '@/types/database'
import { BEVERAGE_CATEGORIES } from '@/types/database'
import { calcUniversalStats, COMMON_MALTS, COMMON_HOPS, COMMON_YEASTS, COMMON_ADJUNCTS } from '@/lib/beverage-calc'
import RecipeStatsPanel from './RecipeStatsPanel'
import { IngredientPicker } from './IngredientPicker'
import { StylePicker } from './StylePicker'
import type { InventoryItem } from '@/lib/inventory-mock'
import { BJCP_CATEGORIES, type BeerStyle } from '@/lib/bjcp-styles'
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
  bittering: 'Горечь', flavor: 'Вкус', aroma: 'Аромат',
  whirlpool: 'Вирпул', dry_hop: 'Сухое охмеление',
}

type Tab = 'ingredients' | 'process' | 'water' | 'notes'

interface MashStep { id: string; name: string; temp: number; time: number }
interface FermStep { id: string; name: string; temp: number; days: number }

const DEFAULT_MASH: MashStep[] = [
  { id: uid(), name: 'Белковая пауза', temp: 52, time: 10 },
  { id: uid(), name: 'Осахаривание', temp: 67, time: 60 },
  { id: uid(), name: 'Мэш-аут', temp: 78, time: 10 },
]

const DEFAULT_FERM: FermStep[] = [
  { id: uid(), name: 'Первичная', temp: 20, days: 7 },
  { id: uid(), name: 'Вторичная', temp: 18, days: 7 },
  { id: uid(), name: 'Холодное осветление', temp: 2, days: 3 },
]

function findBjcpStyle(styleId: string): BeerStyle | null {
  for (const cat of BJCP_CATEGORIES) {
    const found = cat.styles.find(s => s.id === styleId || `${s.name} (${s.id})` === styleId)
    if (found) return found
  }
  return null
}

export default function RecipeEditor() {
  const router = useRouter()

  const [name, setName] = useState('')
  const [category, setCategory] = useState<BeverageCategory>('beer')
  const [style, setStyle] = useState('')
  const [styleId, setStyleId] = useState('')
  const [description, setDescription] = useState('')
  const [batchSize, setBatchSize] = useState(25)
  const [efficiency, setEfficiency] = useState(75)
  const [boilTime, setBoilTime] = useState(60)
  const [carbonation, setCarbonation] = useState(2.4)
  const [showStylePicker, setShowStylePicker] = useState(false)

  const [malts, setMalts] = useState<RecipeMalt[]>([])
  const [hops, setHops] = useState<RecipeHop[]>([])
  const [yeasts, setYeasts] = useState<RecipeYeast[]>([])
  const [adjuncts, setAdjuncts] = useState<RecipeAdjunct[]>([])

  const [mashSteps, setMashSteps] = useState<MashStep[]>(DEFAULT_MASH)
  const [fermSteps, setFermSteps] = useState<FermStep[]>(DEFAULT_FERM)

  // Water profile
  const [water, setWater] = useState({ ca: 75, mg: 10, na: 25, cl: 75, so4: 150, hco3: 50 })

  const [tab, setTab] = useState<Tab>('ingredients')

  const stats = calcUniversalStats(category, malts, hops, yeasts, adjuncts, batchSize, efficiency, boilTime)
  const bjcpStyle = styleId ? findBjcpStyle(styleId) : null

  // Ingredient handlers
  const addMalt   = () => setMalts(p => [...p, { id: uid(), name: '', amount_kg: 1, color_ebc: 5, extract_potential: 78 }])
  const updateMalt = (id: string, f: keyof RecipeMalt, v: string | number) => setMalts(p => p.map(m => m.id === id ? { ...m, [f]: v } : m))
  const removeMalt = (id: string) => setMalts(p => p.filter(m => m.id !== id))

  const addHop    = () => setHops(p => [...p, { id: uid(), name: '', amount_g: 20, alpha_acid: 8, use: 'bittering', time_min: 60 }])
  const updateHop = (id: string, f: keyof RecipeHop, v: string | number) => setHops(p => p.map(h => h.id === id ? { ...h, [f]: v } : h))
  const removeHop = (id: string) => setHops(p => p.filter(h => h.id !== id))

  const addYeast    = () => setYeasts(p => [...p, { id: uid(), name: '', brand: '', attenuation: 75, temp_min: 18, temp_max: 24 }])
  const updateYeast = (id: string, f: keyof RecipeYeast, v: string | number) => setYeasts(p => p.map(y => y.id === id ? { ...y, [f]: v } : y))
  const removeYeast = (id: string) => setYeasts(p => p.filter(y => y.id !== id))

  const addAdjunct    = () => setAdjuncts(p => [...p, { id: uid(), name: '', amount: 1, unit: 'kg', use: '', time_min: null, sugar_content: null }])
  const updateAdjunct = (id: string, f: keyof RecipeAdjunct, v: string | number | null) => setAdjuncts(p => p.map(a => a.id === id ? { ...a, [f]: v } : a))
  const removeAdjunct = (id: string) => setAdjuncts(p => p.filter(a => a.id !== id))

  // Mash/Ferm handlers
  const addMashStep    = () => setMashSteps(p => [...p, { id: uid(), name: 'Пауза', temp: 65, time: 30 }])
  const updateMashStep = (id: string, f: keyof MashStep, v: string | number) => setMashSteps(p => p.map(s => s.id === id ? { ...s, [f]: v } : s))
  const removeMashStep = (id: string) => setMashSteps(p => p.filter(s => s.id !== id))

  const addFermStep    = () => setFermSteps(p => [...p, { id: uid(), name: 'Стадия', temp: 18, days: 5 }])
  const updateFermStep = (id: string, f: keyof FermStep, v: string | number) => setFermSteps(p => p.map(s => s.id === id ? { ...s, [f]: v } : s))
  const removeFermStep = (id: string) => setFermSteps(p => p.filter(s => s.id !== id))

  const tabItems: { value: Tab; label: string }[] = [
    { value: 'ingredients', label: 'Ингредиенты' },
    { value: 'process',     label: 'Процесс' },
    ...(category === 'beer' ? [{ value: 'water' as Tab, label: 'Вода' }] : []),
    { value: 'notes',       label: 'Заметки' },
  ]

  return (
    <Page>
      <PageHeader
        title={name || 'Новый рецепт'}
        subtitle="Параметры пересчитываются в реальном времени"
        actions={
          <>
            <Button variant="ghost" onClick={() => router.back()}><ArrowLeft size={14} />Назад</Button>
            <Button variant="primary">Сохранить рецепт</Button>
          </>
        }
      />

      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) 340px', gap: 20 }}>
        {/* Left */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

          {/* Base info */}
          <Card pad="lg">
            <p className="t-eyebrow" style={{ marginBottom: 14 }}>Основная информация</p>

            {/* Category chips */}
            <Field label="Тип напитка">
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                {BEVERAGE_CATEGORIES.map(cat => (
                  <button key={cat.value} type="button"
                    onClick={() => { setCategory(cat.value); setStyle(''); setStyleId('') }}
                    className="btn btn-sm"
                    style={{
                      background: category === cat.value ? 'var(--accent-soft)' : 'var(--surface-1)',
                      border: `1px solid ${category === cat.value ? 'var(--accent-edge)' : 'var(--hairline)'}`,
                      color: category === cat.value ? 'var(--accent)' : 'var(--t-2)',
                    }}
                  >
                    <span>{cat.emoji}</span>{cat.label}
                  </button>
                ))}
              </div>
            </Field>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginTop: 14 }}>
              <Field label="Название *">
                <Input placeholder="West Coast IPA" value={name} onChange={e => setName(e.target.value)} />
              </Field>
              {/* Style picker button */}
              <Field label="Стиль BJCP">
                <button
                  type="button"
                  onClick={() => setShowStylePicker(true)}
                  style={{
                    width: '100%', height: 40, padding: '0 12px',
                    borderRadius: 'var(--r-md)', cursor: 'pointer', textAlign: 'left',
                    background: 'var(--surface-2)', border: `1px solid ${style ? 'var(--accent-edge)' : 'var(--hairline)'}`,
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    transition: 'border-color .15s',
                  }}
                >
                  <span style={{ fontSize: 13, color: style ? 'var(--t-1)' : 'var(--t-4)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1 }}>
                    {style || 'Выбрать стиль...'}
                  </span>
                  <ChevronDown size={13} style={{ color: 'var(--t-4)', flexShrink: 0 }} />
                </button>
              </Field>
            </div>

            {/* BJCP style ranges banner */}
            {bjcpStyle && (
              <div style={{
                marginTop: 12, padding: '10px 14px', borderRadius: 'var(--r-md)',
                background: 'rgba(251,191,36,0.06)', border: '1px solid var(--accent-edge)',
                display: 'flex', gap: 16, flexWrap: 'wrap',
              }}>
                <span style={{ fontSize: 10, color: 'var(--accent)', fontWeight: 700, letterSpacing: '0.05em', textTransform: 'uppercase', alignSelf: 'center' }}>
                  {bjcpStyle.id}
                </span>
                {[
                  { l: 'OG', v: `${bjcpStyle.og[0].toFixed(3)}–${bjcpStyle.og[1].toFixed(3)}` },
                  { l: 'IBU', v: `${bjcpStyle.ibu[0]}–${bjcpStyle.ibu[1]}` },
                  { l: 'ABV', v: `${bjcpStyle.abv[0]}–${bjcpStyle.abv[1]}%` },
                  { l: 'SRM', v: `${bjcpStyle.srm[0]}–${bjcpStyle.srm[1]}` },
                  { l: 'FG', v: `${bjcpStyle.fg[0].toFixed(3)}–${bjcpStyle.fg[1].toFixed(3)}` },
                ].map(it => (
                  <span key={it.l} className="t-mono" style={{ fontSize: 11, color: 'var(--t-2)' }}>
                    <span style={{ color: 'var(--t-4)', marginRight: 4 }}>{it.l}</span>{it.v}
                  </span>
                ))}
              </div>
            )}

            <div style={{ marginTop: 12 }}>
              <Field label="Описание">
                <textarea className="textarea" rows={2} placeholder="Короткое описание рецепта..."
                  value={description} onChange={e => setDescription(e.target.value)} />
              </Field>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(110px, 1fr))', gap: 10, marginTop: 14 }}>
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
              <Field label="Карбонизация">
                <Input type="number" step={0.1} suffix="vol" min={0} max={6} value={carbonation} onChange={e => setCarbonation(+e.target.value)} />
              </Field>
            </div>
          </Card>

          {/* Tabs */}
          <Card pad="none">
            <div style={{ padding: '14px 20px', borderBottom: '1px solid var(--hairline)' }}>
              <Tabs<Tab> value={tab} onChange={setTab} items={tabItems} />
            </div>

            <div style={{ padding: 20, display: 'flex', flexDirection: 'column', gap: 20 }}>
              {/* ── INGREDIENTS ── */}
              {tab === 'ingredients' && (
                <>
                  {hasMash(category) && (
                    <IngredientSection title="Солод / зерно" onAdd={addMalt} empty="Нажмите «Добавить» для первого солода" hasItems={malts.length > 0}>
                      {malts.map(malt => (
                        <RowGrid key={malt.id}>
                          <div style={{ gridColumn: 'span 5' }}>
                            <IngredientPicker type="malt" value={malt.name} popular={COMMON_MALTS}
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
                              placeholder="— солод —"
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
                          { span: 5, label: 'Наименование' }, { span: 2, label: 'кг' },
                          { span: 2, label: 'EBC' }, { span: 2, label: 'Экстракт %' },
                        ]} />
                      )}
                    </IngredientSection>
                  )}

                  {category === 'beer' && (
                    <IngredientSection title="Хмель" onAdd={addHop} empty="Хмель не добавлен" hasItems={hops.length > 0}>
                      {hops.map(hop => (
                        <RowGrid key={hop.id}>
                          <div style={{ gridColumn: 'span 3' }}>
                            <IngredientPicker type="hop" value={hop.name} popular={COMMON_HOPS}
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
                          { span: 3, label: 'Хмель' }, { span: 2, label: 'г' },
                          { span: 1, label: 'α%' }, { span: 3, label: 'Применение' }, { span: 2, label: 'Время' },
                        ]} />
                      )}
                    </IngredientSection>
                  )}

                  {hasAlcohol(category) && (
                    <IngredientSection
                      title={category === 'kombucha' ? 'SCOBY / культура' : 'Дрожжи'}
                      onAdd={addYeast} empty="Дрожжи не добавлены" hasItems={yeasts.length > 0}
                    >
                      {yeasts.map(yeast => (
                        <RowGrid key={yeast.id}>
                          <div style={{ gridColumn: 'span 4' }}>
                            <IngredientPicker type="yeast" value={yeast.name} popular={COMMON_YEASTS}
                              onPick={(src, choice) => {
                                if (!choice) { updateYeast(yeast.id, 'name', ''); return }
                                if (src === 'popular') {
                                  const p = choice as typeof COMMON_YEASTS[number]
                                  setYeasts(prev => prev.map(y => y.id === yeast.id ? { ...y, ...p, id: yeast.id } : y))
                                } else {
                                  updateYeast(yeast.id, 'name', (choice as InventoryItem).name)
                                }
                              }}
                              placeholder="— штамм —"
                            />
                          </div>
                          <NumCell span={2} suffix="% атт" value={yeast.attenuation} onChange={v => updateYeast(yeast.id, 'attenuation', v)} />
                          <NumCell span={2} suffix="°C↓" value={yeast.temp_min} onChange={v => updateYeast(yeast.id, 'temp_min', v)} />
                          <NumCell span={2} suffix="°C↑" value={yeast.temp_max} onChange={v => updateYeast(yeast.id, 'temp_max', v)} />
                          <DeleteCell onClick={() => removeYeast(yeast.id)} span={2} />
                        </RowGrid>
                      ))}
                      {yeasts.length > 0 && (
                        <ColumnsHeader cols={[
                          { span: 4, label: 'Штамм' }, { span: 2, label: 'Сбражив.' },
                          { span: 2, label: 'T мин' }, { span: 2, label: 'T макс' },
                        ]} />
                      )}
                    </IngredientSection>
                  )}

                  <IngredientSection
                    title="Добавки"
                    onAdd={addAdjunct}
                    empty={category === 'lemonade' ? 'Сахар, соки, кислоты...' : category === 'kombucha' ? 'Чай, сахар, флавуринг...' : category === 'mead' ? 'Мёд, специи, фрукты...' : 'Специи, фрукты, сахар...'}
                    hasItems={adjuncts.length > 0}
                  >
                    {adjuncts.length === 0 && (
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 6 }}>
                        {(category === 'kombucha' ? ['Чай чёрный (листовой)', 'Сахар-песок (сахароза)'] :
                          category === 'lemonade' ? ['Сахар-песок (сахароза)', 'Лимонный сок'] :
                          category === 'mead' ? ['Мёд'] : category === 'cider' ? ['Яблочный сок'] :
                          category === 'ginger_beer' ? ['Имбирь тёртый', 'Сахар-песок (сахароза)', 'Лимонный сок'] : []
                        ).map(preset => (
                          <button key={preset} type="button" className="btn btn-sm btn-ghost"
                            onClick={() => {
                              const all = Object.values(COMMON_ADJUNCTS).flat()
                              const found = all.find(a => a.name === preset)
                              if (found) setAdjuncts(prev => [...prev, { id: uid(), name: found.name, amount: 1, unit: found.unit, use: '', time_min: null, sugar_content: found.sugar_content }])
                            }}>
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
                        { span: 4, label: 'Название' }, { span: 2, label: 'Кол-во' },
                        { span: 2, label: 'Ед.' }, { span: 2, label: 'Применение' }, { span: 1, label: 'Сахар %' },
                      ]} />
                    )}
                  </IngredientSection>
                </>
              )}

              {/* ── PROCESS ── */}
              {tab === 'process' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
                  {hasMash(category) && (
                    <section>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <Thermometer size={13} style={{ color: 'var(--accent)' }} />
                          <p className="t-eyebrow">Схема затирания</p>
                        </div>
                        <Button size="sm" variant="ghost" onClick={addMashStep}><Plus size={12} />Пауза</Button>
                      </div>
                      {/* Visual mash timeline */}
                      <div style={{ display: 'flex', alignItems: 'stretch', gap: 0, marginBottom: 14, overflowX: 'auto' }}>
                        {mashSteps.map((step, i) => (
                          <div key={step.id} style={{ display: 'flex', alignItems: 'stretch', flex: 1, minWidth: 100 }}>
                            <div style={{
                              flex: 1, padding: '10px 12px', borderRadius: i === 0 ? '8px 0 0 8px' : i === mashSteps.length - 1 ? '0 8px 8px 0' : '0',
                              background: step.temp >= 75 ? 'rgba(239,68,68,0.12)' : step.temp >= 60 ? 'rgba(251,191,36,0.1)' : 'rgba(96,165,250,0.08)',
                              border: '1px solid var(--hairline)',
                              borderLeft: i > 0 ? 'none' : undefined,
                              textAlign: 'center',
                            }}>
                              <p style={{ fontSize: 20, fontWeight: 700, color: 'var(--t-1)', lineHeight: 1 }} className="t-mono">{step.temp}°</p>
                              <p style={{ fontSize: 10, color: 'var(--t-3)', marginTop: 3 }}>{step.time} мин</p>
                              <p style={{ fontSize: 11, color: 'var(--t-2)', marginTop: 4, fontWeight: 500 }}>{step.name}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                        {mashSteps.map((step, i) => (
                          <div key={step.id} style={{
                            display: 'grid', gridTemplateColumns: '1fr 80px 80px auto',
                            gap: 8, alignItems: 'center',
                            padding: '10px 12px', borderRadius: 'var(--r-md)',
                            background: 'var(--surface-2)', border: '1px solid var(--hairline)',
                          }}>
                            <Input placeholder="Название паузы" value={step.name} onChange={e => updateMashStep(step.id, 'name', e.target.value)} />
                            <Input type="number" suffix="°C" step={1} value={step.temp} onChange={e => updateMashStep(step.id, 'temp', +e.target.value)} />
                            <Input type="number" suffix="мин" step={5} value={step.time} onChange={e => updateMashStep(step.id, 'time', +e.target.value)} />
                            <button type="button" onClick={() => removeMashStep(step.id)}
                              style={{ width: 32, height: 32, borderRadius: 8, background: 'transparent', border: '1px solid var(--hairline)', cursor: 'pointer', color: 'var(--t-4)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                              <Trash2 size={12} />
                            </button>
                          </div>
                        ))}
                      </div>
                    </section>
                  )}

                  <section>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <Timer size={13} style={{ color: 'var(--info)' }} />
                        <p className="t-eyebrow">Схема ферментации</p>
                      </div>
                      <Button size="sm" variant="ghost" onClick={addFermStep}><Plus size={12} />Стадия</Button>
                    </div>
                    {/* Ferm timeline */}
                    <div style={{ display: 'flex', alignItems: 'stretch', gap: 0, marginBottom: 14 }}>
                      {fermSteps.map((step, i) => (
                        <div key={step.id} style={{ flex: 1, display: 'flex', alignItems: 'stretch' }}>
                          <div style={{
                            flex: 1, padding: '10px 12px', textAlign: 'center',
                            borderRadius: i === 0 ? '8px 0 0 8px' : i === fermSteps.length - 1 ? '0 8px 8px 0' : '0',
                            background: step.temp <= 4 ? 'rgba(96,165,250,0.1)' : step.temp <= 14 ? 'rgba(96,165,250,0.07)' : 'rgba(251,191,36,0.07)',
                            border: '1px solid var(--hairline)', borderLeft: i > 0 ? 'none' : undefined,
                          }}>
                            <p style={{ fontSize: 20, fontWeight: 700, color: step.temp <= 4 ? 'var(--info)' : 'var(--t-1)', lineHeight: 1 }} className="t-mono">{step.temp}°</p>
                            <p style={{ fontSize: 10, color: 'var(--t-3)', marginTop: 3 }}>{step.days} дн</p>
                            <p style={{ fontSize: 11, color: 'var(--t-2)', marginTop: 4, fontWeight: 500 }}>{step.name}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                      {fermSteps.map(step => (
                        <div key={step.id} style={{
                          display: 'grid', gridTemplateColumns: '1fr 80px 80px auto',
                          gap: 8, alignItems: 'center',
                          padding: '10px 12px', borderRadius: 'var(--r-md)',
                          background: 'var(--surface-2)', border: '1px solid var(--hairline)',
                        }}>
                          <Input placeholder="Название стадии" value={step.name} onChange={e => updateFermStep(step.id, 'name', e.target.value)} />
                          <Input type="number" suffix="°C" step={1} value={step.temp} onChange={e => updateFermStep(step.id, 'temp', +e.target.value)} />
                          <Input type="number" suffix="дн" step={1} value={step.days} onChange={e => updateFermStep(step.id, 'days', +e.target.value)} />
                          <button type="button" onClick={() => removeFermStep(step.id)}
                            style={{ width: 32, height: 32, borderRadius: 8, background: 'transparent', border: '1px solid var(--hairline)', cursor: 'pointer', color: 'var(--t-4)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <Trash2 size={12} />
                          </button>
                        </div>
                      ))}
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 14, padding: '10px 14px', borderRadius: 'var(--r-md)', background: 'var(--surface-2)', border: '1px solid var(--hairline)' }}>
                      <Wind size={13} style={{ color: 'var(--t-3)' }} />
                      <p style={{ fontSize: 12.5, color: 'var(--t-2)', flex: 1 }}>Целевая карбонизация</p>
                      <Input type="number" step={0.1} suffix="vol CO₂" min={0} max={6} value={carbonation}
                        onChange={e => setCarbonation(+e.target.value)}
                        style={{ width: 130 }} />
                    </div>
                  </section>
                </div>
              )}

              {/* ── WATER ── */}
              {tab === 'water' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <Droplets size={13} style={{ color: 'var(--info)' }} />
                    <p className="t-eyebrow">Профиль воды (мг/л)</p>
                  </div>
                  {/* Water profile presets */}
                  <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                    {([
                      { name: 'Dublin (Stout)', ca: 118, mg: 4, na: 12, cl: 19, so4: 54, hco3: 319 },
                      { name: 'Burton (Pale Ale)', ca: 352, mg: 24, na: 54, cl: 16, so4: 820, hco3: 320 },
                      { name: 'Pilsen (Pils)', ca: 10, mg: 3, na: 3, cl: 4, so4: 4, hco3: 31 },
                      { name: 'Мягкая', ca: 40, mg: 10, na: 10, cl: 40, so4: 40, hco3: 100 },
                    ] as const).map(p => (
                      <button key={p.name} type="button" className="btn btn-sm btn-ghost"
                        onClick={() => setWater({ ca: p.ca, mg: p.mg, na: p.na, cl: p.cl, so4: p.so4, hco3: p.hco3 })}>
                        {p.name}
                      </button>
                    ))}
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10 }}>
                    {([
                      { key: 'ca',  label: 'Ca²⁺',   ideal: '50–150', color: '#fbbf24' },
                      { key: 'mg',  label: 'Mg²⁺',   ideal: '5–25',   color: '#60a5fa' },
                      { key: 'na',  label: 'Na⁺',    ideal: '0–50',   color: '#a78bfa' },
                      { key: 'cl',  label: 'Cl⁻',    ideal: '0–150',  color: '#34d399' },
                      { key: 'so4', label: 'SO₄²⁻',  ideal: '0–400',  color: '#f97316' },
                      { key: 'hco3',label: 'HCO₃⁻',  ideal: '0–200',  color: '#94a3b8' },
                    ] as const).map(ion => (
                      <Field key={ion.key} label={ion.label} hint={`Цель: ${ion.ideal}`}>
                        <div style={{ position: 'relative' }}>
                          <div style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', width: 8, height: 8, borderRadius: 2, background: ion.color }} />
                          <Input type="number" min={0} step={1} suffix="мг/л"
                            value={water[ion.key]}
                            onChange={e => setWater(prev => ({ ...prev, [ion.key]: +e.target.value }))}
                            style={{ paddingLeft: 26 }}
                          />
                        </div>
                      </Field>
                    ))}
                  </div>
                  {/* Cl:SO4 ratio */}
                  <div style={{ padding: '12px 14px', borderRadius: 'var(--r-md)', background: 'var(--surface-2)', border: '1px solid var(--hairline)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                      <span style={{ fontSize: 12.5, color: 'var(--t-2)' }}>Cl⁻ : SO₄²⁻ (баланс хмель/солод)</span>
                      <span className="t-mono" style={{ fontSize: 13, fontWeight: 600, color: 'var(--accent)' }}>
                        {water.cl > 0 && water.so4 > 0 ? `${(water.cl / water.so4).toFixed(2)} : 1` : '—'}
                      </span>
                    </div>
                    <div className="progress" style={{ height: 5 }}>
                      <div className="progress-bar" style={{
                        width: `${Math.min(100, (water.cl / (water.cl + water.so4)) * 100)}%`,
                        background: 'linear-gradient(90deg, #34d399, #60a5fa)',
                      }} />
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 4 }}>
                      <span style={{ fontSize: 9.5, color: 'var(--t-4)' }}>Солодовый</span>
                      <span style={{ fontSize: 9.5, color: 'var(--t-4)' }}>Хмелевой</span>
                    </div>
                  </div>
                </div>
              )}

              {/* ── NOTES ── */}
              {tab === 'notes' && (
                <Field label="Заметки пивовара">
                  <textarea className="textarea" rows={10}
                    placeholder="Личные заметки, технологические особенности, изменения относительно базового рецепта..." />
                </Field>
              )}
            </div>
          </Card>
        </div>

        {/* Right — stats */}
        <div>
          <div style={{ position: 'sticky', top: 80 }}>
            <RecipeStatsPanel stats={stats} category={category} bjcpStyle={bjcpStyle} />
          </div>
        </div>
      </div>

      {/* Style picker modal */}
      {showStylePicker && (
        <StylePicker
          category={category}
          onSelect={(s, id) => { setStyle(s); if (id) setStyleId(id) }}
          onClose={() => setShowStylePicker(false)}
        />
      )}
    </Page>
  )
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function IngredientSection({ title, onAdd, hasItems, empty, children }: {
  title: string; onAdd: () => void; hasItems: boolean; empty: string; children: React.ReactNode
}) {
  return (
    <section>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
        <p className="t-eyebrow">{title}</p>
        <Button size="sm" variant="ghost" onClick={onAdd}><Plus size={12} />Добавить</Button>
      </div>
      {!hasItems && <p style={{ fontSize: 12.5, color: 'var(--t-3)', textAlign: 'center', padding: '12px 0' }}>{empty}</p>}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>{children}</div>
    </section>
  )
}

function RowGrid({ children }: { children: React.ReactNode }) {
  return (
    <div style={{
      display: 'grid', gridTemplateColumns: 'repeat(12, 1fr)', gap: 6,
      padding: 10, borderRadius: 'var(--r-md)',
      background: 'var(--surface-1)', border: '1px solid var(--hairline)', alignItems: 'center',
    }}>{children}</div>
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
      <button type="button" onClick={onClick}
        style={{
          width: 32, height: 32, borderRadius: 8,
          background: 'rgba(248,113,113,0.08)', border: '1px solid rgba(248,113,113,0.2)',
          color: '#fca5a5', display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
          cursor: 'pointer',
        }}
      ><Trash2 size={13} /></button>
    </div>
  )
}

function ColumnsHeader({ cols }: { cols: { span: number; label: string }[] }) {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(12, 1fr)', gap: 6, padding: '0 10px' }}>
      {cols.map((c, i) => (
        <div key={i} className="t-eyebrow" style={{ gridColumn: `span ${c.span}`, fontSize: 9.5 }}>{c.label}</div>
      ))}
    </div>
  )
}
