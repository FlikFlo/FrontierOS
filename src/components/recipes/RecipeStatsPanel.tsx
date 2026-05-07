'use client'

import { useState } from 'react'
import type { BeverageCategory, RecipeMalt, RecipeHop, RecipeAdjunct } from '@/types/database'
import type { BeverageStats } from '@/lib/beverage-calc'
import { srmToColor } from '@/lib/utils'
import {
  Droplets, Thermometer, Zap, Eye, FlaskConical, Flame, Scale, Beaker,
  Wheat, Hop, Sparkles, ChevronDown, ChevronUp,
} from 'lucide-react'
import {
  calcStrikeTemp, calcMashThickness, classifyMashThickness, calcBuGu, classifyBuGu,
  calcCalories, calcPrimingSugar, defaultCO2VolumeForStyle, calcPitchRate,
  calcGrainBill, calcHopSchedule, calcSpargeWater, calcRealAttenuation,
} from '@/lib/brew-helpers'

interface Props {
  stats: BeverageStats
  category: BeverageCategory
  style?: string
  malts: RecipeMalt[]
  hops: RecipeHop[]
  adjuncts: RecipeAdjunct[]
  yeastAttenuation?: number
}

function StatRow({ label, value, sub, color, hint }: { label: string; value: string; sub?: string; color?: string; hint?: string }) {
  return (
    <div className="flex items-center justify-between py-2 border-b border-white/5 last:border-0 group">
      <span className="text-sm text-white/50 flex items-center gap-1.5">
        {label}
        {hint && (
          <span className="text-[10px] text-white/20 group-hover:text-white/40 cursor-help" title={hint}>ⓘ</span>
        )}
      </span>
      <div className="text-right">
        <span className={`text-sm font-semibold ${color ?? 'text-white'}`}>{value}</span>
        {sub && <p className="text-[10px] text-white/30">{sub}</p>}
      </div>
    </div>
  )
}

function GaugeBar({ value, min, max, color, segments }: {
  value: number; min: number; max: number; color: string;
  segments?: { at: number; label: string }[]
}) {
  const pct = Math.min(100, Math.max(0, ((value - min) / (max - min)) * 100))
  return (
    <div className="mt-1">
      <div className="flex justify-between text-[10px] text-white/30 mb-1">
        <span>{min}</span>
        <span className="font-medium text-white/70">{value.toFixed(1)}</span>
        <span>{max}</span>
      </div>
      <div className="relative h-2 rounded-full bg-white/10 overflow-hidden">
        <div className="h-full rounded-full transition-all duration-300" style={{ width: `${pct}%`, background: color }} />
        {segments?.map((s, i) => {
          const segPct = ((s.at - min) / (max - min)) * 100
          if (segPct < 0 || segPct > 100) return null
          return (
            <span
              key={i}
              className="absolute top-0 bottom-0 w-px bg-white/20"
              style={{ left: `${segPct}%` }}
              title={s.label}
            />
          )
        })}
      </div>
    </div>
  )
}

function Section({ icon: Icon, title, children, defaultOpen = true }: {
  icon: React.ComponentType<{ size?: number; className?: string }>
  title: string
  children: React.ReactNode
  defaultOpen?: boolean
}) {
  const [open, setOpen] = useState(defaultOpen)
  return (
    <div className="glass p-5">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between mb-3 group"
      >
        <span className="text-xs font-semibold text-white/60 uppercase tracking-wider flex items-center gap-2">
          <Icon size={13} />{title}
        </span>
        {open ? <ChevronUp size={14} className="text-white/30 group-hover:text-white/60" /> : <ChevronDown size={14} className="text-white/30 group-hover:text-white/60" />}
      </button>
      {open && children}
    </div>
  )
}

