'use client'

import { useState, useMemo } from 'react'
import {
  Calculator, Droplets, Wind, FlaskConical, TestTube, Beaker, Sparkles,
} from 'lucide-react'
import {
  brixToSG, sgToBrix, calcABV, calcOGFromSugar,
  correctSGforTemp, refractometerFG,
  calcPrimingSugar, calcResidualCO2, calcKegPressure,
  PRIMING_SUGAR_LABELS, type PrimingSugarType, TARGET_CO2_VOLUMES,
  calcStrikeTemp, calcSpargeWater,
  analyzeWater, applySaltAddition, BREWING_SALTS, DEFAULT_WATER_PROFILES, type WaterProfile,
  calcKombucha, calcLemonade, calcMeadOG, calcCiderOG, calcKvassStats,
  calcFG,
} from '@/lib/beverage-calc'

type TabKey = 'density' | 'carb' | 'refrac' | 'mash' | 'water' | 'quick'

const TABS: { key: TabKey; label: string; icon: typeof Calculator }[] = [
  { key: 'density', label: 'Плотность',     icon: Droplets },
  { key: 'carb',    label: 'Карбонизация',   icon: Wind     },
  { key: 'refrac',  label: 'Рефрактометр',   icon: TestTube },
  { key: 'mash',    label: 'Затирание',      icon: FlaskConical },
  { key: 'water',   label: 'Вода',           icon: Beaker   },
  { key: 'quick',   label: 'Быстрый расчёт', icon: Sparkles },
]

export default function CalculatorPage() {
  const [tab, setTab] = useState<TabKey>('density')

  return (
    <div className="max-w-7xl mx-auto space-y-6 fade-in">
      <div>
        <h1 className="text-xl font-bold text-white flex items-center gap-2">
          <Calculator size={20} className="text-amber-400" />
          Калькулятор пивовара
        </h1>
        <p className="text-sm text-white/40 mt-0.5">
          Все расчёты для варки и контроля брожения в одном месте
        </p>
      </div>

      {/* Tabs */}
      <div className="glass-nav p-1 rounded-2xl flex flex-wrap gap-1">
        {TABS.map(({ key, label, icon: Icon }) => {
          const active = tab === key
          return (
            <button
              key={key}
              onClick={() => setTab(key)}
              className={`
                flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium
                transition-all duration-200
                ${active
                  ? 'bg-gradient-to-r from-amber-500/20 to-orange-500/10 text-amber-300 border border-amber-500/20'
                  : 'text-white/50 hover:text-white/90 hover:bg-white/5'}
              `}
            >
              <Icon size={14} />
              {label}
            </button>
          )
        })}
      </div>

      <div className="fade-in">
        {tab === 'density' && <DensityTab />}
        {tab === 'carb'    && <CarbonationTab />}
        {tab === 'refrac'  && <RefractometerTab />}
        {tab === 'mash'    && <MashTab />}
        {tab === 'water'   && <WaterTab />}
        {tab === 'quick'   && <QuickTab />}
      </div>
    </div>
  )
}

// ─── shared atoms ───────────────────────────────────────────────────────────

function Field({
  label, value, onChange, suffix, step = 1, type = 'number',
}: {
  label: string
  value: number | string
  onChange: (v: number) => void
  suffix?: string
  step?: number
  type?: 'number'
}) {
  return (
    <label className="block">
      <span className="text-xs text-white/50 uppercase tracking-wide">{label}</span>
      <div className="relative mt-1">
        <input
          type={type}
          step={step}
          value={value}
          onChange={(e) => onChange(parseFloat(e.target.value) || 0)}
          className="glass-input w-full pr-12"
        />
        {suffix && (
          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-white/40">{suffix}</span>
        )}
      </div>
    </label>
  )
}

