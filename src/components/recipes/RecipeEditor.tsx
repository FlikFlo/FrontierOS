'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Plus, Trash2, FlaskConical, Droplets, Clock, Percent } from 'lucide-react'
import type { BeverageCategory, RecipeMalt, RecipeHop, RecipeYeast, RecipeAdjunct } from '@/types/database'
import { BEVERAGE_CATEGORIES } from '@/types/database'
import { calcUniversalStats } from '@/lib/beverage-calc'
import { COMMON_MALTS, COMMON_HOPS, COMMON_YEASTS } from '@/lib/beer-calc'
import { COMMON_ADJUNCTS } from '@/lib/beverage-calc'
import { saveRecipe } from '@/app/actions/recipes'
import RecipeStatsPanel from './RecipeStatsPanel'

const uid = () => Math.random().toString(36).slice(2)

const isBeerLike = (c: BeverageCategory) => c === 'beer' || c === 'kvass'
const hasAlcohol = (c: BeverageCategory) => !['lemonade'].includes(c)
const hasMash = (c: BeverageCategory) => c === 'beer' || c === 'kvass'

export default function RecipeEditor() {
  const router = useRouter()

  // Base info
  const [name, setName] = useState('')
  const [category, setCategory] = useState<BeverageCategory>('beer')
  const [style, setStyle] = useState('')
  const [description, setDescription] = useState('')
  const [batchSize, setBatchSize] = useState(25)
  const [efficiency, setEfficiency] = useState(75)
  const [boilTime, setBoilTime] = useState(60)

  // Ingredients
  const [malts, setMalts] = useState<RecipeMalt[]>([])
  const [hops, setHops] = useState<RecipeHop[]>([])
  const [yeasts, setYeasts] = useState<RecipeYeast[]>([])
  const [adjuncts, setAdjuncts] = useState<RecipeAdjunct[]>([])
  const [notes, setNotes] = useState('')

  // Active tab
  const [activeTab, setActiveTab] = useState<'ingredients' | 'process' | 'notes'>('ingredients')

  // Save state
  const [isPending, startTransition] = useTransition()
  const [errorMsg, setErrorMsg] = useState<string | null>(null)

  const onSave = () => {
    setErrorMsg(null)
    if (!name.trim()) {
      setErrorMsg('Укажите название рецепта')
      return
    }
    startTransition(async () => {
      const res = await saveRecipe({
        name: name.trim(),
        category,
        style: style.trim(),
        description: description.trim() || null,
        batch_size_l: batchSize,
        efficiency,
        boil_time_min: boilTime,
        notes: notes.trim() || null,
        og_target: stats.og,
        fg_target: stats.fg,
        abv_target: stats.abv,
        ibu_target: stats.ibu,
        srm_target: stats.srm,
        brix_target: stats.brix,
        ph_target: null,
        malts, hops, yeasts, adjuncts,
      })
      if (!res.ok) {
        setErrorMsg(res.error)
        return
      }
      router.push(`/recipes/${res.id}`)
    })
  }

  // Stats (recalculated live)
  const stats = calcUniversalStats(category, malts, hops, yeasts, adjuncts, batchSize, efficiency, boilTime)

  // ── Malts ──────────────────────────────────────────────────────────────────
  const addMalt = () => setMalts(prev => [...prev, { id: uid(), name: '', amount_kg: 1, color_ebc: 5, extract_potential: 78 }])
  const updateMalt = (id: string, field: keyof RecipeMalt, value: string | number) =>
    setMalts(prev => prev.map(m => m.id === id ? { ...m, [field]: value } : m))
  const removeMalt = (id: string) => setMalts(prev => prev.filter(m => m.id !== id))

  const applyMaltPreset = (id: string, presetName: string) => {
    const preset = COMMON_MALTS.find(m => m.name === presetName)
    if (!preset) return
    setMalts(prev => prev.map(m => m.id === id ? { ...m, name: preset.name, color_ebc: preset.color_ebc, extract_potential: preset.extract_potential } : m))
  }

  // ── Hops ───────────────────────────────────────────────────────────────────
  const addHop = () => setHops(prev => [...prev, { id: uid(), name: '', amount_g: 20, alpha_acid: 8, use: 'bittering', time_min: 60 }])
  const updateHop = (id: string, field: keyof RecipeHop, value: string | number) =>
    setHops(prev => prev.map(h => h.id === id ? { ...h, [field]: value } : h))
  const removeHop = (id: string) => setHops(prev => prev.filter(h => h.id !== id))

  // ── Yeasts ─────────────────────────────────────────────────────────────────
  const addYeast = () => setYeasts(prev => [...prev, { id: uid(), name: '', brand: '', attenuation: 75, temp_min: 18, temp_max: 24 }])
  const updateYeast = (id: string, field: keyof RecipeYeast, value: string | number) =>
    setYeasts(prev => prev.map(y => y.id === id ? { ...y, [field]: value } : y))
  const removeYeast = (id: string) => setYeasts(prev => prev.filter(y => y.id !== id))

  const applyYeastPreset = (id: string, presetName: string) => {
    const preset = COMMON_YEASTS.find(y => y.name === presetName)
    if (!preset) return
    setYeasts(prev => prev.map(y => y.id === id ? { ...y, ...preset, id } : y))
  }

  // ── Adjuncts ───────────────────────────────────────────────────────────────
  const addAdjunct = () => setAdjuncts(prev => [...prev, { id: uid(), name: '', amount: 1, unit: 'kg', use: '', time_min: null, sugar_content: null }])
  const updateAdjunct = (id: string, field: keyof RecipeAdjunct, value: string | number | null) =>
    setAdjuncts(prev => prev.map(a => a.id === id ? { ...a, [field]: value } : a))
  const removeAdjunct = (id: string) => setAdjuncts(prev => prev.filter(a => a.id !== id))

  const hopUseLabels: Record<string, string> = {
    bittering: 'Горечь', flavor: 'Вкус', aroma: 'Аромат', whirlpool: 'Вирпул', dry_hop: 'Сухое охмеление'
  }

  return (
    <div className="max-w-7xl mx-auto fade-in">
      <div className="flex items-center gap-4 mb-6">
        <button onClick={() => router.back()} className="btn-glass px-3 py-2 text-sm">← Назад</button>
        <div>
          <h1 className="text-xl font-bold text-white">Новый рецепт</h1>
          <p className="text-sm text-white/40">Заполните параметры — калькулятор считает в реальном времени</p>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">

        {/* Left: Form */}
        <div className="xl:col-span-2 space-y-4">

          {/* Base info */}
          <div className="glass p-6 space-y-4">
            <h2 className="font-semibold text-white flex items-center gap-2 text-sm mb-4">
              <FlaskConical size={16} className="text-amber-400" />
              Основная информация
            </h2>

            {/* Category picker */}
            <div>
              <label className="block text-xs text-white/40 mb-2 uppercase tracking-wider">Тип напитка</label>
              <div className="flex flex-wrap gap-2">
                {BEVERAGE_CATEGORIES.map(cat => (
                  <button
                    key={cat.value}
                    onClick={() => setCategory(cat.value)}
                    className={`px-3 py-1.5 rounded-xl text-sm font-medium border transition-all duration-150 ${
                      category === cat.value
                        ? 'bg-amber-500/20 border-amber-500/40 text-amber-300'
                        : 'bg-white/5 border-white/10 text-white/50 hover:text-white/80 hover:bg-white/10'
                    }`}
                  >
                    {cat.emoji} {cat.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs text-white/40 mb-1.5 uppercase tracking-wider">Название рецепта *</label>
                <input className="glass-input" placeholder="Например: West Coast IPA" value={name} onChange={e => setName(e.target.value)} />
              </div>
              <div>
                <label className="block text-xs text-white/40 mb-1.5 uppercase tracking-wider">Стиль / подвид</label>
                <input className="glass-input" placeholder="American IPA, Kombucha с манго..." value={style} onChange={e => setStyle(e.target.value)} />
              </div>
            </div>

            <div>
              <label className="block text-xs text-white/40 mb-1.5 uppercase tracking-wider">Описание</label>
              <textarea className="glass-input resize-none h-20" placeholder="Описание рецепта..." value={description} onChange={e => setDescription(e.target.value)} />
            </div>

            {/* Batch params */}
            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="block text-xs text-white/40 mb-1.5 uppercase tracking-wider flex items-center gap-1">
                  <Droplets size={11} /> Объём (л)
                </label>
                <input type="number" className="glass-input" value={batchSize} onChange={e => setBatchSize(+e.target.value)} min={1} max={10000} />
              </div>
              {hasMash(category) && (
                <div>
                  <label className="block text-xs text-white/40 mb-1.5 uppercase tracking-wider flex items-center gap-1">
                    <Percent size={11} /> КПД затирания %
                  </label>
                  <input type="number" className="glass-input" value={efficiency} onChange={e => setEfficiency(+e.target.value)} min={1} max={100} />
                </div>
              )}
              {(isBeerLike(category) || category === 'mead') && (
                <div>
                  <label className="block text-xs text-white/40 mb-1.5 uppercase tracking-wider flex items-center gap-1">
                    <Clock size={11} /> Кипячение (мин)
                  </label>
                  <input type="number" className="glass-input" value={boilTime} onChange={e => setBoilTime(+e.target.value)} min={0} max={300} />
                </div>
              )}
            </div>
          </div>

          {/* Ingredient tabs */}
          <div className="glass">
            {/* Tab bar */}
            <div className="flex border-b border-white/10">
              {([
                { key: 'ingredients', label: 'Ингредиенты' },
                { key: 'process',     label: 'Процесс' },
                { key: 'notes',       label: 'Заметки' },
              ] as const).map(tab => (
                <button
                  key={tab.key}
                  onClick={() => setActiveTab(tab.key)}
                  className={`px-5 py-3 text-sm font-medium border-b-2 transition-colors ${
                    activeTab === tab.key
                      ? 'border-amber-400 text-amber-300'
                      : 'border-transparent text-white/40 hover:text-white/70'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            <div className="p-6 space-y-6">
              {activeTab === 'ingredients' && (
                <>
                  {/* MALTS (beer/kvass) */}
                  {hasMash(category) && (
                    <section>
                      <div className="flex items-center justify-between mb-3">
                        <h3 className="text-sm font-semibold text-white/80">Солод / зерно</h3>
                        <button className="btn-glass py-1.5 px-3 text-xs" onClick={addMalt}>
                          <Plus size={13} /> Добавить
                        </button>
                      </div>
                      {malts.length === 0 && (
                        <p className="text-sm text-white/30 text-center py-4">Нет солода — нажмите «Добавить»</p>
                      )}
                      <div className="space-y-2">
                        {malts.map(malt => (
                          <div key={malt.id} className="glass-sm p-3 grid grid-cols-12 gap-2 items-center">
                            <div className="col-span-5">
                              <select
                                className="glass-input text-sm py-2"
                                value={malt.name}
                                onChange={e => { updateMalt(malt.id, 'name', e.target.value); applyMaltPreset(malt.id, e.target.value) }}
                              >
                                <option value="">— выберите солод —</option>
                                {COMMON_MALTS.map(m => <option key={m.name} value={m.name}>{m.name}</option>)}
                              </select>
                            </div>
                            <div className="col-span-2">
                              <input type="number" className="glass-input text-sm py-2" placeholder="кг" step="0.1" min="0"
                                value={malt.amount_kg} onChange={e => updateMalt(malt.id, 'amount_kg', +e.target.value)} />
                            </div>
                            <div className="col-span-2">
                              <input type="number" className="glass-input text-sm py-2" placeholder="EBC" step="1" min="0"
                                value={malt.color_ebc} onChange={e => updateMalt(malt.id, 'color_ebc', +e.target.value)} />
                            </div>
                            <div className="col-span-2">
                              <input type="number" className="glass-input text-sm py-2" placeholder="%" step="0.5" min="0" max="100"
                                value={malt.extract_potential} onChange={e => updateMalt(malt.id, 'extract_potential', +e.target.value)} />
                            </div>
                            <div className="col-span-1 flex justify-end">
                              <button className="btn-danger p-1.5 rounded-lg text-xs" onClick={() => removeMalt(malt.id)}><Trash2 size={13} /></button>
                            </div>
                          </div>
                        ))}
                        {malts.length > 0 && (
                          <div className="grid grid-cols-12 gap-2 px-3 text-[10px] text-white/30 uppercase tracking-wider">
                            <div className="col-span-5">Наименование</div>
                            <div className="col-span-2">Кол-во, кг</div>
                            <div className="col-span-2">Цвет, EBC</div>
                            <div className="col-span-2">Экстракт, %</div>
                          </div>
                        )}
                      </div>
                    </section>
                  )}

                  {/* HOPS (beer) */}
                  {category === 'beer' && (
                    <section>
                      <div className="flex items-center justify-between mb-3">
                        <h3 className="text-sm font-semibold text-white/80">Хмель</h3>
                        <button className="btn-glass py-1.5 px-3 text-xs" onClick={addHop}>
                          <Plus size={13} /> Добавить
                        </button>
                      </div>
                      {hops.length === 0 && (
                        <p className="text-sm text-white/30 text-center py-4">Хмель не добавлен</p>
                      )}
                      <div className="space-y-2">
                        {hops.map(hop => (
                          <div key={hop.id} className="glass-sm p-3 grid grid-cols-12 gap-2 items-center">
                            <div className="col-span-3">
                              <select className="glass-input text-sm py-2" value={hop.name}
                                onChange={e => {
                                  const preset = COMMON_HOPS.find(h => h.name === e.target.value)
                                  updateHop(hop.id, 'name', e.target.value)
                                  if (preset) updateHop(hop.id, 'alpha_acid', preset.alpha_acid)
                                }}>
                                <option value="">— хмель —</option>
                                {COMMON_HOPS.map(h => <option key={h.name} value={h.name}>{h.name}</option>)}
                              </select>
                            </div>
                            <div className="col-span-2">
                              <input type="number" className="glass-input text-sm py-2" placeholder="г" step="5" min="0"
                                value={hop.amount_g} onChange={e => updateHop(hop.id, 'amount_g', +e.target.value)} />
                            </div>
                            <div className="col-span-1">
                              <input type="number" className="glass-input text-sm py-2" placeholder="α%" step="0.5" min="0"
                                value={hop.alpha_acid} onChange={e => updateHop(hop.id, 'alpha_acid', +e.target.value)} />
                            </div>
                            <div className="col-span-3">
                              <select className="glass-input text-sm py-2" value={hop.use} onChange={e => updateHop(hop.id, 'use', e.target.value as RecipeHop['use'])}>
                                {Object.entries(hopUseLabels).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
                              </select>
                            </div>
                            <div className="col-span-2">
                              <input type="number" className="glass-input text-sm py-2" placeholder="мин" step="5" min="0"
                                value={hop.time_min} onChange={e => updateHop(hop.id, 'time_min', +e.target.value)} />
                            </div>
                            <div className="col-span-1 flex justify-end">
                              <button className="btn-danger p-1.5 rounded-lg" onClick={() => removeHop(hop.id)}><Trash2 size={13} /></button>
                            </div>
                          </div>
                        ))}
                        {hops.length > 0 && (
                          <div className="grid grid-cols-12 gap-2 px-3 text-[10px] text-white/30 uppercase tracking-wider">
                            <div className="col-span-3">Хмель</div>
                            <div className="col-span-2">Кол-во, г</div>
                            <div className="col-span-1">α%</div>
                            <div className="col-span-3">Применение</div>
                            <div className="col-span-2">Время, мин</div>
                          </div>
                        )}
                      </div>
                    </section>
                  )}

                  {/* YEASTS (fermented) */}
                  {hasAlcohol(category) && (
                    <section>
                      <div className="flex items-center justify-between mb-3">
                        <h3 className="text-sm font-semibold text-white/80">
                          {category === 'kombucha' ? 'SCOBY / культура' : 'Дрожжи'}
                        </h3>
                        <button className="btn-glass py-1.5 px-3 text-xs" onClick={addYeast}>
                          <Plus size={13} /> Добавить
                        </button>
                      </div>
                      <div className="space-y-2">
                        {yeasts.map(yeast => (
                          <div key={yeast.id} className="glass-sm p-3 grid grid-cols-12 gap-2 items-center">
                            <div className="col-span-4">
                              <select className="glass-input text-sm py-2" value={yeast.name}
                                onChange={e => applyYeastPreset(yeast.id, e.target.value)}>
                                <option value="">— дрожжи —</option>
                                {COMMON_YEASTS.map(y => <option key={y.name} value={y.name}>{y.name} ({y.brand})</option>)}
                              </select>
                            </div>
                            <div className="col-span-2">
                              <input type="number" className="glass-input text-sm py-2" placeholder="Сбраживание %"
                                value={yeast.attenuation} onChange={e => updateYeast(yeast.id, 'attenuation', +e.target.value)} min={0} max={100} />
                            </div>
                            <div className="col-span-2">
                              <input type="number" className="glass-input text-sm py-2" placeholder="Мин °C"
                                value={yeast.temp_min} onChange={e => updateYeast(yeast.id, 'temp_min', +e.target.value)} />
                            </div>
                            <div className="col-span-2">
                              <input type="number" className="glass-input text-sm py-2" placeholder="Макс °C"
                                value={yeast.temp_max} onChange={e => updateYeast(yeast.id, 'temp_max', +e.target.value)} />
                            </div>
                            <div className="col-span-2 flex justify-end">
                              <button className="btn-danger p-1.5 rounded-lg" onClick={() => removeYeast(yeast.id)}><Trash2 size={13} /></button>
                            </div>
                          </div>
                        ))}
                        {yeasts.length > 0 && (
                          <div className="grid grid-cols-12 gap-2 px-3 text-[10px] text-white/30 uppercase tracking-wider">
                            <div className="col-span-4">Штамм</div>
                            <div className="col-span-2">Сбражив. %</div>
                            <div className="col-span-2">T мин °C</div>
                            <div className="col-span-2">T макс °C</div>
                          </div>
                        )}
                      </div>
                    </section>
                  )}

                  {/* ADJUNCTS */}
                  <section>
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="text-sm font-semibold text-white/80">Добавки / ингредиенты</h3>
                      <button className="btn-glass py-1.5 px-3 text-xs" onClick={addAdjunct}>
                        <Plus size={13} /> Добавить
                      </button>
                    </div>
                    {adjuncts.length === 0 && (
                      <p className="text-sm text-white/30 text-center py-4">
                        {category === 'lemonade' ? 'Добавьте сахар, соки, кислоты...' :
                         category === 'kombucha' ? 'Добавьте чай, сахар, флавуринг...' :
                         category === 'mead' ? 'Добавьте мёд, специи, фрукты...' :
                         'Сахар, фрукты, специи...'}
                      </p>
                    )}

                    {/* Quick-add buttons for category */}
                    {adjuncts.length === 0 && (
                      <div className="flex flex-wrap gap-2 mt-2">
                        {(category === 'kombucha' ? ['Чай чёрный (листовой)', 'Сахар-песок (сахароза)'] :
                          category === 'lemonade' ? ['Сахар-песок (сахароза)', 'Лимонный сок'] :
                          category === 'mead' ? ['Мёд'] :
                          category === 'cider' ? ['Яблочный сок'] :
                          category === 'ginger_beer' ? ['Имбирь тёртый', 'Сахар-песок (сахароза)', 'Лимонный сок'] : []
                        ).map(preset => (
                          <button key={preset} onClick={() => {
                            const allAdjuncts = Object.values(COMMON_ADJUNCTS).flat()
                            const found = allAdjuncts.find(a => a.name === preset)
                            if (found) {
                              setAdjuncts(prev => [...prev, { id: uid(), name: found.name, amount: 1, unit: found.unit, use: '', time_min: null, sugar_content: found.sugar_content }])
                            }
                          }} className="badge badge-blue cursor-pointer hover:bg-blue-400/20">+ {preset}</button>
                        ))}
                      </div>
                    )}

                    <div className="space-y-2 mt-2">
                      {adjuncts.map(adj => (
                        <div key={adj.id} className="glass-sm p-3 grid grid-cols-12 gap-2 items-center">
                          <div className="col-span-4">
                            <input className="glass-input text-sm py-2" placeholder="Название ингредиента"
                              value={adj.name} onChange={e => updateAdjunct(adj.id, 'name', e.target.value)} />
                          </div>
                          <div className="col-span-2">
                            <input type="number" className="glass-input text-sm py-2" placeholder="Кол-во" step="0.1"
                              value={adj.amount} onChange={e => updateAdjunct(adj.id, 'amount', +e.target.value)} />
                          </div>
                          <div className="col-span-2">
                            <select className="glass-input text-sm py-2" value={adj.unit} onChange={e => updateAdjunct(adj.id, 'unit', e.target.value)}>
                              {['kg', 'g', 'L', 'ml', 'шт', 'ст.л', 'ч.л'].map(u => <option key={u} value={u}>{u}</option>)}
                            </select>
                          </div>
                          <div className="col-span-2">
                            <input className="glass-input text-sm py-2" placeholder="Применение"
                              value={adj.use} onChange={e => updateAdjunct(adj.id, 'use', e.target.value)} />
                          </div>
                          <div className="col-span-2 flex justify-end gap-1">
                            <input type="number" className="glass-input text-sm py-2 w-16" placeholder="Сахар%"
                              value={adj.sugar_content ?? ''} onChange={e => updateAdjunct(adj.id, 'sugar_content', e.target.value ? +e.target.value : null)} />
                            <button className="btn-danger p-1.5 rounded-lg" onClick={() => removeAdjunct(adj.id)}><Trash2 size={13} /></button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </section>
                </>
              )}

              {activeTab === 'process' && (
                <div className="text-sm text-white/50 text-center py-8">
                  Шаги процесса будут добавлены после сохранения рецепта
                </div>
              )}

              {activeTab === 'notes' && (
                <div>
                  <label className="block text-xs text-white/40 mb-2 uppercase tracking-wider">Заметки пивовара</label>
                  <textarea
                    className="glass-input resize-none h-40 text-sm"
                    placeholder="Личные заметки, наблюдения, изменения..."
                    value={notes}
                    onChange={e => setNotes(e.target.value)}
                  />
                </div>
              )}
            </div>
          </div>

          {/* Save */}
          {errorMsg && (
            <div className="glass-sm p-3 border border-red-500/30 bg-red-500/5 text-sm text-red-300">
              {errorMsg}
            </div>
          )}
          <div className="flex gap-3">
            <button
              type="button"
              className="btn-primary flex-1 justify-center py-3 text-base font-semibold disabled:opacity-50"
              onClick={onSave}
              disabled={isPending}
            >
              {isPending ? 'Сохранение...' : 'Сохранить рецепт'}
            </button>
            <button
              type="button"
              className="btn-glass py-3 px-6"
              onClick={() => router.back()}
              disabled={isPending}
            >
              Отмена
            </button>
          </div>
        </div>

        {/* Right: Stats Panel */}
        <div className="xl:col-span-1">
          <div className="sticky top-20">
            <RecipeStatsPanel
              stats={stats}
              category={category}
              style={style}
              malts={malts}
              hops={hops}
              adjuncts={adjuncts}
              yeastAttenuation={yeasts[0]?.attenuation}
            />
          </div>
        </div>
      </div>
    </div>
  )
}
