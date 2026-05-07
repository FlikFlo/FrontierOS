'use client'

import { useState, useMemo, type ComponentType } from 'react'
import {
  Calculator, Droplets, Wind, FlaskConical, TestTube, Beaker, Sparkles,
  AlertTriangle, ArrowLeftRight, Gauge, Thermometer, Beer, Apple, Wheat,
  Leaf, Citrus, Flame, ChevronRight,
} from 'lucide-react'
import {
  brixToSG, sgToBrix, calcABV, calcOGFromSugar,
  correctSGforTemp, refractometerFG,
  calcPrimingSugar, calcKegPressure,
  PRIMING_SUGAR_LABELS, type PrimingSugarType, TARGET_CO2_VOLUMES,
  calcStrikeTemp, calcSpargeWater,
  analyzeWater, applySaltAddition, BREWING_SALTS, DEFAULT_WATER_PROFILES, type WaterProfile,
  calcKombucha, calcLemonade, calcMeadOG, calcCiderOG, calcKvassStats,
  calcFG,
} from '@/lib/beverage-calc'

// ─── tools registry ─────────────────────────────────────────────────────────

type ToolKey =
  | 'brix-sg' | 'abv' | 'temp-correct' | 'sugar-og'
  | 'priming' | 'keg' | 'co2-styles'
  | 'refrac'
  | 'strike' | 'volumes'
  | 'water'
  | 'kombucha' | 'lemonade' | 'cider' | 'mead' | 'kvass'

type CategoryKey = 'density' | 'carb' | 'refrac' | 'mash' | 'water' | 'quick'

interface Tool {
  key: ToolKey
  category: CategoryKey
  label: string
  short: string
  icon: ComponentType<{ size?: number; className?: string }>
  description: string
}

const TOOLS: Tool[] = [
  // density
  { key: 'brix-sg',      category: 'density', label: 'Brix ↔ SG',           short: 'Brix↔SG',  icon: ArrowLeftRight, description: 'Перевод между шкалой Brix и удельной плотностью' },
  { key: 'abv',          category: 'density', label: 'ABV — алкоголь',      short: 'ABV',      icon: Gauge,          description: 'Расчёт алкоголя по начальной и конечной плотности' },
  { key: 'temp-correct', category: 'density', label: 'Коррекция T',          short: 'Темп.',    icon: Thermometer,    description: 'Коррекция показаний ареометра на температуру' },
  { key: 'sugar-og',     category: 'density', label: 'Сахар → OG',           short: 'Сахар→OG', icon: Sparkles,       description: 'Какую плотность даст N грамм сахара в M литрах' },

  // carbonation
  { key: 'priming',      category: 'carb',    label: 'Прайминг',             short: 'Прайм.',   icon: Wind,           description: 'Сахар для естественной карбонизации в бутылках' },
  { key: 'keg',          category: 'carb',    label: 'Кеггинг',              short: 'Кег',      icon: Gauge,          description: 'Давление CO₂ для нужного уровня карбонизации' },
  { key: 'co2-styles',   category: 'carb',    label: 'Стили',                short: 'Стили',    icon: Sparkles,       description: 'Целевые объёмы CO₂ по стилям напитков' },

  // refractometer
  { key: 'refrac',       category: 'refrac',  label: 'Коррекция FG',         short: 'FG',       icon: TestTube,       description: 'Реальная FG из показаний рефрактометра (формула Terrill)' },

  // mash
  { key: 'strike',       category: 'mash',    label: 'Заливочная вода',     short: 'Strike',    icon: Thermometer,    description: 'Температура воды на затирание (формула Palmer)' },
  { key: 'volumes',      category: 'mash',    label: 'Объёмы',               short: 'Объёмы',    icon: Droplets,       description: 'Затор + промывка + испарение + preboil' },

  // water
  { key: 'water',        category: 'water',   label: 'Профиль и соли',       short: 'Вода',     icon: Beaker,         description: 'Профиль воды, добавки солей, анализ восприятия' },

  // quick beverages
  { key: 'kombucha',     category: 'quick',   label: 'Комбуча',              short: '🫖',      icon: Leaf,           description: 'Ферментация чая с сахаром (SCOBY)' },
  { key: 'lemonade',     category: 'quick',   label: 'Лимонад',              short: '🍋',      icon: Citrus,         description: 'Газировка с балансом сладости и кислотности' },
  { key: 'cider',        category: 'quick',   label: 'Сидр',                 short: '🍎',      icon: Apple,          description: 'Сидр из яблочного сока с дрожжами' },
  { key: 'mead',         category: 'quick',   label: 'Медовуха',             short: '🍯',      icon: Flame,          description: 'Ферментация мёда' },
  { key: 'kvass',        category: 'quick',   label: 'Квас',                 short: '🍶',      icon: Wheat,          description: 'Хлебная ферментация' },
]