function ResultRow({ label, value, sub, color }: { label: string; value: string; sub?: string; color?: string }) {
  return (
    <div className="flex items-center justify-between py-2.5 border-b border-white/5 last:border-0">
      <span className="text-sm text-white/50">{label}</span>
      <div className="text-right">
        <span className={`text-sm font-semibold ${color ?? 'text-white'}`}>{value}</span>
        {sub && <p className="text-[10px] text-white/30">{sub}</p>}
      </div>
    </div>
  )
}

function Card({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="glass p-5">
      <h3 className="text-xs font-semibold text-white/50 uppercase tracking-wider mb-4">{title}</h3>
      {children}
    </div>
  )
}

function TwoCol({ children }: { children: React.ReactNode }) {
  return <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">{children}</div>
}

// ─── 1. DENSITY / BRIX / ABV / TEMP CORRECTION ──────────────────────────────

function DensityTab() {
  const [brix, setBrix] = useState(12)
  const [sg, setSg] = useState(1.048)
  const [og, setOg] = useState(1.060)
  const [fg, setFg] = useState(1.012)
  const [sgMeas, setSgMeas] = useState(1.060)
  const [tSample, setTSample] = useState(30)
  const [tCalib, setTCalib] = useState(20)
  const [sugarG, setSugarG] = useState(1000)
  const [volL, setVolL] = useState(20)

  const sgFromBrix = brixToSG(brix)
  const brixFromSg = sgToBrix(sg)
  const abv = calcABV(og, fg)
  const attenuation = og > 1 ? Math.round(((og - fg) / (og - 1)) * 1000) / 10 : 0
  const corrected = correctSGforTemp(sgMeas, tSample, tCalib)
  const ogFromSugar = calcOGFromSugar(sugarG, volL)

  return (
    <TwoCol>
      <div className="space-y-6">
        <Card title="Brix ↔ SG (плотность)">
          <div className="grid grid-cols-2 gap-3 mb-3">
            <Field label="Brix" value={brix} onChange={setBrix} suffix="°Bx" step={0.1} />
            <Field label="SG (плотность)" value={sg} onChange={setSg} step={0.001} />
          </div>
          <ResultRow label="Brix → SG"  value={sgFromBrix.toFixed(4)} color="text-amber-300" />
          <ResultRow label="SG → Brix"  value={`${brixFromSg.toFixed(2)} °Bx`} color="text-amber-300" />
        </Card>

        <Card title="ABV — алкоголь из OG/FG">
          <div className="grid grid-cols-2 gap-3 mb-3">
            <Field label="OG" value={og} onChange={setOg} step={0.001} />
            <Field label="FG" value={fg} onChange={setFg} step={0.001} />
          </div>
          <ResultRow label="ABV"            value={`${abv.toFixed(2)} %`}    color="text-blue-300" />
          <ResultRow label="Аттенюация"     value={`${attenuation.toFixed(1)} %`} sub="процент сбраживания" />
          <ResultRow label="Точек ферм." value={`${Math.round((og - fg) * 1000)}`} sub="SG points" />
        </Card>
      </div>

      <div className="space-y-6">
        <Card title="Температурная коррекция ареометра">
          <p className="text-[11px] text-white/30 mb-3">
            Если плотность мерили не при калибровочной температуре — скорректируй.
          </p>
          <div className="grid grid-cols-3 gap-3 mb-3">
            <Field label="SG измер." value={sgMeas} onChange={setSgMeas} step={0.001} />
            <Field label="T образца" value={tSample} onChange={setTSample} suffix="°C" />
            <Field label="T калибр." value={tCalib} onChange={setTCalib} suffix="°C" />
          </div>
          <ResultRow
            label="Скорректированная SG"
            value={corrected.toFixed(4)}
            color="text-emerald-300"
            sub={`Δ = ${((corrected - sgMeas) * 1000).toFixed(1)} pts`}
          />
        </Card>

        <Card title="OG из растворённого сахара">
          <p className="text-[11px] text-white/30 mb-3">
            Сколько SG даст N грамм сахара в M литров жидкости (для медовухи / квас / сидра).
          </p>
          <div className="grid grid-cols-2 gap-3 mb-3">
            <Field label="Сахар" value={sugarG} onChange={setSugarG} suffix="г" />
            <Field label="Объём" value={volL} onChange={setVolL} suffix="л" />
          </div>
          <ResultRow label="OG"   value={ogFromSugar.toFixed(4)} color="text-amber-300" />
          <ResultRow label="Brix" value={`${sgToBrix(ogFromSugar).toFixed(1)} °Bx`} />
          <ResultRow
            label="ABV (если сбродит на 75%)"
            value={`${calcABV(ogFromSugar, calcFG(ogFromSugar, 75)).toFixed(2)} %`}
            color="text-blue-300"
          />
        </Card>
      </div>
    </TwoCol>
  )
}

