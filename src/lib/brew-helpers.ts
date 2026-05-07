/**
 * Advanced brewing calculator helpers — strike temp, mash thickness,
 * BU:GU ratio, calories, carbonation, pitch rate, grain bill breakdown,
 * hop schedule, water profile, cost estimate.
 */

import type { RecipeMalt, RecipeHop, RecipeAdjunct } from '@/types/database'

// ─── STRIKE WATER TEMPERATURE ────────────────────────────────────────────────
// Palmer's formula: T_strike = (0.2 × T_grain × Wg/Ww + T_target × (1 + 0.2 × Wg/Ww))
// 0.2 is heat capacity ratio of grain to water
export function calcStrikeTemp(
  grainKg: number,
  waterL: number,
  grainTempC: number,
  targetMashTempC: number,
): number {
  if (waterL <= 0 || grainKg <= 0) return targetMashTempC + 5
  const ratio = grainKg / waterL // kg/L
  const t = targetMashTempC + 0.2 * (targetMashTempC - grainTempC) * ratio
  return Math.round(t * 10) / 10
}

// ─── MASH THICKNESS ──────────────────────────────────────────────────────────
// liters per kg
export function calcMashThickness(grainKg: number, waterL: number): number {
  if (grainKg <= 0) return 0
  return Math.round((waterL / grainKg) * 100) / 100
}

export function classifyMashThickness(ratio: number): 'thick' | 'medium' | 'thin' {
  if (ratio < 2.5) return 'thick'
  if (ratio > 3.3) return 'thin'
  return 'medium'
}

// ─── BU:GU RATIO ─────────────────────────────────────────────────────────────
// Bitterness vs gravity balance — perceived bitterness indicator.
export function calcBuGu(ibu: number, og: number): number {
  if (og <= 1.0) return 0
  const gravityPoints = (og - 1) * 1000
  return Math.round((ibu / gravityPoints) * 100) / 100
}

export function classifyBuGu(ratio: number): string {
  if (ratio < 0.3) return 'Очень солодовый'
  if (ratio < 0.5) return 'Солодовый'
  if (ratio < 0.7) return 'Сбалансированный'
  if (ratio < 0.9) return 'Хмелевой'
  return 'Очень хмелевой'
}

// ─── CALORIES (per 330 ml serving) ───────────────────────────────────────────
// Calories ≈ ((6.9 × ABV) + 4.0 × (real_extract - 0.1)) × FG × 3.55 (per 12 oz)
// Approximation per 330 ml.
export function calcCalories(og: number, fg: number): number {
  const abv = (og - fg) * 131.25
  const realExtract = (0.1808 * (og - 1) * 1000) + (0.8192 * (fg - 1) * 1000)
  const caloriesPer12oz = ((6.9 * abv) + 4.0 * Math.max(realExtract - 0.1, 0)) * fg * 3.55 / 100
  return Math.round(caloriesPer12oz * (330 / 355))
}

// ─── CARBONATION (priming sugar) ─────────────────────────────────────────────
// Volumes of CO₂ → grams of dextrose for bottle conditioning
export function calcPrimingSugar(
  batchSizeL: number,
  beerTempC: number,
  targetVolumesCO2: number,
): { dextroseG: number; sucroseG: number; dmeG: number } {
  // Residual CO2 in beer at temperature
  const residual = 3.0378 - (0.050062 * (beerTempC * 9 / 5 + 32)) + (0.00026555 * Math.pow(beerTempC * 9 / 5 + 32, 2))
  const co2NeededG = (targetVolumesCO2 - residual) * 1.96 * batchSizeL
  // Dextrose = CO2/0.46 (efficiency); Sucrose ~0.91× dextrose; DME ~1.4× dextrose
  const dextrose = co2NeededG / 0.46
  return {
    dextroseG: Math.round(dextrose),
    sucroseG: Math.round(dextrose * 0.91),
    dmeG: Math.round(dextrose * 1.4),
  }
}

export function defaultCO2VolumeForStyle(style: string): number {
  const s = style.toLowerCase()
  if (s.includes('lager') || s.includes('pilsner')) return 2.5
  if (s.includes('wheat') || s.includes('hefe') || s.includes('weizen')) return 3.4
  if (s.includes('belg') || s.includes('saison')) return 3.0
  if (s.includes('stout') || s.includes('porter')) return 1.8
  if (s.includes('ipa') || s.includes('pale')) return 2.4
  return 2.4
}

// ─── YEAST PITCH RATE ────────────────────────────────────────────────────────
// Pitching rate = batch_L × OG_points × pitch_factor (M cells / mL)
// Standard ales: 0.75 M/mL/°P, lagers: 1.5 M/mL/°P
export function calcPitchRate(
  batchSizeL: number,
  og: number,
  type: 'ale' | 'lager' | 'big' = 'ale',
): { totalCellsB: number; packsRecommended: number } {
  const plato = (og - 1) * 1000 / 4 // approx points → °P
  const factor = type === 'lager' ? 1.5 : type === 'big' ? 1.25 : 0.75 // M cells / mL / °P
  const cellsM = batchSizeL * 1000 * factor * plato
  const cellsB = cellsM / 1000 // convert M to B
  const packsRecommended = Math.ceil(cellsB / 200) // dry pack ~200B viable cells
  return {
    totalCellsB: Math.round(cellsB * 10) / 10,
    packsRecommended,
  }
}

