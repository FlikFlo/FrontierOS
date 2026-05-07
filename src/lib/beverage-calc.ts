/**
 * Universal calculator for craft beverages.
 * Beer / Kombucha / Lemonade / Cider / Mead / Kvass / Wine + auxiliary helpers
 * (priming sugar, refractometer correction, hydrometer temp correction,
 * strike water, water chemistry, alternative IBU formulas).
 */

import type { RecipeMalt, RecipeHop, RecipeYeast, RecipeAdjunct, BeverageCategory } from '@/types/database'

// ─── BEER CALCULATIONS ───────────────────────────────────────────────────────

export function calcBeerOG(malts: RecipeMalt[], batchSizeL: number, efficiency: number): number {
  if (!malts.length || batchSizeL <= 0) return 1.000
  const totalPoints = malts.reduce((sum, m) => {
    const ppg = m.extract_potential * 0.46
    const ppL = ppg / 0.264172
    return sum + m.amount_kg * ppL
  }, 0)
  const og = 1 + (totalPoints * (efficiency / 100)) / batchSizeL / 1000
  return Math.round(og * 10000) / 10000
}

/** Alias kept for components that import the older name. */
export const calcOG = calcBeerOG

export function calcFG(og: number, attenuation: number): number {
  return Math.round((og - (og - 1.000) * (attenuation / 100)) * 10000) / 10000
}

export function calcABV(og: number, fg: number): number {
  return Math.round((og - fg) * 131.25 * 100) / 100
}

/** IBU — Tinseth formula (default). */
export function calcIBU(hops: RecipeHop[], og: number, batchSizeL: number): number {
  if (!hops.length) return 0
  const boilGravity = og * 0.9
  return Math.round(
    hops.filter(h => h.use !== 'dry_hop').reduce((sum, hop) => {
      const bigness = 1.65 * Math.pow(0.000125, boilGravity - 1)
      const boilTime = (1 - Math.exp(-0.04 * hop.time_min)) / 4.15
      const aau = (hop.alpha_acid / 100) * hop.amount_g
      return sum + (aau * bigness * boilTime * 7490) / batchSizeL
    }, 0) * 10
  ) / 10
}

/** IBU — Rager formula (alternative; slightly higher than Tinseth at long boils). */
export function calcIBURager(hops: RecipeHop[], og: number, batchSizeL: number): number {
  if (!hops.length) return 0
  const ga = og > 1.050 ? (og - 1.050) / 0.2 : 0
  const totalIBU = hops.filter(h => h.use !== 'dry_hop').reduce((sum, hop) => {
    const utilPct = 18.11 + 13.86 * Math.tanh((hop.time_min - 31.32) / 18.27)
    const ibu = (hop.amount_g * (utilPct / 100) * hop.alpha_acid * 0.1) / batchSizeL / (1 + ga)
    return sum + ibu
  }, 0)
  return Math.round(totalIBU * 10) / 10
}

export function calcSRM(malts: RecipeMalt[], batchSizeL: number): number {
  if (!malts.length || batchSizeL <= 0) return 0
  const batchGal = batchSizeL * 0.264172
  const mcu = malts.reduce((sum, m) => {
    return sum + (m.amount_kg * 2.20462 * (m.color_ebc / 1.97)) / batchGal
  }, 0)
  return Math.round(1.4922 * Math.pow(Math.max(mcu, 0.001), 0.6859) * 10) / 10
}

export function srmToEbc(srm: number): number { return Math.round(srm * 1.97 * 10) / 10 }
export function ebcToSrm(ebc: number): number { return Math.round(ebc / 1.97 * 10) / 10 }

// ─── SUGAR / BRIX CONVERSIONS (universal) ────────────────────────────────────

export function brixToSG(brix: number): number {
  return Math.round((1 + brix / (258.6 - (brix / 258.2) * 227.1)) * 10000) / 10000
}

export function sgToBrix(sg: number): number {
  return Math.round((-616.868 + 1111.14 * sg - 630.272 * sg ** 2 + 135.997 * sg ** 3) * 100) / 100
}

/**
 * OG from dissolved sugar.
 * sugarG: total grams, volumeL: liters. Approx 0.00038 SG points per g/L sucrose.
 */
export function calcOGFromSugar(sugarG: number, volumeL: number): number {
  if (volumeL <= 0) return 1.000
  const og = 1 + (sugarG / volumeL) * 0.00038
  return Math.round(og * 10000) / 10000
}

