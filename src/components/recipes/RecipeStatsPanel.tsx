'use client'

import type { BeverageCategory } from '@/types/database'
import type { BeverageStats } from '@/lib/beverage-calc'
import type { BeerStyle } from '@/lib/bjcp-styles'
import { srmToColor } from '@/lib/utils'
import { Eye, FlaskConical, Zap, Droplets, Thermometer, Target, Check, X } from 'lucide-react'
import { Card } from '@/components/ui/Card'

interface Props {
  stats: BeverageStats
  category: BeverageCategory
  bjcpStyle?: BeerStyle | null
}

// Shows a value vs [min,max] range with an inline indicator
function StyleCheck({ label, value, range, fmt }: {
  label: string; value: number | null | undefined; range: [number, number]; fmt: (v: number) => string
}) {
  if (value == null) return null
  const inRange = value >= range[0] && value <= range[1]
  const pct = Math.min(100, Math.max(0, ((value - range[0]) / (range[1] - range[0])) * 100))
  return (
    <div style={{ marginBottom: 10 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
        <span style={{ fontSize: 11, color: 'var(--t-3)' }}>{label}</span>
        <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
          <span className="t-mono" style={{ fontSize: 11.5, fontWeight: 600, color: inRange ? 'var(--ok)' : 'var(--bad)' }}>
            {fmt(value)}
          </span>
          {inRange
            ? <Check size={10} style={{ color: 'var(--ok)' }} />
            : <X size={10} style={{ color: 'var(--bad)' }} />
          }
        </div>
      </div>
      <div style={{ position: 'relative', height: 4, background: 'var(--surface-3)', borderRadius: 2, overflow: 'visible' }}>
        <div style={{ position: 'absolute', inset: 0, background: 'rgba(34,197,94,0.2)', borderRadius: 2 }} />
        {(() => {
          const lo = range[0] * 0.8
          const hi = range[1] * 1.2
          const pctLeft = Math.min(95, Math.max(2, ((value - lo) / (hi - lo)) * 100))
          return (
            <div style={{
              position: 'absolute', top: -2, width: 8, height: 8, borderRadius: '50%',
              left: `${pctLeft}%`, marginLeft: -4,
              background: inRange ? 'var(--ok)' : 'var(--bad)',
              border: '2px solid var(--surface-1)',
              boxShadow: `0 0 6px ${inRange ? 'var(--ok)' : 'var(--bad)'}`,
              zIndex: 1,
            }} />
          )
        })()}
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 3 }}>
        <span className="t-mono" style={{ fontSize: 9, color: 'var(--t-5, var(--t-4))' }}>{fmt(range[0])}</span>
        <span className="t-mono" style={{ fontSize: 9, color: 'var(--t-5, var(--t-4))' }}>{fmt(range[1])}</span>
      </div>
    </div>
  )
}

function Row({ label, value, sub, accent }: { label: string; value: string; sub?: string; accent?: boolean }) {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      padding: '10px 0', borderBottom: '1px solid var(--hairline)',
    }}>
      <span style={{ fontSize: 13, color: 'var(--t-2)' }}>{label}</span>
      <div style={{ textAlign: 'right' }}>
        <span className="t-mono" style={{ fontSize: 13.5, fontWeight: 600, color: accent ? 'var(--accent)' : 'var(--t-1)' }}>
          {value}
        </span>
        {sub && <p className="t-meta" style={{ fontSize: 10.5, marginTop: 1 }}>{sub}</p>}
      </div>
    </div>
  )
}

function Section({ title, icon, children }: { title: string; icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <Card pad="md">
      <p className="t-eyebrow" style={{ marginBottom: 8, display: 'inline-flex', alignItems: 'center', gap: 6 }}>
        {icon}{title}
      </p>
      <div>{children}</div>
    </Card>
  )
}

