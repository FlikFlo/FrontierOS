/**
 * Universal calculator for all craft beverage types.
 * Beer: OG/FG/ABV/IBU/SRM via standard brewing formulas
 * Kombucha: sugar -> pH estimation, SCOBY health metrics
 * Lemonade: sugar/Brix, acid balance
 * Cider/Mead: OG from sugar content
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

export function calcFG(og: number, attenuation: number): number {
  return Math.round((og - (og - 1.000) * (attenuation / 100)) * 10000) / 10000
}

export function calcABV(og: number, fg: number): number {
  return Math.round((og - fg) * 131.25 * 100) / 100
}

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

export function calcSRM(malts: RecipeMalt[], batchSizeL: number): number {
  if (!malts.length || batchSizeL <= 0) return 0
  const batchGal = batchSizeL * 0.264172
  const mcu = malts.reduce((sum, m) => {
    return sum + (m.amount_kg * 2.20462 * (m.color_ebc / 1.97)) / batchGal
  }, 0)
  return Math.round(1.4922 * Math.pow(Math.max(mcu, 0.001), 0.6859) * 10) / 10
}

export function srmToEbc(srm: number): number { return Math.round(srm * 1.97 * 10) / 10 }

// ─── SUGAR / BRIX CALCULATIONS (universal) ───────────────────────────────────

/** Convert Brix to SG */
export function brixToSG(brix: number): number {
  return Math.round((1 + brix / (258.6 - (brix / 258.2) * 227.1)) * 10000) / 10000
}

/** Convert SG to Brix */
export function sgToBrix(sg: number): number {
  return Math.round((-616.868 + 1111.14 * sg - 630.272 * sg ** 2 + 135.997 * sg ** 3) * 100) / 100
}

/**
 * Calculate OG from dissolved sugar (sucrose/glucose) in liters.
 * sugarG: total grams of sugar, volumeL: volume in liters
 */
export function calcOGFromSugar(sugarG: number, volumeL: number): number {
  if (volumeL <= 0) return 1.000
  // Approx: 1g sucrose in 1L raises SG by ~0.00038
  const og = 1 + (sugarG / volumeL) * 0.00038
  return Math.round(og * 10000) / 10000
}

/**
 * Calculate total fermentable sugar from adjuncts (fruits, juices, honey, etc.)
 * Returns grams of total sugar
 */
export function calcTotalSugarFromAdjuncts(adjuncts: RecipeAdjunct[]): number {
  return adjuncts.reduce((sum, a) => {
    if (!a.sugar_content) return sum
    return sum + (a.amount * a.sugar_content) / 100
  }, 0)
}

// ─── KOMBUCHA ────────────────────────────────────────────────────────────────

export interface KombuchaStats {
  sugarPerLiter: number        // g/L
  estimatedFermentDays: number
  firstFermentDays: number
  secondFermentDays: number
  approxAlcohol: number        // % vol (usually <0.5%)
  teaConcentration: string
}

export function calcKombucha(
  batchSizeL: number,
  sugarG: number,
  teaG: number,
  tempC: number = 24
): KombuchaStats {
  const sugarPerLiter = sugarG / batchSizeL
  // SCOBY ferments roughly 60-80% of sugar at room temp
  const fermentedSugar = sugarPerLiter * 0.70
  const approxAlcohol = fermentedSugar * 0.0051 // 0.51% ABV per g/L sugar
  // Rate: faster at higher temp
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
  brix: number             // sugar content °Bx
  sugarPerLiter: number    // g/L
  acidityGramPerLiter: number // approximate
  sweetnessBitterness: 'too_sweet' | 'sweet' | 'balanced' | 'tart' | 'very_tart'
  co2Volumes: number       // carbonation
}