export function calcTotalSugarFromAdjuncts(adjuncts: RecipeAdjunct[]): number {
  return adjuncts.reduce((sum, a) => {
    if (!a.sugar_content) return sum
    return sum + (a.amount * a.sugar_content) / 100
  }, 0)
}

// ─── REFRACTOMETER CORRECTION (Sean Terrill cubic) ───────────────────────────
// During fermentation refractometers read high because of alcohol. This
// formula reconstructs the true SG from initial and final Brix readings.

const WCF_DEFAULT = 1.04 // wort correction factor — refractometer reads ~4% high in unfermented wort

export interface RefractometerResult {
  og: number
  fg: number
  abv: number
  apparentAttenuation: number
}

export function refractometerFG(
  originalBrix: number,
  finalBrix: number,
  wcf: number = WCF_DEFAULT,
): RefractometerResult {
  const OB = originalBrix / wcf
  const FB = finalBrix / wcf
  const fg =
    1.0000
    - 0.0044993 * OB
    + 0.011774  * FB
    + 0.00027581 * OB * OB
    - 0.0012717  * FB * FB
    - 0.0000072800 * OB * OB * OB
    + 0.0000063293 * FB * FB * FB
  const og = brixToSG(OB)
  const abv = calcABV(og, fg)
  const apparentAttenuation = og > 1.000 ? Math.round(((og - fg) / (og - 1)) * 1000) / 10 : 0
  return {
    og: Math.round(og * 10000) / 10000,
    fg: Math.round(fg * 10000) / 10000,
    abv,
    apparentAttenuation,
  }
}

// ─── HYDROMETER TEMPERATURE CORRECTION ───────────────────────────────────────
// Hydrometers are calibrated at a reference temperature (commonly 20°C).
// Wort/sample density changes with temp; correct via NBS polynomial.

export function correctSGforTemp(
  sgMeasured: number,
  sampleTempC: number,
  calibrationTempC: number = 20,
): number {
  const density = (t: number) =>
    1.00130346
    - 0.000134722124 * t
    + 0.00000204052596 * t * t
    - 0.00000000232820948 * t * t * t
  const corrected = sgMeasured * (density(calibrationTempC) / density(sampleTempC))
  return Math.round(corrected * 10000) / 10000
}

// ─── PRIMING SUGAR (bottle conditioning) ─────────────────────────────────────

export type PrimingSugarType = 'sucrose' | 'dextrose' | 'dme' | 'honey'
export const PRIMING_SUGAR_LABELS: Record<PrimingSugarType, string> = {
  sucrose:  'Сахар-песок (сахароза)',
  dextrose: 'Декстроза',
  dme:      'Сухой солодовый экстракт (DME)',
  honey:    'Мёд',
}
const PRIMING_SUGAR_FACTOR: Record<PrimingSugarType, number> = {
  sucrose:  1.00,
  dextrose: 0.91,
  dme:      0.59,
  honey:    0.74,
}

/** Residual CO2 (volumes) dissolved in beer at a given max fermentation temp. */
export function calcResidualCO2(maxFermentTempC: number): number {
  const tF = maxFermentTempC * 9 / 5 + 32
  const co2 = 3.0378 - 0.050062 * tF + 0.00026555 * tF * tF
  return Math.round(co2 * 100) / 100
}

export interface PrimingSugarResult {
  grams: number
  residualCO2: number
  targetCO2: number
}

export function calcPrimingSugar(
  batchSizeL: number,
  targetCO2: number,
  maxFermentTempC: number,
  sugarType: PrimingSugarType = 'sucrose',
): PrimingSugarResult {
  const residual = calcResidualCO2(maxFermentTempC)
  const grams = Math.max(0, batchSizeL * (targetCO2 - residual) * 4) / PRIMING_SUGAR_FACTOR[sugarType]
  return {
    grams: Math.round(grams * 10) / 10,
    residualCO2: residual,
    targetCO2,
  }
}

// ─── KEGGING / FORCED CARBONATION ────────────────────────────────────────────
// Pressure (PSI) needed to dissolve `targetCO2` volumes at `tempC`.

export function calcKegPressure(targetCO2: number, tempC: number): number {
  const T = tempC
  const P =
    -16.6999
    - 0.0101059 * T * T
    + 0.00116512 * T * T * T
    + 0.173354  * T * targetCO2
    + 4.24267   * targetCO2
    - 0.0684226 * targetCO2 * targetCO2
  return Math.round(Math.max(0, P) * 10) / 10
}

// ─── STRIKE WATER & SPARGE ───────────────────────────────────────────────────

/**
 * Palmer's strike water temperature for single-infusion mash:
 *   T_strike = (0.2 / R) × (T_mash − T_grain) + T_mash
 * where R = ratio of L water per kg grain.
 */