const CATEGORIES: { key: CategoryKey; label: string; icon: ComponentType<{ size?: number; className?: string }>; color: string }[] = [
  { key: 'density', label: 'Плотность',     icon: Droplets,      color: 'amber' },
  { key: 'carb',    label: 'Карбонизация',   icon: Wind,         color: 'blue'  },
  { key: 'refrac',  label: 'Рефрактометр',   icon: TestTube,     color: 'green' },
  { key: 'mash',    label: 'Затирание',      icon: FlaskConical, color: 'amber' },
  { key: 'water',   label: 'Вода',           icon: Beaker,       color: 'blue'  },
  { key: 'quick',   label: 'Быстрые рецепты', icon: Beer,         color: 'amber' },
]

// ─── page ───────────────────────────────────────────────────────────────────

export default function CalculatorPage() {
  const [active, setActive] = useState<ToolKey>('brix-sg')
  const tool = TOOLS.find(t => t.key === active)!
  const category = CATEGORIES.find(c => c.key === tool.category)!
  const subTools = TOOLS.filter(t => t.category === tool.category)

  return (
    <div className="space-y-7 fade-in">
      {/* Header */}
      <header className="flex items-end justify-between gap-6 flex-wrap">
        <div>
          <span className="badge badge-amber inline-flex items-center gap-1.5 mb-3">
            <Calculator size={11} /> Brewing Tools
          </span>
          <h1 className="text-3xl lg:text-4xl font-bold text-white tracking-tight">
            Калькулятор <span className="text-gradient-amber">пивовара</span>
          </h1>
          <p className="text-sm text-white/45 mt-1.5 max-w-2xl">
            16 инструментов для варки и контроля брожения
          </p>
        </div>
        <div className="text-xs text-white/30 hidden lg:block">
          <span className="text-white/55">{tool.label}</span>
          <ChevronRight size={11} className="inline mx-1 -translate-y-px" />
          <span>{TOOLS.length} калькуляторов</span>
        </div>
      </header>

      {/* Category nav */}
      <nav className="glass p-1.5 rounded-2xl flex gap-1 overflow-x-auto">
        {CATEGORIES.map((c) => {
          const isActive = c.key === tool.category
          const firstTool = TOOLS.find(t => t.category === c.key)!
          return (
            <button
              key={c.key}
              onClick={() => setActive(firstTool.key)}
              className={`
                flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium
                whitespace-nowrap transition-all duration-200
                ${isActive
                  ? 'bg-gradient-to-r from-amber-500/25 to-orange-500/15 text-amber-200 border border-amber-500/30 shadow-lg shadow-amber-500/10'
                  : 'text-white/55 hover:text-white hover:bg-white/5 border border-transparent'}
              `}
            >
              <c.icon size={15} />
              {c.label}
            </button>
          )
        })}
      </nav>

      {/* Sub-tool nav (chips) */}
      {subTools.length > 1 && (
        <div className="flex gap-2 flex-wrap">
          {subTools.map((t) => {
            const isActive = t.key === active
            const Icon = t.icon
            return (
              <button
                key={t.key}
                onClick={() => setActive(t.key)}
                className={`
                  flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-medium
                  border transition-all duration-200
                  ${isActive
                    ? 'bg-white/10 border-white/25 text-white'
                    : 'bg-transparent border-white/10 text-white/50 hover:text-white hover:border-white/20'}
                `}
              >
                <Icon size={12} />
                {t.label}
              </button>
            )
          })}
        </div>
      )}

      {/* Active tool */}
      <div key={active} className="fade-in">
        <ActiveTool toolKey={active} />
      </div>
    </div>
  )
}

// ─── Active tool dispatcher ─────────────────────────────────────────────────

function ActiveTool({ toolKey }: { toolKey: ToolKey }) {
  switch (toolKey) {
    case 'brix-sg':      return <BrixSGTool />
    case 'abv':          return <ABVTool />
    case 'temp-correct': return <TempCorrectTool />
    case 'sugar-og':     return <SugarOGTool />
    case 'priming':      return <PrimingTool />
    case 'keg':          return <KegTool />
    case 'co2-styles':   return <CO2StylesTool />
    case 'refrac':       return <RefracTool />
    case 'strike':       return <StrikeTool />
    case 'volumes':      return <VolumesTool />
    case 'water':        return <WaterTool />
    case 'kombucha':     return <KombuchaTool />
    case 'lemonade':     return <LemonadeTool />
    case 'cider':        return <CiderTool />
    case 'mead':         return <MeadTool />
    case 'kvass':        return <KvassTool />
  }
}

// ─── shared layout primitives ───────────────────────────────────────────────

