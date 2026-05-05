'use client'

import type { BeverageCategory } from '@/types/database'
import type { BeverageStats } from '@/lib/beverage-calc'
import { srmToColor } from '@/lib/utils'
import { Droplets, Thermometer, Zap, Eye, FlaskConical } from 'lucide-react'

interface Props {
  stats: BeverageStats
  category: BeverageCategory
}

function StatRow({ label, value, sub, color }: { label: string; value: string; sub?: string; color?: string }) {
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

function GaugeBar({ value, min, max, color = '#f59e0b', label }: { value: number; min: number; max: number; color?: string; label: string }) {
  const pct = Math.min(100, Math.max(0, ((value - min) / (max - min)) * 100))
  return (
    <div className="mt-1">
      <div className="flex justify-between text-[10px] text-white/30 mb-1">
        <span>{min}</span><span className="font-medium text-white/60">{value.toFixed(1)}</span><span>{max}</span>
      </div>
      <div className="progress-track h-2">
        <div className="progress-bar h-2" style={{ width: `${pct}%`, background: color }} />
      </div>
    </div>
  )
}

export default function RecipeStatsPanel({ stats, category }: Props) {
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
    <div className="space-y-4">

      {/* Color visual (beer) */}
      {isBeer && stats.srm != null && (
        <div className="glass p-5">
          <h3 className="text-xs font-semibold text-white/50 uppercase tracking-wider mb-3 flex items-center gap-2">
            <Eye size={13} />Цвет пива
          </h3>
          <div className="flex items-center gap-4">
            <div
              className="w-16 h-16 rounded-2xl border border-white/10 flex-shrink-0"
              style={{ background: `radial-gradient(ellipse at 35% 35%, ${srmColor}cc, ${srmColor})`, boxShadow: `0 0 20px ${srmColor}44` }}
            />
            <div>
              <p className="text-2xl font-bold text-white">{stats.srm?.toFixed(1)} SRM</p>
              <p className="text-sm text-white/40">{stats.ebc?.toFixed(1)} EBC</p>
            </div>
          </div>
        </div>
      )}

      {/* Main stats */}
      <div className="glass p-5">
        <h3 className="text-xs font-semibold text-white/50 uppercase tracking-wider mb-3 flex items-center gap-2">
          <FlaskConical size={13} />Расчёт калькулятора
        </h3>

        {/* Fermented */}
        {stats.og != null && (
          <>
            <StatRow label="OG (нач. плотность)" value={stats.og.toFixed(4)} color="text-amber-300" />
            {stats.fg != null && <StatRow label="FG (кон. плотность)" value={stats.fg.toFixed(4)} />}
            {stats.abv != null && <StatRow label="ABV (алкоголь)" value={`${stats.abv.toFixed(1)}%`} color="text-blue-300" />}
          </>
        )}

        {isBeer && stats.ibu != null && (
          <StatRow label="IBU (горечь)" value={stats.ibu.toFixed(1)} sub="единиц горечи" />
        )}

        {stats.brix != null && (
          <StatRow label="Brix" value={`${stats.brix.toFixed(1)}°Bx`} />
        )}

        {isLemonade && stats.lemonade && (
          <>
            <StatRow label="Сахар" value={`${stats.lemonade.sugarPerLiter} г/л`} />
            <StatRow label="Кислотность" value={`${stats.lemonade.acidityGramPerLiter} г/л`} />
            <StatRow
              label="Баланс"
              value={sweetnessLabel[stats.lemonade.sweetnessBitterness]}
              color={stats.lemonade.sweetnessBitterness === 'balanced' ? 'text-emerald-400' : 'text-amber-300'}
            />
          </>
        )}

        {isKombucha && stats.kombucha && (
          <>
            <StatRow label="Сахар" value={`${stats.kombucha.sugarPerLiter} г/л`} />
            <StatRow label="1-я ферментация" value={`~${stats.kombucha.firstFermentDays} дн.`} />
            <StatRow label="2-я ферментация" value={`~${stats.kombucha.secondFermentDays} дн.`} />
            <StatRow label="Алкоголь" value={`< ${stats.kombucha.approxAlcohol.toFixed(2)}%`} color="text-emerald-300" />
            <StatRow label="Чай" value={stats.kombucha.teaConcentration} />
          </>
        )}
      </div>

      {/* IBU gauge (beer) */}
      {isBeer && stats.ibu != null && (
        <div className="glass p-5">
          <h3 className="text-xs font-semibold text-white/50 uppercase tracking-wider mb-2 flex items-center gap-2">
            <Zap size={13} />Горечь
          </h3>
          <GaugeBar value={stats.ibu} min={0} max={120} color="#f59e0b" label="IBU" />
          <p className="text-[11px] text-white/30 mt-2">
            {stats.ibu < 15 ? 'Очень мягкая' : stats.ibu < 30 ? 'Мягкая' : stats.ibu < 50 ? 'Умеренная' : stats.ibu < 70 ? 'Горькая' : 'Очень горькая'}
          </p>
        </div>
      )}

      {/* Water / Process */}
      {stats.mashWater > 0 && (
        <div className="glass p-5">
          <h3 className="text-xs font-semibold text-white/50 uppercase tracking-wider mb-3 flex items-center gap-2">
            <Droplets size={13} />Вода и объёмы
          </h3>
          <StatRow label="Вода на затирание" value={`${stats.mashWater} л`} />
          <StatRow label="Поглощение зерном" value={`${stats.grainAbsorption} л`} />
          <StatRow label="Объём до кипячения" value={`${stats.preboilVolume} л`} />
          <StatRow label="Зерна всего" value={`${stats.totalGrainKg.toFixed(2)} кг`} />
          {stats.totalHopG > 0 && <StatRow label="Хмель всего" value={`${stats.totalHopG} г`} />}
        </div>
      )}

      {/* Temp range (if yeast) */}
      <div className="glass p-5">
        <h3 className="text-xs font-semibold text-white/50 uppercase tracking-wider mb-2 flex items-center gap-2">
          <Thermometer size={13} />Рекомендации
        </h3>
        <ul className="space-y-1.5 text-sm text-white/50">
          {isBeer && stats.og != null && stats.og > 1.065 && (
            <li className="text-amber-400/80">⚠ Высокая плотность — питание дрожжей</li>
          )}
          {isBeer && stats.ibu != null && stats.ibu > 80 && (
            <li className="text-amber-400/80">⚠ Высокая горечь — проверьте стиль</li>
          )}
          {isBeer && stats.srm != null && stats.srm < 3 && (
            <li className="text-blue-400/80">💡 Очень светлый — вода важна</li>
          )}
          {isKombucha && (
            <li className="text-emerald-400/80">✓ SCOBY внести при 24-28°C</li>
          )}
          {isLemonade && (
            <li className="text-blue-400/80">💡 Карбонизация 3.5 vol CO₂</li>
          )}
          {stats.og != null && stats.og >= 1.000 && stats.og <= 1.010 && (
            <li className="text-white/30">Добавьте ингредиенты для расчёта</li>
          )}
        </ul>
      </div>
    </div>
  )
}