export function calcStrikeTemp(
  grainTempC: number,
  targetMashTempC: number,
  ratioLperKg: number = 3.0,
): number {
  const t = (0.2 / ratioLperKg) * (targetMashTempC - grainTempC) + targetMashTempC
  return Math.round(t * 10) / 10
}

/**
 * Sparge water = preboil volume − (mash water − grain absorption).
 * Returns liters of sparge water.
 */
export function calcSpargeWater(
  batchSizeL: number,
  totalGrainKg: number,
  boilTimeMin: number,
  mashRatioLperKg: number = 3.0,
): number {
  const evapL = batchSizeL * 0.10 * (boilTimeMin / 60)
  const preboil = batchSizeL + evapL
  const mashWater = totalGrainKg * mashRatioLperKg
  const grainAbs = totalGrainKg * 0.96
  return Math.round(Math.max(0, preboil - (mashWater - grainAbs)) * 10) / 10
}

// ─── WATER CHEMISTRY (basic) ─────────────────────────────────────────────────

export interface WaterProfile {
  ca: number   // ppm Calcium
  mg: number   // ppm Magnesium
  na: number   // ppm Sodium
  cl: number   // ppm Chloride
  so4: number  // ppm Sulfate
  hco3: number // ppm Bicarbonate
}

export interface WaterAnalysis {
  sulfateChlorideRatio: number
  perception: 'very_malty' | 'malty' | 'balanced' | 'hoppy' | 'very_hoppy'
  perceptionLabel: string
  alkalinityCaCO3: number
  totalHardnessCaCO3: number
  warnings: string[]
}

export function analyzeWater(profile: WaterProfile): WaterAnalysis {
  const ratio = profile.cl > 0 ? profile.so4 / profile.cl : (profile.so4 > 0 ? Infinity : 0)
  const [perception, perceptionLabel] =
    ratio < 0.5 ? ['very_malty', 'Очень солодовый'] as const :
    ratio < 1.0 ? ['malty', 'Солодовый, мягкий']  as const :
    ratio < 1.5 ? ['balanced', 'Сбалансированный'] as const :
    ratio < 2.5 ? ['hoppy', 'Хмелевой']           as const :
                  ['very_hoppy', 'Очень хмелевой / сухой'] as const

  const alkalinity     = Math.round(profile.hco3 * 0.82)
  const totalHardness  = Math.round(2.5 * profile.ca + 4.1 * profile.mg)

  const warnings: string[] = []
  if (profile.ca < 50)  warnings.push('Кальций < 50 ppm — слабый mash, плохая флокуляция дрожжей')
  if (profile.ca > 200) warnings.push('Кальций > 200 ppm — слишком жёсткая вода')
  if (profile.so4 > 350) warnings.push('Сульфаты > 350 ppm — резкая горечь')
  if (profile.cl > 200)  warnings.push('Хлориды > 200 ppm — солоноватый вкус')
  if (alkalinity > 150)  warnings.push('Высокая щёлочность — pH затора будет высоким')
  if (profile.na > 150)  warnings.push('Натрий > 150 ppm — солёный вкус')

  return {
    sulfateChlorideRatio: ratio === Infinity ? 999 : Math.round(ratio * 100) / 100,
    perception,
    perceptionLabel,
    alkalinityCaCO3: alkalinity,
    totalHardnessCaCO3: totalHardness,
    warnings,
  }
}

/** Salt additions: ppm contribution to water profile per 1 g salt added to 1 L water. */
export interface SaltAddition {
  key: string
  label: string
  delta: Partial<WaterProfile>
}

export const BREWING_SALTS: SaltAddition[] = [
  { key: 'gypsum',           label: 'Гипс (CaSO₄·2H₂O)',       delta: { ca: 232.5, so4: 557.7 } },
  { key: 'calcium_chloride', label: 'Хлорид кальция (CaCl₂·2H₂O)', delta: { ca: 272.0, cl: 482.3 } },
  { key: 'epsom',            label: 'Английская соль (MgSO₄·7H₂O)', delta: { mg: 98.6, so4: 389.6 } },
  { key: 'table_salt',       label: 'Поваренная соль (NaCl)',    delta: { na: 393.0, cl: 606.6 } },
  { key: 'baking_soda',      label: 'Сода пищевая (NaHCO₃)',      delta: { na: 273.7, hco3: 726.3 } },
  { key: 'chalk',            label: 'Мел (CaCO₃)',                delta: { ca: 400.4, hco3: 1219.7 } },
]