function Gauge({ value, min, max }: { value: number; min: number; max: number }) {
  const pct = Math.min(100, Math.max(0, ((value - min) / (max - min)) * 100))
  return (
    <div style={{ marginTop: 6 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10.5, color: 'var(--t-4)', marginBottom: 4 }}>
        <span>{min}</span>
        <span className="t-mono" style={{ fontWeight: 600, color: 'var(--t-2)' }}>{value.toFixed(1)}</span>
        <span>{max}</span>
      </div>
      <div className="progress" style={{ height: 5 }}>
        <div className="progress-bar" style={{ width: `${pct}%` }} />
      </div>
    </div>
  )
}

export default function RecipeStatsPanel({ stats, category, bjcpStyle }: Props) {
  const srmColor = stats.srm ? srmToColor(stats.srm) : '#FFE699'
  const isBeer = category === 'beer'
  const isKombucha = category === 'kombucha'
  const isLemonade = category === 'lemonade'

  const sweetnessLabel: Record<string, string> = {
    too_sweet: 'Слишком сладко',
    sweet: 'Сладко',
    balanced: 'Баланс',
    tart: 'Кисло',
    very_tart: 'Очень кисло',
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      {isBeer && stats.srm != null && (
        <Section title="Цвет пива" icon={<Eye size={11} />}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginTop: 4 }}>
            <div
              style={{
                width: 56, height: 56, borderRadius: 14,
                background: `radial-gradient(ellipse at 35% 35%, ${srmColor}cc, ${srmColor})`,
                boxShadow: `0 0 20px ${srmColor}55, inset 0 1px 0 rgba(255,255,255,0.25)`,
                border: '1px solid var(--hairline)',
                flexShrink: 0,
              }}
            />
            <div>
              <p className="t-mono" style={{ fontSize: 22, fontWeight: 600, color: 'var(--t-1)', letterSpacing: '-0.01em' }}>
                {stats.srm?.toFixed(1)} <span style={{ fontSize: 13, color: 'var(--t-3)', fontWeight: 500 }}>SRM</span>
              </p>
              <p className="t-meta t-mono" style={{ marginTop: 2 }}>{stats.ebc?.toFixed(1)} EBC</p>
            </div>
          </div>
        </Section>
      )}

      <Section title="Расчёт" icon={<FlaskConical size={11} />}>
        {stats.og != null && (
          <>
            <Row label="OG" value={stats.og.toFixed(4)} accent />
            {stats.fg != null && <Row label="FG" value={stats.fg.toFixed(4)} />}
            {stats.abv != null && <Row label="ABV" value={`${stats.abv.toFixed(1)}%`} />}
          </>
        )}
        {isBeer && stats.ibu != null && <Row label="IBU" value={stats.ibu.toFixed(1)} sub="горечь" />}
        {stats.brix != null && <Row label="Brix" value={`${stats.brix.toFixed(1)}°Bx`} />}

        {isLemonade && stats.lemonade && (
          <>
            <Row label="Сахар"        value={`${stats.lemonade.sugarPerLiter} г/л`} />
            <Row label="Кислотность"  value={`${stats.lemonade.acidityGramPerLiter} г/л`} />
            <Row
              label="Баланс"
              value={sweetnessLabel[stats.lemonade.sweetnessBitterness]}
              accent={stats.lemonade.sweetnessBitterness === 'balanced'}
            />
          </>
        )}

        {isKombucha && stats.kombucha && (
          <>
            <Row label="Сахар"          value={`${stats.kombucha.sugarPerLiter} г/л`} />
            <Row label="1-я ферм."      value={`~${stats.kombucha.firstFermentDays} дн`} />
            <Row label="2-я ферм."      value={`~${stats.kombucha.secondFermentDays} дн`} />
            <Row label="Алкоголь"       value={`< ${stats.kombucha.approxAlcohol.toFixed(2)}%`} />
            <Row label="Чай"            value={stats.kombucha.teaConcentration} />
          </>
        )}
      </Section>

      {isBeer && stats.ibu != null && (
        <Section title="Горечь" icon={<Zap size={11} />}>
          <Gauge value={stats.ibu} min={0} max={120} />
          <p className="t-meta" style={{ marginTop: 8 }}>
            {stats.ibu < 15 ? 'Очень мягкая' : stats.ibu < 30 ? 'Мягкая' : stats.ibu < 50 ? 'Умеренная' : stats.ibu < 70 ? 'Горькая' : 'Очень горькая'}
          </p>
        </Section>
      )}

      {stats.mashWater > 0 && (
        <Section title="Объёмы" icon={<Droplets size={11} />}>
          <Row label="Затирание"      value={`${stats.mashWater} л`} />
          <Row label="Поглощено"      value={`${stats.grainAbsorption} л`} sub="зерном" />
          <Row label="До кипячения"   value={`${stats.preboilVolume} л`} />
          <Row label="Зерна всего"    value={`${stats.totalGrainKg.toFixed(2)} кг`} />
          {stats.totalHopG > 0 && <Row label="Хмель всего" value={`${stats.totalHopG} г`} />}
        </Section>
      )}

      {/* BJCP style compliance */}
      {bjcpStyle && isBeer && (
        <Section title={`Стиль: ${bjcpStyle.name}`} icon={<Target size={11} />}>
          <p style={{ fontSize: 10.5, color: 'var(--t-3)', marginBottom: 10 }}>{bjcpStyle.id}</p>
          <StyleCheck label="OG" value={stats.og} range={bjcpStyle.og} fmt={v => v.toFixed(3)} />
          <StyleCheck label="FG" value={stats.fg} range={bjcpStyle.fg} fmt={v => v.toFixed(3)} />
          <StyleCheck label="ABV" value={stats.abv} range={bjcpStyle.abv} fmt={v => `${v.toFixed(1)}%`} />
          <StyleCheck label="IBU" value={stats.ibu} range={bjcpStyle.ibu} fmt={v => v.toFixed(0)} />
          <StyleCheck label="SRM" value={stats.srm} range={bjcpStyle.srm} fmt={v => v.toFixed(1)} />
        </Section>
      )}

      <Section title="Рекомендации" icon={<Thermometer size={11} />}>
        <ul style={{ display: 'flex', flexDirection: 'column', gap: 8, listStyle: 'none', padding: 0, fontSize: 12.5, color: 'var(--t-2)' }}>
          {isBeer && stats.og != null && stats.og > 1.065 && (
            <li style={{ display: 'flex', alignItems: 'flex-start', gap: 8 }}>
              <span className="dot dot-warn" style={{ marginTop: 5 }} />
              Высокая плотность — питание дрожжей
            </li>
          )}
          {isBeer && stats.ibu != null && stats.ibu > 80 && (
            <li style={{ display: 'flex', alignItems: 'flex-start', gap: 8 }}>
              <span className="dot dot-warn" style={{ marginTop: 5 }} />
              Высокая горечь — проверьте стиль
            </li>
          )}
          {isBeer && stats.srm != null && stats.srm < 3 && (
            <li style={{ display: 'flex', alignItems: 'flex-start', gap: 8 }}>
              <span className="dot dot-info" style={{ marginTop: 5 }} />
              Очень светлый — вода важна
            </li>
          )}
          {isKombucha && (
            <li style={{ display: 'flex', alignItems: 'flex-start', gap: 8 }}>
              <span className="dot dot-ok" style={{ marginTop: 5 }} />
              SCOBY внести при 24-28°C
            </li>
          )}
          {isLemonade && (
            <li style={{ display: 'flex', alignItems: 'flex-start', gap: 8 }}>
              <span className="dot dot-info" style={{ marginTop: 5 }} />
              Карбонизация 3.5 vol CO₂
            </li>
          )}
          {(!stats.og || (stats.og >= 1.000 && stats.og <= 1.010)) && (
            <li style={{ color: 'var(--t-3)' }}>Добавьте ингредиенты для расчёта</li>
          )}
        </ul>
      </Section>
    </div>
  )
}