function ToolShell({
  toolKey,
  inputs,
  result,
  stats,
  footer,
}: {
  toolKey: ToolKey
  inputs: React.ReactNode
  result: React.ReactNode
  stats?: React.ReactNode
  footer?: React.ReactNode
}) {
  const tool = TOOLS.find(t => t.key === toolKey)!
  const Icon = tool.icon
  return (
    <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,2fr)_minmax(0,3fr)] gap-6">
      {/* Inputs panel */}
      <section className="glass p-7">
        <div className="flex items-center gap-3 mb-1">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-amber-500/20 to-orange-500/10 border border-amber-500/20 flex items-center justify-center">
            <Icon size={16} className="text-amber-300" />
          </div>
          <h2 className="text-base font-semibold text-white">{tool.label}</h2>
        </div>
        <p className="text-[12.5px] text-white/45 mb-6 leading-relaxed">{tool.description}</p>
        <div className="space-y-4">{inputs}</div>
      </section>

      {/* Result panel */}
      <section className="glass p-7 relative overflow-hidden">
        <div
          aria-hidden
          className="absolute -top-32 -right-32 w-64 h-64 rounded-full opacity-20 blur-3xl pointer-events-none"
          style={{ background: 'radial-gradient(circle, rgba(251, 191, 36, 0.5), transparent 70%)' }}
        />
        <div className="relative">
          {result}
          {stats && <div className="mt-7 pt-6 border-t border-white/5">{stats}</div>}
          {footer && <div className="mt-6 pt-5 border-t border-white/5">{footer}</div>}
        </div>
      </section>
    </div>
  )
}