export function applySaltAddition(
  profile: WaterProfile,
  saltKey: string,
  gramsPerLiter: number,
): WaterProfile {
  const salt = BREWING_SALTS.find(s => s.key === saltKey)
  if (!salt) return profile
  const next: WaterProfile = { ...profile }
  for (const k of Object.keys(salt.delta) as (keyof WaterProfile)[]) {
    next[k] = Math.round((next[k] + (salt.delta[k] ?? 0) * gramsPerLiter) * 10) / 10
  }
  return next
}

// ─── KOMBUCHA ────────────────────────────────────────────────────────────────

export interface KombuchaStats {
  sugarPerLiter: number
  estimatedFermentDays: number
  firstFermentDays: number
  secondFermentDays: number
  approxAlcohol: number
  teaConcentration: string
}

export function calcKombucha(
  batchSizeL: number,
  sugarG: number,
  teaG: number,
  tempC: number = 24,
): KombuchaStats {
  const sugarPerLiter = sugarG / batchSizeL
  const fermentedSugar = sugarPerLiter * 0.70
  const approxAlcohol = fermentedSugar * 0.0051
  const tempFactor = Math.max(0.5, Math.min(2.0, (tempC - 18) / 6 + 1))
  const firstFermentDays = Math.round(7 / tempFactor)
  const secondFermentDays = 2
  return {
    sugarPerLiter: Math.round(sugarPerLiter * 10) / 10,
    estimatedFermentDays: firstFermentDays + secondFermentDays,
    firstFermentDays,
    secondFermentDays,
    approxAlcohol: Math.round(approxAlcohol * 100) / 100,
    teaConcentration: `${Math.round(teaG / batchSizeL * 10) / 10} г/л`,
  }
}

// ─── LEMONADE / SOFT DRINKS ──────────────────────────────────────────────────

export interface LemonadeStats {
  brix: number
  sugarPerLiter: number
  acidityGramPerLiter: number
  sweetnessBitterness: 'too_sweet' | 'sweet' | 'balanced' | 'tart' | 'very_tart'
  co2Volumes: number
}

export function calcLemonade(
  batchSizeL: number,
  sugarG: number,
  juicePercent: number = 15,
  acidG: number = 0,
): LemonadeStats {
  const sugarPerLiter = sugarG / batchSizeL
  const brix = sugarPerLiter / 10
  const acidFromJuice = (juicePercent / 100) * batchSizeL * 5
  const totalAcid = (acidG + acidFromJuice) / batchSizeL

  const ratio = sugarPerLiter / Math.max(totalAcid * 10, 1)
  const sweetness =
    ratio > 15 ? 'too_sweet' :
    ratio > 10 ? 'sweet' :
    ratio > 6  ? 'balanced' :
    ratio > 3  ? 'tart' : 'very_tart'

  return {
    brix: Math.round(brix * 10) / 10,
    sugarPerLiter: Math.round(sugarPerLiter * 10) / 10,
    acidityGramPerLiter: Math.round(totalAcid * 10) / 10,
    sweetnessBitterness: sweetness,
    co2Volumes: 3.5,
  }
}

// ─── MEAD / CIDER / KVASS ────────────────────────────────────────────────────

export function calcMeadOG(honeyKg: number, batchSizeL: number): number {
  const sugarG = honeyKg * 1000 * 0.80
  return calcOGFromSugar(sugarG, batchSizeL)
}

export function calcCiderOG(juiceL: number, batchSizeL: number, addedSugarG: number = 0): number {
  const juiceSugarG = juiceL * 110
  return calcOGFromSugar(juiceSugarG + addedSugarG, batchSizeL)
}

export function calcKvassStats(breadKg: number, sugarG: number, batchSizeL: number) {
  const breadSugar = breadKg * 200
  const totalSugar = breadSugar + sugarG
  const og = calcOGFromSugar(totalSugar, batchSizeL)
  const fg = calcFG(og, 30)
  const abv = calcABV(og, fg)
  return { og, fg, abv: Math.min(abv, 1.5), totalSugarG: totalSugar }
}

// ─── UNIVERSAL STATS ─────────────────────────────────────────────────────────

export interface BeverageStats {
  category: BeverageCategory
  og: number | null
  fg: number | null
  abv: number | null
  ibu: number | null
  srm: number | null
  ebc: number | null
  brix: number | null
  preboilVolume: number
  mashWater: number
  grainAbsorption: number
  totalGrainKg: number
  totalHopG: number
  totalSugarG: number
  kombucha?: KombuchaStats
  lemonade?: LemonadeStats
}