// ─── 2. CARBONATION ─────────────────────────────────────────────────────────

function CarbonationTab() {
  const [batchL, setBatchL] = useState(20)
  const [targetCO2, setTargetCO2] = useState(2.4)
  const [maxFermT, setMaxFermT] = useState(20)
  const [sugarType, setSugarType] = useState<PrimingSugarType>('sucrose')

  const [kegT, setKegT] = useState(4)
  const [kegCO2, setKegCO2] = useState(2.4)

  const priming = calcPrimingSugar(batchL, targetCO2, maxFermT, sugarType)
  const psi = calcKegPressure(kegCO2, kegT)
  const residual = calcResidualCO2(maxFermT)

  return (
    <TwoCol>
      <Card title="Прайминг — сахар для бутылок">
        <div className="grid grid-cols-2 gap-3 mb-3">
          <Field label="Объём пива" value={batchL} onChange={setBatchL} suffix="л" />
          <Field label="Целевая CO₂" value={targetCO2} onChange={setTargetCO2} suffix="vol" step={0.1} />
          <Field label="Макс. T при ферм." value={maxFermT} onChange={setMaxFermT} suffix="°C" />
          <label className="block">
            <span className="text-xs text-white/50 uppercase tracking-wide">Сахар</span>
            <select
              value={sugarType}
              onChange={(e) => setSugarType(e.target.value as PrimingSugarType)}
              className="glass-input w-full mt-1"
            >
              {(Object.keys(PRIMING_SUGAR_LABELS) as PrimingSugarType[]).map((k) => (
                <option key={k} value={k} className="bg-slate-900">{PRIMING_SUGAR_LABELS[k]}</option>
              ))}
            </select>
          </label>
        </div>
        <ResultRow label="Сахар на партию"     value={`${priming.grams} г`}              color="text-amber-300" />
        <ResultRow label="На 1 литр"            value={`${(priming.grams / batchL).toFixed(1)} г/л`} />
        <ResultRow label="Остаточный CO₂"        value={`${residual} vol`}                 sub="растворён в пиве после ферментации" />
        <ResultRow label="Δ нужно добавить"     value={`${(targetCO2 - residual).toFixed(2)} vol`} />

        <div className="mt-4 pt-4 border-t border-white/5">
          <p className="text-[11px] text-white/40 uppercase tracking-wide mb-2">Целевые объёмы CO₂ по стилям</p>
          <div className="space-y-1">
            {TARGET_CO2_VOLUMES.map(({ style, min, max }) => (
              <div key={style} className="flex items-center justify-between text-[11px] text-white/50">
                <span>{style}</span>
                <span className="font-mono text-white/70">{min}–{max}</span>
              </div>
            ))}
          </div>
        </div>
      </Card>

      <Card title="Кеггинг — давление CO₂">
        <p className="text-[11px] text-white/30 mb-3">
          Какое давление держать на кеге, чтобы получить нужную карбонизацию.
        </p>
        <div className="grid grid-cols-2 gap-3 mb-3">
          <Field label="T кега" value={kegT} onChange={setKegT} suffix="°C" />
          <Field label="Целевая CO₂" value={kegCO2} onChange={setKegCO2} suffix="vol" step={0.1} />
        </div>
        <ResultRow label="Давление" value={`${psi} PSI`} color="text-emerald-300" />
        <ResultRow label="В барах"  value={`${(psi * 0.0689476).toFixed(2)} bar`} />
        <p className="text-[11px] text-white/30 mt-3">
          ⚠ При повышении T нужно поднимать давление. Хранить пиво холодным безопаснее.
        </p>
      </Card>
    </TwoCol>
  )
}

