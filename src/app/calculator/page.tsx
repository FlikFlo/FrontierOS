'use client'

import { useState, useMemo, type ComponentType } from 'react'
import {
  Droplets, Wind, FlaskConical, TestTube, Beaker,
  AlertTriangle, ArrowLeftRight, Gauge, Thermometer, Beer, Apple, Wheat,
  Leaf, Citrus, Flame, Sparkles,
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
import { Page, PageHeader } from '@/components/ui/Page'
import { Card } from '@/components/ui/Card'
import { Tabs } from '@/components/ui/Tabs'
import { Field, Input, Select } from '@/components/ui/Field'
import { Badge } from '@/components/ui/Badge'

// ─── tools registry ─────────────────────────────────────────────────────────

type ToolKey =
  | 'brix-sg' | 'abv' | 'temp-correct' | 'sugar-og'
  | 'priming' | 'keg' | 'co2-styles'
  | 'refrac'
  | 'strike' | 'volumes'
  | 'water'
  | 'kombucha' | 'lemonade' | 'cider' | 'mead' | 'kvass'

type CategoryKey = 'density' | 'carb' | 'refrac' | 'mash' | 'water' | 'recipes'

interface Tool {
  key: ToolKey
  category: CategoryKey
  label: string
  icon: ComponentType<{ size?: number; strokeWidth?: number }>
  description: string
}

const TOOLS: Tool[] = [
  { key: 'brix-sg',      category: 'density',  label: 'Brix ↔ SG',         icon: ArrowLeftRight, description: 'Перевод между шкалой Brix и удельной плотностью' },
  { key: 'abv',          category: 'density',  label: 'ABV',                icon: Gauge,          description: 'Алкоголь по начальной и конечной плотности' },
  { key: 'temp-correct', category: 'density',  label: 'Коррекция T',        icon: Thermometer,    description: 'Поправка ареометра на температуру' },
  { key: 'sugar-og',     category: 'density',  label: 'Сахар → OG',         icon: Sparkles,       description: 'Какую начальную плотность даст N грамм сахара' },

  { key: 'priming',      category: 'carb',     label: 'Прайминг',           icon: Wind,           description: 'Сахар для естественной карбонизации в бутылках' },
  { key: 'keg',          category: 'carb',     label: 'Кеггинг',            icon: Gauge,          description: 'Давление CO₂ для кеггинга' },
  { key: 'co2-styles',   category: 'carb',     label: 'CO₂ по стилям',     icon: Sparkles,       description: 'Справочник целевых объёмов CO₂' },

  { key: 'refrac',       category: 'refrac',   label: 'Коррекция FG',       icon: TestTube,       description: 'Реальная FG по показаниям рефрактометра' },

  { key: 'strike',       category: 'mash',     label: 'Заливочная вода',    icon: Thermometer,    description: 'Температура воды для затирания (Palmer)' },
  { key: 'volumes',      category: 'mash',     label: 'Объёмы воды',        icon: Droplets,       description: 'Затирание + поглощение + испарение + промывка' },

  { key: 'water',        category: 'water',    label: 'Профиль и соли',     icon: Beaker,         description: 'Состав воды, добавки солей, анализ' },

  { key: 'kombucha',     category: 'recipes',  label: 'Комбуча',            icon: Leaf,           description: 'SCOBY-ферментация чая с сахаром' },
  { key: 'lemonade',     category: 'recipes',  label: 'Лимонад',            icon: Citrus,         description: 'Газировка с балансом сладости и кислотности' },
  { key: 'cider',        category: 'recipes',  label: 'Сидр',               icon: Apple,          description: 'Сидр из яблочного сока' },
  { key: 'mead',         category: 'recipes',  label: 'Медовуха',           icon: Flame,          description: 'Ферментация мёда с дрожжами' },
  { key: 'kvass',        category: 'recipes',  label: 'Квас',               icon: Wheat,          description: 'Хлебная ферментация' },
]

const CATEGORIES: { value: CategoryKey; label: string }[] = [
  { value: 'density',  label: 'Плотность' },
  { value: 'carb',     label: 'Карбонизация' },
  { value: 'refrac',   label: 'Рефрактометр' },
  { value: 'mash',     label: 'Затирание' },
  { value: 'water',    label: 'Вода' },
  { value: 'recipes',  label: 'Рецепты' },
]

// ─── page ───────────────────────────────────────────────────────────────────

export default function CalculatorPage() {
  const [active, setActive] = useState<ToolKey>('brix-sg')
  const tool = TOOLS.find(t => t.key === active)!
  const subTools = TOOLS.filter(t => t.category === tool.category)

  const handleCategoryChange = (cat: CategoryKey) => {
    const first = TOOLS.find(t => t.category === cat)!
    setActive(first.key)
  }

  return (
    <Page>
      <PageHeader
        title="Калькулятор пивовара"
        subtitle={`${TOOLS.length} инструментов для варки и контроля брожения`}
      />

      {/* Category tabs */}
      <div style={{ display: 'flex', justifyContent: 'flex-start' }}>
        <Tabs<CategoryKey>
          items={CATEGORIES}
          value={tool.category}
          onChange={handleCategoryChange}
          size="lg"
        />
      </div>

      {/* Sub-tools nav (when more than one) */}
      {subTools.length > 1 && (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
          {subTools.map(t => {
            const isActive = t.key === active
            const Icon = t.icon
            return (
              <button
                key={t.key}
                onClick={() => setActive(t.key)}
                style={{
                  display: 'inline-flex', alignItems: 'center', gap: 7,
                  padding: '8px 14px',
                  borderRadius: 10,
                  background: isActive ? 'var(--surface-2)' : 'transparent',
                  border: `1px solid ${isActive ? 'var(--hairline-strong)' : 'var(--hairline)'}`,
                  color: isActive ? 'var(--t-1)' : 'var(--t-3)',
                  fontSize: 12.5, fontWeight: 600,
                  cursor: 'pointer', transition: 'all .15s ease',
                }}
              >
                <Icon size={13} strokeWidth={isActive ? 2.4 : 1.8} />
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
    </Page>
  )
}

// ─── primitives ─────────────────────────────────────────────────────────────

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
    <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) minmax(0, 1fr)', gap: 20 }}>
      {/* Inputs */}
      <Card pad="lg">
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 14, marginBottom: 24 }}>
          <div style={{
            width: 38, height: 38, borderRadius: 10, flexShrink: 0,
            background: 'var(--surface-2)', border: '1px solid var(--hairline)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <Icon size={17} strokeWidth={1.9} />
          </div>
          <div style={{ flex: 1 }}>
            <h2 style={{ fontSize: 17, fontWeight: 600, color: 'var(--t-1)', letterSpacing: '-0.01em' }}>{tool.label}</h2>
            <p style={{ fontSize: 12.5, color: 'var(--t-3)', marginTop: 3, lineHeight: 1.5 }}>{tool.description}</p>
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <p className="t-eyebrow">Параметры</p>
          {inputs}
        </div>

        {hint && (
          <p style={{
            marginTop: 24, paddingTop: 16,
            borderTop: '1px solid var(--hairline)',
            fontSize: 12, color: 'var(--t-3)', lineHeight: 1.6,
          }}>
            {hint}
          </p>
        )}
      </Card>

      {/* Result */}
      <Card pad="lg">
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <p className="t-eyebrow">Результат</p>
          {result}
        </div>
      </Card>
    </div>
  )
}

function NumField({
  label, value, onChange, suffix, step = 1,
}: {
  label: string
  value: number
  onChange: (v: number) => void
  suffix?: string
  step?: number
}) {
  return (
    <Field label={label}>
      <Input
        type="number"
        step={step}
        suffix={suffix}
        value={value}
        onChange={e => onChange(parseFloat(e.target.value) || 0)}
      />
    </Field>
  )
}

function FieldGrid({ cols = 2, children }: { cols?: 1 | 2 | 3; children: React.ReactNode }) {
  return (
    <div style={{
      display: 'grid',
      gridTemplateColumns: `repeat(auto-fit, minmax(${cols === 3 ? 140 : 160}px, 1fr))`,
      gap: 12,
    }}>
      {children}
    </div>
  )
}

function HeroNumber({
  label, value, unit, accent = false,
}: {
  label: string
  value: string
  unit?: string
  accent?: boolean
}) {
  return (
    <div style={{
      padding: '24px 20px',
      borderRadius: 'var(--r-md)',
      background: 'var(--surface-1)',
      border: '1px solid var(--hairline)',
      textAlign: 'left',
    }}>
      <p className="t-eyebrow" style={{ marginBottom: 10 }}>{label}</p>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
        <span
          className="t-mono"
          style={{
            fontSize: 'clamp(40px, 5vw, 56px)', lineHeight: 1, fontWeight: 600, letterSpacing: '-0.03em',
            color: accent ? 'var(--accent)' : 'var(--t-1)',
          }}
        >
          {value}
        </span>
        {unit && <span style={{ fontSize: 17, color: 'var(--t-3)', fontWeight: 500 }}>{unit}</span>}
      </div>
    </div>
  )
}

function StatRow({ items }: { items: { label: string; value: string; sub?: string }[] }) {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))', gap: 8 }}>
      {items.map((s, i) => (
        <div key={i} style={{
          padding: '12px 14px',
          borderRadius: 'var(--r-sm)',
          background: 'var(--surface-1)',
          border: '1px solid var(--hairline)',
        }}>
          <p className="t-eyebrow" style={{ fontSize: 9.5 }}>{s.label}</p>
          <p className="t-mono" style={{ fontSize: 15, fontWeight: 600, color: 'var(--t-1)', marginTop: 5, lineHeight: 1.1 }}>{s.value}</p>
          {s.sub && <p className="t-meta" style={{ fontSize: 11, marginTop: 3 }}>{s.sub}</p>}
        </div>
      ))}
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

// ─── tools ──────────────────────────────────────────────────────────────────

function BrixSGTool() {
  const [brix, setBrix] = useState(12)
  const [sg, setSg]     = useState(1.048)
  return (
    <ToolFrame
      toolKey="brix-sg"
      inputs={
        <FieldGrid>
          <NumField label="Brix" value={brix} onChange={setBrix} suffix="°Bx" step={0.1} />
          <NumField label="SG" value={sg} onChange={setSg} step={0.001} />
        </FieldGrid>
      }
      result={
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <HeroNumber label="Brix → SG" value={brixToSG(brix).toFixed(4)} accent />
          <HeroNumber label="SG → Brix" value={sgToBrix(sg).toFixed(2)} unit="°Bx" />
        </div>
      }
      hint="Brix — массовая доля сахара в %, SG — отношение плотности раствора к воде."
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
        <FieldGrid>
          <NumField label="OG" value={og} onChange={setOg} step={0.001} />
          <NumField label="FG" value={fg} onChange={setFg} step={0.001} />
        </FieldGrid>
      }
      result={
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <HeroNumber label="ABV" value={abv.toFixed(2)} unit="%" accent />
          <StatRow items={[
            { label: 'Аттенюация',  value: `${att.toFixed(1)} %`,                sub: 'процент сбраживания' },
            { label: 'Точек ферм.', value: `${Math.round((og - fg) * 1000)}`,    sub: 'разница SG points' },
          ]} />
        </div>
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
          <NumField label="SG измеренная" value={sgMeas} onChange={setSgMeas} step={0.001} />
          <NumField label="T образца" value={tSample} onChange={setTSample} suffix="°C" />
          <NumField label="T калибровки" value={tCalib} onChange={setTCalib} suffix="°C" />
        </FieldGrid>
      }
      result={
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <HeroNumber label={`SG при ${tCalib}°C`} value={corrected.toFixed(4)} accent />
          <StatRow items={[
            { label: 'Поправка', value: `${delta >= 0 ? '+' : ''}${delta.toFixed(1)} pts` },
            { label: 'Изм. при', value: `${tSample}°C` },
          ]} />
        </div>
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
        <FieldGrid>
          <NumField label="Сахар" value={sugarG} onChange={setSugarG} suffix="г" />
          <NumField label="Объём" value={volL} onChange={setVolL} suffix="л" />
        </FieldGrid>
      }
      result={
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <HeroNumber label="OG" value={og.toFixed(4)} accent />
          <StatRow items={[
            { label: 'Brix',       value: `${sgToBrix(og).toFixed(1)} °Bx` },
            { label: 'Концентр.',  value: `${(sugarG / volL).toFixed(0)} г/л` },
            { label: 'ABV (75%)',  value: `${abv.toFixed(2)} %` },
          ]} />
        </div>
      }
      hint="≈ 0.00038 SG-points на г/л сахарозы. Применимо для медовухи, кваса, сидра."
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
        <FieldGrid>
          <NumField label="Объём пива" value={batchL} onChange={setBatchL} suffix="л" />
          <NumField label="Целевая CO₂" value={targetCO2} onChange={setTargetCO2} suffix="vol" step={0.1} />
          <NumField label="Макс. T при ферм." value={maxFermT} onChange={setMaxFermT} suffix="°C" />
          <Field label="Тип сахара">
            <Select value={sugar} onChange={e => setSugar(e.target.value as PrimingSugarType)}>
              {(Object.keys(PRIMING_SUGAR_LABELS) as PrimingSugarType[]).map(k => (
                <option key={k} value={k}>{PRIMING_SUGAR_LABELS[k]}</option>
              ))}
            </Select>
          </Field>
        </FieldGrid>
      }
      result={
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <HeroNumber label="Сахар на партию" value={r.grams.toFixed(1)} unit="г" accent />
          <StatRow items={[
            { label: 'На литр',         value: `${(r.grams / batchL).toFixed(1)} г/л` },
            { label: 'Остаточный CO₂',  value: `${r.residualCO2}`, sub: 'vol после ферм.' },
            { label: 'Δ нужно',          value: `${(targetCO2 - r.residualCO2).toFixed(2)} vol` },
          ]} />
        </div>
      }
      hint="Растворить сахар в малом объёме кипятка, остудить, влить в пиво при разливе. Карбонизация 2-3 недели."
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
        <FieldGrid>
          <NumField label="T кега" value={t} onChange={setT} suffix="°C" />
          <NumField label="Целевая CO₂" value={co2} onChange={setCo2} suffix="vol" step={0.1} />
        </FieldGrid>
      }
      result={
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <HeroNumber label="Давление" value={psi.toFixed(1)} unit="PSI" accent />
          <StatRow items={[
            { label: 'Бар',  value: `${(psi * 0.0689476).toFixed(2)}` },
            { label: 'Атм.', value: `${(psi * 0.068046).toFixed(2)}` },
            { label: 'kPa',  value: `${(psi * 6.89476).toFixed(0)}` },
          ]} />
        </div>
      }
      hint="При повышении температуры нужно поднимать давление пропорционально."
    />
  )
}