export function calcUniversalStats(
  category: BeverageCategory,
  malts: RecipeMalt[],
  hops: RecipeHop[],
  yeasts: RecipeYeast[],
  adjuncts: RecipeAdjunct[],
  batchSizeL: number,
  efficiency: number,
  boilTimeMin: number,
): BeverageStats {
  const totalGrainKg = malts.reduce((s, m) => s + m.amount_kg, 0)
  const totalHopG = hops.reduce((s, h) => s + h.amount_g, 0)
  const totalSugarG = calcTotalSugarFromAdjuncts(adjuncts)

  const evapRate = 0.10
  const preboilVolume = Math.round(batchSizeL * (1 + evapRate * (boilTimeMin / 60)) * 10) / 10
  const mashWater = Math.round(totalGrainKg * 3.0 * 10) / 10
  const grainAbsorption = Math.round(totalGrainKg * 0.96 * 10) / 10

  if (category === 'beer' || category === 'kvass') {
    const og = calcBeerOG(malts, batchSizeL, efficiency)
    const attenuation = yeasts[0]?.attenuation ?? (category === 'kvass' ? 30 : 75)
    const fg = calcFG(og, attenuation)
    const abv = calcABV(og, fg)
    const ibu = category === 'beer' ? calcIBU(hops, og, batchSizeL) : null
    const srm = calcSRM(malts, batchSizeL)
    const ebc = srmToEbc(srm)
    return { category, og, fg, abv, ibu, srm, ebc, brix: sgToBrix(og), preboilVolume, mashWater, grainAbsorption, totalGrainKg, totalHopG, totalSugarG }
  }

  if (category === 'mead') {
    const honeyAdjunct = adjuncts.find(a => a.name.toLowerCase().includes('мёд') || a.name.toLowerCase().includes('honey'))
    const honeyKg = honeyAdjunct ? honeyAdjunct.amount / (honeyAdjunct.unit === 'g' ? 1000 : 1) : 0
    const og = calcMeadOG(honeyKg, batchSizeL)
    const attenuation = yeasts[0]?.attenuation ?? 90
    const fg = calcFG(og, attenuation)
    const abv = calcABV(og, fg)
    return { category, og, fg, abv, ibu: null, srm: null, ebc: null, brix: sgToBrix(og), preboilVolume, mashWater: 0, grainAbsorption: 0, totalGrainKg: 0, totalHopG, totalSugarG }
  }

  if (category === 'kombucha') {
    const sugarAdjunct = adjuncts.find(a => a.name.toLowerCase().includes('сахар') || a.name.toLowerCase().includes('sugar'))
    const teaAdjunct = adjuncts.find(a => a.name.toLowerCase().includes('чай') || a.name.toLowerCase().includes('tea'))
    const sugarG = sugarAdjunct ? sugarAdjunct.amount * (sugarAdjunct.unit === 'kg' ? 1000 : 1) : 70 * batchSizeL
    const teaG = teaAdjunct ? teaAdjunct.amount : 5 * batchSizeL
    const kombuchaStats = calcKombucha(batchSizeL, sugarG, teaG)
    const og = calcOGFromSugar(sugarG, batchSizeL)
    return { category, og, fg: null, abv: kombuchaStats.approxAlcohol, ibu: null, srm: null, ebc: null, brix: sgToBrix(og), preboilVolume: batchSizeL, mashWater: 0, grainAbsorption: 0, totalGrainKg: 0, totalHopG: 0, totalSugarG: sugarG, kombucha: kombuchaStats }
  }

  if (category === 'lemonade') {
    const sugarG2 = totalSugarG || 80 * batchSizeL
    const lemonadeStats = calcLemonade(batchSizeL, sugarG2)
    return { category, og: null, fg: null, abv: 0, ibu: null, srm: null, ebc: null, brix: lemonadeStats.brix, preboilVolume: batchSizeL, mashWater: 0, grainAbsorption: 0, totalGrainKg: 0, totalHopG: 0, totalSugarG: sugarG2, lemonade: lemonadeStats }
  }

  if (category === 'cider') {
    const juiceAdjunct = adjuncts.find(a => a.name.toLowerCase().includes('сок') || a.name.toLowerCase().includes('juice'))
    const juiceL = juiceAdjunct ? juiceAdjunct.amount * (juiceAdjunct.unit === 'ml' ? 0.001 : 1) : batchSizeL * 0.9
    const og = calcCiderOG(juiceL, batchSizeL, totalSugarG)
    const attenuation = yeasts[0]?.attenuation ?? 80
    const fg = calcFG(og, attenuation)
    const abv = calcABV(og, fg)
    return { category, og, fg, abv, ibu: null, srm: null, ebc: null, brix: sgToBrix(og), preboilVolume: batchSizeL, mashWater: 0, grainAbsorption: 0, totalGrainKg: 0, totalHopG: 0, totalSugarG }
  }

  const og = calcOGFromSugar(totalSugarG || 100 * batchSizeL, batchSizeL)
  const attenuation = yeasts[0]?.attenuation ?? 80
  const fg = calcFG(og, attenuation)
  const abv = calcABV(og, fg)
  return { category, og, fg, abv, ibu: null, srm: null, ebc: null, brix: sgToBrix(og), preboilVolume: batchSizeL, mashWater: 0, grainAbsorption: 0, totalGrainKg: 0, totalHopG: 0, totalSugarG }
}

