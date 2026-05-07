'use client'

import { useState, useMemo, type ComponentType } from 'react'
import {
  Calculator, Droplets, Wind, FlaskConical, TestTube, Beaker, Sparkles,
  AlertTriangle, ArrowLeftRight, Gauge, Thermometer, Beer, Apple, Wheat,
  Leaf, Citrus, Flame,
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

interface Tool {
  key: ToolKey
  group: string
  label: string
  icon: ComponentType<{ size?: number; className?: string }>
  description: string
}

const TOOLS: Tool[] = [
  { key: 'brix-sg',      group: 'Плотность',    label: 'Brix ↔ SG',          icon: ArrowLeftRight, description: 'Перевод между шкалой Brix и удельной плотностью' },
  { key: 'abv',          group: 'Плотность',    label: 'ABV — алкоголь',      icon: Gauge,          description: 'Расчёт алкоголя по OG и FG' },
  { key: 'temp-correct', group: 'Плотность',    label: 'Коррекция T',         icon: Thermometer,    description: 'Поправка ареометра на температуру' },
  { key: 'sugar-og',     group: 'Плотность',    label: 'Сахар → OG',          icon: Sparkles,       description: 'Какую OG даст N грамм сахара в M литрах' },

  { key: 'priming',      group: 'Карбонизация', label: 'Прайминг',            icon: Wind,           description: 'Сахар для естественной карбонизации в бутылках' },
  { key: 'keg',          group: 'Карбонизация', label: 'Кеггинг',             icon: Gauge,          description: 'Давление CO₂ для кега' },
  { key: 'co2-styles',   group: 'Карбонизация', label: 'CO₂ по стилям',       icon: Sparkles,       description: 'Справочные диапазоны карбонизации' },

  { key: 'refrac',       group: 'Рефрактометр', label: 'Коррекция FG',        icon: TestTube,       description: 'Реальная FG из показаний рефрактометра' },

  { key: 'strike',       group: 'Затирание',    label: 'Заливочная вода',     icon: Thermometer,    description: 'T воды для затирания (Palmer)' },
  { key: 'volumes',      group: 'Затирание',    label: 'Объёмы',              icon: Droplets,       description: 'Затор + промывка + испарение' },

  { key: 'water',        group: 'Вода',         label: 'Профиль и соли',      icon: Beaker,         description: 'Состав воды, соли, анализ восприятия' },

  { key: 'kombucha',     group: 'Рецепты',      label: 'Комбуча',             icon: Leaf,           description: 'Ферментация чая с сахаром (SCOBY)' },
  { key: 'lemonade',     group: 'Рецепты',      label: 'Лимонад',             icon: Citrus,         description: 'Газировка, баланс сладости и кислотности' },
  { key: 'cider',        group: 'Рецепты',      label: 'Сидр',                icon: Apple,          description: 'Сидр из яблочного сока' },
  { key: 'mead',         group: 'Рецепты',      label: 'Медовуха',            icon: Flame,          description: 'Ферментация мёда' },
  { key: 'kvass',        group: 'Рецепты',      label: 'Квас',                icon: Wheat,          description: 'Хлебная ферментация' },
]

const GROUPS = ['Плотность', 'Карбонизация', 'Рефрактометр', 'Затирание', 'Вода', 'Рецепты']

// ─── page ───────────────────────────────────────────────────────────────────

export default function CalculatorPage() {
  const [active, setActive] = useState<ToolKey>('brix-sg')

  return (
    <div className="fade-in">
      {/* Header */}
      <header className="mb-6">
        <div className="flex items-center gap-2.5 mb-2">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center">
            <Calculator size={16} className="text-black" />
          </div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Калькулятор пивовара</h1>
        </div>
        <p className="text-[13px] text-white/45">{TOOLS.length} инструментов для варки и контроля брожения</p>
      </header>

      {/* Layout: tool list (left) + active tool (right) */}
      <div className="grid grid-cols-1 lg:grid-cols-[260px_minmax(0,1fr)] gap-6 items-start">
        <ToolList active={active} onSelect={setActive} />
        <div key={active} className="fade-in">
          <ActiveTool toolKey={active} />
        </div>
      </div>
    </div>
  )
}

// ─── tool list (left sidebar) ───────────────────────────────────────────────

function ToolList({ active, onSelect }: { active: ToolKey; onSelect: (k: ToolKey) => void }) {
  return (
    <nav className="glass p-3 space-y-4 lg:sticky lg:top-4">
      {GROUPS.map((group) => (
        <div key={group}>
          <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-white/35 px-2 mb-1.5">
            {group}
          </p>
          <div className="space-y-0.5">
            {TOOLS.filter(t => t.group === group).map((t) => {
              const isActive = t.key === active
              return (
                <button
                  key={t.key}
                  onClick={() => onSelect(t.key)}
                  className={`
                    w-full flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-[13px]
                    transition-colors duration-150 text-left
                    ${isActive
                      ? 'bg-amber-500/15 text-amber-200 border border-amber-500/25'
                      : 'text-white/65 hover:text-white hover:bg-white/[0.04] border border-transparent'}
                  `}
                >
                  <t.icon size={14} className={isActive ? 'text-amber-300' : 'text-white/40'} />
                  <span className="font-medium">{t.label}</span>
                </button>
              )
            })}
          </div>
        </div>
      ))}
    </nav>
  )
}

// ─── dispatcher ─────────────────────────────────────────────────────────────

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

// ─── shared layout ──────────────────────────────────────────────────────────

function ToolCard({ toolKey, children }: { toolKey: ToolKey; children: React.ReactNode }) {
  const tool = TOOLS.find(t => t.key === toolKey)!
  const Icon = tool.icon
  return (
    <div className="max-w-[680px]">
      <div className="glass p-7">
        <div className="flex items-start gap-3 mb-5">
          <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center flex-shrink-0">
            <Icon size={17} className="text-amber-300" />
          </div>
          <div>
            <h2 className="text-[17px] font-semibold text-white leading-tight">{tool.label}</h2>
            <p className="text-[12.5px] text-white/45 mt-1 leading-relaxed">{tool.description}</p>
          </div>
        </div>
        {children}
      </div>
    </div>
  )
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-white/40 mb-2.5">
        {title}
      </p>
      {children}
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
      <span className="text-[10px] text-white/55 uppercase tracking-[0.1em] font-semibold">{label}</span>
      <div className="relative mt-1.5">
        <input
          type="number"
          step={step}
          value={value}
          onChange={(e) => onChange(parseFloat(e.target.value) || 0)}
          className="glass-input w-full pr-12 text-[14px] font-semibold"
        />
        {suffix && (
          <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[11px] text-white/35 font-medium pointer-events-none">
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
      <span className="text-[10px] text-white/55 uppercase tracking-[0.1em] font-semibold">{label}</span>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value as T)}
        className="glass-input w-full mt-1.5 text-[13px] font-medium cursor-pointer"
      >
        {options.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
      </select>
    </label>
  )
}

function FieldGrid({ cols = 2, children }: { cols?: 1 | 2 | 3; children: React.ReactNode }) {
  const cls = { 1: 'grid-cols-1', 2: 'grid-cols-1 sm:grid-cols-2', 3: 'grid-cols-1 sm:grid-cols-3' }[cols]
  return <div className={`grid ${cls} gap-3`}>{children}</div>
}

function Result({
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
  const glow = {
    amber: 'rgba(251, 191, 36, 0.25)',
    blue:  'rgba(96, 165, 250, 0.25)',
    green: 'rgba(52, 211, 153, 0.25)',
  }[accent]
  return (
    <div
      className="rounded-2xl px-5 py-6 text-center relative overflow-hidden border"
      style={{
        background: 'linear-gradient(180deg, rgba(255,255,255,0.04) 0%, rgba(255,255,255,0.01) 100%)',
        borderColor: 'rgba(255,255,255,0.08)',
      }}
    >
      <div
        aria-hidden
        className="absolute inset-0 opacity-60 pointer-events-none"
        style={{ background: `radial-gradient(ellipse at center top, ${glow}, transparent 70%)` }}
      />
      <div className="relative">
        <p className="text-[10px] uppercase tracking-[0.18em] text-white/45 font-semibold">{label}</p>
        <div className="mt-2 flex items-baseline justify-center gap-2">
          <span className={`text-5xl font-bold leading-none tracking-tight ${grad}`}>{value}</span>
          {unit && <span className="text-lg text-white/45 font-medium">{unit}</span>}
        </div>
      </div>
    </div>
  )
}

function DualResult({ a, b }: {
  a: { label: string; value: string; unit?: string; accent?: 'amber' | 'blue' | 'green' }
  b: { label: string; value: string; unit?: string; accent?: 'amber' | 'blue' | 'green' }
}) {
  return (
    <div className="grid grid-cols-2 gap-3">
      <Result {...a} />
      <Result {...b} />
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
    <div className="bg-white/[0.025] border border-white/[0.06] rounded-lg px-3.5 py-2.5">
      <p className="text-[9.5px] uppercase tracking-wider text-white/40 font-medium">{label}</p>
      <p className={`text-[15px] font-bold mt-0.5 leading-tight ${color}`}>{value}</p>
      {sub && <p className="text-[10px] text-white/35 mt-0.5">{sub}</p>}
    </div>
  )
}

function StatRow({ children }: { children: React.ReactNode }) {
  return <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">{children}</div>
}

function Hint({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-[11.5px] text-white/40 leading-relaxed">{children}</p>
  )
}

// ─── TOOLS ──────────────────────────────────────────────────────────────────

function BrixSGTool() {
  const [brix, setBrix] = useState(12)
  const [sg, setSg]     = useState(1.048)
  return (
    <ToolCard toolKey="brix-sg">
      <div className="space-y-5">
        <Section title="Параметры">
          <FieldGrid cols={2}>
            <Field label="Brix" value={brix} onChange={setBrix} suffix="°Bx" step={0.1} />
            <Field label="SG"   value={sg}   onChange={setSg}   step={0.001} />
          </FieldGrid>
        </Section>
        <Section title="Результат">
          <DualResult
            a={{ label: 'Brix → SG', value: brixToSG(brix).toFixed(4) }}
            b={{ label: 'SG → Brix', value: sgToBrix(sg).toFixed(2), unit: '°Bx' }}
          />
        </Section>
      </div>
    </ToolCard>
  )
}

function ABVTool() {
  const [og, setOg] = useState(1.060)
  const [fg, setFg] = useState(1.012)
  const abv = calcABV(og, fg)
  const att = og > 1 ? Math.round(((og - fg) / (og - 1)) * 1000) / 10 : 0
  return (
    <ToolCard toolKey="abv">
      <div className="space-y-5">
        <Section title="Плотность">
          <FieldGrid cols={2}>
            <Field label="OG" value={og} onChange={setOg} step={0.001} />
            <Field label="FG" value={fg} onChange={setFg} step={0.001} />
          </FieldGrid>
        </Section>
        <Section title="Алкоголь">
          <Result label="ABV" value={abv.toFixed(2)} unit="%" accent="blue" />
        </Section>
        <Section title="Дополнительно">
          <StatRow>
            <Stat label="Аттенюация"    value={`${att.toFixed(1)} %`}              accent="green" sub="процент сбраживания" />
            <Stat label="Точек ферм."  value={`${Math.round((og - fg) * 1000)}`}  accent="amber" sub="разница SG" />
          </StatRow>
        </Section>
        <Hint>Формула Miller: ABV = (OG − FG) × 131.25. Точность ±0.3% при OG &lt; 1.080.</Hint>
      </div>
    </ToolCard>
  )
}

function TempCorrectTool() {
  const [sgMeas, setSgMeas]   = useState(1.060)
  const [tSample, setTSample] = useState(30)
  const [tCalib, setTCalib]   = useState(20)
  const corrected = correctSGforTemp(sgMeas, tSample, tCalib)
  const delta = (corrected - sgMeas) * 1000
  return (
    <ToolCard toolKey="temp-correct">
      <div className="space-y-5">
        <Section title="Замеры">
          <FieldGrid cols={3}>
            <Field label="SG"        value={sgMeas}  onChange={setSgMeas}  step={0.001} />
            <Field label="T образца" value={tSample} onChange={setTSample} suffix="°C" />
            <Field label="T калибр." value={tCalib}  onChange={setTCalib}  suffix="°C" />
          </FieldGrid>
        </Section>
        <Section title="Скорректированная плотность">
          <Result
            label={`SG при ${tCalib}°C`}
            value={corrected.toFixed(4)}
            accent="green"
          />
          <p className="text-[11px] text-white/40 mt-2 text-center">
            Δ {delta >= 0 ? '+' : ''}{delta.toFixed(1)} pts от измеренного
          </p>
        </Section>
        <Hint>Если измерял плотность горячим суслом — фактическая SG отличается. Используется полином NBS.</Hint>
      </div>
    </ToolCard>
  )
}

function SugarOGTool() {
  const [sugarG, setSugarG] = useState(1000)
  const [volL, setVolL]     = useState(20)
  const og = calcOGFromSugar(sugarG, volL)
  const fg = calcFG(og, 75)
  const abv = calcABV(og, fg)
  return (
    <ToolCard toolKey="sugar-og">
      <div className="space-y-5">
        <Section title="Параметры">
          <FieldGrid cols={2}>
            <Field label="Сахар" value={sugarG} onChange={setSugarG} suffix="г" />
            <Field label="Объём" value={volL}   onChange={setVolL}   suffix="л" />
          </FieldGrid>
        </Section>
        <Section title="OG">
          <Result label="Начальная плотность" value={og.toFixed(4)} />
        </Section>
        <Section title="Дополнительно">
          <StatRow>
            <Stat label="Brix"       value={`${sgToBrix(og).toFixed(1)} °Bx`} />
            <Stat label="Концентр."  value={`${(sugarG / volL).toFixed(0)} г/л`} />
            <Stat label="ABV (75%)"  value={`${abv.toFixed(2)} %`} accent="blue" />
          </StatRow>
        </Section>
        <Hint>≈ 0.00038 SG-points на г/л сахарозы. Применимо для медовухи, кваса, сидра.</Hint>
      </div>
    </ToolCard>
  )
}

function PrimingTool() {
  const [batchL, setBatchL]       = useState(20)
  const [targetCO2, setTargetCO2] = useState(2.4)
  const [maxFermT, setMaxFermT]   = useState(20)
  const [sugar, setSugar]         = useState<PrimingSugarType>('sucrose')
  const r = calcPrimingSugar(batchL, targetCO2, maxFermT, sugar)
  return (
    <ToolCard toolKey="priming">
      <div className="space-y-5">
        <Section title="Параметры">
          <FieldGrid cols={2}>
            <Field label="Объём пива"        value={batchL}    onChange={setBatchL}    suffix="л" />
            <Field label="Целевая CO₂"        value={targetCO2} onChange={setTargetCO2} suffix="vol" step={0.1} />
            <Field label="Макс. T при ферм."  value={maxFermT}  onChange={setMaxFermT}  suffix="°C" />
            <SelectField
              label="Тип сахара"
              value={sugar}
              onChange={setSugar}
              options={(Object.keys(PRIMING_SUGAR_LABELS) as PrimingSugarType[]).map(k => ({ value: k, label: PRIMING_SUGAR_LABELS[k] }))}
            />
          </FieldGrid>
        </Section>
        <Section title="Сахар">
          <Result label="На партию" value={r.grams.toFixed(1)} unit="г" />
        </Section>
        <Section title="Детали">
          <StatRow>
            <Stat label="На литр"        value={`${(r.grams / batchL).toFixed(1)} г/л`} />
            <Stat label="Остаточный CO₂" value={`${r.residualCO2}`} sub="vol после ферм." />
            <Stat label="Δ нужно"         value={`${(targetCO2 - r.residualCO2).toFixed(2)} vol`} accent="amber" />
          </StatRow>
        </Section>
        <Hint>💡 Растворить сахар в кипятке, остудить, влить при разливе. Карбонизация 2-3 недели при комнатной T.</Hint>
      </div>
    </ToolCard>
  )
}

function KegTool() {
  const [t, setT]     = useState(4)
  const [co2, setCo2] = useState(2.4)
  const psi = calcKegPressure(co2, t)
  return (
    <ToolCard toolKey="keg">
      <div className="space-y-5">
        <Section title="Параметры">
          <FieldGrid cols={2}>
            <Field label="T кега"        value={t}   onChange={setT}   suffix="°C" />
            <Field label="Целевая CO₂"    value={co2} onChange={setCo2} suffix="vol" step={0.1} />
          </FieldGrid>
        </Section>
        <Section title="Давление">
          <Result label="На редукторе CO₂" value={psi.toFixed(1)} unit="PSI" accent="blue" />
        </Section>
        <Section title="В других единицах">
          <StatRow>
            <Stat label="Бар"    value={`${(psi * 0.0689476).toFixed(2)}`} />
            <Stat label="Атм."   value={`${(psi * 0.068046).toFixed(2)}`} />
            <Stat label="kPa"    value={`${(psi * 6.89476).toFixed(0)}`} />
          </StatRow>
        </Section>
        <Hint>⚠ При повышении T нужно поднимать давление. Хранить пиво холодным безопаснее.</Hint>
      </div>
    </ToolCard>
  )
}

function CO2StylesTool() {
  return (
    <ToolCard toolKey="co2-styles">
      <div className="space-y-1.5">
        {TARGET_CO2_VOLUMES.map(({ style, min, max }) => (
          <div key={style} className="bg-white/[0.025] border border-white/[0.06] rounded-lg px-4 py-2.5 flex items-center justify-between">
            <span className="text-[13px] text-white/75">{style}</span>
            <span className="text-[13px] font-mono font-semibold text-amber-300">{min}–{max}</span>
          </div>
        ))}
      </div>
    </ToolCard>
  )
}

function RefracTool() {
  const [ob, setOb]   = useState(14)
  const [fb, setFb]   = useState(7)
  const [wcf, setWcf] = useState(1.04)
  const r = useMemo(() => refractometerFG(ob, fb, wcf), [ob, fb, wcf])
  return (
    <ToolCard toolKey="refrac">
      <div className="space-y-5">
        <Section title="Замеры рефрактометра">
          <FieldGrid cols={3}>
            <Field label="Brix до (OB)"    value={ob}  onChange={setOb}  suffix="°Bx" step={0.1} />
            <Field label="Brix после (FB)" value={fb}  onChange={setFb}  suffix="°Bx" step={0.1} />
            <Field label="WCF"              value={wcf} onChange={setWcf} step={0.01} />
          </FieldGrid>
        </Section>
        <Section title="Скорректированные значения">
          <DualResult
            a={{ label: 'OG',          value: r.og.toFixed(4) }}
            b={{ label: 'FG (true)',   value: r.fg.toFixed(4) }}
          />
        </Section>
        <Section title="Прочее">
          <StatRow>
            <Stat label="ABV"        value={`${r.abv.toFixed(2)} %`}                 accent="blue" />
            <Stat label="Аттенюация" value={`${r.apparentAttenuation.toFixed(1)} %`} accent="green" />
          </StatRow>
        </Section>
        <Hint>💡 WCF (поправка сусла) обычно 1.02–1.06. Калибруй: измерь сусло перед варкой одновременно рефрактометром и ареометром.</Hint>
      </div>
    </ToolCard>
  )
}

function StrikeTool() {
  const [grainT, setGrainT] = useState(20)
  const [mashT, setMashT]   = useState(67)
  const [ratio, setRatio]   = useState(3.0)
  const t = calcStrikeTemp(grainT, mashT, ratio)
  return (
    <ToolCard toolKey="strike">
      <div className="space-y-5">
        <Section title="Параметры затора">
          <FieldGrid cols={3}>
            <Field label="T зерна"   value={grainT} onChange={setGrainT} suffix="°C" />
            <Field label="T затора"  value={mashT}  onChange={setMashT}  suffix="°C" />
            <Field label="Соотн. R"  value={ratio}  onChange={setRatio}  suffix="л/кг" step={0.1} />
          </FieldGrid>
        </Section>
        <Section title="Заливочная вода">
          <Result label="Температура" value={t.toFixed(1)} unit="°C" />
        </Section>
        <Hint>R — литры воды на кг зерна (стандарт 2.5–3.5). Учитывай теплопотери чана: лей на 1-2°C горячее.</Hint>
      </div>
    </ToolCard>
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
    <ToolCard toolKey="volumes">
      <div className="space-y-5">
        <Section title="Партия">
          <FieldGrid cols={3}>
            <Field label="Зерно"     value={grainKg} onChange={setGrainKg} suffix="кг" step={0.1} />
            <Field label="Партия"    value={batchL}  onChange={setBatchL}  suffix="л" />
            <Field label="Кипячение" value={boilMin} onChange={setBoilMin} suffix="мин" />
          </FieldGrid>
        </Section>
        <Section title="Промывная вода">
          <Result label="Sparge water" value={`${sparge}`} unit="л" accent="blue" />
        </Section>
        <Section title="Прочие объёмы">
          <StatRow>
            <Stat label="Затирание"  value={`${mashWater} л`} />
            <Stat label="Поглощено"  value={`${grainAbs} л`}  sub="зерном" />
            <Stat label="Испарение"   value={`${evapL} л`}     sub="за варку" />
            <Stat label="Preboil"     value={`${preboil} л`}   accent="amber" />
          </StatRow>
        </Section>
      </div>
    </ToolCard>
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
    <ToolCard toolKey="water">
      <div className="space-y-5">
        <Section title="Пресет">
          <div className="flex flex-wrap gap-1.5">
            {DEFAULT_WATER_PROFILES.map((p) => (
              <button
                key={p.name}
                onClick={() => setProfile(p.profile)}
                className="px-3 py-1.5 rounded-full text-[11px] font-medium border border-white/10 bg-white/[0.03] text-white/60 hover:text-white hover:bg-white/[0.08] hover:border-white/20 transition-colors"
              >
                {p.name}
              </button>
            ))}
          </div>
        </Section>

        <Section title="Профиль воды (ppm)">
          <FieldGrid cols={3}>
            <Field label="Ca²⁺"   value={profile.ca}   onChange={setKey('ca')}   suffix="ppm" />
            <Field label="Mg²⁺"   value={profile.mg}   onChange={setKey('mg')}   suffix="ppm" />
            <Field label="Na⁺"    value={profile.na}   onChange={setKey('na')}   suffix="ppm" />
            <Field label="Cl⁻"    value={profile.cl}   onChange={setKey('cl')}   suffix="ppm" />
            <Field label="SO₄²⁻"  value={profile.so4}  onChange={setKey('so4')}  suffix="ppm" />
            <Field label="HCO₃⁻"  value={profile.hco3} onChange={setKey('hco3')} suffix="ppm" />
          </FieldGrid>
        </Section>

        <Section title="Добавка соли">
          <FieldGrid cols={2}>
            <SelectField
              label="Соль"
              value={saltKey}
              onChange={setSaltKey}
              options={BREWING_SALTS.map(s => ({ value: s.key, label: s.label }))}
            />
            <Field label="Доза" value={gPerL} onChange={setGPerL} suffix="г/л" step={0.1} />
          </FieldGrid>
        </Section>

        <Section title="Итоговый профиль">
          <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
            {(['ca','mg','na','cl','so4','hco3'] as const).map((k) => {
              const before = profile[k]
              const after = updated[k]
              const diff = after - before
              const labels: Record<typeof k, string> = { ca: 'Ca', mg: 'Mg', na: 'Na', cl: 'Cl', so4: 'SO₄', hco3: 'HCO₃' }
              return (
                <div key={k} className="bg-white/[0.025] border border-white/[0.06] rounded-lg px-2.5 py-2">
                  <p className="text-[9.5px] text-white/40 uppercase tracking-wider font-medium">{labels[k]}</p>
                  <p className="text-[14px] font-bold text-white mt-0.5 leading-none">{after.toFixed(0)}</p>
                  {diff !== 0 && (
                    <p className={`text-[10px] font-semibold mt-0.5 ${diff > 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                      {diff > 0 ? '+' : ''}{diff.toFixed(0)}
                    </p>
                  )}
                </div>
              )
            })}
          </div>
        </Section>

        <Section title="Анализ">
          <div className="bg-white/[0.025] border border-white/[0.06] rounded-xl px-4 py-3.5">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-[10px] text-white/40 uppercase tracking-wider font-medium">SO₄ : Cl</p>
                <p className="text-xl font-bold text-amber-300 mt-0.5">
                  {analysis.sulfateChlorideRatio === 999 ? '∞' : analysis.sulfateChlorideRatio.toFixed(2)}
                </p>
              </div>
              <span className={`badge ${analysis.perception === 'balanced' ? 'badge-green' : 'badge-amber'}`}>
                {analysis.perceptionLabel}
              </span>
            </div>
            <div className="grid grid-cols-2 gap-2 mt-3 pt-3 border-t border-white/5">
              <Stat label="Щёлочность"      value={`${analysis.alkalinityCaCO3} ppm`}      sub="CaCO₃" />
              <Stat label="Общая жёсткость" value={`${analysis.totalHardnessCaCO3} ppm`} sub="CaCO₃" />
            </div>
          </div>
          {analysis.warnings.length > 0 && (
            <div className="mt-3 space-y-1.5">
              {analysis.warnings.map((w, i) => (
                <div key={i} className="flex items-start gap-2 text-[12px] text-amber-300/85 bg-amber-500/[0.04] border border-amber-500/15 rounded-lg px-3 py-2">
                  <AlertTriangle size={12} className="mt-0.5 flex-shrink-0" />
                  <span className="leading-relaxed">{w}</span>
                </div>
              ))}
            </div>
          )}
        </Section>
      </div>
    </ToolCard>
  )
}

function KombuchaTool() {
  const [vol, setVol]     = useState(5)
  const [sugar, setSugar] = useState(350)
  const [tea, setTea]     = useState(25)
  const [t, setT]         = useState(24)
  const r = calcKombucha(vol, sugar, tea, t)
  return (
    <ToolCard toolKey="kombucha">
      <div className="space-y-5">
        <Section title="Параметры">
          <FieldGrid cols={2}>
            <Field label="Объём"        value={vol}   onChange={setVol}   suffix="л" />
            <Field label="Сахар"        value={sugar} onChange={setSugar} suffix="г" />
            <Field label="Чай"          value={tea}   onChange={setTea}   suffix="г" />
            <Field label="T ферментации" value={t}    onChange={setT}     suffix="°C" />
          </FieldGrid>
        </Section>
        <Section title="Время брожения">
          <Result label="1-я ферментация" value={`~${r.firstFermentDays}`} unit="дней" accent="green" />
        </Section>
        <Section title="Параметры партии">
          <StatRow>
            <Stat label="Сахар"      value={`${r.sugarPerLiter} г/л`} />
            <Stat label="Чай"        value={r.teaConcentration} />
            <Stat label="2-я ферм."  value={`~${r.secondFermentDays} дн.`} />
            <Stat label="Алкоголь"   value={`< ${r.approxAlcohol.toFixed(2)} %`} accent="green" />
            <Stat label="Всего"      value={`~${r.estimatedFermentDays} дн.`} accent="amber" />
          </StatRow>
        </Section>
      </div>
    </ToolCard>
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
    <ToolCard toolKey="lemonade">
      <div className="space-y-5">
        <Section title="Параметры">
          <FieldGrid cols={2}>
            <Field label="Объём"   value={vol}   onChange={setVol}   suffix="л" />
            <Field label="Сахар"   value={sugar} onChange={setSugar} suffix="г" />
            <Field label="Сок"     value={juice} onChange={setJuice} suffix="%" />
            <Field label="Кислота" value={acid}  onChange={setAcid}  suffix="г" />
          </FieldGrid>
        </Section>
        <Section title="Баланс вкуса">
          <Result label="Восприятие" value={labels[r.sweetnessBitterness]} accent={accent} />
        </Section>
        <Section title="Концентрации">
          <StatRow>
            <Stat label="Сахар"        value={`${r.sugarPerLiter} г/л`} />
            <Stat label="Brix"         value={`${r.brix} °Bx`} />
            <Stat label="Кислотность"  value={`${r.acidityGramPerLiter} г/л`} accent="amber" />
          </StatRow>
        </Section>
      </div>
    </ToolCard>
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
    <ToolCard toolKey="cider">
      <div className="space-y-5">
        <Section title="Параметры">
          <FieldGrid cols={2}>
            <Field label="Сок"          value={juice} onChange={setJuice} suffix="л" />
            <Field label="Объём"        value={vol}   onChange={setVol}   suffix="л" />
            <Field label="Доп. сахар"   value={sugar} onChange={setSugar} suffix="г" />
            <Field label="Аттенюация"   value={att}   onChange={setAtt}   suffix="%" />
          </FieldGrid>
        </Section>
        <Section title="Алкоголь">
          <Result label="ABV" value={abv.toFixed(2)} unit="%" accent="blue" />
        </Section>
        <Section title="Плотность">
          <StatRow>
            <Stat label="OG" value={og.toFixed(4)} accent="amber" />
            <Stat label="FG" value={fg.toFixed(4)} />
          </StatRow>
        </Section>
      </div>
    </ToolCard>
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
    <ToolCard toolKey="mead">
      <div className="space-y-5">
        <Section title="Параметры">
          <FieldGrid cols={3}>
            <Field label="Мёд"        value={honey} onChange={setHoney} suffix="кг" step={0.1} />
            <Field label="Объём"      value={vol}   onChange={setVol}   suffix="л" />
            <Field label="Аттенюация" value={att}   onChange={setAtt}   suffix="%" />
          </FieldGrid>
        </Section>
        <Section title="Алкоголь">
          <Result label="ABV" value={abv.toFixed(2)} unit="%" accent="blue" />
        </Section>
        <Section title="Плотность">
          <StatRow>
            <Stat label="OG" value={og.toFixed(4)} accent="amber" />
            <Stat label="FG" value={fg.toFixed(4)} />
          </StatRow>
        </Section>
      </div>
    </ToolCard>
  )
}

function KvassTool() {
  const [bread, setBread] = useState(0.5)
  const [sugar, setSugar] = useState(150)
  const [vol, setVol]     = useState(10)
  const r = calcKvassStats(bread, sugar, vol)
  return (
    <ToolCard toolKey="kvass">
      <div className="space-y-5">
        <Section title="Параметры">
          <FieldGrid cols={3}>
            <Field label="Хлеб"  value={bread} onChange={setBread} suffix="кг" step={0.1} />
            <Field label="Сахар" value={sugar} onChange={setSugar} suffix="г" />
            <Field label="Объём" value={vol}   onChange={setVol}   suffix="л" />
          </FieldGrid>
        </Section>
        <Section title="Алкоголь">
          <Result label="ABV" value={r.abv.toFixed(2)} unit="%" accent="blue" />
        </Section>
        <Section title="Параметры партии">
          <StatRow>
            <Stat label="OG"          value={r.og.toFixed(4)} accent="amber" />
            <Stat label="FG"          value={r.fg.toFixed(4)} />
            <Stat label="Сахар всего" value={`${r.totalSugarG.toFixed(0)} г`} />
          </StatRow>
        </Section>
      </div>
    </ToolCard>
  )
}