// ─── GRAIN BILL BREAKDOWN ────────────────────────────────────────────────────
export interface GrainBillRow {
  name: string
  amountKg: number
  pct: number
  contributionPoints: number
}
export function calcGrainBill(malts: RecipeMalt[]): GrainBillRow[] {
  const totalKg = malts.reduce((s, m) => s + m.amount_kg, 0)
  if (!totalKg) return []
  return malts.map(m => ({
    name: m.name || 'Без названия',
    amountKg: Math.round(m.amount_kg * 100) / 100,
    pct: Math.round((m.amount_kg / totalKg) * 1000) / 10,
    contributionPoints: Math.round(m.amount_kg * m.extract_potential * 4.6) / 10,
  })).sort((a, b) => b.amountKg - a.amountKg)
}

// ─── HOP SCHEDULE BREAKDOWN ──────────────────────────────────────────────────
export interface HopScheduleRow {
  name: string
  amountG: number
  alpha: number
  use: string
  timeMin: number
  ibuContribution: number
  pct: number
}
export function calcHopSchedule(hops: RecipeHop[], og: number, batchSizeL: number): HopScheduleRow[] {
  if (!hops.length) return []

  function utilization(time: number, gravity: number) {
    const bigness = 1.65 * Math.pow(0.000125, gravity - 1)
    const boilTime = (1 - Math.exp(-0.04 * time)) / 4.15
    return bigness * boilTime
  }

  const boilGravity = og * 0.9
  const totalIBU = hops.reduce((sum, h) => {
    if (h.use === 'dry_hop') return sum
    const aau = (h.alpha_acid / 100) * h.amount_g
    return sum + (aau * utilization(h.time_min, boilGravity) * 7490) / batchSizeL
  }, 0) || 1

  return hops.map(h => {
    const aau = (h.alpha_acid / 100) * h.amount_g
    const contrib = h.use === 'dry_hop' ? 0 : (aau * utilization(h.time_min, boilGravity) * 7490) / batchSizeL
    return {
      name: h.name || 'Без названия',
      amountG: h.amount_g,
      alpha: h.alpha_acid,
      use: h.use,
      timeMin: h.time_min,
      ibuContribution: Math.round(contrib * 10) / 10,
      pct: Math.round((contrib / totalIBU) * 1000) / 10,
    }
  }).sort((a, b) => b.timeMin - a.timeMin)
}

// ─── WATER PROFILE ───────────────────────────────────────────────────────────
// Sparge water = total mash-out volume + grain absorption losses
export function calcSpargeWater(
  preboilVolumeL: number,
  mashWaterL: number,
  grainAbsorptionL: number,
  deadSpaceL = 1,
): number {
  return Math.round(Math.max(0, preboilVolumeL - mashWaterL + grainAbsorptionL + deadSpaceL) * 10) / 10
}

// ─── ATTENUATION RANGE ───────────────────────────────────────────────────────
export function attenuationRange(yeastAtt: number): { fgMin: number; fgMax: number } {
  // ±5% atten range gives FG window
  return { fgMin: yeastAtt + 5, fgMax: yeastAtt - 5 }
}

// ─── COST ESTIMATE ───────────────────────────────────────────────────────────
// Match malts/hops/adjuncts by name to inventory items, sum cost
export interface InventoryLookup {
  name: string
  cost_per_unit: number | null
  unit: string
}
export function calcRecipeCost(
  malts: RecipeMalt[],
  hops: RecipeHop[],
  adjuncts: RecipeAdjunct[],
  inventory: InventoryLookup[],
): { totalCost: number; breakdown: { name: string; cost: number }[] } {
  const lookup = new Map(inventory.map(i => [i.name.toLowerCase(), i]))
  const breakdown: { name: string; cost: number }[] = []
  let total = 0

  for (const m of malts) {
    const inv = lookup.get(m.name.toLowerCase())
    if (inv?.cost_per_unit) {
      // assume inventory unit kg, malt amount_kg
      const cost = m.amount_kg * inv.cost_per_unit
      total += cost
      breakdown.push({ name: m.name, cost: Math.round(cost * 100) / 100 })
    }
  }
  for (const h of hops) {
    const inv = lookup.get(h.name.toLowerCase())
    if (inv?.cost_per_unit) {
      // hop cost_per_unit is per gram in inventory typically
      const cost = h.amount_g * inv.cost_per_unit
      total += cost
      breakdown.push({ name: h.name, cost: Math.round(cost * 100) / 100 })
    }
  }
  for (const a of adjuncts) {
    const inv = lookup.get(a.name.toLowerCase())
    if (inv?.cost_per_unit) {
      const factor = a.unit === 'kg' ? 1 : a.unit === 'g' ? 1 : a.unit === 'L' ? 1 : a.unit === 'ml' ? 1 : 1
      const cost = a.amount * factor * inv.cost_per_unit
      total += cost
      breakdown.push({ name: a.name, cost: Math.round(cost * 100) / 100 })
    }
  }
  return { totalCost: Math.round(total * 100) / 100, breakdown }
}

// ─── BOIL OFF VOLUME ─────────────────────────────────────────────────────────
export function calcBoilOff(preboilL: number, postboilL: number): number {
  return Math.round((preboilL - postboilL) * 10) / 10
}

// ─── ALCOHOL BY VOLUME (alternative formula) ─────────────────────────────────
export function calcABVAdvanced(og: number, fg: number): number {
  // Brewer's Friend: ABV = (76.08 × (og - fg) / (1.775 - og)) × (fg / 0.794)
  const abv = (76.08 * (og - fg) / (1.775 - og)) * (fg / 0.794)
  return Math.round(abv * 100) / 100
}

// ─── REAL ATTENUATION ────────────────────────────────────────────────────────
export function calcRealAttenuation(og: number, fg: number): number {
  if (og <= 1.0) return 0
  return Math.round(((og - fg) / (og - 1)) * 1000) / 10
}