// ─── BEER STYLES ─────────────────────────────────────────────────────────────

export const BEER_STYLES = [
  { name: 'American IPA',       ogMin: 1.056, ogMax: 1.070, ibuMin: 40, ibuMax: 70, srmMin: 6,  srmMax: 14 },
  { name: 'West Coast IPA',     ogMin: 1.060, ogMax: 1.075, ibuMin: 50, ibuMax: 80, srmMin: 4,  srmMax: 10 },
  { name: 'New England IPA',    ogMin: 1.060, ogMax: 1.080, ibuMin: 25, ibuMax: 60, srmMin: 3,  srmMax: 7  },
  { name: 'American Pale Ale',  ogMin: 1.045, ogMax: 1.060, ibuMin: 30, ibuMax: 50, srmMin: 5,  srmMax: 10 },
  { name: 'Oatmeal Stout',      ogMin: 1.048, ogMax: 1.065, ibuMin: 25, ibuMax: 40, srmMin: 22, srmMax: 40 },
  { name: 'Imperial Stout',     ogMin: 1.075, ogMax: 1.115, ibuMin: 50, ibuMax: 90, srmMin: 30, srmMax: 40 },
  { name: 'German Pilsner',     ogMin: 1.044, ogMax: 1.050, ibuMin: 25, ibuMax: 45, srmMin: 2,  srmMax: 5  },
  { name: 'Czech Pilsner',      ogMin: 1.044, ogMax: 1.060, ibuMin: 30, ibuMax: 45, srmMin: 3,  srmMax: 6  },
  { name: 'Belgian Tripel',     ogMin: 1.075, ogMax: 1.085, ibuMin: 20, ibuMax: 40, srmMin: 4,  srmMax: 7  },
  { name: 'Belgian Dubbel',     ogMin: 1.062, ogMax: 1.075, ibuMin: 15, ibuMax: 25, srmMin: 10, srmMax: 17 },
  { name: 'Hefeweizen',         ogMin: 1.044, ogMax: 1.052, ibuMin: 8,  ibuMax: 15, srmMin: 3,  srmMax: 9  },
  { name: 'Witbier',            ogMin: 1.044, ogMax: 1.052, ibuMin: 8,  ibuMax: 20, srmMin: 2,  srmMax: 4  },
  { name: 'Saison',             ogMin: 1.048, ogMax: 1.065, ibuMin: 20, ibuMax: 35, srmMin: 5,  srmMax: 14 },
  { name: 'Porter',             ogMin: 1.040, ogMax: 1.052, ibuMin: 18, ibuMax: 35, srmMin: 20, srmMax: 30 },
  { name: 'Lager',              ogMin: 1.040, ogMax: 1.050, ibuMin: 10, ibuMax: 25, srmMin: 2,  srmMax: 5  },
  { name: 'Red Ale',            ogMin: 1.045, ogMax: 1.060, ibuMin: 18, ibuMax: 35, srmMin: 10, srmMax: 17 },
  { name: 'Barleywine',         ogMin: 1.080, ogMax: 1.120, ibuMin: 50, ibuMax: 100, srmMin: 8, srmMax: 19 },
  { name: 'Sour Ale',           ogMin: 1.040, ogMax: 1.060, ibuMin: 5,  ibuMax: 20, srmMin: 3,  srmMax: 10 },
]

// ─── INGREDIENT LIBRARIES ────────────────────────────────────────────────────