// ─── 3. REFRACTOMETER CORRECTION ────────────────────────────────────────────

function RefractometerTab() {
  const [ob, setOb] = useState(14)
  const [fb, setFb] = useState(7)
  const [wcf, setWcf] = useState(1.04)

  const result = useMemo(() => refractometerFG(ob, fb, wcf), [ob, fb, wcf])

  return (
    <TwoCol>
      <Card title="Коррекция FG из Brix-замеров">
        <p className="text-[11px] text-white/30 mb-3">
          Рефрактометр показывает завышенно, когда есть алкоголь.
          Эта формула (Sean Terrill) восстанавливает реальную SG из показаний Brix до и после ферментации.
        </p>
        <div className="grid grid-cols-2 gap-3 mb-3">
          <Field label="Brix до брожения (OB)" value={ob} onChange={setOb} suffix="°Bx" step={0.1} />
          <Field label="Brix после (FB)"        value={fb} onChange={setFb} suffix="°Bx" step={0.1} />
          <Field label="WCF (поправка сусла)"   value={wcf} onChange={setWcf} step={0.01} />
        </div>
      </Card>

      <Card title="Результаты">
        <ResultRow label="OG"         value={result.og.toFixed(4)}       color="text-amber-300" />
        <ResultRow label="FG (true)"  value={result.fg.toFixed(4)}       color="text-amber-300" />
        <ResultRow label="ABV"        value={`${result.abv.toFixed(2)} %`} color="text-blue-300" />
        <ResultRow label="Аттенюация" value={`${result.apparentAttenuation.toFixed(1)} %`} />
        <p className="text-[11px] text-white/30 mt-4">
          💡 WCF обычно 1.02–1.06. Калибруется так: измерь сусло до варки и Brix, и ареометром,
          подбери WCF чтобы OG совпала.
        </p>
      </Card>
    </TwoCol>
  )
}

// ─── 4. MASH / STRIKE WATER ─────────────────────────────────────────────────

function MashTab() {
  const [grainT, setGrainT] = useState(20)
  const [mashT, setMashT]   = useState(67)
  const [ratio, setRatio]   = useState(3.0)
  const [grainKg, setGrainKg] = useState(5)
  const [batchL, setBatchL]   = useState(25)
  const [boilMin, setBoilMin] = useState(60)

  const strike = calcStrikeTemp(grainT, mashT, ratio)
  const sparge = calcSpargeWater(batchL, grainKg, boilMin, ratio)
  const mashWater = Math.round(grainKg * ratio * 10) / 10
  const grainAbs  = Math.round(grainKg * 0.96 * 10) / 10
  const evapL     = Math.round(batchL * 0.10 * (boilMin / 60) * 10) / 10
  const preboil   = Math.round((batchL + evapL) * 10) / 10

  return (
    <TwoCol>
      <Card title="Температура заливочной воды">
        <p className="text-[11px] text-white/30 mb-3">
          Какой температуры залить воду, чтобы после контакта с зерном получить целевую температуру затора.
        </p>
        <div className="grid grid-cols-3 gap-3 mb-3">
          <Field label="T зерна"   value={grainT} onChange={setGrainT} suffix="°C" />
          <Field label="T затора"  value={mashT}  onChange={setMashT}  suffix="°C" />
          <Field label="Соотн. R"  value={ratio}  onChange={setRatio}  suffix="л/кг" step={0.1} />
        </div>
        <ResultRow label="T заливочной воды" value={`${strike} °C`} color="text-amber-300" />
        <p className="text-[11px] text-white/30 mt-3">
          R = литры воды на кг зерна. Стандарт 2.5–3.5 л/кг.
        </p>
      </Card>

      <Card title="Объёмы воды (затор + промывка)">
        <div className="grid grid-cols-3 gap-3 mb-3">
          <Field label="Зерно"        value={grainKg} onChange={setGrainKg} suffix="кг" step={0.1} />
          <Field label="Партия"       value={batchL}  onChange={setBatchL}  suffix="л" />
          <Field label="Кипячение"    value={boilMin} onChange={setBoilMin} suffix="мин" />
        </div>
        <ResultRow label="Вода на затирание"   value={`${mashWater} л`} color="text-blue-300" />
        <ResultRow label="Поглощение зерном"   value={`${grainAbs} л`}  sub="≈0.96 л/кг" />
        <ResultRow label="Испарение"            value={`${evapL} л`}     sub="~10%/час" />
        <ResultRow label="Преboil объём"        value={`${preboil} л`} />
        <ResultRow label="Промывная вода"       value={`${sparge} л`}    color="text-emerald-300" />
      </Card>
    </TwoCol>
  )
}

