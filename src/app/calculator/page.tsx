'use client'

import { useState, useMemo } from 'react'
import {
  Calculator, Droplets, Wind, FlaskConical, TestTube, Beaker, Sparkles,
  AlertTriangle,
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

// ─── tabs config ────────────────────────────────────────────────────────────

type TabKey = 'density' | 'carb' | 'refrac' | 'mash' | 'water' | 'quick'

const TABS: { key: TabKey; label: string; short: string; icon: typeof Calculator }[] = [
  { key: 'density', label: 'Плотность',     short: 'Плотн.',  icon: Droplets },
  { key: 'carb',    label: 'Карбонизация',   short: 'Карб.',   icon: Wind     },
  { key: 'refrac',  label: 'Рефрактометр',   short: 'Рефр.',   icon: TestTube },
  { key: 'mash',    label: 'Затирание',      short: 'Затор',   icon: FlaskConical },
  { key: 'water',   label: 'Вода',           short: 'Вода',    icon: Beaker   },
  { key: 'quick',   label: 'Быстрый расчёт', short: 'Быстро',  icon: Sparkles },
]

// ─── page ───────────────────────────────────────────────────────────────────

export default function CalculatorPage() {
  const [tab, setTab] = useState<TabKey>('density')

  return (
    <div className="space-y-8 fade-in">
      {/* Hero header */}
      <header>
        <span className="badge badge-amber inline-flex items-center gap-1.5 mb-3">
          <Calculator size={11} /> Brewing Tools
        </span>
        <h1 className="text-3xl lg:text-4xl font-bold text-white tracking-tight">
          Калькулятор <span className="text-gradient-amber">пивовара</span>
        </h1>
        <p className="text-sm text-white/40 mt-2 max-w-2xl">
          Все расчёты для варки и контроля брожения — плотность, карбонизация, рефрактометр,
          затирание, вода и быстрые рецепты.
        </p>
      </header>

      {/* Sticky tab nav */}
      <nav className="sticky top-3 z-30 glass p-1.5 rounded-2xl flex gap-1 overflow-x-auto">
        {TABS.map(({ key, label, short, icon: Icon }) => {
          const active = tab === key
          return (
            <button
              key={key}
              onClick={() => setTab(key)}
              className={`
                flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium
                whitespace-nowrap transition-all duration-200
                ${active
                  ? 'bg-gradient-to-r from-amber-500/25 to-orange-500/15 text-amber-200 shadow-lg shadow-amber-500/10 border border-amber-500/30'
                  : 'text-white/55 hover:text-white hover:bg-white/5 border border-transparent'}
              `}
            >
              <Icon size={15} />
              <span className="hidden md:inline">{label}</span>
              <span className="md:hidden">{short}</span>
            </button>
          )
        })}
      </nav>

      {/* Content */}
      <div key={tab} className="fade-in space-y-6">
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

// ─── ATOMS ──────────────────────────────────────────────────────────────────

function Card({
  title,
  subtitle,
  icon: Icon,
  accent = 'amber',
  children,
}: {
  title: string
  subtitle?: string
  icon?: typeof Calculator
  accent?: 'amber' | 'blue' | 'green'
  children: React.ReactNode
}) {
  const tint = {
    amber: 'from-amber-500/15 to-transparent border-amber-500/20',
    blue:  'from-blue-500/15 to-transparent border-blue-500/20',
    green: 'from-emerald-500/15 to-transparent border-emerald-500/20',
  }[accent]
  const iconColor = { amber: 'text-amber-400', blue: 'text-blue-400', green: 'text-emerald-400' }[accent]

  return (
    <section className="glass overflow-hidden">
      <header className={`px-6 py-4 border-b border-white/5 bg-gradient-to-r ${tint}`}>
        <div className="flex items-center gap-2.5">
          {Icon && <Icon size={16} className={iconColor} />}
          <h3 className="text-sm font-semibold text-white tracking-wide">{title}</h3>
        </div>
        {subtitle && <p className="text-[12px] text-white/45 mt-1 ml-[26px]">{subtitle}</p>}
      </header>
      <div className="p-6">{children}</div>
    </section>
  )
}

function Field({
  label, value, onChange, suffix, step = 1,
}: {
  label: string
  value: number | string
  onChange: (v: number) => void
  suffix?: string
  step?: number
}) {
  return (
    <label className="block">
      <span className="text-[10.5px] text-white/45 uppercase tracking-[0.08em] font-semibold">{label}</span>
      <div className="relative mt-1.5">
        <input
          type="number"
          step={step}
          value={value}
          onChange={(e) => onChange(parseFloat(e.target.value) || 0)}
          className="glass-input w-full pr-14 text-[15px] font-semibold"
        />
        {suffix && (
          <span className="absolute right-4 top-1/2 -translate-y-1/2 text-[11px] text-white/40 font-medium pointer-events-none">
            {suffix}
          </span>
        )}
      </div>
    </label>
  )
}

function SelectField<T extends string>({
  label, value, onChange, options,
}: {
  label: string
  value: T
  onChange: (v: T) => void
  options: { value: T; label: string }[]
}) {
  return (
    <label className="block">
      <span className="text-[10.5px] text-white/45 uppercase tracking-[0.08em] font-semibold">{label}</span>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value as T)}
        className="glass-input w-full mt-1.5 text-[14px] font-medium cursor-pointer"
      >
        {options.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
      </select>
    </label>
  )
}

function Stat({
  label, value, sub, accent,
}: {
  label: string
  value: string
  sub?: string
  accent?: 'amber' | 'blue' | 'green' | 'red'
}) {
  const color = {
    amber: 'text-amber-300',
    blue:  'text-blue-300',
    green: 'text-emerald-300',
    red:   'text-red-300',
  }[accent ?? 'amber'] ?? 'text-white'
  return (
    <div className="glass-sm px-4 py-3.5">
      <p className="text-[10px] uppercase tracking-wider text-white/40 font-medium">{label}</p>
      <p className={`text-xl font-bold mt-1 leading-none ${accent ? color : 'text-white'}`}>{value}</p>
      {sub && <p className="text-[10.5px] text-white/35 mt-1.5">{sub}</p>}
    </div>
  )
}

function HeroResult({
  label, value, unit, accent = 'amber', sub,
}: {
  label: string
  value: string
  unit?: string
  accent?: 'amber' | 'blue' | 'green'
  sub?: string
}) {
  const grad = {
    amber: 'text-gradient-amber',
    blue:  'text-gradient-blue',
    green: 'text-gradient-green',
  }[accent]
  return (
    <div className="text-center py-2">
      <p className="text-[10.5px] uppercase tracking-[0.15em] text-white/45 font-semibold">{label}</p>
      <div className="mt-2 flex items-baseline justify-center gap-2">
        <span className={`text-5xl lg:text-[3.5rem] font-bold leading-none tracking-tight ${grad}`}>
          {value}
        </span>
        {unit && <span className="text-lg text-white/40 font-medium">{unit}</span>}
      </div>
      {sub && <p className="text-xs text-white/40 mt-2">{sub}</p>}
    </div>
  )
}

function Grid({ cols = 2, children }: { cols?: 2 | 3 | 4; children: React.ReactNode }) {
  const cls = {
    2: 'sm:grid-cols-2',
    3: 'sm:grid-cols-2 lg:grid-cols-3',
    4: 'sm:grid-cols-2 lg:grid-cols-4',
  }[cols]
  return <div className={`grid grid-cols-1 ${cls} gap-3`}>{children}</div>
}

// ─── 1. DENSITY ─────────────────────────────────────────────────────────────

function DensityTab() {
  return (
    <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
      <BrixSGCard />
      <ABVCard />
      <TempCorrectionCard />
      <SugarOGCard />
    </div>
  )
}

function BrixSGCard() {
  const [brix, setBrix] = useState(12)
  const [sg,   setSg]   = useState(1.048)
  const sgFromBrix = brixToSG(brix)
  const brixFromSg = sgToBrix(sg)
  return (
    <Card title="Brix ↔ SG" subtitle="Перевод между шкалой Brix и удельной плотностью" icon={Droplets}>
      <Grid cols={2}>
        <Field label="Brix"   value={brix} onChange={setBrix} suffix="°Bx"  step={0.1} />
        <Field label="SG"     value={sg}   onChange={setSg}   step={0.001} />
      </Grid>
      <div className="grid grid-cols-2 gap-3 mt-5">
        <Stat label="Brix → SG"  value={sgFromBrix.toFixed(4)}            accent="amber" />
        <Stat label="SG → Brix"  value={`${brixFromSg.toFixed(2)} °Bx`}   accent="amber" />
      </div>
    </Card>
  )
}

function ABVCard() {
  const [og, setOg] = useState(1.060)
  const [fg, setFg] = useState(1.012)
  const abv = calcABV(og, fg)
  const att = og > 1 ? Math.round(((og - fg) / (og - 1)) * 1000) / 10 : 0
  return (
    <Card title="ABV — алкоголь" subtitle="Из начальной и конечной плотности" icon={FlaskConical} accent="blue">
      <Grid cols={2}>
        <Field label="OG" value={og} onChange={setOg} step={0.001} />
        <Field label="FG" value={fg} onChange={setFg} step={0.001} />
      </Grid>
      <div className="mt-6">
        <HeroResult label="ABV" value={abv.toFixed(2)} unit="%" accent="blue" />
      </div>
      <div className="grid grid-cols-2 gap-3 mt-5">
        <Stat label="Аттенюация" value={`${att.toFixed(1)} %`} sub="процент сбраживания" />
        <Stat label="Точек ферм." value={`${Math.round((og - fg) * 1000)}`} sub="SG points" />
      </div>
    </Card>
  )
}

function TempCorrectionCard() {
  const [sgMeas, setSgMeas]   = useState(1.060)
  const [tSample, setTSample] = useState(30)
  const [tCalib, setTCalib]   = useState(20)
  const corrected = correctSGforTemp(sgMeas, tSample, tCalib)
  const delta = (corrected - sgMeas) * 1000
  return (
    <Card
      title="Коррекция ареометра"
      subtitle="Если измеряли не при калибровочной температуре"
      icon={TestTube}
      accent="green"
    >
      <Grid cols={3}>
        <Field label="SG измер."   value={sgMeas}  onChange={setSgMeas}  step={0.001} />
        <Field label="T образца"   value={tSample} onChange={setTSample} suffix="°C" />
        <Field label="T калибр."   value={tCalib}  onChange={setTCalib}  suffix="°C" />
      </Grid>
      <div className="mt-6">
        <HeroResult
          label="Скорректированная SG"
          value={corrected.toFixed(4)}
          accent="green"
          sub={`Δ ${delta >= 0 ? '+' : ''}${delta.toFixed(1)} pts`}
        />
      </div>
    </Card>
  )
}

function SugarOGCard() {
  const [sugarG, setSugarG] = useState(1000)
  const [volL, setVolL]     = useState(20)
  const og = calcOGFromSugar(sugarG, volL)
  const fg = calcFG(og, 75)
  const abv = calcABV(og, fg)
  return (
    <Card
      title="OG из растворённого сахара"
      subtitle="Сколько SG даст N грамм сахара в M литрах (медовуха / квас / сидр)"
      icon={Sparkles}
    >
      <Grid cols={2}>
        <Field label="Сахар"  value={sugarG} onChange={setSugarG} suffix="г" />
        <Field label="Объём"  value={volL}   onChange={setVolL}   suffix="л" />
      </Grid>
      <div className="grid grid-cols-3 gap-3 mt-5">
        <Stat label="OG"   value={og.toFixed(4)}                   accent="amber" />
        <Stat label="Brix" value={`${sgToBrix(og).toFixed(1)} °Bx`} />
        <Stat label="ABV (75%)" value={`${abv.toFixed(2)} %`}        accent="blue" />
      </div>
    </Card>
  )
}

// ─── 2. CARBONATION ─────────────────────────────────────────────────────────

function CarbonationTab() {
  return (
    <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
      <PrimingCard />
      <KegCard />
      <CO2TableCard />
    </div>
  )
}

function PrimingCard() {
  const [batchL, setBatchL]       = useState(20)
  const [targetCO2, setTargetCO2] = useState(2.4)
  const [maxFermT, setMaxFermT]   = useState(20)
  const [sugar, setSugar]         = useState<PrimingSugarType>('sucrose')
  const r = calcPrimingSugar(batchL, targetCO2, maxFermT, sugar)
  return (
    <Card
      title="Прайминг для бутылок"
      subtitle="Сахар для естественной карбонизации"
      icon={Wind}
    >
      <Grid cols={2}>
        <Field label="Объём пива"        value={batchL}    onChange={setBatchL}    suffix="л" />
        <Field label="Целевая CO₂"        value={targetCO2} onChange={setTargetCO2} suffix="vol" step={0.1} />
        <Field label="Макс. T при ферм."  value={maxFermT}  onChange={setMaxFermT}  suffix="°C" />
        <SelectField
          label="Тип сахара"
          value={sugar}
          onChange={setSugar}
          options={(Object.keys(PRIMING_SUGAR_LABELS) as PrimingSugarType[]).map(k => ({ value: k, label: PRIMING_SUGAR_LABELS[k] }))}
        />
      </Grid>
      <div className="mt-6">
        <HeroResult label="Сахар на партию" value={r.grams.toFixed(1)} unit="г" />
      </div>
      <div className="grid grid-cols-3 gap-3 mt-5">
        <Stat label="На литр"        value={`${(r.grams / batchL).toFixed(1)} г/л`} />
        <Stat label="Остаточный CO₂"  value={`${r.residualCO2}`} sub="vol — растворён в пиве" />
        <Stat label="Δ нужно"         value={`${(targetCO2 - r.residualCO2).toFixed(2)}`} sub="vol" />
      </div>
    </Card>
  )
}

function KegCard() {
  const [t, setT]       = useState(4)
  const [co2, setCo2]   = useState(2.4)
  const psi = calcKegPressure(co2, t)
  return (
    <Card
      title="Кеггинг — давление CO₂"
      subtitle="Какое давление держать на кеге для нужной карбонизации"
      icon={Wind}
      accent="blue"
    >
      <Grid cols={2}>
        <Field label="T кега"       value={t}   onChange={setT}   suffix="°C" />
        <Field label="Целевая CO₂"   value={co2} onChange={setCo2} suffix="vol" step={0.1} />
      </Grid>
      <div className="mt-6">
        <HeroResult label="Давление" value={psi.toFixed(1)} unit="PSI" accent="blue" />
      </div>
      <div className="grid grid-cols-2 gap-3 mt-5">
        <Stat label="В барах"    value={`${(psi * 0.0689476).toFixed(2)} bar`} />
        <Stat label="В атм."     value={`${(psi * 0.068046).toFixed(2)} atm`} />
      </div>
      <p className="text-[11px] text-white/35 mt-4 leading-relaxed">
        ⚠ При повышении температуры нужно поднимать давление. Хранить пиво холодным безопаснее.
      </p>
    </Card>
  )
}

function CO2TableCard() {
  return (
    <div className="xl:col-span-2">
      <Card title="Целевые объёмы CO₂ по стилям" subtitle="Справочные диапазоны" icon={Sparkles} accent="green">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
          {TARGET_CO2_VOLUMES.map(({ style, min, max }) => (
            <div key={style} className="glass-sm px-4 py-3 flex items-center justify-between">
              <span className="text-sm text-white/70">{style}</span>
              <span className="text-sm font-mono font-semibold text-amber-300">{min}–{max}</span>
            </div>
          ))}
        </div>
      </Card>
    </div>
  )
}

// ─── 3. REFRACTOMETER ───────────────────────────────────────────────────────

function RefractometerTab() {
  const [ob, setOb]   = useState(14)
  const [fb, setFb]   = useState(7)
  const [wcf, setWcf] = useState(1.04)
  const r = useMemo(() => refractometerFG(ob, fb, wcf), [ob, fb, wcf])
  return (
    <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
      <div className="xl:col-span-1">
        <Card title="Замеры рефрактометра" icon={TestTube}>
          <p className="text-[12px] text-white/45 leading-relaxed mb-5">
            Рефрактометр показывает завышенно, когда есть алкоголь. Формула Sean Terrill восстанавливает
            реальную SG из показаний Brix до и после ферментации.
          </p>
          <div className="space-y-3">
            <Field label="Brix до брожения (OB)" value={ob}  onChange={setOb}  suffix="°Bx" step={0.1} />
            <Field label="Brix после (FB)"        value={fb}  onChange={setFb}  suffix="°Bx" step={0.1} />
            <Field label="WCF — поправка сусла"   value={wcf} onChange={setWcf} step={0.01} />
          </div>
          <p className="text-[11px] text-white/35 mt-4 leading-relaxed">
            💡 WCF обычно 1.02–1.06. Калибруется так: измерь сусло до варки и Brix, и ареометром,
            подбери WCF чтобы OG совпала.
          </p>
        </Card>
      </div>
      <div className="xl:col-span-2 space-y-6">
        <Card title="Результаты" icon={Sparkles} accent="blue">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <HeroResult label="OG" value={r.og.toFixed(4)} accent="amber" />
            <HeroResult label="FG (true)" value={r.fg.toFixed(4)} accent="amber" />
          </div>
          <div className="grid grid-cols-2 gap-3 mt-6">
            <Stat label="ABV"        value={`${r.abv.toFixed(2)} %`}                 accent="blue" />
            <Stat label="Аттенюация" value={`${r.apparentAttenuation.toFixed(1)} %`} accent="green" />
          </div>
        </Card>
      </div>
    </div>
  )
}

// ─── 4. MASH ────────────────────────────────────────────────────────────────

function MashTab() {
  return (
    <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
      <StrikeCard />
      <VolumesCard />
    </div>
  )
}

function StrikeCard() {
  const [grainT, setGrainT] = useState(20)
  const [mashT, setMashT]   = useState(67)
  const [ratio, setRatio]   = useState(3.0)
  const t = calcStrikeTemp(grainT, mashT, ratio)
  return (
    <Card
      title="Температура заливочной воды"
      subtitle="Какой температуры залить воду чтобы получить нужный затор (формула Palmer)"
      icon={Droplets}
    >
      <Grid cols={3}>
        <Field label="T зерна"   value={grainT} onChange={setGrainT} suffix="°C" />
        <Field label="T затора"  value={mashT}  onChange={setMashT}  suffix="°C" />
        <Field label="Соотн. R"  value={ratio}  onChange={setRatio}  suffix="л/кг" step={0.1} />
      </Grid>
      <div className="mt-6">
        <HeroResult label="T заливочной воды" value={t.toFixed(1)} unit="°C" />
      </div>
      <p className="text-[11px] text-white/35 mt-4 leading-relaxed">
        R = литры воды на кг зерна. Стандарт 2.5–3.5 л/кг.
      </p>
    </Card>
  )
}

function VolumesCard() {
  const [grainKg, setGrainKg] = useState(5)
  const [batchL, setBatchL]   = useState(25)
  const [boilMin, setBoilMin] = useState(60)
  const ratio = 3.0
  const sparge    = calcSpargeWater(batchL, grainKg, boilMin, ratio)
  const mashWater = Math.round(grainKg * ratio * 10) / 10
  const grainAbs  = Math.round(grainKg * 0.96 * 10) / 10
  const evapL     = Math.round(batchL * 0.10 * (boilMin / 60) * 10) / 10
  const preboil   = Math.round((batchL + evapL) * 10) / 10
  return (
    <Card
      title="Объёмы воды"
      subtitle="Затор + промывка + испарение"
      icon={FlaskConical}
      accent="blue"
    >
      <Grid cols={3}>
        <Field label="Зерно"     value={grainKg} onChange={setGrainKg} suffix="кг" step={0.1} />
        <Field label="Партия"    value={batchL}  onChange={setBatchL}  suffix="л" />
        <Field label="Кипячение"  value={boilMin} onChange={setBoilMin} suffix="мин" />
      </Grid>
      <div className="mt-6">
        <HeroResult label="Промывная вода" value={`${sparge}`} unit="л" accent="blue" />
      </div>
      <div className="grid grid-cols-2 gap-3 mt-5">
        <Stat label="Вода на затирание"   value={`${mashWater} л`} />
        <Stat label="Поглощение зерном"   value={`${grainAbs} л`} sub="≈0.96 л/кг" />
        <Stat label="Испарение"           value={`${evapL} л`} sub="~10%/час" />
        <Stat label="Преboil"              value={`${preboil} л`} />
      </div>
    </Card>
  )
}

// ─── 5. WATER ───────────────────────────────────────────────────────────────

function WaterTab() {
  const [profile, setProfile]   = useState<WaterProfile>(DEFAULT_WATER_PROFILES[0].profile)
  const [saltKey, setSaltKey]   = useState(BREWING_SALTS[0].key)
  const [gPerL, setGPerL]       = useState(0.5)
  const updated  = useMemo(() => applySaltAddition(profile, saltKey, gPerL), [profile, saltKey, gPerL])
  const analysis = useMemo(() => analyzeWater(updated), [updated])
  const setKey = (k: keyof WaterProfile) => (v: number) => setProfile({ ...profile, [k]: v })

  return (
    <div className="space-y-6">
      <Card title="Профиль воды (ppm)" subtitle="Ионный состав исходной воды" icon={Beaker}>
        <div className="flex flex-wrap gap-2 mb-5">
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
        <Grid cols={3}>
          <Field label="Кальций Ca²⁺"      value={profile.ca}   onChange={setKey('ca')}   suffix="ppm" />
          <Field label="Магний Mg²⁺"       value={profile.mg}   onChange={setKey('mg')}   suffix="ppm" />
          <Field label="Натрий Na⁺"        value={profile.na}   onChange={setKey('na')}   suffix="ppm" />
          <Field label="Хлориды Cl⁻"       value={profile.cl}   onChange={setKey('cl')}   suffix="ppm" />
          <Field label="Сульфаты SO₄²⁻"    value={profile.so4}  onChange={setKey('so4')}  suffix="ppm" />
          <Field label="Бикарбонаты HCO₃⁻" value={profile.hco3} onChange={setKey('hco3')} suffix="ppm" />
        </Grid>
      </Card>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <Card title="Добавки солей" subtitle="Сколько добавить и как изменится профиль" icon={Sparkles}>
          <Grid cols={2}>
            <SelectField
              label="Соль"
              value={saltKey}
              onChange={setSaltKey}
              options={BREWING_SALTS.map(s => ({ value: s.key, label: s.label }))}
            />
            <Field label="Доза" value={gPerL} onChange={setGPerL} suffix="г/л" step={0.1} />
          </Grid>
          <p className="text-[10.5px] text-white/45 uppercase tracking-wider font-semibold mt-6 mb-3">
            Итоговый профиль
          </p>
          <div className="grid grid-cols-3 gap-2.5">
            {(['ca','mg','na','cl','so4','hco3'] as const).map((k) => {
              const before = profile[k]
              const after = updated[k]
              const diff = after - before
              return (
                <div key={k} className="glass-sm px-3 py-2.5">
                  <p className="text-[9.5px] text-white/40 uppercase tracking-wider">{k}</p>
                  <p className="text-base font-bold text-white mt-0.5">{after.toFixed(0)}</p>
                  {diff !== 0 && (
                    <p className={`text-[10.5px] font-semibold ${diff > 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                      {diff > 0 ? '+' : ''}{diff.toFixed(0)}
                    </p>
                  )}
                </div>
              )
            })}
          </div>
        </Card>

        <Card title="Анализ воды" subtitle="Восприятие вкуса и предупреждения" icon={Beaker} accent="green">
          <HeroResult
            label="SO₄ : Cl"
            value={analysis.sulfateChlorideRatio === 999 ? '∞' : analysis.sulfateChlorideRatio.toFixed(2)}
            accent={analysis.perception === 'balanced' ? 'green' : 'amber'}
            sub={analysis.perceptionLabel}
          />
          <div className="grid grid-cols-2 gap-3 mt-6">
            <Stat label="Щёлочность"      value={`${analysis.alkalinityCaCO3} ppm`}      sub="CaCO₃" />
            <Stat label="Общая жёсткость" value={`${analysis.totalHardnessCaCO3} ppm`} sub="CaCO₃" />
          </div>
          {analysis.warnings.length > 0 && (
            <div className="mt-5 pt-5 border-t border-white/5 space-y-2">
              {analysis.warnings.map((w, i) => (
                <div key={i} className="flex items-start gap-2 text-[12px] text-amber-300/85">
                  <AlertTriangle size={13} className="mt-0.5 flex-shrink-0" />
                  <span>{w}</span>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>
    </div>
  )
}

// ─── 6. QUICK CATEGORY ──────────────────────────────────────────────────────

function QuickTab() {
  return (
    <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
      <KombuchaCard />
      <LemonadeCard />
      <CiderCard />
      <MeadCard />
      <KvassCard />
    </div>
  )
}

function KombuchaCard() {
  const [vol, setVol]     = useState(5)
  const [sugar, setSugar] = useState(350)
  const [tea, setTea]     = useState(25)
  const [t, setT]         = useState(24)
  const r = calcKombucha(vol, sugar, tea, t)
  return (
    <Card title="🫖 Комбуча" subtitle="SCOBY-ферментация чая с сахаром" accent="green">
      <Grid cols={2}>
        <Field label="Объём"   value={vol}   onChange={setVol}   suffix="л" />
        <Field label="Сахар"   value={sugar} onChange={setSugar} suffix="г" />
        <Field label="Чай"     value={tea}   onChange={setTea}   suffix="г" />
        <Field label="T ферм." value={t}     onChange={setT}     suffix="°C" />
      </Grid>
      <div className="grid grid-cols-2 gap-3 mt-5">
        <Stat label="Сахар"      value={`${r.sugarPerLiter} г/л`} />
        <Stat label="Чай"        value={r.teaConcentration} />
        <Stat label="1-я ферм."  value={`~${r.firstFermentDays} дн.`}  accent="amber" />
        <Stat label="2-я ферм."  value={`~${r.secondFermentDays} дн.`} />
        <Stat label="Алкоголь"   value={`< ${r.approxAlcohol.toFixed(2)} %`} accent="green" />
        <Stat label="Всего"      value={`~${r.estimatedFermentDays} дн.`} />
      </div>
    </Card>
  )
}

function LemonadeCard() {
  const [vol, setVol]     = useState(5)
  const [sugar, setSugar] = useState(400)
  const [juice, setJuice] = useState(15)
  const [acid, setAcid]   = useState(0)
  const r = calcLemonade(vol, sugar, juice, acid)
  const labels: Record<string, string> = {
    too_sweet: 'Слишком сладко', sweet: 'Сладко', balanced: 'Баланс', tart: 'Кисло', very_tart: 'Очень кисло',
  }
  return (
    <Card title="🍋 Лимонад" subtitle="Газировка с балансом сладости и кислотности">
      <Grid cols={2}>
        <Field label="Объём"   value={vol}   onChange={setVol}   suffix="л" />
        <Field label="Сахар"   value={sugar} onChange={setSugar} suffix="г" />
        <Field label="Сок"     value={juice} onChange={setJuice} suffix="%" />
        <Field label="Кислота" value={acid}  onChange={setAcid}  suffix="г" />
      </Grid>
      <div className="grid grid-cols-2 gap-3 mt-5">
        <Stat label="Сахар"        value={`${r.sugarPerLiter} г/л`} />
        <Stat label="Brix"         value={`${r.brix} °Bx`} />
        <Stat label="Кислотность"  value={`${r.acidityGramPerLiter} г/л`} />
        <Stat
          label="Баланс"
          value={labels[r.sweetnessBitterness]}
          accent={r.sweetnessBitterness === 'balanced' ? 'green' : 'amber'}
        />
      </div>
    </Card>
  )
}

function CiderCard() {
  const [juice, setJuice] = useState(20)
  const [vol, setVol]     = useState(20)
  const [sugar, setSugar] = useState(0)
  const [att, setAtt]     = useState(80)
  const og = calcCiderOG(juice, vol, sugar)
  const fg = calcFG(og, att)
  const abv = calcABV(og, fg)
  return (
    <Card title="🍎 Сидр" subtitle="Из яблочного сока" accent="green">
      <Grid cols={2}>
        <Field label="Сок"          value={juice} onChange={setJuice} suffix="л" />
        <Field label="Объём"        value={vol}   onChange={setVol}   suffix="л" />
        <Field label="Доп. сахар"   value={sugar} onChange={setSugar} suffix="г" />
        <Field label="Аттенюация"   value={att}   onChange={setAtt}   suffix="%" />
      </Grid>
      <div className="grid grid-cols-3 gap-3 mt-5">
        <Stat label="OG"  value={og.toFixed(4)}        accent="amber" />
        <Stat label="FG"  value={fg.toFixed(4)} />
        <Stat label="ABV" value={`${abv.toFixed(2)} %`} accent="blue" />
      </div>
    </Card>
  )
}

function MeadCard() {
  const [honey, setHoney] = useState(3)
  const [vol, setVol]     = useState(20)
  const [att, setAtt]     = useState(90)
  const og = calcMeadOG(honey, vol)
  const fg = calcFG(og, att)
  const abv = calcABV(og, fg)
  return (
    <Card title="🍯 Медовуха" subtitle="Ферментация мёда" accent="amber">
      <Grid cols={3}>
        <Field label="Мёд"        value={honey} onChange={setHoney} suffix="кг" step={0.1} />
        <Field label="Объём"      value={vol}   onChange={setVol}   suffix="л" />
        <Field label="Аттенюация" value={att}   onChange={setAtt}   suffix="%" />
      </Grid>
      <div className="grid grid-cols-3 gap-3 mt-5">
        <Stat label="OG"  value={og.toFixed(4)}        accent="amber" />
        <Stat label="FG"  value={fg.toFixed(4)} />
        <Stat label="ABV" value={`${abv.toFixed(2)} %`} accent="blue" />
      </div>
    </Card>
  )
}

function KvassCard() {
  const [bread, setBread] = useState(0.5)
  const [sugar, setSugar] = useState(150)
  const [vol, setVol]     = useState(10)
  const r = calcKvassStats(bread, sugar, vol)
  return (
    <Card title="🍶 Квас" subtitle="Хлебная ферментация" accent="amber">
      <Grid cols={3}>
        <Field label="Хлеб"  value={bread} onChange={setBread} suffix="кг" step={0.1} />
        <Field label="Сахар" value={sugar} onChange={setSugar} suffix="г" />
        <Field label="Объём" value={vol}   onChange={setVol}   suffix="л" />
      </Grid>
      <div className="grid grid-cols-2 gap-3 mt-5">
        <Stat label="OG"          value={r.og.toFixed(4)}           accent="amber" />
        <Stat label="FG"          value={r.fg.toFixed(4)} />
        <Stat label="ABV"         value={`${r.abv.toFixed(2)} %`}    accent="blue" />
        <Stat label="Сахар всего" value={`${r.totalSugarG.toFixed(0)} г`} />
      </div>
    </Card>
  )
}