export default function RecipeStatsPanel({ stats, category, style, malts, hops, adjuncts, yeastAttenuation = 75 }: Props) {
  const srmColor = stats.srm ? srmToColor(stats.srm) : '#FFE699'
  const isBeer = category === 'beer'
  const isKombucha = category === 'kombucha'
  const isLemonade = category === 'lemonade'

  // Mash params
  const [mashTempC, setMashTempC] = useState(67)
  const [grainTempC, setGrainTempC] = useState(20)
  const [mashRatio, setMashRatio] = useState(3.0)

  // Carbonation params
  const [beerTempC, setBeerTempC] = useState(20)
  const [targetCO2, setTargetCO2] = useState(defaultCO2VolumeForStyle(style ?? ''))

  const grainBill = calcGrainBill(malts)
  const hopSchedule = calcHopSchedule(hops, stats.og ?? 1.05, 25)

  const buGu = stats.og && stats.ibu ? calcBuGu(stats.ibu, stats.og) : null
  const calories = stats.og && stats.fg ? calcCalories(stats.og, stats.fg) : null
  const realAtt = stats.og && stats.fg ? calcRealAttenuation(stats.og, stats.fg) : null
  const strikeTemp = stats.totalGrainKg > 0
    ? calcStrikeTemp(stats.totalGrainKg, stats.totalGrainKg * mashRatio, grainTempC, mashTempC)
    : null
  const mashThickness = stats.totalGrainKg > 0 && stats.mashWater > 0
    ? calcMashThickness(stats.totalGrainKg, stats.mashWater)
    : null
  const spargeWater = stats.preboilVolume > 0
    ? calcSpargeWater(stats.preboilVolume, stats.mashWater, stats.grainAbsorption)
    : null
  const pitch = stats.og && stats.og > 1.0
    ? calcPitchRate(25, stats.og, stats.og >= 1.075 ? 'big' : 'ale')
    : null
  const priming = stats.totalGrainKg > 0 || isBeer ? calcPrimingSugar(25, beerTempC, targetCO2) : null

  const sweetnessLabel: Record<string, string> = {
    too_sweet: 'Слишком сладко',
    sweet: 'Сладко',
    balanced: 'Баланс',
    tart: 'Кисло',
    very_tart: 'Очень кисло',
  }

  const hopUseLabels: Record<string, string> = {
    bittering: 'Горечь', flavor: 'Вкус', aroma: 'Аромат', whirlpool: 'Вирпул', dry_hop: 'Сухое',
  }

  return (
    <div className="space-y-4">

      {/* Color visual + Quick stats */}
      <div className="glass p-5 space-y-4">
        {isBeer && stats.srm != null && (
          <div className="flex items-center gap-4">
            <div
              className="w-20 h-20 rounded-2xl border border-white/10 flex-shrink-0 relative"
              style={{ background: `radial-gradient(ellipse at 35% 35%, ${srmColor}, ${srmColor}aa)`, boxShadow: `0 0 30px ${srmColor}55` }}
            >
              <span className="absolute bottom-1 right-1 text-[10px] font-mono text-black/60 bg-white/30 px-1 rounded">
                #{Math.round(stats.srm)}
              </span>
            </div>
            <div className="flex-1">
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-bold text-white">{stats.abv?.toFixed(1) ?? '—'}</span>
                <span className="text-sm text-white/40">% ABV</span>
              </div>
              <div className="flex items-center gap-3 mt-1 text-xs text-white/50">
                <span>SRM {stats.srm.toFixed(1)}</span>
                <span className="text-white/20">·</span>
                <span>EBC {stats.ebc?.toFixed(0)}</span>
                {stats.ibu != null && (
                  <>
                    <span className="text-white/20">·</span>
                    <span>IBU {stats.ibu.toFixed(0)}</span>
                  </>
                )}
              </div>
            </div>
          </div>
        )}

        {!isBeer && stats.abv != null && (
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-bold text-white">{stats.abv.toFixed(1)}</span>
            <span className="text-sm text-white/40">% ABV</span>
          </div>
        )}

        <div className="grid grid-cols-3 gap-2">
          <div className="glass-sm p-2 text-center">
            <p className="text-[10px] text-white/30 uppercase tracking-wide">OG</p>
            <p className="text-base font-semibold text-amber-300 mt-0.5">{stats.og?.toFixed(3) ?? '—'}</p>
          </div>
          <div className="glass-sm p-2 text-center">
            <p className="text-[10px] text-white/30 uppercase tracking-wide">FG</p>
            <p className="text-base font-semibold text-blue-300 mt-0.5">{stats.fg?.toFixed(3) ?? '—'}</p>
          </div>
          <div className="glass-sm p-2 text-center">
            <p className="text-[10px] text-white/30 uppercase tracking-wide">Brix</p>
            <p className="text-base font-semibold text-white mt-0.5">{stats.brix?.toFixed(1) ?? '—'}</p>
          </div>
        </div>

        {calories != null && (
          <div className="grid grid-cols-3 gap-2">
            <div className="glass-sm p-2 text-center">
              <p className="text-[10px] text-white/30 uppercase">Калории</p>
              <p className="text-sm font-semibold text-white mt-0.5">{calories} ккал</p>
              <p className="text-[9px] text-white/30">/ 330 мл</p>
            </div>
            <div className="glass-sm p-2 text-center">
              <p className="text-[10px] text-white/30 uppercase">Сбраж.</p>
              <p className="text-sm font-semibold text-white mt-0.5">{realAtt?.toFixed(0) ?? '—'}%</p>
              <p className="text-[9px] text-white/30">реально</p>
            </div>
            <div className="glass-sm p-2 text-center">
              <p className="text-[10px] text-white/30 uppercase">BU:GU</p>
              <p className={`text-sm font-semibold mt-0.5 ${buGu ? 'text-white' : 'text-white/30'}`}>{buGu?.toFixed(2) ?? '—'}</p>
              <p className="text-[9px] text-white/30">{buGu ? classifyBuGu(buGu) : '—'}</p>
            </div>
          </div>
        )}
      </div>

      {/* IBU gauge (beer) */}
      {isBeer && stats.ibu != null && stats.ibu > 0 && (
        <Section icon={Zap} title="Горечь">
          <GaugeBar
            value={stats.ibu} min={0} max={120} color="#f59e0b"
            segments={[{ at: 15, label: 'мягкая' }, { at: 30, label: 'умер.' }, { at: 50, label: 'горькая' }, { at: 80, label: 'очень' }]}
          />
          <p className="text-[11px] text-white/30 mt-2">
            {stats.ibu < 15 ? 'Очень мягкая' : stats.ibu < 30 ? 'Мягкая' : stats.ibu < 50 ? 'Умеренная' : stats.ibu < 70 ? 'Горькая' : 'Очень горькая'}
            {buGu && ` · ${classifyBuGu(buGu)}`}
          </p>
        </Section>
      )}

      {/* Grain bill % */}
      {grainBill.length > 0 && (
        <Section icon={Wheat} title={`Засыпь · ${stats.totalGrainKg.toFixed(2)} кг`}>
          <div className="space-y-1.5">
            {grainBill.map(g => (
              <div key={g.name}>
                <div className="flex justify-between text-xs">
                  <span className="text-white/70 truncate flex-1 mr-2">{g.name}</span>
                  <span className="text-white/50 tabular-nums">{g.amountKg} кг</span>
                  <span className="text-white/40 tabular-nums w-12 text-right">{g.pct.toFixed(1)}%</span>
                </div>
                <div className="h-1 bg-white/5 rounded-full mt-1 overflow-hidden">
                  <div className="h-full bg-gradient-to-r from-amber-400 to-orange-500" style={{ width: `${g.pct}%` }} />
                </div>
              </div>
            ))}
          </div>
        </Section>
      )}

      {/* Hop schedule */}
      {hopSchedule.length > 0 && isBeer && (
        <Section icon={Hop} title={`Хмель · ${stats.totalHopG} г`}>
          <div className="space-y-1.5">
            {hopSchedule.map((h, i) => (
              <div key={i} className="flex items-center justify-between text-xs glass-sm p-2 gap-2">
                <span className="text-white/80 truncate flex-1 min-w-0">{h.name}</span>
                <span className="badge badge-gray text-[10px]">{hopUseLabels[h.use] ?? h.use}</span>
                <span className="text-white/40 tabular-nums w-12 text-right">{h.amountG}г</span>
                <span className="text-white/30 tabular-nums w-10 text-right">{h.timeMin}мин</span>
                <span className="text-amber-300 tabular-nums w-12 text-right">{h.ibuContribution} IBU</span>
              </div>
            ))}
          </div>
        </Section>
      )}

      {/* Mash calculator */}
      {(category === 'beer' || category === 'kvass') && stats.totalGrainKg > 0 && (
        <Section icon={Flame} title="Затирание">
          <div className="grid grid-cols-3 gap-2 mb-3">
            <div>
              <label className="block text-[10px] text-white/40 uppercase mb-1">T затир.</label>
              <input type="number" className="glass-input text-xs py-1.5" value={mashTempC}
                onChange={e => setMashTempC(+e.target.value)} min={50} max={80} step={0.5} />
            </div>
            <div>
              <label className="block text-[10px] text-white/40 uppercase mb-1">T зерна</label>
              <input type="number" className="glass-input text-xs py-1.5" value={grainTempC}
                onChange={e => setGrainTempC(+e.target.value)} min={0} max={40} step={1} />
            </div>
            <div>
              <label className="block text-[10px] text-white/40 uppercase mb-1">Густота л/кг</label>
              <input type="number" className="glass-input text-xs py-1.5" value={mashRatio}
                onChange={e => setMashRatio(+e.target.value)} min={1.5} max={5} step={0.1} />
            </div>
          </div>

          <StatRow label="T заливочной воды" value={strikeTemp != null ? `${strikeTemp.toFixed(1)} °C` : '—'}
            color="text-orange-300" hint="Палмер: T_strike = T_target + 0.2·(T_target − T_grain)·(зерно/вода)" />
          <StatRow label="Густота затора" value={mashThickness != null ? `${mashThickness} л/кг` : '—'}
            sub={mashThickness ? (classifyMashThickness(mashThickness) === 'thick' ? 'густой' : classifyMashThickness(mashThickness) === 'thin' ? 'жидкий' : 'средний') : undefined} />
          <StatRow label="Вода на затирание" value={`${stats.mashWater} л`} />
          <StatRow label="Поглощение зерном" value={`${stats.grainAbsorption} л`} />
          {spargeWater != null && spargeWater > 0 && (
            <StatRow label="Вода на промывку" value={`${spargeWater} л`} hint="Sparge water для достижения preboil объёма" />
          )}
          <StatRow label="Объём до кипячения" value={`${stats.preboilVolume} л`} />
        </Section>
      )}

      {/* Yeast pitch */}
      {pitch && isBeer && (
        <Section icon={Beaker} title="Дрожжи">
          <StatRow label="Нужно клеток" value={`${pitch.totalCellsB} млрд`}
            hint="Расчёт по Mr. Malty (0.75 М/мл/°P для элей, 1.5 для лагеров)" />
          <StatRow label="Сухих пакетов" value={`${pitch.packsRecommended} шт`} sub="из расчёта 200 млрд / пак" />
          <StatRow label="Сбражив. рецепта" value={`${yeastAttenuation}%`} />
          {realAtt != null && (
            <StatRow label="Реальное сбражив." value={`${realAtt.toFixed(1)}%`}
              color={realAtt > yeastAttenuation + 5 ? 'text-amber-300' : realAtt < yeastAttenuation - 5 ? 'text-amber-300' : 'text-emerald-300'} />
          )}
        </Section>
      )}

      {/* Carbonation */}
      {priming && isBeer && (
        <Section icon={Sparkles} title="Карбонизация" defaultOpen={false}>
          <div className="grid grid-cols-2 gap-2 mb-3">
            <div>
              <label className="block text-[10px] text-white/40 uppercase mb-1">T пива °C</label>
              <input type="number" className="glass-input text-xs py-1.5" value={beerTempC}
                onChange={e => setBeerTempC(+e.target.value)} min={0} max={30} step={1} />
            </div>
            <div>
              <label className="block text-[10px] text-white/40 uppercase mb-1">Цель vol CO₂</label>
              <input type="number" className="glass-input text-xs py-1.5" value={targetCO2}
                onChange={e => setTargetCO2(+e.target.value)} min={1.5} max={4.5} step={0.1} />
            </div>
          </div>
          <StatRow label="Декстроза" value={`${priming.dextroseG} г`} color="text-amber-300" />
          <StatRow label="Сахар-песок" value={`${priming.sucroseG} г`} />
          <StatRow label="Сухой солод. экстракт" value={`${priming.dmeG} г`} />
          <p className="text-[10px] text-white/30 mt-2">Расчёт на 25 л партии. Растворить в кипятке, остудить, добавить перед розливом.</p>
        </Section>
      )}

      {/* Special category panels */}
      {isLemonade && stats.lemonade && (
        <Section icon={Droplets} title="Лимонад / газировка">
          <StatRow label="Сахар" value={`${stats.lemonade.sugarPerLiter} г/л`} />
          <StatRow label="Кислотность" value={`${stats.lemonade.acidityGramPerLiter} г/л`} />
          <StatRow
            label="Баланс"
            value={sweetnessLabel[stats.lemonade.sweetnessBitterness]}
            color={stats.lemonade.sweetnessBitterness === 'balanced' ? 'text-emerald-400' : 'text-amber-300'}
          />
          <StatRow label="Карбонизация" value={`${stats.lemonade.co2Volumes} vol CO₂`} />
        </Section>
      )}

      {isKombucha && stats.kombucha && (
        <Section icon={FlaskConical} title="Комбуча">
          <StatRow label="Сахар" value={`${stats.kombucha.sugarPerLiter} г/л`} />
          <StatRow label="1-я ферментация" value={`~${stats.kombucha.firstFermentDays} дн.`} />
          <StatRow label="2-я ферментация" value={`~${stats.kombucha.secondFermentDays} дн.`} />
          <StatRow label="Алкоголь" value={`< ${stats.kombucha.approxAlcohol.toFixed(2)}%`} color="text-emerald-300" />
          <StatRow label="Чай" value={stats.kombucha.teaConcentration} />
        </Section>
      )}

      {/* Recommendations */}
      <Section icon={Thermometer} title="Подсказки" defaultOpen={false}>
        <ul className="space-y-1.5 text-sm text-white/50">
          {isBeer && stats.og != null && stats.og > 1.075 && (
            <li className="text-amber-400/80">⚠ Очень высокая плотность ({stats.og.toFixed(3)}) — питание дрожжей, степ-стартер</li>
          )}
          {isBeer && stats.og != null && stats.og > 1.065 && stats.og <= 1.075 && (
            <li className="text-amber-400/80">⚠ Высокая плотность — рассмотри O₂ перед инокуляцией</li>
          )}
          {isBeer && stats.ibu != null && stats.ibu > 80 && (
            <li className="text-amber-400/80">⚠ Очень высокая горечь — проверь стиль</li>
          )}
          {isBeer && buGu != null && buGu > 1.0 && (
            <li className="text-amber-400/80">⚠ BU:GU {buGu.toFixed(2)} — хмель доминирует над солодом</li>
          )}
          {isBeer && stats.srm != null && stats.srm < 3 && (
            <li className="text-blue-400/80">💡 Светлое — вода критична, контролируй сульфаты</li>
          )}
          {isBeer && stats.srm != null && stats.srm > 30 && (
            <li className="text-blue-400/80">💡 Тёмное — повышь хлориды, убавь сульфаты</li>
          )}
          {mashThickness != null && classifyMashThickness(mashThickness) === 'thick' && (
            <li className="text-blue-400/80">💡 Густой затор — выше brewhouse efficiency, сложнее перемешивать</li>
          )}
          {mashThickness != null && classifyMashThickness(mashThickness) === 'thin' && (
            <li className="text-blue-400/80">💡 Жидкий затор — мягче на ферменты, но потери эффективности</li>
          )}
          {isKombucha && (
            <li className="text-emerald-400/80">✓ SCOBY вносить при 24-28°C, pH старта 4.5</li>
          )}
          {isLemonade && (
            <li className="text-blue-400/80">💡 Натуральная карбонизация — 7-10 дн. при 22°C</li>
          )}
          {(stats.og == null || stats.og <= 1.005) && malts.length === 0 && adjuncts.length === 0 && (
            <li className="text-white/30">Добавьте ингредиенты для расчёта</li>
          )}
          <li className="text-white/30 text-xs pt-2 border-t border-white/5">
            <Scale size={11} className="inline mr-1" />
            Расчёты приближённые: Tinseth (IBU), Morey (SRM), Palmer (затирание)
          </li>
        </ul>
      </Section>
    </div>
  )
}