// ─── 5. WATER CHEMISTRY ─────────────────────────────────────────────────────

function WaterTab() {
  const [profile, setProfile] = useState<WaterProfile>(DEFAULT_WATER_PROFILES[0].profile)
  const [saltKey, setSaltKey] = useState(BREWING_SALTS[0].key)
  const [saltGperL, setSaltGperL] = useState(0.5)

  const updated = useMemo(() => applySaltAddition(profile, saltKey, saltGperL), [profile, saltKey, saltGperL])
  const analysis = useMemo(() => analyzeWater(updated), [updated])

  const setKey = (k: keyof WaterProfile) => (v: number) => setProfile({ ...profile, [k]: v })

  return (
    <div className="space-y-6">
      <Card title="Профиль воды (ppm)">
        <div className="flex flex-wrap gap-2 mb-4">
          {DEFAULT_WATER_PROFILES.map((p) => (
            <button
              key={p.name}
              onClick={() => setProfile(p.profile)}
              className="btn-glass text-xs"
            >
              {p.name}
            </button>
          ))}
        </div>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          <Field label="Кальций Ca²⁺"     value={profile.ca}   onChange={setKey('ca')}   suffix="ppm" />
          <Field label="Магний Mg²⁺"      value={profile.mg}   onChange={setKey('mg')}   suffix="ppm" />
          <Field label="Натрий Na⁺"       value={profile.na}   onChange={setKey('na')}   suffix="ppm" />
          <Field label="Хлориды Cl⁻"      value={profile.cl}   onChange={setKey('cl')}   suffix="ppm" />
          <Field label="Сульфаты SO₄²⁻"   value={profile.so4}  onChange={setKey('so4')}  suffix="ppm" />
          <Field label="Бикарбонаты HCO₃⁻" value={profile.hco3} onChange={setKey('hco3')} suffix="ppm" />
        </div>
      </Card>

      <TwoCol>
        <Card title="Добавки солей">
          <p className="text-[11px] text-white/30 mb-3">
            Сколько добавить соли в каждый литр воды и как изменится профиль.
          </p>
          <div className="grid grid-cols-2 gap-3 mb-3">
            <label className="block">
              <span className="text-xs text-white/50 uppercase tracking-wide">Соль</span>
              <select
                value={saltKey}
                onChange={(e) => setSaltKey(e.target.value)}
                className="glass-input w-full mt-1"
              >
                {BREWING_SALTS.map((s) => (
                  <option key={s.key} value={s.key} className="bg-slate-900">{s.label}</option>
                ))}
              </select>
            </label>
            <Field label="Доза" value={saltGperL} onChange={setSaltGperL} suffix="г/л" step={0.1} />
          </div>
          <p className="text-[11px] text-white/40 uppercase mb-2 mt-4">Итоговый профиль:</p>
          <div className="grid grid-cols-3 gap-2 text-xs">
            {(['ca','mg','na','cl','so4','hco3'] as const).map((k) => {
              const before = profile[k]
              const after = updated[k]
              const diff = after - before
              return (
                <div key={k} className="glass-sm p-2">
                  <p className="text-[10px] text-white/40 uppercase">{k}</p>
                  <p className="text-sm font-semibold text-white">{after.toFixed(0)}</p>
                  {diff !== 0 && (
                    <p className={`text-[10px] ${diff > 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                      {diff > 0 ? '+' : ''}{diff.toFixed(0)}
                    </p>
                  )}
                </div>
              )
            })}
          </div>
        </Card>

        <Card title="Анализ">
          <ResultRow
            label="SO₄ : Cl"
            value={analysis.sulfateChlorideRatio === 999 ? '∞' : analysis.sulfateChlorideRatio.toFixed(2)}
            sub={analysis.perceptionLabel}
            color={analysis.perception === 'balanced' ? 'text-emerald-300' : 'text-amber-300'}
          />
          <ResultRow label="Щёлочность"      value={`${analysis.alkalinityCaCO3} ppm CaCO₃`} />
          <ResultRow label="Общая жёсткость" value={`${analysis.totalHardnessCaCO3} ppm CaCO₃`} />

          {analysis.warnings.length > 0 && (
            <div className="mt-4 pt-4 border-t border-white/5 space-y-1.5">
              <p className="text-[11px] text-white/40 uppercase">⚠ Предупреждения</p>
              {analysis.warnings.map((w, i) => (
                <p key={i} className="text-[11px] text-amber-400/80">• {w}</p>
              ))}
            </div>
          )}
        </Card>
      </TwoCol>
    </div>
  )
}

// ─── 6. QUICK CATEGORY CALCULATORS ──────────────────────────────────────────

function QuickTab() {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <KombuchaCard />
      <LemonadeCard />
      <CiderCard />
      <MeadCard />
      <KvassCard />
    </div>
  )
}

function KombuchaCard() {
  const [vol, setVol] = useState(5)
  const [sugar, setSugar] = useState(350)
  const [tea, setTea] = useState(25)
  const [t, setT] = useState(24)
  const r = calcKombucha(vol, sugar, tea, t)
  return (
    <Card title="🫖 Комбуча">
      <div className="grid grid-cols-2 gap-3 mb-3">
        <Field label="Объём" value={vol} onChange={setVol} suffix="л" />
        <Field label="Сахар" value={sugar} onChange={setSugar} suffix="г" />
        <Field label="Чай"   value={tea}   onChange={setTea}   suffix="г" />
        <Field label="T ферм." value={t}   onChange={setT}     suffix="°C" />
      </div>
      <ResultRow label="Сахар"           value={`${r.sugarPerLiter} г/л`} />
      <ResultRow label="Чай"             value={r.teaConcentration} />
      <ResultRow label="1-я ферм."        value={`~${r.firstFermentDays} дн.`} color="text-amber-300" />
      <ResultRow label="2-я ферм."        value={`~${r.secondFermentDays} дн.`} />
      <ResultRow label="Алкоголь"         value={`< ${r.approxAlcohol.toFixed(2)} %`} color="text-emerald-300" />
    </Card>
  )
}

function LemonadeCard() {
  const [vol, setVol] = useState(5)
  const [sugar, setSugar] = useState(400)
  const [juice, setJuice] = useState(15)
  const [acid, setAcid] = useState(0)
  const r = calcLemonade(vol, sugar, juice, acid)
  const labels: Record<string, string> = {
    too_sweet: 'Слишком сладко', sweet: 'Сладко', balanced: 'Баланс', tart: 'Кисло', very_tart: 'Очень кисло',
  }
  return (
    <Card title="🍋 Лимонад">
      <div className="grid grid-cols-2 gap-3 mb-3">
        <Field label="Объём" value={vol}   onChange={setVol}   suffix="л" />
        <Field label="Сахар" value={sugar} onChange={setSugar} suffix="г" />
        <Field label="Сок"   value={juice} onChange={setJuice} suffix="%" />
        <Field label="Кислота" value={acid} onChange={setAcid} suffix="г" />
      </div>
      <ResultRow label="Сахар"        value={`${r.sugarPerLiter} г/л`} />
      <ResultRow label="Brix"         value={`${r.brix} °Bx`} />
      <ResultRow label="Кислотность"  value={`${r.acidityGramPerLiter} г/л`} />
      <ResultRow
        label="Баланс"
        value={labels[r.sweetnessBitterness]}
        color={r.sweetnessBitterness === 'balanced' ? 'text-emerald-400' : 'text-amber-300'}
      />
    </Card>
  )
}

function CiderCard() {
  const [juice, setJuice] = useState(20)
  const [vol, setVol] = useState(20)
  const [sugar, setSugar] = useState(0)
  const [att, setAtt] = useState(80)
  const og = calcCiderOG(juice, vol, sugar)
  const fg = calcFG(og, att)
  const abv = calcABV(og, fg)
  return (
    <Card title="🍎 Сидр">
      <div className="grid grid-cols-2 gap-3 mb-3">
        <Field label="Сок"     value={juice} onChange={setJuice} suffix="л" />
        <Field label="Объём"   value={vol}   onChange={setVol}   suffix="л" />
        <Field label="Доп. сахар" value={sugar} onChange={setSugar} suffix="г" />
        <Field label="Аттенюация" value={att}   onChange={setAtt}   suffix="%" />
      </div>
      <ResultRow label="OG"  value={og.toFixed(4)}        color="text-amber-300" />
      <ResultRow label="FG"  value={fg.toFixed(4)} />
      <ResultRow label="ABV" value={`${abv.toFixed(2)} %`} color="text-blue-300" />
    </Card>
  )
}

function MeadCard() {
  const [honey, setHoney] = useState(3)
  const [vol, setVol] = useState(20)
  const [att, setAtt] = useState(90)
  const og = calcMeadOG(honey, vol)
  const fg = calcFG(og, att)
  const abv = calcABV(og, fg)
  return (
    <Card title="🍯 Медовуха">
      <div className="grid grid-cols-3 gap-3 mb-3">
        <Field label="Мёд"       value={honey} onChange={setHoney} suffix="кг" step={0.1} />
        <Field label="Объём"     value={vol}   onChange={setVol}   suffix="л" />
        <Field label="Аттенюация" value={att}  onChange={setAtt}   suffix="%" />
      </div>
      <ResultRow label="OG"  value={og.toFixed(4)}        color="text-amber-300" />
      <ResultRow label="FG"  value={fg.toFixed(4)} />
      <ResultRow label="ABV" value={`${abv.toFixed(2)} %`} color="text-blue-300" />
    </Card>
  )
}

function KvassCard() {
  const [bread, setBread] = useState(0.5)
  const [sugar, setSugar] = useState(150)
  const [vol, setVol] = useState(10)
  const r = calcKvassStats(bread, sugar, vol)
  return (
    <Card title="🍶 Квас">
      <div className="grid grid-cols-3 gap-3 mb-3">
        <Field label="Хлеб"  value={bread} onChange={setBread} suffix="кг" step={0.1} />
        <Field label="Сахар" value={sugar} onChange={setSugar} suffix="г" />
        <Field label="Объём" value={vol}   onChange={setVol}   suffix="л" />
      </div>
      <ResultRow label="OG"           value={r.og.toFixed(4)}      color="text-amber-300" />
      <ResultRow label="FG"           value={r.fg.toFixed(4)} />
      <ResultRow label="ABV"          value={`${r.abv.toFixed(2)} %`} color="text-blue-300" />
      <ResultRow label="Сахар всего"  value={`${r.totalSugarG.toFixed(0)} г`} />
    </Card>
  )
}