export const COMMON_MALTS = [
  { name: 'Pale Ale Malt (Maris Otter)', color_ebc: 5.9,   extract_potential: 78 },
  { name: 'Pilsner Malt',                color_ebc: 3.4,   extract_potential: 80 },
  { name: 'Vienna Malt',                 color_ebc: 7.9,   extract_potential: 78 },
  { name: 'Munich Malt',                 color_ebc: 17.7,  extract_potential: 77 },
  { name: 'Caramel 20L',                 color_ebc: 39.4,  extract_potential: 75 },
  { name: 'Caramel 40L',                 color_ebc: 78.7,  extract_potential: 74 },
  { name: 'Caramel 60L',                 color_ebc: 118.1, extract_potential: 73 },
  { name: 'Caramel 80L',                 color_ebc: 157.5, extract_potential: 72 },
  { name: 'Caramel 120L',                color_ebc: 236.2, extract_potential: 70 },
  { name: 'Chocolate Malt',              color_ebc: 591,   extract_potential: 66 },
  { name: 'Roasted Barley',              color_ebc: 591,   extract_potential: 65 },
  { name: 'Black Malt',                  color_ebc: 1299,  extract_potential: 64 },
  { name: 'Oats (Flaked)',               color_ebc: 3.4,   extract_potential: 70 },
  { name: 'Wheat Malt',                  color_ebc: 3.9,   extract_potential: 84 },
  { name: 'Rye Malt',                    color_ebc: 5.9,   extract_potential: 75 },
  { name: 'Smoked Malt',                 color_ebc: 4.9,   extract_potential: 75 },
]

export const COMMON_HOPS = [
  { name: 'Cascade',            alpha_acid: 5.5  },
  { name: 'Centennial',         alpha_acid: 9.5  },
  { name: 'Citra',              alpha_acid: 12.0 },
  { name: 'Mosaic',             alpha_acid: 12.5 },
  { name: 'Simcoe',             alpha_acid: 13.0 },
  { name: 'Amarillo',           alpha_acid: 9.0  },
  { name: 'Columbus',           alpha_acid: 15.0 },
  { name: 'Saaz',               alpha_acid: 3.5  },
  { name: 'Hallertau',          alpha_acid: 4.0  },
  { name: 'Fuggle',             alpha_acid: 4.5  },
  { name: 'East Kent Goldings', alpha_acid: 5.0  },
  { name: 'Magnum',             alpha_acid: 14.0 },
  { name: 'Ekuanot',            alpha_acid: 13.5 },
  { name: 'Galaxy',             alpha_acid: 14.0 },
  { name: 'Nelson Sauvin',      alpha_acid: 12.5 },
  { name: 'Perle',              alpha_acid: 8.0  },
]

export const COMMON_YEASTS = [
  { name: 'US-05',         brand: 'Fermentis',  attenuation: 81, temp_min: 15, temp_max: 24 },
  { name: 'S-04',          brand: 'Fermentis',  attenuation: 75, temp_min: 15, temp_max: 22 },
  { name: 'BE-134',        brand: 'Fermentis',  attenuation: 93, temp_min: 15, temp_max: 30 },
  { name: 'W-34/70',       brand: 'Fermentis',  attenuation: 80, temp_min: 7,  temp_max: 15 },
  { name: 'WY1056',        brand: 'Wyeast',     attenuation: 80, temp_min: 16, temp_max: 22 },
  { name: 'WY3787',        brand: 'Wyeast',     attenuation: 80, temp_min: 18, temp_max: 26 },
  { name: 'WY3944',        brand: 'Wyeast',     attenuation: 72, temp_min: 16, temp_max: 22 },
  { name: 'WLP001',        brand: 'White Labs', attenuation: 76, temp_min: 18, temp_max: 23 },
  { name: 'WLP500',        brand: 'White Labs', attenuation: 78, temp_min: 18, temp_max: 24 },
  { name: 'WLP830',        brand: 'White Labs', attenuation: 77, temp_min: 8,  temp_max: 14 },
  { name: 'Kveik',         brand: 'Various',    attenuation: 80, temp_min: 20, temp_max: 42 },
  { name: 'Omega OYL-057', brand: 'Omega',      attenuation: 78, temp_min: 18, temp_max: 28 },
]

