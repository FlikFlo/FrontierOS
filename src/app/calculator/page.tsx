'use client'

import { useState, useMemo, type ComponentType } from 'react'
import {
  Calculator, Droplets, Wind, FlaskConical, TestTube, Beaker, Sparkles,
  AlertTriangle, ArrowLeftRight, Gauge, Thermometer, Beer, Apple, Wheat,
  Leaf, Citrus, Flame, ArrowRight,
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

type CategoryKey = 'density' | 'carb' | 'refrac' | 'mash' | 'water' | 'recipes'
type Accent = 'amber' | 'blue' | 'emerald' | 'violet' | 'rose' | 'cyan'

interface Tool {
  key: ToolKey
  category: CategoryKey
  label: string
  icon: ComponentType<{ size?: number; className?: string }>
  description: string
  accent: Accent
}

const TOOLS: Tool[] = [
  { key: 'brix-sg',      category: 'density',  label: 'Brix ↔ SG',         icon: ArrowLeftRight, description: 'Перевод между шкалой Brix и удельной плотностью',         accent: 'amber'   },
  { key: 'abv',          category: 'density',  label: 'ABV',                icon: Gauge,          description: 'Алкоголь по начальной и конечной плотности',              accent: 'violet'  },
  { key: 'temp-correct', category: 'density',  label: 'Коррекция T',        icon: Thermometer,    description: 'Поправка ареометра на температуру измерения',             accent: 'emerald' },
  { key: 'sugar-og',     category: 'density',  label: 'Сахар → OG',         icon: Sparkles,       description: 'Какую начальную плотность даст N грамм сахара в M литрах', accent: 'amber'   },

  { key: 'priming',      category: 'carb',     label: 'Прайминг',           icon: Wind,           description: 'Сахар для естественной карбонизации в бутылках',          accent: 'cyan'    },
  { key: 'keg',          category: 'carb',     label: 'Кеггинг',            icon: Gauge,          description: 'Давление CO₂ для кеггинга',                                accent: 'blue'    },
  { key: 'co2-styles',   category: 'carb',     label: 'CO₂ по стилям',     icon: Sparkles,       description: 'Справочник целевых объёмов CO₂ для разных стилей',         accent: 'amber'   },

  { key: 'refrac',       category: 'refrac',   label: 'Коррекция FG',       icon: TestTube,       description: 'Реальная FG по показаниям рефрактометра при наличии алкоголя', accent: 'emerald' },

  { key: 'strike',       category: 'mash',     label: 'Заливочная вода',    icon: Thermometer,    description: 'Температура воды для затирания (формула Palmer)',         accent: 'rose'    },
  { key: 'volumes',      category: 'mash',     label: 'Объёмы воды',        icon: Droplets,       description: 'Затирание + поглощение + испарение + промывка',           accent: 'blue'    },

  { key: 'water',        category: 'water',    label: 'Профиль и соли',     icon: Beaker,         description: 'Состав воды, добавки солей, анализ восприятия',           accent: 'cyan'    },

  { key: 'kombucha',     category: 'recipes',  label: 'Комбуча',            icon: Leaf,           description: 'SCOBY-ферментация чая с сахаром',                          accent: 'emerald' },
  { key: 'lemonade',     category: 'recipes',  label: 'Лимонад',            icon: Citrus,         description: 'Газировка с балансом сладости и кислотности',             accent: 'amber'   },
  { key: 'cider',        category: 'recipes',  label: 'Сидр',               icon: Apple,          description: 'Сидр из яблочного сока с дрожжами',                       accent: 'rose'    },
  { key: 'mead',         category: 'recipes',  label: 'Медовуха',           icon: Flame,          description: 'Ферментация мёда с дрожжами',                              accent: 'amber'   },
  { key: 'kvass',        category: 'recipes',  label: 'Квас',               icon: Wheat,          description: 'Хлебная ферментация с минимальным алкоголем',             accent: 'amber'   },
]

const CATEGORIES: { key: CategoryKey; label: string; icon: ComponentType<{ size?: number; className?: string }> }[] = [
  { key: 'density',  label: 'Плотность',     icon: Droplets     },
  { key: 'carb',     label: 'Карбонизация',   icon: Wind         },
  { key: 'refrac',   label: 'Рефрактометр',   icon: TestTube     },
  { key: 'mash',     label: 'Затирание',      icon: FlaskConical },
  { key: 'water',    label: 'Вода',           icon: Beaker       },
  { key: 'recipes',  label: 'Рецепты',        icon: Beer         },
]

// ─── accent colour helpers ─────────────────────────────────────────────────

const ACCENT_GLOW: Record<Accent, string> = {
  amber:   'rgba(251, 191, 36, 0.35)',
  blue:    'rgba(96, 165, 250, 0.35)',
  emerald: 'rgba(52, 211, 153, 0.35)',
  violet:  'rgba(167, 139, 250, 0.35)',
  rose:    'rgba(251, 113, 133, 0.35)',
  cyan:    'rgba(34, 211, 238, 0.35)',
}

const ACCENT_GRAD: Record<Accent, string> = {
  amber:   'linear-gradient(135deg, #fbbf24, #f97316)',
  blue:    'linear-gradient(135deg, #60a5fa, #3b82f6)',
  emerald: 'linear-gradient(135deg, #34d399, #10b981)',
  violet:  'linear-gradient(135deg, #a78bfa, #8b5cf6)',
  rose:    'linear-gradient(135deg, #fb7185, #e11d48)',
  cyan:    'linear-gradient(135deg, #22d3ee, #0891b2)',
}

const ACCENT_BORDER: Record<Accent, string> = {
  amber:   'rgba(251, 191, 36, 0.25)',
  blue:    'rgba(96, 165, 250, 0.25)',
  emerald: 'rgba(52, 211, 153, 0.25)',
  violet:  'rgba(167, 139, 250, 0.25)',
  rose:    'rgba(251, 113, 133, 0.25)',
  cyan:    'rgba(34, 211, 238, 0.25)',
}

// ─── page ───────────────────────────────────────────────────────────────────

export default function CalculatorPage() {
  const [active, setActive] = useState<ToolKey>('brix-sg')
  const tool = TOOLS.find(t => t.key === active)!
  const subTools = TOOLS.filter(t => t.category === tool.category)

  return (
    <div className="fade-in max-w-[1100px] mx-auto">
      {/* Header */}
      <header className="mb-10 text-center">
        <span className="badge badge-amber inline-flex items-center gap-1.5 mb-4">
          <Calculator size={11} /> Brewing Tools
        </span>
        <h1 className="text-4xl lg:text-5xl font-bold tracking-tight">
          <span className="text-white">Калькулятор </span>
          <span className="text-gradient-amber">пивовара</span>
        </h1>
        <p className="text-[14px] text-white/45 mt-3">
          {TOOLS.length} инструментов для варки и контроля брожения
        </p>
      </header>

      {/* Primary nav: categories */}
      <nav className="mb-5">
        <div className="glass p-1.5 rounded-2xl flex gap-1 overflow-x-auto">
          {CATEGORIES.map((c) => {
            const isActive = c.key === tool.category
            const firstTool = TOOLS.find(t => t.category === c.key)!
            return (
              <button
                key={c.key}
                onClick={() => setActive(firstTool.key)}
                className={`
                  flex items-center gap-2 px-5 py-3 rounded-xl text-[13.5px] font-semibold
                  whitespace-nowrap transition-all duration-200 flex-1 justify-center min-w-fit
                  ${isActive
                    ? 'bg-gradient-to-br from-amber-500/20 to-orange-500/10 text-amber-200 shadow-lg shadow-amber-500/10 border border-amber-500/25'
                    : 'text-white/55 hover:text-white hover:bg-white/[0.04] border border-transparent'}
                `}
              >
                <c.icon size={15} />
                {c.label}
              </button>
            )
          })}
        </div>
      </nav>

      {/* Secondary nav: sub-tools (only if category has more than 1 tool) */}
      {subTools.length > 1 && (
        <div className="flex gap-2 flex-wrap mb-8 justify-center">
          {subTools.map((t) => {
            const isActive = t.key === active
            const Icon = t.icon
            return (
              <button
                key={t.key}
                onClick={() => setActive(t.key)}
                className={`
                  flex items-center gap-1.5 px-4 py-2 rounded-full text-[12.5px] font-medium
                  border transition-all duration-150
                  ${isActive
                    ? 'bg-white/[0.08] text-white border-white/20'
                    : 'bg-transparent border-white/[0.08] text-white/55 hover:text-white hover:bg-white/[0.04] hover:border-white/15'}
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

// ─── PRIMITIVES ─────────────────────────────────────────────────────────────

function ToolFrame({
  toolKey,
  inputs,
  result,
  hint,
}: {
  toolKey: ToolKey
  inputs: React.ReactNode
  result: React.ReactNode
  hint?: string
}) {
  const tool = TOOLS.find(t => t.key === toolKey)!
  const Icon = tool.icon

  return (
    <article className="relative glass overflow-hidden">
      {/* Top accent bar */}
      <div className="h-[3px] w-full" style={{ background: ACCENT_GRAD[tool.accent] }} />

      <div className="p-8 lg:p-10">
        {/* Header */}
        <div className="flex items-start gap-4 mb-8">
          <div
            className="w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0 border"
            style={{
              background: 'rgba(255,255,255,0.04)',
              borderColor: ACCENT_BORDER[tool.accent],
              boxShadow: `inset 0 0 24px ${ACCENT_GLOW[tool.accent]}`,
            }}
          >
            <Icon size={20} className="text-white" />
          </div>
          <div className="flex-1 pt-0.5">
            <h2 className="text-[19px] font-bold text-white leading-tight">{tool.label}</h2>
            <p className="text-[13px] text-white/50 mt-1 leading-relaxed">{tool.description}</p>
          </div>
        </div>

        {/* Inputs */}
        <div className="mb-8">{inputs}</div>

        {/* Arrow divider */}
        <div className="flex items-center justify-center mb-8">
          <div className="h-px flex-1 bg-gradient-to-r from-transparent via-white/10 to-transparent" />
          <div
            className="mx-4 w-9 h-9 rounded-full flex items-center justify-center border"
            style={{
              background: 'rgba(0,0,0,0.4)',
              borderColor: ACCENT_BORDER[tool.accent],
              boxShadow: `0 0 20px ${ACCENT_GLOW[tool.accent]}`,
            }}
          >
            <ArrowRight size={14} className="text-white/70 -rotate-90" />
          </div>
          <div className="h-px flex-1 bg-gradient-to-r from-transparent via-white/10 to-transparent" />
        </div>

        {/* Result */}
        {result}

        {/* Hint */}
        {hint && (
          <p className="text-[12px] text-white/40 leading-relaxed mt-8 pt-6 border-t border-white/[0.06]">
            {hint}
          </p>
        )}
      </div>
    </article>
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
      <span className="text-[10.5px] text-white/55 uppercase tracking-[0.12em] font-bold">{label}</span>
      <div className="relative mt-2">
        <input
          type="number"
          step={step}
          value={value}
          onChange={(e) => onChange(parseFloat(e.target.value) || 0)}
          className="w-full bg-white/[0.04] border border-white/10 rounded-xl px-4 py-3.5 pr-14 text-[18px] font-semibold text-white outline-none focus:border-amber-500/50 focus:bg-white/[0.06] focus:shadow-[0_0_0_4px_rgba(251,191,36,0.08)] transition-all"
        />
        {suffix && (
          <span className="absolute right-4 top-1/2 -translate-y-1/2 text-[12px] text-white/40 font-semibold pointer-events-none">
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
      <span className="text-[10.5px] text-white/55 uppercase tracking-[0.12em] font-bold">{label}</span>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value as T)}
        className="w-full mt-2 bg-white/[0.04] border border-white/10 rounded-xl px-4 py-3.5 text-[15px] font-semibold text-white outline-none focus:border-amber-500/50 focus:bg-white/[0.06] focus:shadow-[0_0_0_4px_rgba(251,191,36,0.08)] transition-all cursor-pointer"
      >
        {options.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
      </select>
    </label>
  )
}

function FieldGrid({ cols = 2, children }: { cols?: 1 | 2 | 3 | 4; children: React.ReactNode }) {
  const cls = {
    1: 'grid-cols-1',
    2: 'grid-cols-1 sm:grid-cols-2',
    3: 'grid-cols-1 sm:grid-cols-3',
    4: 'grid-cols-2 lg:grid-cols-4',
  }[cols]
  return <div className={`grid ${cls} gap-4`}>{children}</div>
}

function ResultPanel({
  primary, stats, accent = 'amber',
}: {
  primary: { label: string; value: string; unit?: string } | { dual: [
    { label: string; value: string; unit?: string },
    { label: string; value: string; unit?: string },
  ] }
  stats?: { label: string; value: string; sub?: string }[]
  accent?: Accent
}) {
  return (
    <div className="space-y-5">
      <div
        className="rounded-3xl px-8 py-10 text-center relative overflow-hidden border"
        style={{
          background: 'linear-gradient(180deg, rgba(255,255,255,0.04) 0%, rgba(255,255,255,0.01) 100%)',
          borderColor: ACCENT_BORDER[accent],
        }}
      >
        <div
          aria-hidden
          className="absolute inset-0 opacity-50 pointer-events-none"
          style={{ background: `radial-gradient(ellipse 80% 100% at center top, ${ACCENT_GLOW[accent]}, transparent 70%)` }}
        />
        <div className="relative">
          {'dual' in primary ? (
            <div className="grid grid-cols-2 gap-6 lg:gap-12">
              {primary.dual.map((p, i) => (
                <div key={i}>
                  <p className="text-[10.5px] uppercase tracking-[0.18em] text-white/45 font-bold">{p.label}</p>
                  <div className="mt-3 flex items-baseline justify-center gap-2">
                    <span
                      className="text-5xl lg:text-6xl font-bold leading-none tracking-tight"
                      style={{ background: ACCENT_GRAD[accent], WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}
                    >
                      {p.value}
                    </span>
                    {p.unit && <span className="text-xl text-white/45 font-semibold">{p.unit}</span>}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <>
              <p className="text-[10.5px] uppercase tracking-[0.18em] text-white/45 font-bold">{primary.label}</p>
              <div className="mt-3 flex items-baseline justify-center gap-3">
                <span
                  className="text-7xl lg:text-8xl font-bold leading-none tracking-tight"
                  style={{ background: ACCENT_GRAD[accent], WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}
                >
                  {primary.value}
                </span>
                {primary.unit && <span className="text-3xl text-white/45 font-semibold">{primary.unit}</span>}
              </div>
            </>
          )}
        </div>
      </div>

      {stats && stats.length > 0 && (
        <div className={`grid gap-3 ${stats.length === 2 ? 'grid-cols-2' : stats.length === 3 ? 'grid-cols-3' : 'grid-cols-2 sm:grid-cols-4'}`}>
          {stats.map((s, i) => (
            <div key={i} className="bg-white/[0.025] border border-white/[0.06] rounded-xl px-4 py-3.5">
              <p className="text-[10px] uppercase tracking-wider text-white/40 font-bold">{s.label}</p>
              <p className="text-lg font-bold mt-1 text-white leading-none">{s.value}</p>
              {s.sub && <p className="text-[10.5px] text-white/35 mt-1.5">{s.sub}</p>}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

// ─── TOOLS ──────────────────────────────────────────────────────────────────

function BrixSGTool() {
  const [brix, setBrix] = useState(12)
  const [sg, setSg]     = useState(1.048)
  return (
    <ToolFrame
      toolKey="brix-sg"
      inputs={
        <FieldGrid cols={2}>
          <Field label="Brix" value={brix} onChange={setBrix} suffix="°Bx" step={0.1} />
          <Field label="SG"   value={sg}   onChange={setSg}   step={0.001} />
        </FieldGrid>
      }
      result={
        <ResultPanel
          primary={{ dual: [
            { label: 'Brix → SG', value: brixToSG(brix).toFixed(4) },
            { label: 'SG → Brix', value: sgToBrix(sg).toFixed(2), unit: '°Bx' },
          ] }}
          accent="amber"
        />
      }
      hint="Brix — массовая доля сахара в %, SG — отношение плотности раствора к воде. В пивоварении используются обе шкалы взаимозаменяемо."
    />
  )
}

function ABVTool() {
  const [og, setOg] = useState(1.060)
  const [fg, setFg] = useState(1.012)
  const abv = calcABV(og, fg)
  const att = og > 1 ? Math.round(((og - fg) / (og - 1)) * 1000) / 10 : 0
  return (
    <ToolFrame
      toolKey="abv"
      inputs={
        <FieldGrid cols={2}>
          <Field label="OG (начальная плотность)" value={og} onChange={setOg} step={0.001} />
          <Field label="FG (конечная плотность)"   value={fg} onChange={setFg} step={0.001} />
        </FieldGrid>
      }
      result={
        <ResultPanel
          primary={{ label: 'ABV', value: abv.toFixed(2), unit: '%' }}
          stats={[
            { label: 'Аттенюация',   value: `${att.toFixed(1)} %`,                 sub: 'процент сбраживания' },
            { label: 'Точек ферм.',  value: `${Math.round((og - fg) * 1000)}`,     sub: 'разница SG points' },
          ]}
          accent="violet"
        />
      }
      hint="Формула Miller: ABV = (OG − FG) × 131.25. Точность ±0.3% при OG < 1.080."
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
    <ToolFrame
      toolKey="temp-correct"
      inputs={
        <FieldGrid cols={3}>
          <Field label="SG измеренная" value={sgMeas}  onChange={setSgMeas}  step={0.001} />
          <Field label="T образца"      value={tSample} onChange={setTSample} suffix="°C" />
          <Field label="T калибровки"   value={tCalib}  onChange={setTCalib}  suffix="°C" />
        </FieldGrid>
      }
      result={
        <ResultPanel
          primary={{ label: `SG при ${tCalib}°C`, value: corrected.toFixed(4) }}
          stats={[
            { label: 'Поправка',    value: `${delta >= 0 ? '+' : ''}${delta.toFixed(1)} pts` },
            { label: 'Изм. при',    value: `${tSample}°C` },
          ]}
          accent="emerald"
        />
      }
      hint="Если измерял плотность горячим суслом — фактическая SG отличается. Используется полином NBS."
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
    <ToolFrame
      toolKey="sugar-og"
      inputs={
        <FieldGrid cols={2}>
          <Field label="Сахар" value={sugarG} onChange={setSugarG} suffix="г" />
          <Field label="Объём" value={volL}   onChange={setVolL}   suffix="л" />
        </FieldGrid>
      }
      result={
        <ResultPanel
          primary={{ label: 'OG', value: og.toFixed(4) }}
          stats={[
            { label: 'Brix',       value: `${sgToBrix(og).toFixed(1)} °Bx` },
            { label: 'Концентр.',  value: `${(sugarG / volL).toFixed(0)} г/л` },
            { label: 'ABV (75%)',  value: `${abv.toFixed(2)} %` },
          ]}
          accent="amber"
        />
      }
      hint="≈ 0.00038 SG-points на г/л сахарозы. Применимо для медовухи, кваса, сидра, дополнительной сахаризации сусла."
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
    <ToolFrame
      toolKey="priming"
      inputs={
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
      }
      result={
        <ResultPanel
          primary={{ label: 'Сахар на партию', value: r.grams.toFixed(1), unit: 'г' }}
          stats={[
            { label: 'На литр',         value: `${(r.grams / batchL).toFixed(1)} г/л` },
            { label: 'Остаточный CO₂',  value: `${r.residualCO2}`,                      sub: 'vol после ферм.' },
            { label: 'Δ нужно',          value: `${(targetCO2 - r.residualCO2).toFixed(2)} vol` },
          ]}
          accent="cyan"
        />
      }
      hint="Растворить сахар в малом объёме кипятка, остудить, аккуратно влить в пиво при разливе. Карбонизация 2-3 недели при комнатной температуре."
    />
  )
}

function KegTool() {
  const [t, setT]     = useState(4)
  const [co2, setCo2] = useState(2.4)
  const psi = calcKegPressure(co2, t)
  return (
    <ToolFrame
      toolKey="keg"
      inputs={
        <FieldGrid cols={2}>
          <Field label="T кега"        value={t}   onChange={setT}   suffix="°C" />
          <Field label="Целевая CO₂"    value={co2} onChange={setCo2} suffix="vol" step={0.1} />
        </FieldGrid>
      }
      result={
        <ResultPanel
          primary={{ label: 'Давление', value: psi.toFixed(1), unit: 'PSI' }}
          stats={[
            { label: 'Бар',  value: `${(psi * 0.0689476).toFixed(2)}` },
            { label: 'Атм.', value: `${(psi * 0.068046).toFixed(2)}` },
            { label: 'kPa',  value: `${(psi * 6.89476).toFixed(0)}` },
          ]}
          accent="blue"
        />
      }
      hint="При повышении температуры нужно поднимать давление пропорционально. Хранить пиво холодным безопаснее и вкуснее."
    />
  )
}

function CO2StylesTool() {
  return (
    <ToolFrame
      toolKey="co2-styles"
      inputs={
        <p className="text-[13px] text-white/50 leading-relaxed">
          Справочные диапазоны карбонизации (объёмы CO₂) для разных типов напитков.
          Используй как ориентир при выборе целевой карбонизации в калькуляторах прайминга и кеггинга.
        </p>
      }
      result={
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
          {TARGET_CO2_VOLUMES.map(({ style, min, max }) => (
            <div key={style} className="bg-white/[0.025] border border-white/[0.06] rounded-xl px-5 py-3.5 flex items-center justify-between">
              <span className="text-[14px] text-white/80 font-medium">{style}</span>
              <span className="text-[15px] font-mono font-bold text-amber-300">{min}–{max}</span>
            </div>
          ))}
        </div>
      }
    />
  )
}

function RefracTool() {
  const [ob, setOb]   = useState(14)
  const [fb, setFb]   = useState(7)
  const [wcf, setWcf] = useState(1.04)
  const r = useMemo(() => refractometerFG(ob, fb, wcf), [ob, fb, wcf])
  return (
    <ToolFrame
      toolKey="refrac"
      inputs={
        <FieldGrid cols={3}>
          <Field label="Brix до (OB)"    value={ob}  onChange={setOb}  suffix="°Bx" step={0.1} />
          <Field label="Brix после (FB)" value={fb}  onChange={setFb}  suffix="°Bx" step={0.1} />
          <Field label="WCF"              value={wcf} onChange={setWcf} step={0.01} />
        </FieldGrid>
      }
      result={
        <ResultPanel
          primary={{ dual: [
            { label: 'OG',          value: r.og.toFixed(4) },
            { label: 'FG (true)',   value: r.fg.toFixed(4) },
          ] }}
          stats={[
            { label: 'ABV',          value: `${r.abv.toFixed(2)} %` },
            { label: 'Аттенюация',   value: `${r.apparentAttenuation.toFixed(1)} %` },
          ]}
          accent="emerald"
        />
      }
      hint="Рефрактометр показывает завышенно при наличии алкоголя — формула Sean Terrill восстанавливает реальную SG. WCF (поправка сусла) обычно 1.02–1.06."
    />
  )
}

function StrikeTool() {
  const [grainT, setGrainT] = useState(20)
  const [mashT, setMashT]   = useState(67)
  const [ratio, setRatio]   = useState(3.0)
  const t = calcStrikeTemp(grainT, mashT, ratio)
  return (
    <ToolFrame
      toolKey="strike"
      inputs={
        <FieldGrid cols={3}>
          <Field label="T зерна"   value={grainT} onChange={setGrainT} suffix="°C" />
          <Field label="T затора"  value={mashT}  onChange={setMashT}  suffix="°C" />
          <Field label="Соотн. R"  value={ratio}  onChange={setRatio}  suffix="л/кг" step={0.1} />
        </FieldGrid>
      }
      result={
        <ResultPanel
          primary={{ label: 'T заливочной воды', value: t.toFixed(1), unit: '°C' }}
          accent="rose"
        />
      }
      hint="R — литры воды на кг зерна (стандарт 2.5–3.5). Учитывай теплопотери чана: лей на 1-2°C горячее расчётной T."
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
    <ToolFrame
      toolKey="volumes"
      inputs={
        <FieldGrid cols={3}>
          <Field label="Зерно"      value={grainKg} onChange={setGrainKg} suffix="кг" step={0.1} />
          <Field label="Партия"     value={batchL}  onChange={setBatchL}  suffix="л" />
          <Field label="Кипячение"   value={boilMin} onChange={setBoilMin} suffix="мин" />
        </FieldGrid>
      }
      result={
        <ResultPanel
          primary={{ label: 'Промывная вода', value: `${sparge}`, unit: 'л' }}
          stats={[
            { label: 'Затирание',   value: `${mashWater} л` },
            { label: 'Поглощено',   value: `${grainAbs} л`,  sub: 'зерном' },
            { label: 'Испарение',   value: `${evapL} л`,     sub: 'за варку' },
            { label: 'Preboil',      value: `${preboil} л` },
          ]}
          accent="blue"
        />
      }
      hint="Стандартные значения: 3 л/кг затирание, 0.96 л/кг поглощение зерном, 10%/час испарение."
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
    <ToolFrame
      toolKey="water"
      inputs={
        <div className="space-y-6">
          <div>
            <p className="text-[10.5px] text-white/55 uppercase tracking-[0.12em] font-bold mb-3">Пресет</p>
            <div className="flex flex-wrap gap-2">
              {DEFAULT_WATER_PROFILES.map((p) => (
                <button
                  key={p.name}
                  onClick={() => setProfile(p.profile)}
                  className="px-4 py-2 rounded-full text-[12px] font-medium border border-white/10 bg-white/[0.03] text-white/65 hover:text-white hover:bg-white/[0.06] hover:border-white/20 transition-colors"
                >
                  {p.name}
                </button>
              ))}
            </div>
          </div>

          <FieldGrid cols={3}>
            <Field label="Ca²⁺"   value={profile.ca}   onChange={setKey('ca')}   suffix="ppm" />
            <Field label="Mg²⁺"   value={profile.mg}   onChange={setKey('mg')}   suffix="ppm" />
            <Field label="Na⁺"    value={profile.na}   onChange={setKey('na')}   suffix="ppm" />
            <Field label="Cl⁻"    value={profile.cl}   onChange={setKey('cl')}   suffix="ppm" />
            <Field label="SO₄²⁻"  value={profile.so4}  onChange={setKey('so4')}  suffix="ppm" />
            <Field label="HCO₃⁻"  value={profile.hco3} onChange={setKey('hco3')} suffix="ppm" />
          </FieldGrid>

          <div>
            <p className="text-[10.5px] text-white/55 uppercase tracking-[0.12em] font-bold mb-3">Добавка соли</p>
            <FieldGrid cols={2}>
              <SelectField
                label="Соль"
                value={saltKey}
                onChange={setSaltKey}
                options={BREWING_SALTS.map(s => ({ value: s.key, label: s.label }))}
              />
              <Field label="Доза" value={gPerL} onChange={setGPerL} suffix="г/л" step={0.1} />
            </FieldGrid>
          </div>
        </div>
      }
      result={
        <div className="space-y-5">
          {/* Ratio hero */}
          <div
            className="rounded-3xl px-8 py-8 relative overflow-hidden border"
            style={{
              background: 'linear-gradient(180deg, rgba(255,255,255,0.04) 0%, rgba(255,255,255,0.01) 100%)',
              borderColor: ACCENT_BORDER.cyan,
            }}
          >
            <div
              aria-hidden
              className="absolute inset-0 opacity-50 pointer-events-none"
              style={{ background: `radial-gradient(ellipse 80% 100% at center top, ${ACCENT_GLOW.cyan}, transparent 70%)` }}
            />
            <div className="relative flex items-center justify-between gap-4 flex-wrap">
              <div>
                <p className="text-[10.5px] uppercase tracking-[0.18em] text-white/45 font-bold">SO₄ : Cl</p>
                <span
                  className="text-6xl font-bold leading-none tracking-tight mt-2 inline-block"
                  style={{ background: ACCENT_GRAD.cyan, WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}
                >
                  {analysis.sulfateChlorideRatio === 999 ? '∞' : analysis.sulfateChlorideRatio.toFixed(2)}
                </span>
              </div>
              <span className={`badge ${analysis.perception === 'balanced' ? 'badge-green' : 'badge-amber'} text-[12px]`}>
                {analysis.perceptionLabel}
              </span>
            </div>
          </div>

          {/* Updated profile grid */}
          <div>
            <p className="text-[10.5px] text-white/55 uppercase tracking-[0.12em] font-bold mb-3">Итоговый профиль</p>
            <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
              {(['ca','mg','na','cl','so4','hco3'] as const).map((k) => {
                const before = profile[k]
                const after = updated[k]
                const diff = after - before
                const labels: Record<typeof k, string> = { ca: 'Ca', mg: 'Mg', na: 'Na', cl: 'Cl', so4: 'SO₄', hco3: 'HCO₃' }
                return (
                  <div key={k} className="bg-white/[0.025] border border-white/[0.06] rounded-xl px-3 py-2.5 text-center">
                    <p className="text-[10px] text-white/40 uppercase tracking-wider font-bold">{labels[k]}</p>
                    <p className="text-[16px] font-bold text-white mt-1 leading-none">{after.toFixed(0)}</p>
                    {diff !== 0 && (
                      <p className={`text-[10px] font-semibold mt-1 ${diff > 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                        {diff > 0 ? '+' : ''}{diff.toFixed(0)}
                      </p>
                    )}
                  </div>
                )
              })}
            </div>
          </div>

          {/* Other stats */}
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-white/[0.025] border border-white/[0.06] rounded-xl px-4 py-3.5">
              <p className="text-[10px] uppercase tracking-wider text-white/40 font-bold">Щёлочность</p>
              <p className="text-lg font-bold mt-1 text-white leading-none">{analysis.alkalinityCaCO3} ppm</p>
              <p className="text-[10.5px] text-white/35 mt-1.5">CaCO₃</p>
            </div>
            <div className="bg-white/[0.025] border border-white/[0.06] rounded-xl px-4 py-3.5">
              <p className="text-[10px] uppercase tracking-wider text-white/40 font-bold">Общая жёсткость</p>
              <p className="text-lg font-bold mt-1 text-white leading-none">{analysis.totalHardnessCaCO3} ppm</p>
              <p className="text-[10.5px] text-white/35 mt-1.5">CaCO₃</p>
            </div>
          </div>

          {analysis.warnings.length > 0 && (
            <div className="space-y-2">
              {analysis.warnings.map((w, i) => (
                <div key={i} className="flex items-start gap-2.5 text-[12.5px] text-amber-300/85 bg-amber-500/[0.05] border border-amber-500/15 rounded-xl px-4 py-3">
                  <AlertTriangle size={13} className="mt-0.5 flex-shrink-0" />
                  <span className="leading-relaxed">{w}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      }
    />
  )
}

function KombuchaTool() {
  const [vol, setVol]     = useState(5)
  const [sugar, setSugar] = useState(350)
  const [tea, setTea]     = useState(25)
  const [t, setT]         = useState(24)
  const r = calcKombucha(vol, sugar, tea, t)
  return (
    <ToolFrame
      toolKey="kombucha"
      inputs={
        <FieldGrid cols={2}>
          <Field label="Объём"        value={vol}   onChange={setVol}   suffix="л" />
          <Field label="Сахар"        value={sugar} onChange={setSugar} suffix="г" />
          <Field label="Чай"          value={tea}   onChange={setTea}   suffix="г" />
          <Field label="T ферментации" value={t}    onChange={setT}     suffix="°C" />
        </FieldGrid>
      }
      result={
        <ResultPanel
          primary={{ label: '1-я ферментация', value: `~${r.firstFermentDays}`, unit: 'дней' }}
          stats={[
            { label: 'Сахар',     value: `${r.sugarPerLiter} г/л` },
            { label: 'Чай',       value: r.teaConcentration },
            { label: '2-я ферм.', value: `~${r.secondFermentDays} дн.` },
            { label: 'Алкоголь',  value: `< ${r.approxAlcohol.toFixed(2)} %` },
          ]}
          accent="emerald"
        />
      }
      hint="Tip: внести SCOBY при 24-28°C. После 1-й ферментации (комбуча) можно перевести на 2-ю с фруктами/специями для газации."
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
  return (
    <ToolFrame
      toolKey="lemonade"
      inputs={
        <FieldGrid cols={2}>
          <Field label="Объём"   value={vol}   onChange={setVol}   suffix="л" />
          <Field label="Сахар"   value={sugar} onChange={setSugar} suffix="г" />
          <Field label="Сок"     value={juice} onChange={setJuice} suffix="%" />
          <Field label="Кислота" value={acid}  onChange={setAcid}  suffix="г" />
        </FieldGrid>
      }
      result={
        <ResultPanel
          primary={{ label: 'Баланс вкуса', value: labels[r.sweetnessBitterness] }}
          stats={[
            { label: 'Сахар',        value: `${r.sugarPerLiter} г/л` },
            { label: 'Brix',         value: `${r.brix} °Bx` },
            { label: 'Кислотность',  value: `${r.acidityGramPerLiter} г/л` },
          ]}
          accent={r.sweetnessBitterness === 'balanced' ? 'emerald' : 'amber'}
        />
      }
      hint="Идеальное соотношение Sugar : Acid (10×) около 6–10. Карбонизация 3.5 vol CO₂ — стандарт для газировки."
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
    <ToolFrame
      toolKey="cider"
      inputs={
        <FieldGrid cols={2}>
          <Field label="Сок"          value={juice} onChange={setJuice} suffix="л" />
          <Field label="Объём"        value={vol}   onChange={setVol}   suffix="л" />
          <Field label="Доп. сахар"   value={sugar} onChange={setSugar} suffix="г" />
          <Field label="Аттенюация"   value={att}   onChange={setAtt}   suffix="%" />
        </FieldGrid>
      }
      result={
        <ResultPanel
          primary={{ label: 'ABV', value: abv.toFixed(2), unit: '%' }}
          stats={[
            { label: 'OG', value: og.toFixed(4) },
            { label: 'FG', value: fg.toFixed(4) },
          ]}
          accent="rose"
        />
      }
      hint="Типичный яблочный сок ≈ 11°Bx (1.045 SG). Дрожжи для сидра атенюируют 75-90% — выбирай по желаемой сухости."
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
    <ToolFrame
      toolKey="mead"
      inputs={
        <FieldGrid cols={3}>
          <Field label="Мёд"        value={honey} onChange={setHoney} suffix="кг" step={0.1} />
          <Field label="Объём"      value={vol}   onChange={setVol}   suffix="л" />
          <Field label="Аттенюация" value={att}   onChange={setAtt}   suffix="%" />
        </FieldGrid>
      }
      result={
        <ResultPanel
          primary={{ label: 'ABV', value: abv.toFixed(2), unit: '%' }}
          stats={[
            { label: 'OG', value: og.toFixed(4) },
            { label: 'FG', value: fg.toFixed(4) },
          ]}
          accent="amber"
        />
      }
      hint="Мёд ≈ 80% сбраживаемого сахара. Винные дрожжи дают 85-95% атенюации — медовуха получается сухая, можно добавить мёд после ферментации для сладости."
    />
  )
}

function KvassTool() {
  const [bread, setBread] = useState(0.5)
  const [sugar, setSugar] = useState(150)
  const [vol, setVol]     = useState(10)
  const r = calcKvassStats(bread, sugar, vol)
  return (
    <ToolFrame
      toolKey="kvass"
      inputs={
        <FieldGrid cols={3}>
          <Field label="Хлеб"  value={bread} onChange={setBread} suffix="кг" step={0.1} />
          <Field label="Сахар" value={sugar} onChange={setSugar} suffix="г" />
          <Field label="Объём" value={vol}   onChange={setVol}   suffix="л" />
        </FieldGrid>
      }
      result={
        <ResultPanel
          primary={{ label: 'ABV', value: r.abv.toFixed(2), unit: '%' }}
          stats={[
            { label: 'OG',          value: r.og.toFixed(4) },
            { label: 'FG',          value: r.fg.toFixed(4) },
            { label: 'Сахар всего', value: `${r.totalSugarG.toFixed(0)} г` },
          ]}
          accent="amber"
        />
      }
      hint="Ржаной хлеб ≈ 200 г сбраживаемого сахара на кг. Атенюация низкая (~30%) — алкоголь обычно 0.5–1.5%."
    />
  )
}
