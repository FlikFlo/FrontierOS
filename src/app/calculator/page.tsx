'use client'

import { useState, useMemo, type ComponentType } from 'react'
import {
  Calculator, Droplets, Wind, FlaskConical, TestTube, Beaker,
  AlertTriangle, ArrowLeftRight, Gauge, Thermometer, Beer, Apple, Wheat,
  Leaf, Citrus, Flame, Sparkles, ArrowDown,
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

const ACCENT: Record<Accent, { glow: string; grad: string; border: string; bg: string }> = {
  amber:   { glow: 'rgba(251, 191, 36, 0.45)',  grad: 'linear-gradient(135deg, #fbbf24, #f97316)', border: 'rgba(251, 191, 36, 0.4)',  bg: 'rgba(251, 191, 36, 0.08)' },
  blue:    { glow: 'rgba(96, 165, 250, 0.45)',  grad: 'linear-gradient(135deg, #60a5fa, #3b82f6)', border: 'rgba(96, 165, 250, 0.4)',  bg: 'rgba(96, 165, 250, 0.08)' },
  emerald: { glow: 'rgba(52, 211, 153, 0.45)',  grad: 'linear-gradient(135deg, #34d399, #10b981)', border: 'rgba(52, 211, 153, 0.4)',  bg: 'rgba(52, 211, 153, 0.08)' },
  violet:  { glow: 'rgba(167, 139, 250, 0.45)', grad: 'linear-gradient(135deg, #a78bfa, #8b5cf6)', border: 'rgba(167, 139, 250, 0.4)', bg: 'rgba(167, 139, 250, 0.08)' },
  rose:    { glow: 'rgba(251, 113, 133, 0.45)', grad: 'linear-gradient(135deg, #fb7185, #e11d48)', border: 'rgba(251, 113, 133, 0.4)', bg: 'rgba(251, 113, 133, 0.08)' },
  cyan:    { glow: 'rgba(34, 211, 238, 0.45)',  grad: 'linear-gradient(135deg, #22d3ee, #0891b2)', border: 'rgba(34, 211, 238, 0.4)',  bg: 'rgba(34, 211, 238, 0.08)' },
}

// ─── page ───────────────────────────────────────────────────────────────────

export default function CalculatorPage() {
  const [active, setActive] = useState<ToolKey>('brix-sg')
  const tool = TOOLS.find(t => t.key === active)!
  const subTools = TOOLS.filter(t => t.category === tool.category)

  return (
    <div className="fade-in" style={{ width: '100%' }}>
      {/* Header */}
      <header style={{ textAlign: 'center', marginBottom: 32 }}>
        <div
          style={{
            display: 'inline-flex', alignItems: 'center', gap: 8,
            padding: '6px 14px', borderRadius: 999,
            background: 'linear-gradient(180deg, rgba(251,191,36,0.18), rgba(251,191,36,0.06))',
            border: '1px solid rgba(251, 191, 36, 0.3)',
            color: '#fbbf24', fontSize: 12, fontWeight: 600,
            boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.18), 0 0 24px rgba(251,191,36,0.15)',
            marginBottom: 16,
          }}
        >
          <Calculator size={12} /> Brewing Tools
        </div>
        <h1 style={{ fontSize: 'clamp(28px, 4vw, 44px)', fontWeight: 700, letterSpacing: '-0.02em', lineHeight: 1.1 }}>
          <span style={{ color: '#fff' }}>Калькулятор </span>
          <span className="text-gradient-amber">пивовара</span>
        </h1>
        <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.45)', marginTop: 10 }}>
          {TOOLS.length} инструментов для варки и контроля брожения
        </p>
      </header>

      {/* Primary nav: categories */}
      <nav
        style={{
          display: 'flex', gap: 8, flexWrap: 'wrap', justifyContent: 'center',
          marginBottom: 16,
        }}
      >
        {CATEGORIES.map((c) => {
          const isActive = c.key === tool.category
          const firstTool = TOOLS.find(t => t.category === c.key)!
          return (
            <button
              key={c.key}
              onClick={() => setActive(firstTool.key)}
              className={`lg-pill ${isActive ? 'lg-pill-active' : ''}`}
            >
              <c.icon size={14} />
              {c.label}
            </button>
          )
        })}
      </nav>

      {/* Secondary nav: sub-tools */}
      {subTools.length > 1 && (
        <div
          style={{
            display: 'flex', gap: 6, flexWrap: 'wrap', justifyContent: 'center',
            marginBottom: 28,
          }}
        >
          {subTools.map((t) => {
            const isActive = t.key === active
            const Icon = t.icon
            return (
              <button
                key={t.key}
                onClick={() => setActive(t.key)}
                style={{
                  display: 'inline-flex', alignItems: 'center', gap: 6,
                  padding: '7px 16px', borderRadius: 999,
                  border: `1px solid ${isActive ? 'rgba(255,255,255,0.22)' : 'rgba(255,255,255,0.08)'}`,
                  background: isActive
                    ? 'linear-gradient(180deg, rgba(255,255,255,0.1), rgba(255,255,255,0.02))'
                    : 'transparent',
                  color: isActive ? '#fff' : 'rgba(255,255,255,0.55)',
                  fontSize: 12, fontWeight: 500,
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                  boxShadow: isActive ? 'inset 0 1px 0 rgba(255,255,255,0.15)' : 'none',
                }}
              >
                <Icon size={11} />
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
  const a = ACCENT[tool.accent]

  return (
    <div className="lg-card" style={{ padding: 0 }}>
      {/* Top accent bar */}
      <div style={{ height: 3, width: '100%', background: a.grad }} />

      <div style={{ padding: '36px 36px 32px' }}>
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 16, marginBottom: 28 }}>
          <div
            style={{
              width: 52, height: 52, borderRadius: 18,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              flexShrink: 0,
              background: `linear-gradient(180deg, ${a.bg}, rgba(0,0,0,0.2))`,
              border: `1px solid ${a.border}`,
              boxShadow: `inset 0 1px 0 rgba(255,255,255,0.15), 0 0 32px ${a.glow}, 0 4px 12px rgba(0,0,0,0.3)`,
            }}
          >
            <Icon size={22} className="text-white" />
          </div>
          <div style={{ flex: 1, paddingTop: 2 }}>
            <h2 style={{ fontSize: 22, fontWeight: 700, color: '#fff', lineHeight: 1.2, letterSpacing: '-0.01em' }}>
              {tool.label}
            </h2>
            <p style={{ fontSize: 13.5, color: 'rgba(255,255,255,0.5)', marginTop: 4, lineHeight: 1.5 }}>
              {tool.description}
            </p>
          </div>
        </div>

        {/* Inputs */}
        <div style={{ marginBottom: 28 }}>
          <SectionLabel>Параметры</SectionLabel>
          {inputs}
        </div>

        {/* Arrow divider */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 28, gap: 16 }}>
          <div style={{ height: 1, flex: 1, background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.1), transparent)' }} />
          <div
            style={{
              width: 40, height: 40, borderRadius: 999,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              background: 'linear-gradient(180deg, rgba(0,0,0,0.4), rgba(0,0,0,0.6))',
              border: `1px solid ${a.border}`,
              boxShadow: `0 0 24px ${a.glow}, inset 0 1px 0 rgba(255,255,255,0.1)`,
            }}
          >
            <ArrowDown size={14} style={{ color: 'rgba(255,255,255,0.7)' }} />
          </div>
          <div style={{ height: 1, flex: 1, background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.1), transparent)' }} />
        </div>

        {/* Result */}
        <div style={{ marginBottom: hint ? 24 : 0 }}>
          <SectionLabel>Результат</SectionLabel>
          {result}
        </div>

        {/* Hint */}
        {hint && (
          <div
            style={{
              marginTop: 24, paddingTop: 20,
              borderTop: '1px solid rgba(255,255,255,0.06)',
              fontSize: 12.5, color: 'rgba(255,255,255,0.42)',
              lineHeight: 1.6,
            }}
          >
            💡 {hint}
          </div>
        )}
      </div>
    </div>
  )
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <p style={{
      fontSize: 10.5, fontWeight: 700, color: 'rgba(255,255,255,0.45)',
      letterSpacing: '0.14em', textTransform: 'uppercase',
      marginBottom: 14,
    }}>
      {children}
    </p>
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
    <label style={{ display: 'block' }}>
      <span style={{
        display: 'block',
        fontSize: 10.5, fontWeight: 700, color: 'rgba(255,255,255,0.55)',
        letterSpacing: '0.12em', textTransform: 'uppercase',
        marginBottom: 8,
      }}>
        {label}
      </span>
      <div style={{ position: 'relative' }}>
        <input
          type="number"
          step={step}
          value={value}
          onChange={(e) => onChange(parseFloat(e.target.value) || 0)}
          className="lg-input"
          style={{ paddingRight: suffix ? 56 : 18 }}
        />
        {suffix && (
          <span style={{
            position: 'absolute', right: 16, top: '50%', transform: 'translateY(-50%)',
            fontSize: 12, color: 'rgba(255,255,255,0.4)', fontWeight: 600,
            pointerEvents: 'none',
          }}>
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
    <label style={{ display: 'block' }}>
      <span style={{
        display: 'block',
        fontSize: 10.5, fontWeight: 700, color: 'rgba(255,255,255,0.55)',
        letterSpacing: '0.12em', textTransform: 'uppercase',
        marginBottom: 8,
      }}>
        {label}
      </span>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value as T)}
        className="lg-input"
        style={{ fontSize: 14 }}
      >
        {options.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
      </select>
    </label>
  )
}

function FieldGrid({ cols = 2, children }: { cols?: 1 | 2 | 3 | 4; children: React.ReactNode }) {
  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: `repeat(auto-fit, minmax(${cols === 4 ? 140 : cols === 3 ? 180 : 200}px, 1fr))`,
        gap: 16,
      }}
    >
      {children}
    </div>
  )
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
  const a = ACCENT[accent]
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {/* Hero result */}
      <div
        style={{
          position: 'relative',
          padding: '40px 32px',
          borderRadius: 22,
          textAlign: 'center',
          overflow: 'hidden',
          background: `linear-gradient(180deg, rgba(255,255,255,0.05), rgba(255,255,255,0.01)), ${a.bg}`,
          border: `1px solid ${a.border}`,
          boxShadow: `inset 0 1px 0 rgba(255,255,255,0.12), 0 0 60px -20px ${a.glow}, 0 8px 32px -16px rgba(0,0,0,0.5)`,
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
        }}
      >
        {/* Glow */}
        <div
          aria-hidden
          style={{
            position: 'absolute', inset: 0, opacity: 0.7, pointerEvents: 'none',
            background: `radial-gradient(ellipse 70% 80% at center top, ${a.glow}, transparent 65%)`,
            animation: 'lg-pulse 4s ease-in-out infinite',
          }}
        />
        <div style={{ position: 'relative' }}>
          {'dual' in primary ? (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
              {primary.dual.map((p, i) => (
                <div key={i}>
                  <p style={{
                    fontSize: 10.5, letterSpacing: '0.18em', textTransform: 'uppercase',
                    color: 'rgba(255,255,255,0.5)', fontWeight: 700,
                  }}>{p.label}</p>
                  <div style={{ marginTop: 10, display: 'flex', alignItems: 'baseline', justifyContent: 'center', gap: 6 }}>
                    <span
                      style={{
                        fontSize: 'clamp(36px, 5vw, 56px)', fontWeight: 800, lineHeight: 1, letterSpacing: '-0.02em',
                        background: a.grad,
                        WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text',
                      }}
                    >
                      {p.value}
                    </span>
                    {p.unit && <span style={{ fontSize: 18, color: 'rgba(255,255,255,0.45)', fontWeight: 600 }}>{p.unit}</span>}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <>
              <p style={{
                fontSize: 11, letterSpacing: '0.2em', textTransform: 'uppercase',
                color: 'rgba(255,255,255,0.5)', fontWeight: 700,
              }}>{primary.label}</p>
              <div style={{ marginTop: 14, display: 'flex', alignItems: 'baseline', justifyContent: 'center', gap: 10 }}>
                <span
                  style={{
                    fontSize: 'clamp(56px, 9vw, 96px)', fontWeight: 800, lineHeight: 1, letterSpacing: '-0.03em',
                    background: a.grad,
                    WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text',
                    filter: `drop-shadow(0 4px 24px ${a.glow})`,
                  }}
                >
                  {primary.value}
                </span>
                {primary.unit && <span style={{ fontSize: 28, color: 'rgba(255,255,255,0.5)', fontWeight: 600 }}>{primary.unit}</span>}
              </div>
            </>
          )}
        </div>
      </div>

      {/* Stats */}
      {stats && stats.length > 0 && (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: `repeat(auto-fit, minmax(${stats.length >= 4 ? 130 : 150}px, 1fr))`,
            gap: 10,
          }}
        >
          {stats.map((s, i) => (
            <div key={i} className="lg-stat">
              <p style={{
                fontSize: 10, fontWeight: 700, color: 'rgba(255,255,255,0.4)',
                letterSpacing: '0.1em', textTransform: 'uppercase',
              }}>
                {s.label}
              </p>
              <p style={{ fontSize: 18, fontWeight: 700, color: '#fff', marginTop: 4, lineHeight: 1.1 }}>
                {s.value}
              </p>
              {s.sub && (
                <p style={{ fontSize: 10.5, color: 'rgba(255,255,255,0.35)', marginTop: 4 }}>{s.sub}</p>
              )}
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
        <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.5)', lineHeight: 1.6 }}>
          Справочные диапазоны карбонизации (объёмы CO₂) для разных типов напитков.
          Используй как ориентир при выборе целевой карбонизации в калькуляторах прайминга и кеггинга.
        </p>
      }
      result={
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 10 }}>
          {TARGET_CO2_VOLUMES.map(({ style, min, max }) => (
            <div key={style} className="lg-stat" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ fontSize: 14, color: 'rgba(255,255,255,0.8)', fontWeight: 500 }}>{style}</span>
              <span style={{ fontSize: 15, fontFamily: 'var(--font-mono, monospace)', fontWeight: 700, color: '#fbbf24' }}>{min}–{max}</span>
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
  const a = ACCENT.cyan

  return (
    <ToolFrame
      toolKey="water"
      inputs={
        <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
          <div>
            <SectionLabel>Пресет</SectionLabel>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
              {DEFAULT_WATER_PROFILES.map((p) => (
                <button key={p.name} onClick={() => setProfile(p.profile)} className="lg-pill" style={{ padding: '8px 16px', fontSize: 12 }}>
                  {p.name}
                </button>
              ))}
            </div>
          </div>

          <div>
            <SectionLabel>Профиль воды (ppm)</SectionLabel>
            <FieldGrid cols={3}>
              <Field label="Ca²⁺"   value={profile.ca}   onChange={setKey('ca')}   suffix="ppm" />
              <Field label="Mg²⁺"   value={profile.mg}   onChange={setKey('mg')}   suffix="ppm" />
              <Field label="Na⁺"    value={profile.na}   onChange={setKey('na')}   suffix="ppm" />
              <Field label="Cl⁻"    value={profile.cl}   onChange={setKey('cl')}   suffix="ppm" />
              <Field label="SO₄²⁻"  value={profile.so4}  onChange={setKey('so4')}  suffix="ppm" />
              <Field label="HCO₃⁻"  value={profile.hco3} onChange={setKey('hco3')} suffix="ppm" />
            </FieldGrid>
          </div>

          <div>
            <SectionLabel>Добавка соли</SectionLabel>
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
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div
            style={{
              position: 'relative',
              padding: '32px 28px',
              borderRadius: 22,
              overflow: 'hidden',
              background: `linear-gradient(180deg, rgba(255,255,255,0.05), rgba(255,255,255,0.01)), ${a.bg}`,
              border: `1px solid ${a.border}`,
              boxShadow: `inset 0 1px 0 rgba(255,255,255,0.12), 0 0 60px -20px ${a.glow}`,
            }}
          >
            <div aria-hidden style={{ position: 'absolute', inset: 0, opacity: 0.6, pointerEvents: 'none', background: `radial-gradient(ellipse 70% 80% at center top, ${a.glow}, transparent 65%)` }} />
            <div style={{ position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap' }}>
              <div>
                <p style={{ fontSize: 11, letterSpacing: '0.2em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.5)', fontWeight: 700 }}>SO₄ : Cl</p>
                <span style={{
                  fontSize: 'clamp(48px, 7vw, 72px)', fontWeight: 800, lineHeight: 1, letterSpacing: '-0.02em', marginTop: 8, display: 'inline-block',
                  background: a.grad, WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text',
                  filter: `drop-shadow(0 4px 20px ${a.glow})`,
                }}>
                  {analysis.sulfateChlorideRatio === 999 ? '∞' : analysis.sulfateChlorideRatio.toFixed(2)}
                </span>
              </div>
              <span className={`badge ${analysis.perception === 'balanced' ? 'badge-green' : 'badge-amber'}`} style={{ fontSize: 12 }}>
                {analysis.perceptionLabel}
              </span>
            </div>
          </div>

          <div>
            <SectionLabel>Итоговый профиль</SectionLabel>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: 8 }}>
              {(['ca','mg','na','cl','so4','hco3'] as const).map((k) => {
                const before = profile[k]
                const after = updated[k]
                const diff = after - before
                const labels: Record<typeof k, string> = { ca: 'Ca', mg: 'Mg', na: 'Na', cl: 'Cl', so4: 'SO₄', hco3: 'HCO₃' }
                return (
                  <div key={k} className="lg-stat" style={{ textAlign: 'center', padding: '10px 8px' }}>
                    <p style={{ fontSize: 10, color: 'rgba(255,255,255,0.4)', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase' }}>{labels[k]}</p>
                    <p style={{ fontSize: 16, color: '#fff', fontWeight: 700, marginTop: 4, lineHeight: 1 }}>{after.toFixed(0)}</p>
                    {diff !== 0 && (
                      <p style={{ fontSize: 10, fontWeight: 600, marginTop: 4, color: diff > 0 ? '#34d399' : '#f87171' }}>
                        {diff > 0 ? '+' : ''}{diff.toFixed(0)}
                      </p>
                    )}
                  </div>
                )
              })}
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            <div className="lg-stat">
              <p style={{ fontSize: 10, color: 'rgba(255,255,255,0.4)', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase' }}>Щёлочность</p>
              <p style={{ fontSize: 18, color: '#fff', fontWeight: 700, marginTop: 4, lineHeight: 1.1 }}>{analysis.alkalinityCaCO3} ppm</p>
              <p style={{ fontSize: 10.5, color: 'rgba(255,255,255,0.35)', marginTop: 4 }}>CaCO₃</p>
            </div>
            <div className="lg-stat">
              <p style={{ fontSize: 10, color: 'rgba(255,255,255,0.4)', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase' }}>Общая жёсткость</p>
              <p style={{ fontSize: 18, color: '#fff', fontWeight: 700, marginTop: 4, lineHeight: 1.1 }}>{analysis.totalHardnessCaCO3} ppm</p>
              <p style={{ fontSize: 10.5, color: 'rgba(255,255,255,0.35)', marginTop: 4 }}>CaCO₃</p>
            </div>
          </div>

          {analysis.warnings.length > 0 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {analysis.warnings.map((w, i) => (
                <div key={i} style={{
                  display: 'flex', alignItems: 'flex-start', gap: 10,
                  padding: '12px 16px', borderRadius: 12,
                  background: 'rgba(251, 191, 36, 0.05)',
                  border: '1px solid rgba(251, 191, 36, 0.18)',
                  fontSize: 12.5, color: 'rgba(252, 211, 77, 0.9)', lineHeight: 1.6,
                }}>
                  <AlertTriangle size={13} style={{ marginTop: 2, flexShrink: 0 }} />
                  <span>{w}</span>
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
      hint="Внести SCOBY при 24-28°C. После 1-й ферментации можно перевести на 2-ю с фруктами/специями для газации."
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