export function calcLemonade(
  batchSizeL: number,
  sugarG: number,
  juicePercent: number = 15,
  acidG: number = 0
): LemonadeStats {
  const sugarPerLiter = sugarG / batchSizeL
  const brix = sugarPerLiter / 10  // approx 10g sugar = 1°Bx
  const acidFromJuice = (juicePercent / 100) * batchSizeL * 5  // ~5g/L acid in citrus juice
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

// ─── MEAD (Медовуха) ─────────────────────────────────────────────────────────

export function calcMeadOG(honeyKg: number, batchSizeL: number): number {
  // Honey is ~80% fermentable sugar, ~0.0035 pts per g per L
  const sugarG = honeyKg * 1000 * 0.80
  return calcOGFromSugar(sugarG, batchSizeL)
}

// ─── CIDER ───────────────────────────────────────────────────────────────────

export function calcCiderOG(juiceL: number, batchSizeL: number, addedSugarG: number = 0): number {
  // Typical apple juice: ~11-13°Bx → ~1.045-1.055
  const juiceSugarG = juiceL * 110  // ~110g sugar per liter of juice
  const totalSugar = juiceSugarG + addedSugarG
  return calcOGFromSugar(totalSugar, batchSizeL)
}

// ─── KVASS ───────────────────────────────────────────────────────────────────

export function calcKvassStats(breadKg: number, sugarG: number, batchSizeL: number) {
  // Bread contributes ~200g fermentable sugar per kg
  const breadSugar = breadKg * 200
  const totalSugar = breadSugar + sugarG
  const og = calcOGFromSugar(totalSugar, batchSizeL)
  const fg = calcFG(og, 30)  // low attenuation - light fermentation
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

  // Generic fermented (ginger beer, tepache, wine, other)
  const og = calcOGFromSugar(totalSugarG || 100 * batchSizeL, batchSizeL)
  const attenuation = yeasts[0]?.attenuation ?? 80
  const fg = calcFG(og, attenuation)
  const abv = calcABV(og, fg)
  return { category, og, fg, abv, ibu: null, srm: null, ebc: null, brix: sgToBrix(og), preboilVolume: batchSizeL, mashWater: 0, grainAbsorption: 0, totalGrainKg: 0, totalHopG: 0, totalSugarG }
}

// ─── CONSTANTS ───────────────────────────────────────────────────────────────

export { COMMON_MALTS, COMMON_HOPS, COMMON_YEASTS, BEER_STYLES } from './beer-calc'

export const COMMON_ADJUNCTS: Record<string, { name: string; unit: string; sugar_content: number; categories: string[] }[]> = {
  sugar: [
    { name: 'Сахар-песок (сахароза)',    unit: 'kg', sugar_content: 100, categories: ['all'] },
    { name: 'Мёд',                        unit: 'kg', sugar_content: 80,  categories: ['mead', 'beer', 'other'] },
    { name: 'Декстроза (глюкоза)',        unit: 'kg', sugar_content: 100, categories: ['all'] },
    { name: 'Кэнди-сироп',               unit: 'kg', sugar_content: 78,  categories: ['beer'] },
    { name: 'Тростниковый сахар',         unit: 'kg', sugar_content: 100, categories: ['all'] },
    { name: 'Лактоза',                   unit: 'kg', sugar_content: 100, categories: ['beer'] },
  ],
  fruit: [
    { name: 'Лимонный сок',              unit: 'L',  sugar_content: 6,  categories: ['lemonade', 'other'] },
    { name: 'Апельсиновый сок',          unit: 'L',  sugar_content: 10, categories: ['lemonade', 'other'] },
    { name: 'Яблочный сок',              unit: 'L',  sugar_content: 11, categories: ['cider', 'other'] },
    { name: 'Вишнёвый сок',              unit: 'L',  sugar_content: 12, categories: ['beer', 'other'] },
    { name: 'Малина свежая',             unit: 'kg', sugar_content: 5,  categories: ['beer', 'kombucha'] },
    { name: 'Манго пюре',                unit: 'kg', sugar_content: 15, categories: ['beer', 'lemonade'] },
    { name: 'Имбирь тёртый',             unit: 'kg', sugar_content: 2,  categories: ['ginger_beer', 'kombucha'] },
    { name: 'Ананас кусочки',            unit: 'kg', sugar_content: 13, categories: ['tepache', 'lemonade'] },
  ],
  spice: [
    { name: 'Корица',                    unit: 'g',  sugar_content: 0, categories: ['all'] },
    { name: 'Кориандр',                  unit: 'g',  sugar_content: 0, categories: ['beer', 'other'] },
    { name: 'Апельсиновая цедра',        unit: 'g',  sugar_content: 0, categories: ['beer', 'lemonade'] },
    { name: 'Ваниль стручок',            unit: 'шт', sugar_content: 0, categories: ['beer', 'mead'] },
    { name: 'Перец чили',               unit: 'g',  sugar_content: 0, categories: ['beer', 'other'] },
    { name: 'Роза (лепестки)',           unit: 'g',  sugar_content: 0, categories: ['lemonade', 'other'] },
  ],
  tea: [
    { name: 'Чай чёрный (листовой)',     unit: 'g',  sugar_content: 0, categories: ['kombucha', 'other'] },
    { name: 'Чай зелёный',               unit: 'g',  sugar_content: 0, categories: ['kombucha', 'other'] },
    { name: 'Чай белый',                 unit: 'g',  sugar_content: 0, categories: ['kombucha', 'other'] },
    { name: 'Хиби скус (каркаде)',       unit: 'g',  sugar_content: 0, categories: ['kombucha', 'lemonade'] },
    { name: 'Ройбуш',                    unit: 'g',  sugar_content: 0, categories: ['kombucha'] },
  ],
}