function CO2StylesTool() {
  return (
    <div className="card card-pad-lg">
      <p className="t-eyebrow" style={{ marginBottom: 8 }}>Справочник</p>
      <h2 style={{ fontSize: 17, fontWeight: 600, color: 'var(--t-1)', letterSpacing: '-0.01em' }}>Объёмы CO₂ по стилям</h2>
      <p style={{ fontSize: 12.5, color: 'var(--t-3)', marginTop: 4, lineHeight: 1.5 }}>
        Используй как ориентир при выборе целевой карбонизации в калькуляторах прайминга и кеггинга.
      </p>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 8, marginTop: 20 }}>
        {TARGET_CO2_VOLUMES.map(({ style, min, max }) => (
          <div key={style} style={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            padding: '12px 14px',
            borderRadius: 'var(--r-sm)',
            background: 'var(--surface-1)',
            border: '1px solid var(--hairline)',
          }}>
            <span style={{ fontSize: 13.5, color: 'var(--t-1)' }}>{style}</span>
            <span className="t-mono" style={{ fontSize: 13, fontWeight: 600, color: 'var(--accent)' }}>{min}–{max}</span>
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
    <ToolFrame
      toolKey="refrac"
      inputs={
        <FieldGrid cols={3}>
          <NumField label="Brix до (OB)" value={ob} onChange={setOb} suffix="°Bx" step={0.1} />
          <NumField label="Brix после (FB)" value={fb} onChange={setFb} suffix="°Bx" step={0.1} />
          <NumField label="WCF" value={wcf} onChange={setWcf} step={0.01} />
        </FieldGrid>
      }
      result={
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <HeroNumber label="OG" value={r.og.toFixed(4)} />
          <HeroNumber label="FG (true)" value={r.fg.toFixed(4)} accent />
          <StatRow items={[
            { label: 'ABV',          value: `${r.abv.toFixed(2)} %` },
            { label: 'Аттенюация',   value: `${r.apparentAttenuation.toFixed(1)} %` },
          ]} />
        </div>
      }
      hint="Рефрактометр показывает завышенно при наличии алкоголя — формула Sean Terrill восстанавливает реальную SG."
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
          <NumField label="T зерна" value={grainT} onChange={setGrainT} suffix="°C" />
          <NumField label="T затора" value={mashT} onChange={setMashT} suffix="°C" />
          <NumField label="Соотн." value={ratio} onChange={setRatio} suffix="л/кг" step={0.1} />
        </FieldGrid>
      }
      result={<HeroNumber label="T заливочной воды" value={t.toFixed(1)} unit="°C" accent />}
      hint="R — литры воды на кг зерна (стандарт 2.5–3.5). Учитывай теплопотери чана: лей на 1-2°C горячее."
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
          <NumField label="Зерно" value={grainKg} onChange={setGrainKg} suffix="кг" step={0.1} />
          <NumField label="Партия" value={batchL} onChange={setBatchL} suffix="л" />
          <NumField label="Кипячение" value={boilMin} onChange={setBoilMin} suffix="мин" />
        </FieldGrid>
      }
      result={
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <HeroNumber label="Промывная вода" value={`${sparge}`} unit="л" accent />
          <StatRow items={[
            { label: 'Затирание',  value: `${mashWater} л` },
            { label: 'Поглощено',  value: `${grainAbs} л`,  sub: 'зерном' },
            { label: 'Испарение',  value: `${evapL} л`,     sub: 'за варку' },
            { label: 'Preboil',    value: `${preboil} л` },
          ]} />
        </div>
      }
      hint="Стандартные значения: 3 л/кг затирание, 0.96 л/кг поглощение, 10%/час испарение."
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
  const labels = { ca: 'Ca²⁺', mg: 'Mg²⁺', na: 'Na⁺', cl: 'Cl⁻', so4: 'SO₄²⁻', hco3: 'HCO₃⁻' } as const

  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) minmax(0, 1fr)', gap: 20 }}>
      <Card pad="lg">
        <p className="t-eyebrow" style={{ marginBottom: 10 }}>Пресет</p>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 22 }}>
          {DEFAULT_WATER_PROFILES.map(p => (
            <button
              key={p.name}
              onClick={() => setProfile(p.profile)}
              className="btn btn-ghost btn-sm"
              style={{ height: 30, padding: '0 12px' }}
            >
              {p.name}
            </button>
          ))}
        </div>

        <p className="t-eyebrow" style={{ marginBottom: 10 }}>Профиль воды (ppm)</p>
        <FieldGrid cols={3}>
          {(Object.keys(labels) as (keyof WaterProfile)[]).map(k => (
            <NumField key={k} label={labels[k]} value={profile[k]} onChange={setKey(k)} suffix="ppm" />
          ))}
        </FieldGrid>

        <p className="t-eyebrow" style={{ marginTop: 22, marginBottom: 10 }}>Добавка соли</p>
        <FieldGrid>
          <Field label="Соль">
            <Select value={saltKey} onChange={e => setSaltKey(e.target.value)}>
              {BREWING_SALTS.map(s => <option key={s.key} value={s.key}>{s.label}</option>)}
            </Select>
          </Field>
          <NumField label="Доза" value={gPerL} onChange={setGPerL} suffix="г/л" step={0.1} />
        </FieldGrid>
      </Card>

      <Card pad="lg">
        <p className="t-eyebrow" style={{ marginBottom: 10 }}>Анализ</p>

        <div style={{
          padding: '20px',
          borderRadius: 'var(--r-md)',
          background: 'var(--surface-1)',
          border: '1px solid var(--hairline)',
          marginBottom: 12,
          display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap',
        }}>
          <div>
            <p className="t-eyebrow" style={{ fontSize: 9.5 }}>SO₄ : Cl</p>
            <span className="t-mono" style={{ fontSize: 'clamp(36px, 5vw, 48px)', fontWeight: 600, letterSpacing: '-0.03em', color: 'var(--accent)', lineHeight: 1, marginTop: 6, display: 'inline-block' }}>
              {analysis.sulfateChlorideRatio === 999 ? '∞' : analysis.sulfateChlorideRatio.toFixed(2)}
            </span>
          </div>
          <Badge tone={analysis.perception === 'balanced' ? 'ok' : 'warn'}>{analysis.perceptionLabel}</Badge>
        </div>

        <p className="t-eyebrow" style={{ marginBottom: 10 }}>Итоговый профиль</p>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: 6, marginBottom: 12 }}>
          {(Object.keys(labels) as (keyof WaterProfile)[]).map(k => {
            const before = profile[k]
            const after = updated[k]
            const diff = after - before
            const short = { ca: 'Ca', mg: 'Mg', na: 'Na', cl: 'Cl', so4: 'SO₄', hco3: 'HCO₃' }[k]
            return (
              <div key={k} style={{
                padding: '10px 6px', textAlign: 'center',
                borderRadius: 'var(--r-sm)',
                background: 'var(--surface-1)',
                border: '1px solid var(--hairline)',
              }}>
                <p className="t-eyebrow" style={{ fontSize: 9 }}>{short}</p>
                <p className="t-mono" style={{ fontSize: 14, fontWeight: 600, color: 'var(--t-1)', marginTop: 4, lineHeight: 1 }}>{after.toFixed(0)}</p>
                {diff !== 0 && (
                  <p className="t-mono" style={{ fontSize: 10, fontWeight: 600, marginTop: 3, color: diff > 0 ? 'var(--ok)' : 'var(--bad)' }}>
                    {diff > 0 ? '+' : ''}{diff.toFixed(0)}
                  </p>
                )}
              </div>
            )
          })}
        </div>

        <StatRow items={[
          { label: 'Щёлочность',     value: `${analysis.alkalinityCaCO3} ppm`,    sub: 'CaCO₃' },
          { label: 'Общая жёсткость', value: `${analysis.totalHardnessCaCO3} ppm`, sub: 'CaCO₃' },
        ]} />

        {analysis.warnings.length > 0 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginTop: 12 }}>
            {analysis.warnings.map((w, i) => (
              <div key={i} style={{
                display: 'flex', alignItems: 'flex-start', gap: 8,
                padding: '10px 12px', borderRadius: 'var(--r-sm)',
                background: 'rgba(251, 146, 60, 0.05)',
                border: '1px solid rgba(251, 146, 60, 0.18)',
                fontSize: 12, color: '#fdba74', lineHeight: 1.5,
              }}>
                <AlertTriangle size={12} style={{ marginTop: 2, flexShrink: 0 }} />
                <span>{w}</span>
              </div>
            ))}
          </div>
        )}
      </Card>
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
    <ToolFrame
      toolKey="kombucha"
      inputs={
        <FieldGrid>
          <NumField label="Объём" value={vol} onChange={setVol} suffix="л" />
          <NumField label="Сахар" value={sugar} onChange={setSugar} suffix="г" />
          <NumField label="Чай" value={tea} onChange={setTea} suffix="г" />
          <NumField label="T ферментации" value={t} onChange={setT} suffix="°C" />
        </FieldGrid>
      }
      result={
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <HeroNumber label="1-я ферментация" value={`~${r.firstFermentDays}`} unit="дней" accent />
          <StatRow items={[
            { label: 'Сахар',     value: `${r.sugarPerLiter} г/л` },
            { label: 'Чай',       value: r.teaConcentration },
            { label: '2-я ферм.', value: `~${r.secondFermentDays} дн.` },
            { label: 'Алкоголь',  value: `< ${r.approxAlcohol.toFixed(2)} %` },
          ]} />
        </div>
      }
      hint="Внести SCOBY при 24-28°C. После 1-й ферментации можно перевести на 2-ю с фруктами для газации."
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
        <FieldGrid>
          <NumField label="Объём" value={vol} onChange={setVol} suffix="л" />
          <NumField label="Сахар" value={sugar} onChange={setSugar} suffix="г" />
          <NumField label="Сок" value={juice} onChange={setJuice} suffix="%" />
          <NumField label="Кислота" value={acid} onChange={setAcid} suffix="г" />
        </FieldGrid>
      }
      result={
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <HeroNumber label="Баланс вкуса" value={labels[r.sweetnessBitterness]} accent={r.sweetnessBitterness === 'balanced'} />
          <StatRow items={[
            { label: 'Сахар',        value: `${r.sugarPerLiter} г/л` },
            { label: 'Brix',         value: `${r.brix} °Bx` },
            { label: 'Кислотность',  value: `${r.acidityGramPerLiter} г/л` },
          ]} />
        </div>
      }
      hint="Идеальное соотношение Sugar : Acid (10×) около 6–10. Карбонизация 3.5 vol CO₂ — стандарт."
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
        <FieldGrid>
          <NumField label="Сок" value={juice} onChange={setJuice} suffix="л" />
          <NumField label="Объём" value={vol} onChange={setVol} suffix="л" />
          <NumField label="Доп. сахар" value={sugar} onChange={setSugar} suffix="г" />
          <NumField label="Аттенюация" value={att} onChange={setAtt} suffix="%" />
        </FieldGrid>
      }
      result={
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <HeroNumber label="ABV" value={abv.toFixed(2)} unit="%" accent />
          <StatRow items={[
            { label: 'OG', value: og.toFixed(4) },
            { label: 'FG', value: fg.toFixed(4) },
          ]} />
        </div>
      }
      hint="Типичный яблочный сок ≈ 11°Bx (1.045 SG). Дрожжи для сидра атенюируют 75-90%."
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
          <NumField label="Мёд" value={honey} onChange={setHoney} suffix="кг" step={0.1} />
          <NumField label="Объём" value={vol} onChange={setVol} suffix="л" />
          <NumField label="Аттенюация" value={att} onChange={setAtt} suffix="%" />
        </FieldGrid>
      }
      result={
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <HeroNumber label="ABV" value={abv.toFixed(2)} unit="%" accent />
          <StatRow items={[
            { label: 'OG', value: og.toFixed(4) },
            { label: 'FG', value: fg.toFixed(4) },
          ]} />
        </div>
      }
      hint="Мёд ≈ 80% сбраживаемого сахара. Винные дрожжи дают 85-95% атенюации."
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
          <NumField label="Хлеб" value={bread} onChange={setBread} suffix="кг" step={0.1} />
          <NumField label="Сахар" value={sugar} onChange={setSugar} suffix="г" />
          <NumField label="Объём" value={vol} onChange={setVol} suffix="л" />
        </FieldGrid>
      }
      result={
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <HeroNumber label="ABV" value={r.abv.toFixed(2)} unit="%" accent />
          <StatRow items={[
            { label: 'OG',          value: r.og.toFixed(4) },
            { label: 'FG',          value: r.fg.toFixed(4) },
            { label: 'Сахар всего', value: `${r.totalSugarG.toFixed(0)} г` },
          ]} />
        </div>
      }
      hint="Ржаной хлеб ≈ 200 г сбраживаемого сахара на кг. Атенюация ~30%."
    />
  )
}