export const COMMON_ADJUNCTS: Record<string, { name: string; unit: string; sugar_content: number; categories: string[] }[]> = {
  sugar: [
    { name: 'Сахар-песок (сахароза)',    unit: 'kg', sugar_content: 100, categories: ['all'] },
    { name: 'Мёд',                        unit: 'kg', sugar_content: 80,  categories: ['mead', 'beer', 'other'] },
    { name: 'Декстроза (глюкоза)',        unit: 'kg', sugar_content: 100, categories: ['all'] },
    { name: 'Кэнди-сироп',                unit: 'kg', sugar_content: 78,  categories: ['beer'] },
    { name: 'Тростниковый сахар',         unit: 'kg', sugar_content: 100, categories: ['all'] },
    { name: 'Лактоза',                    unit: 'kg', sugar_content: 100, categories: ['beer'] },
  ],
  fruit: [
    { name: 'Лимонный сок',               unit: 'L',  sugar_content: 6,  categories: ['lemonade', 'other'] },
    { name: 'Апельсиновый сок',           unit: 'L',  sugar_content: 10, categories: ['lemonade', 'other'] },
    { name: 'Яблочный сок',               unit: 'L',  sugar_content: 11, categories: ['cider', 'other'] },
    { name: 'Вишнёвый сок',               unit: 'L',  sugar_content: 12, categories: ['beer', 'other'] },
    { name: 'Малина свежая',              unit: 'kg', sugar_content: 5,  categories: ['beer', 'kombucha'] },
    { name: 'Манго пюре',                 unit: 'kg', sugar_content: 15, categories: ['beer', 'lemonade'] },
    { name: 'Имбирь тёртый',              unit: 'kg', sugar_content: 2,  categories: ['ginger_beer', 'kombucha'] },
    { name: 'Ананас кусочки',             unit: 'kg', sugar_content: 13, categories: ['tepache', 'lemonade'] },
  ],
  spice: [
    { name: 'Корица',                     unit: 'g',  sugar_content: 0, categories: ['all'] },
    { name: 'Кориандр',                   unit: 'g',  sugar_content: 0, categories: ['beer', 'other'] },
    { name: 'Апельсиновая цедра',         unit: 'g',  sugar_content: 0, categories: ['beer', 'lemonade'] },
    { name: 'Ваниль стручок',             unit: 'шт', sugar_content: 0, categories: ['beer', 'mead'] },
    { name: 'Перец чили',                 unit: 'g',  sugar_content: 0, categories: ['beer', 'other'] },
    { name: 'Роза (лепестки)',            unit: 'g',  sugar_content: 0, categories: ['lemonade', 'other'] },
  ],
  tea: [
    { name: 'Чай чёрный (листовой)',      unit: 'g',  sugar_content: 0, categories: ['kombucha', 'other'] },
    { name: 'Чай зелёный',                unit: 'g',  sugar_content: 0, categories: ['kombucha', 'other'] },
    { name: 'Чай белый',                  unit: 'g',  sugar_content: 0, categories: ['kombucha', 'other'] },
    { name: 'Хибискус (каркаде)',         unit: 'g',  sugar_content: 0, categories: ['kombucha', 'lemonade'] },
    { name: 'Ройбуш',                     unit: 'g',  sugar_content: 0, categories: ['kombucha'] },
  ],
}

// ─── REFERENCE TARGETS (for the carbonation calculator) ──────────────────────

export const TARGET_CO2_VOLUMES: { style: string; min: number; max: number }[] = [
  { style: 'British Ale (cask)',  min: 1.5, max: 2.0 },
  { style: 'Porter / Stout',      min: 1.7, max: 2.3 },
  { style: 'American Ale',        min: 2.2, max: 2.7 },
  { style: 'Lager',               min: 2.4, max: 2.8 },
  { style: 'Wheat / Hefeweizen',  min: 3.0, max: 4.0 },
  { style: 'Belgian Ale',         min: 2.5, max: 4.0 },
  { style: 'Lambic / Sour',       min: 2.4, max: 2.8 },
  { style: 'Kombucha',            min: 2.0, max: 3.5 },
  { style: 'Cider',               min: 2.5, max: 4.0 },
  { style: 'Soda / Лимонад',      min: 3.0, max: 4.5 },
]

export const DEFAULT_WATER_PROFILES: { name: string; profile: WaterProfile }[] = [
  { name: 'Pilsen (мягкая)',     profile: { ca: 7,   mg: 2,  na: 2,  cl: 5,   so4: 5,   hco3: 15  } },
  { name: 'Munich',              profile: { ca: 76,  mg: 18, na: 2,  cl: 2,   so4: 10,  hco3: 152 } },
  { name: 'Burton-on-Trent',     profile: { ca: 295, mg: 45, na: 55, cl: 25,  so4: 725, hco3: 300 } },
  { name: 'Dublin',              profile: { ca: 115, mg: 4,  na: 12, cl: 19,  so4: 54,  hco3: 200 } },
  { name: 'London',              profile: { ca: 90,  mg: 5,  na: 15, cl: 40,  so4: 60,  hco3: 125 } },
  { name: 'Дистиллят (RO)',      profile: { ca: 0,   mg: 0,  na: 0,  cl: 0,   so4: 0,   hco3: 0   } },
]