function Field({
  label, value, onChange, suffix, step = 1,
}: {
  label: string
  value: number
  onChange: (v: number) => void
  suffix?: string
  step?: number
}) {
  return (
    <label className="block">
      <span className="text-[10.5px] text-white/55 uppercase tracking-[0.1em] font-semibold">{label}</span>
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
      <span className="text-[10.5px] text-white/55 uppercase tracking-[0.1em] font-semibold">{label}</span>
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

function Hero({
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
    <div className="text-center py-4">
      <p className="text-[10.5px] uppercase tracking-[0.18em] text-white/45 font-semibold">{label}</p>
      <div className="mt-3 flex items-baseline justify-center gap-2.5">
        <span className={`text-6xl lg:text-7xl font-bold leading-none tracking-tight ${grad}`}>
          {value}
        </span>
        {unit && <span className="text-2xl text-white/45 font-medium">{unit}</span>}
      </div>
      {sub && <p className="text-[13px] text-white/45 mt-3">{sub}</p>}
    </div>
  )
}

function DualHero({
  left, right,
}: {
  left:  { label: string; value: string; unit?: string; accent?: 'amber' | 'blue' | 'green' }
  right: { label: string; value: string; unit?: string; accent?: 'amber' | 'blue' | 'green' }
}) {
  return (
    <div className="grid grid-cols-2 gap-4 py-4">
      <SmallHero {...left} />
      <SmallHero {...right} />
    </div>
  )
}

function SmallHero({
  label, value, unit, accent = 'amber',
}: {
  label: string
  value: string
  unit?: string
  accent?: 'amber' | 'blue' | 'green'
}) {
  const grad = {
    amber: 'text-gradient-amber',
    blue:  'text-gradient-blue',
    green: 'text-gradient-green',
  }[accent]
  return (
    <div className="text-center py-2 px-2">
      <p className="text-[10px] uppercase tracking-[0.15em] text-white/40 font-semibold">{label}</p>
      <div className="mt-2 flex items-baseline justify-center gap-1.5">
        <span className={`text-4xl lg:text-5xl font-bold leading-none tracking-tight ${grad}`}>
          {value}
        </span>
        {unit && <span className="text-base text-white/40 font-medium">{unit}</span>}
      </div>
    </div>
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
  const color = accent ? {
    amber: 'text-amber-300',
    blue:  'text-blue-300',
    green: 'text-emerald-300',
    red:   'text-red-300',
  }[accent] : 'text-white'
  return (
    <div className="bg-white/[0.025] border border-white/[0.06] rounded-xl px-4 py-3.5">
      <p className="text-[10px] uppercase tracking-wider text-white/40 font-medium">{label}</p>
      <p className={`text-lg font-bold mt-1 leading-none ${color}`}>{value}</p>
      {sub && <p className="text-[10.5px] text-white/35 mt-1.5">{sub}</p>}
    </div>
  )
}

function StatGrid({ cols = 3, children }: { cols?: 2 | 3 | 4; children: React.ReactNode }) {
  const cls = { 2: 'grid-cols-2', 3: 'grid-cols-2 sm:grid-cols-3', 4: 'grid-cols-2 sm:grid-cols-4' }[cols]
  return <div className={`grid ${cls} gap-2.5`}>{children}</div>
}

// ─── TOOLS ──────────────────────────────────────────────────────────────────

function BrixSGTool() {
  const [brix, setBrix] = useState(12)
  const [sg, setSg]     = useState(1.048)
  const sgFromBrix = brixToSG(brix)
  const brixFromSg = sgToBrix(sg)
  return (
    <ToolShell
      toolKey="brix-sg"
      inputs={
        <>
          <Field label="Brix" value={brix} onChange={setBrix} suffix="°Bx" step={0.1} />
          <Field label="SG"   value={sg}   onChange={setSg}   step={0.001} />
          <p className="text-[11px] text-white/35 leading-relaxed pt-2">
            Brix — массовая доля сахара в %, SG — отношение плотности раствора к воде.
            Для пива и сусла используются обе шкалы.
          </p>
        </>
      }
      result={<DualHero
        left={{  label: 'Brix → SG', value: sgFromBrix.toFixed(4), accent: 'amber' }}
        right={{ label: 'SG → Brix', value: brixFromSg.toFixed(2), unit: '°Bx', accent: 'amber' }}
      />}
    />
  )
}

function ABVTool() {
  const [og, setOg] = useState(1.060)
  const [fg, setFg] = useState(1.012)
  const abv = calcABV(og, fg)
  const att = og > 1 ? Math.round(((og - fg) / (og - 1)) * 1000) / 10 : 0
  return (
    <ToolShell
      toolKey="abv"
      inputs={
        <>
          <Field label="OG (начальная плотность)" value={og} onChange={setOg} step={0.001} />
          <Field label="FG (конечная плотность)"   value={fg} onChange={setFg} step={0.001} />
          <p className="text-[11px] text-white/35 leading-relaxed pt-2">
            Формула Miller: ABV = (OG − FG) × 131.25. Точность ±0.3% для OG &lt; 1.080.
          </p>
        </>
      }
      result={<Hero label="ABV — содержание алкоголя" value={abv.toFixed(2)} unit="%" accent="blue" />}
      stats={
        <StatGrid cols={2}>
          <Stat label="Аттенюация"   value={`${att.toFixed(1)} %`}                      sub="процент сбраживания" accent="green" />
          <Stat label="Точек ферм." value={`${Math.round((og - fg) * 1000)}`}          sub="разница в SG points" accent="amber" />
        </StatGrid>
      }
    />
  )
}

function TempCorrectTool() {
  const [sgMeas, setSgMeas]   = useState(1.060)
  const [tSample, setTSample] = useState(30)
  const [tCalib, setTCalib]   = useState(20)
  const corrected = correctSGforTemp(sgMeas, tSample, tCalib)
  const delta = (corrected - sgMeas) * 1000
  return (
    <ToolShell
      toolKey="temp-correct"
      inputs={
        <>
          <Field label="SG измеренная" value={sgMeas}  onChange={setSgMeas}  step={0.001} />
          <Field label="T образца"      value={tSample} onChange={setTSample} suffix="°C" />
          <Field label="T калибровки"   value={tCalib}  onChange={setTCalib}  suffix="°C" />
          <p className="text-[11px] text-white/35 leading-relaxed pt-2">
            Если измерял плотность горячим суслом — фактическая SG отличается. Полином NBS.
          </p>
        </>
      }
      result={<Hero
        label="Скорректированная SG"
        value={corrected.toFixed(4)}
        accent="green"
        sub={`Δ ${delta >= 0 ? '+' : ''}${delta.toFixed(1)} pts`}
      />}
    />
  )
}

function SugarOGTool() {
  const [sugarG, setSugarG] = useState(1000)
  const [volL, setVolL]     = useState(20)
  const og = calcOGFromSugar(sugarG, volL)
  const fg = calcFG(og, 75)
  const abv = calcABV(og, fg)
  return (
    <ToolShell
      toolKey="sugar-og"
      inputs={
        <>
          <Field label="Сахар" value={sugarG} onChange={setSugarG} suffix="г" />
          <Field label="Объём" value={volL}   onChange={setVolL}   suffix="л" />
          <p className="text-[11px] text-white/35 leading-relaxed pt-2">
            ≈ 0.00038 SG-points на г/л сахарозы. Для медовухи, кваса, сидра.
          </p>
        </>
      }
      result={<Hero label="OG из сахара" value={og.toFixed(4)} accent="amber" />}
      stats={
        <StatGrid cols={3}>
          <Stat label="Brix"       value={`${sgToBrix(og).toFixed(1)} °Bx`} />
          <Stat label="г/л"        value={`${(sugarG / volL).toFixed(0)}`} />
          <Stat label="ABV (75%)"  value={`${abv.toFixed(2)} %`}        accent="blue" />
        </StatGrid>
      }
    />
  )
}

function PrimingTool() {
  const [batchL, setBatchL]       = useState(20)
  const [targetCO2, setTargetCO2] = useState(2.4)
  const [maxFermT, setMaxFermT]   = useState(20)
  const [sugar, setSugar]         = useState<PrimingSugarType>('sucrose')
  const r = calcPrimingSugar(batchL, targetCO2, maxFermT, sugar)
  return (
    <ToolShell
      toolKey="priming"
      inputs={
        <>
          <Field label="Объём пива"        value={batchL}    onChange={setBatchL}    suffix="л" />
          <Field label="Целевая CO₂"        value={targetCO2} onChange={setTargetCO2} suffix="vol" step={0.1} />
          <Field label="Макс. T при ферм."  value={maxFermT}  onChange={setMaxFermT}  suffix="°C" />
          <SelectField
            label="Тип сахара"
            value={sugar}
            onChange={setSugar}
            options={(Object.keys(PRIMING_SUGAR_LABELS) as PrimingSugarType[]).map(k => ({ value: k, label: PRIMING_SUGAR_LABELS[k] }))}
          />
        </>
      }
      result={<Hero label="Сахар на партию" value={r.grams.toFixed(1)} unit="г" />}
      stats={
        <StatGrid cols={3}>
          <Stat label="На литр"         value={`${(r.grams / batchL).toFixed(1)} г/л`} />
          <Stat label="Остаточный CO₂"  value={`${r.residualCO2}`}                       sub="vol после ферментации" />
          <Stat label="Δ нужно добавить" value={`${(targetCO2 - r.residualCO2).toFixed(2)}`} sub="vol" accent="amber" />
        </StatGrid>
      }
      footer={
        <p className="text-[11px] text-white/40 leading-relaxed">
          💡 Растворить сахар в малом объёме кипятка, остудить, аккуратно влить в пиво при разливе.
          Карбонизация — 2-3 недели при комнатной T.
        </p>
      }
    />
  )
}

function KegTool() {
  const [t, setT]     = useState(4)
  const [co2, setCo2] = useState(2.4)
  const psi = calcKegPressure(co2, t)
  return (
    <ToolShell
      toolKey="keg"
      inputs={
        <>
          <Field label="T кега"        value={t}   onChange={setT}   suffix="°C" />
          <Field label="Целевая CO₂"    value={co2} onChange={setCo2} suffix="vol" step={0.1} />
          <p className="text-[11px] text-white/35 leading-relaxed pt-2">
            ⚠ При повышении температуры нужно поднимать давление пропорционально.
          </p>
        </>
      }
      result={<Hero label="Давление" value={psi.toFixed(1)} unit="PSI" accent="blue" />}
      stats={
        <StatGrid cols={2}>
          <Stat label="В барах"  value={`${(psi * 0.0689476).toFixed(2)} bar`} />
          <Stat label="В атм."   value={`${(psi * 0.068046).toFixed(2)} atm`} />
        </StatGrid>
      }
    />
  )
}

function CO2StylesTool() {
  return (
    <div className="glass p-7">
      <div className="flex items-center gap-3 mb-2">
        <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-amber-500/20 to-orange-500/10 border border-amber-500/20 flex items-center justify-center">
          <Sparkles size={16} className="text-amber-300" />
        </div>
        <h2 className="text-base font-semibold text-white">Целевые объёмы CO₂ по стилям</h2>
      </div>
      <p className="text-[12.5px] text-white/45 mb-6 ml-12">
        Справочные диапазоны карбонизации для разных типов напитков
      </p>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
        {TARGET_CO2_VOLUMES.map(({ style, min, max }) => (
          <div key={style} className="bg-white/[0.025] border border-white/[0.06] rounded-xl px-4 py-3 flex items-center justify-between">
            <span className="text-sm text-white/75">{style}</span>
            <span className="text-sm font-mono font-bold text-amber-300">{min}–{max}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

function RefracTool() {
  const [ob, setOb]   = useState(14)
  const [fb, setFb]   = useState(7)
  const [wcf, setWcf] = useState(1.04)
  const r = useMemo(() => refractometerFG(ob, fb, wcf), [ob, fb, wcf])
  return (
    <ToolShell
      toolKey="refrac"
      inputs={
        <>
          <Field label="Brix до брожения (OB)" value={ob}  onChange={setOb}  suffix="°Bx" step={0.1} />
          <Field label="Brix после (FB)"        value={fb}  onChange={setFb}  suffix="°Bx" step={0.1} />
          <Field label="WCF — поправка сусла"   value={wcf} onChange={setWcf} step={0.01} />
          <p className="text-[11px] text-white/35 leading-relaxed pt-2">
            Рефрактометр показывает завышенно при наличии алкоголя. Формула Sean Terrill (кубический полином) восстанавливает реальную FG.
          </p>
        </>
      }
      result={<DualHero
        left={{  label: 'OG',         value: r.og.toFixed(4),  accent: 'amber' }}
        right={{ label: 'FG (true)',  value: r.fg.toFixed(4),  accent: 'amber' }}
      />}
      stats={
        <StatGrid cols={2}>
          <Stat label="ABV"        value={`${r.abv.toFixed(2)} %`}                 accent="blue"  />
          <Stat label="Аттенюация" value={`${r.apparentAttenuation.toFixed(1)} %`} accent="green" />
        </StatGrid>
      }
      footer={
        <p className="text-[11px] text-white/40 leading-relaxed">
          💡 WCF обычно 1.02–1.06. Калибруется так: измерь сусло до варки одновременно
          рефрактометром и ареометром, подбери WCF чтобы OG совпала.
        </p>
      }
    />
  )
}

function StrikeTool() {
  const [grainT, setGrainT] = useState(20)
  const [mashT, setMashT]   = useState(67)
  const [ratio, setRatio]   = useState(3.0)
  const t = calcStrikeTemp(grainT, mashT, ratio)
  return (
    <ToolShell
      toolKey="strike"
      inputs={
        <>
          <Field label="T зерна"   value={grainT} onChange={setGrainT} suffix="°C" />
          <Field label="T затора"  value={mashT}  onChange={setMashT}  suffix="°C" />
          <Field label="Соотн. R"  value={ratio}  onChange={setRatio}  suffix="л/кг" step={0.1} />
          <p className="text-[11px] text-white/35 leading-relaxed pt-2">
            R — литры воды на кг зерна. Стандарт 2.5–3.5 л/кг. Формула Palmer:
            T = (0.2/R) × (T_mash − T_grain) + T_mash.
          </p>
        </>
      }
      result={<Hero label="T заливочной воды" value={t.toFixed(1)} unit="°C" />}
      footer={
        <p className="text-[11px] text-white/40 leading-relaxed">
          💡 Учитывай теплопотери чана — обычно лей на 1-2°C горячее расчётной T.
        </p>
      }
    />
  )
}

function VolumesTool() {
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
    <ToolShell
      toolKey="volumes"
      inputs={
        <>
          <Field label="Зерно"      value={grainKg} onChange={setGrainKg} suffix="кг" step={0.1} />
          <Field label="Партия"     value={batchL}  onChange={setBatchL}  suffix="л" />
          <Field label="Кипячение"   value={boilMin} onChange={setBoilMin} suffix="мин" />
          <p className="text-[11px] text-white/35 leading-relaxed pt-2">
            Стандартные значения: 3 л/кг затирание, 0.96 л/кг поглощение, 10%/час испарение.
          </p>
        </>
      }
      result={<Hero label="Промывная вода" value={`${sparge}`} unit="л" accent="blue" />}
      stats={
        <StatGrid cols={4}>
          <Stat label="Затирание"   value={`${mashWater} л`} />
          <Stat label="Поглощено"   value={`${grainAbs} л`}  sub="зерном" />
          <Stat label="Испарение"    value={`${evapL} л`}     sub="за варку" />
          <Stat label="Preboil"      value={`${preboil} л`}   accent="amber" />
        </StatGrid>
      }
    />
  )
}

function WaterTool() {
  const [profile, setProfile]   = useState<WaterProfile>(DEFAULT_WATER_PROFILES[0].profile)
  const [saltKey, setSaltKey]   = useState(BREWING_SALTS[0].key)
  const [gPerL, setGPerL]       = useState(0.5)
  const updated  = useMemo(() => applySaltAddition(profile, saltKey, gPerL), [profile, saltKey, gPerL])
  const analysis = useMemo(() => analyzeWater(updated), [updated])
  const setKey = (k: keyof WaterProfile) => (v: number) => setProfile({ ...profile, [k]: v })

  return (
    <div className="space-y-6">
      {/* Profile + analysis side-by-side */}
      <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,2fr)_minmax(0,3fr)] gap-6">
        <section className="glass p-7">
          <div className="flex items-center gap-3 mb-1">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-500/20 to-purple-500/10 border border-blue-500/20 flex items-center justify-center">
              <Beaker size={16} className="text-blue-300" />
            </div>
            <h2 className="text-base font-semibold text-white">Профиль воды</h2>
          </div>
          <p className="text-[12.5px] text-white/45 mb-5 leading-relaxed">
            Ионный состав исходной воды (ppm)
          </p>

          <div className="flex flex-wrap gap-1.5 mb-5">
            {DEFAULT_WATER_PROFILES.map((p) => (
              <button
                key={p.name}
                onClick={() => setProfile(p.profile)}
                className="px-3 py-1.5 rounded-full text-[11px] font-medium border border-white/10 bg-white/[0.03] text-white/60 hover:text-white hover:bg-white/[0.08] hover:border-white/20 transition-all"
              >
                {p.name}
              </button>
            ))}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Field label="Ca²⁺"   value={profile.ca}   onChange={setKey('ca')}   suffix="ppm" />
            <Field label="Mg²⁺"   value={profile.mg}   onChange={setKey('mg')}   suffix="ppm" />
            <Field label="Na⁺"    value={profile.na}   onChange={setKey('na')}   suffix="ppm" />
            <Field label="Cl⁻"    value={profile.cl}   onChange={setKey('cl')}   suffix="ppm" />
            <Field label="SO₄²⁻"  value={profile.so4}  onChange={setKey('so4')}  suffix="ppm" />
            <Field label="HCO₃⁻"  value={profile.hco3} onChange={setKey('hco3')} suffix="ppm" />
          </div>
        </section>

        <section className="glass p-7 relative overflow-hidden">
          <div
            aria-hidden
            className="absolute -top-32 -right-32 w-64 h-64 rounded-full opacity-20 blur-3xl pointer-events-none"
            style={{ background: 'radial-gradient(circle, rgba(96, 165, 250, 0.5), transparent 70%)' }}
          />
          <div className="relative">
            <Hero
              label="SO₄ : Cl"
              value={analysis.sulfateChlorideRatio === 999 ? '∞' : analysis.sulfateChlorideRatio.toFixed(2)}
              accent={analysis.perception === 'balanced' ? 'green' : 'amber'}
              sub={analysis.perceptionLabel}
            />
            <div className="grid grid-cols-2 gap-2.5 mt-7 pt-6 border-t border-white/5">
              <Stat label="Щёлочность"      value={`${analysis.alkalinityCaCO3} ppm`}      sub="CaCO₃" />
              <Stat label="Общая жёсткость" value={`${analysis.totalHardnessCaCO3} ppm`} sub="CaCO₃" />
            </div>
            {analysis.warnings.length > 0 && (
              <div className="mt-6 pt-5 border-t border-white/5 space-y-2.5">
                {analysis.warnings.map((w, i) => (
                  <div key={i} className="flex items-start gap-2.5 text-[12px] text-amber-300/85">
                    <AlertTriangle size={13} className="mt-0.5 flex-shrink-0" />
                    <span className="leading-relaxed">{w}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>
      </div>

      {/* Salts panel */}
      <section className="glass p-7">
        <div className="flex items-center gap-3 mb-1">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-emerald-500/20 to-teal-500/10 border border-emerald-500/20 flex items-center justify-center">
            <Sparkles size={16} className="text-emerald-300" />
          </div>
          <h2 className="text-base font-semibold text-white">Добавки солей</h2>
        </div>
        <p className="text-[12.5px] text-white/45 mb-6 leading-relaxed">
          Сколько соли добавить и как изменится профиль
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          <SelectField
            label="Соль"
            value={saltKey}
            onChange={setSaltKey}
            options={BREWING_SALTS.map(s => ({ value: s.key, label: s.label }))}
          />
          <Field label="Доза" value={gPerL} onChange={setGPerL} suffix="г/л" step={0.1} />
        </div>

        <p className="text-[10.5px] text-white/45 uppercase tracking-wider font-semibold mb-3">
          Итоговый профиль (после добавления)
        </p>
        <div className="grid grid-cols-3 sm:grid-cols-6 gap-2.5">
          {(['ca','mg','na','cl','so4','hco3'] as const).map((k) => {
            const before = profile[k]
            const after = updated[k]
            const diff = after - before
            const labels: Record<typeof k, string> = { ca: 'Ca', mg: 'Mg', na: 'Na', cl: 'Cl', so4: 'SO₄', hco3: 'HCO₃' }
            return (
              <div key={k} className="bg-white/[0.025] border border-white/[0.06] rounded-xl px-3 py-3">
                <p className="text-[10px] text-white/40 uppercase tracking-wider font-medium">{labels[k]}</p>
                <p className="text-base font-bold text-white mt-0.5 leading-none">{after.toFixed(0)}</p>
                {diff !== 0 && (
                  <p className={`text-[10.5px] font-semibold mt-1 ${diff > 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                    {diff > 0 ? '+' : ''}{diff.toFixed(0)}
                  </p>
                )}
              </div>
            )
          })}
        </div>
      </section>
    </div>
  )
}

function KombuchaTool() {
  const [vol, setVol]     = useState(5)
  const [sugar, setSugar] = useState(350)
  const [tea, setTea]     = useState(25)
  const [t, setT]         = useState(24)
  const r = calcKombucha(vol, sugar, tea, t)
  return (
    <ToolShell
      toolKey="kombucha"
      inputs={
        <>
          <Field label="Объём"        value={vol}   onChange={setVol}   suffix="л" />
          <Field label="Сахар"        value={sugar} onChange={setSugar} suffix="г" />
          <Field label="Чай"          value={tea}   onChange={setTea}   suffix="г" />
          <Field label="T ферментации" value={t}    onChange={setT}     suffix="°C" />
        </>
      }
      result={<Hero label="1-я ферментация" value={`~${r.firstFermentDays}`} unit="дней" accent="green" sub={r.teaConcentration + ' чая'} />}
      stats={
        <StatGrid cols={3}>
          <Stat label="Сахар"      value={`${r.sugarPerLiter} г/л`} />
          <Stat label="2-я ферм."  value={`~${r.secondFermentDays} дн.`} />
          <Stat label="Алкоголь"   value={`< ${r.approxAlcohol.toFixed(2)} %`} accent="green" />
          <Stat label="Всего"      value={`~${r.estimatedFermentDays} дн.`} accent="amber" />
        </StatGrid>
      }
    />
  )
}

function LemonadeTool() {
  const [vol, setVol]     = useState(5)
  const [sugar, setSugar] = useState(400)
  const [juice, setJuice] = useState(15)
  const [acid, setAcid]   = useState(0)
  const r = calcLemonade(vol, sugar, juice, acid)
  const labels: Record<string, string> = {
    too_sweet: 'Слишком сладко', sweet: 'Сладко', balanced: 'Баланс', tart: 'Кисло', very_tart: 'Очень кисло',
  }
  const accent: 'green' | 'amber' = r.sweetnessBitterness === 'balanced' ? 'green' : 'amber'
  return (
    <ToolShell
      toolKey="lemonade"
      inputs={
        <>
          <Field label="Объём"   value={vol}   onChange={setVol}   suffix="л" />
          <Field label="Сахар"   value={sugar} onChange={setSugar} suffix="г" />
          <Field label="Сок"     value={juice} onChange={setJuice} suffix="%" />
          <Field label="Кислота" value={acid}  onChange={setAcid}  suffix="г" />
        </>
      }
      result={<Hero label="Баланс вкуса" value={labels[r.sweetnessBitterness]} accent={accent} sub={`SO/Acid = ${(r.sugarPerLiter / Math.max(r.acidityGramPerLiter * 10, 1)).toFixed(1)}`} />}
      stats={
        <StatGrid cols={3}>
          <Stat label="Сахар"        value={`${r.sugarPerLiter} г/л`} />
          <Stat label="Brix"         value={`${r.brix} °Bx`} />
          <Stat label="Кислотность"  value={`${r.acidityGramPerLiter} г/л`} accent="amber" />
        </StatGrid>
      }
    />
  )
}

function CiderTool() {
  const [juice, setJuice] = useState(20)
  const [vol, setVol]     = useState(20)
  const [sugar, setSugar] = useState(0)
  const [att, setAtt]     = useState(80)
  const og = calcCiderOG(juice, vol, sugar)
  const fg = calcFG(og, att)
  const abv = calcABV(og, fg)
  return (
    <ToolShell
      toolKey="cider"
      inputs={
        <>
          <Field label="Сок"          value={juice} onChange={setJuice} suffix="л" />
          <Field label="Объём"        value={vol}   onChange={setVol}   suffix="л" />
          <Field label="Доп. сахар"   value={sugar} onChange={setSugar} suffix="г" />
          <Field label="Аттенюация"   value={att}   onChange={setAtt}   suffix="%" />
        </>
      }
      result={<Hero label="ABV" value={abv.toFixed(2)} unit="%" accent="blue" />}
      stats={
        <StatGrid cols={2}>
          <Stat label="OG" value={og.toFixed(4)} accent="amber" />
          <Stat label="FG" value={fg.toFixed(4)} />
        </StatGrid>
      }
    />
  )
}

function MeadTool() {
  const [honey, setHoney] = useState(3)
  const [vol, setVol]     = useState(20)
  const [att, setAtt]     = useState(90)
  const og = calcMeadOG(honey, vol)
  const fg = calcFG(og, att)
  const abv = calcABV(og, fg)
  return (
    <ToolShell
      toolKey="mead"
      inputs={
        <>
          <Field label="Мёд"        value={honey} onChange={setHoney} suffix="кг" step={0.1} />
          <Field label="Объём"      value={vol}   onChange={setVol}   suffix="л" />
          <Field label="Аттенюация" value={att}   onChange={setAtt}   suffix="%" />
        </>
      }
      result={<Hero label="ABV" value={abv.toFixed(2)} unit="%" accent="blue" />}
      stats={
        <StatGrid cols={2}>
          <Stat label="OG" value={og.toFixed(4)} accent="amber" />
          <Stat label="FG" value={fg.toFixed(4)} />
        </StatGrid>
      }
    />
  )
}

function KvassTool() {
  const [bread, setBread] = useState(0.5)
  const [sugar, setSugar] = useState(150)
  const [vol, setVol]     = useState(10)
  const r = calcKvassStats(bread, sugar, vol)
  return (
    <ToolShell
      toolKey="kvass"
      inputs={
        <>
          <Field label="Хлеб"  value={bread} onChange={setBread} suffix="кг" step={0.1} />
          <Field label="Сахар" value={sugar} onChange={setSugar} suffix="г" />
          <Field label="Объём" value={vol}   onChange={setVol}   suffix="л" />
        </>
      }
      result={<Hero label="ABV" value={r.abv.toFixed(2)} unit="%" accent="blue" />}
      stats={
        <StatGrid cols={3}>
          <Stat label="OG"          value={r.og.toFixed(4)} accent="amber" />
          <Stat label="FG"          value={r.fg.toFixed(4)} />
          <Stat label="Сахар всего" value={`${r.totalSugarG.toFixed(0)} г`} />
        </StatGrid>
      }
    />
  )
}
