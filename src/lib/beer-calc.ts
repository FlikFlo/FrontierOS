import type { RecipeMalt, RecipeHop, RecipeYeast } from '@/types/database'

/**
 * Calculate Original Gravity using Malt Color Units method.
 * efficiency: 0-100, batchSize in liters
 */
export function calcOG(malts: RecipeMalt[], batchSizeL: number, efficiency: number): number {
  if (!malts.length || batchSizeL <= 0) return 1.000

  // Sum of (kg * extract_potential * efficiency) per malt
  // extract_potential is FGDB (fine grind dry basis) as % e.g. 78 = 78%
  // Conversion: 1 kg malt in 1 L gives PPG-like values; we use MCU approach
  // Points per kg per liter (PPKL): extract_potential% × 0.046 × 1000 / 19.35
  // Simplified: total_points = sum(kg × extract_potential × 0.384) × efficiency/100
  const totalPoints = malts.reduce((sum, m) => {
    const ppg = m.extract_potential * 0.46   // convert % extract to PPG
    const ppL = ppg / 0.264172               // PPG to PP/L
    return sum + m.amount_kg * ppL
  }, 0)

  const og = 1 + (totalPoints * (efficiency / 100)) / batchSizeL / 1000
  return Math.round(og * 10000) / 10000
}

/**
 * Calculate Final Gravity using yeast attenuation.
 * attenuation: 0-100 (%)
 */
export function calcFG(og: number, attenuation: number): number {
  const fg = og - (og - 1.000) * (attenuation / 100)
  return Math.round(fg * 10000) / 10000
}

/**
 * Calculate ABV from OG and FG (Miller formula)
 */
export function calcABV(og: number, fg: number): number {
  const abv = (og - fg) * 131.25
  return Math.round(abv * 100) / 100
}

/**
 * Calculate IBU using Tinseth formula.
 * batchSize in liters, boil gravity = estimated wort gravity during boil
 */
export function calcIBU(hops: RecipeHop[], og: number, batchSizeL: number): number {
  if (!hops.length) return 0

  // Tinseth utilization factors
  function bignessFactor(gravity: number) {
    return 1.65 * Math.pow(0.000125, gravity - 1)
  }
  function boilTimeFactor(time: number) {
    return (1 - Math.exp(-0.04 * time)) / 4.15
  }

  const boilGravity = og * 0.9 // approximate pre-boil gravity

  const totalIBU = hops
    .filter(h => h.use !== 'dry_hop')
    .reduce((sum, hop) => {
      const utilization = bignessFactor(boilGravity) * boilTimeFactor(hop.time_min)
      const aau = (hop.alpha_acid / 100) * hop.amount_g
      const ibu = (aau * utilization * 7490) / batchSizeL
      return sum + ibu
    }, 0)

  return Math.round(totalIBU * 10) / 10
}

/**
 * Calculate SRM color using Morey formula (from MCU).
 */
export function calcSRM(malts: RecipeMalt[], batchSizeL: number): number {
  if (!malts.length || batchSizeL <= 0) return 0

  // MCU = (grain_weight_lb × color_degrees_L) / volume_gallons
  const batchGal = batchSizeL * 0.264172

  const mcu = malts.reduce((sum, m) => {
    const weightLb = m.amount_kg * 2.20462
    const colorL = m.color_ebc / 1.97  // EBC to Lovibond approximation
    return sum + (weightLb * colorL) / batchGal
  }, 0)

  // Morey formula: SRM = 1.4922 × MCU^0.6859
  const srm = 1.4922 * Math.pow(mcu, 0.6859)
  return Math.round(srm * 10) / 10
}

/**
 * Convert SRM to EBC
 */
export function srmToEbc(srm: number): number {
  return Math.round(srm * 1.97 * 10) / 10
}

/**
 * Estimate preboil volume (liters) accounting for boil-off (~10%/hr)
 */
export function calcPreboilVolume(batchSizeL: number, boilTimeMin: number): number {
  const evapRate = 0.10  // 10% per hour
  const hours = boilTimeMin / 60
  return Math.round(batchSizeL * (1 + evapRate * hours) * 10) / 10
}

/**
 * Calculate grain water absorption (liters)
 * Approx 0.96 L/kg
 */
export function calcGrainAbsorption(malts: RecipeMalt[]): number {
  const totalKg = malts.reduce((s, m) => s + m.amount_kg, 0)
  return Math.round(totalKg * 0.96 * 10) / 10
}

/**
 * Calculate strike water volume for mash (liters)
 * ratio: liters per kg (typical 2.5-3.5)
 */
export function calcMashWater(malts: RecipeMalt[], ratio = 3.0): number {
  const totalKg = malts.reduce((s, m) => s + m.amount_kg, 0)
  return Math.round(totalKg * ratio * 10) / 10
}

/**
 * Calculate all recipe stats in one call
 */
export interface RecipeStats {
  og: number
  fg: number
  abv: number
  ibu: number
  srm: number
  ebc: number
  preboilVolume: number
  mashWater: number
  grainAbsorption: number
  totalGrainKg: number
  totalHopG: number
  estimatedCost: number | null
}

export function calcRecipeStats(
  malts: RecipeMalt[],
  hops: RecipeHop[],
  yeasts: RecipeYeast[],
  batchSizeL: number,
  efficiency: number,
  boilTimeMin: number,
): RecipeStats {
  const og = calcOG(malts, batchSizeL, efficiency)
  const attenuation = yeasts[0]?.attenuation ?? 75
  const fg = calcFG(og, attenuation)
  const abv = calcABV(og, fg)
  const ibu = calcIBU(hops, og, batchSizeL)
  const srm = calcSRM(malts, batchSizeL)
  const ebc = srmToEbc(srm)
  const preboilVolume = calcPreboilVolume(batchSizeL, boilTimeMin)
  const mashWater = calcMashWater(malts)
  const grainAbsorption = calcGrainAbsorption(malts)
  const totalGrainKg = malts.reduce((s, m) => s + m.amount_kg, 0)
  const totalHopG = hops.reduce((s, h) => s + h.amount_g, 0)

  return {
    og, fg, abv, ibu, srm, ebc,
    preboilVolume, mashWater, grainAbsorption,
    totalGrainKg, totalHopG,
    estimatedCost: null,
  }
}

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
  { name: 'Barleywine',         ogMin: 1.080, ogMax: 1.120, ibuMin: 50, ibuMax: 100,srmMin: 8,  srmMax: 19 },
  { name: 'Sour Ale',           ogMin: 1.040, ogMax: 1.060, ibuMin: 5,  ibuMax: 20, srmMin: 3,  srmMax: 10 },
]

export const COMMON_MALTS = [
  { name: 'Pale Ale Malt (Maris Otter)', color_ebc: 5.9,  extract_potential: 78 },
  { name: 'Pilsner Malt',                color_ebc: 3.4,  extract_potential: 80 },
  { name: 'Vienna Malt',                 color_ebc: 7.9,  extract_potential: 78 },
  { name: 'Munich Malt',                 color_ebc: 17.7, extract_potential: 77 },
  { name: 'Caramel 20L',                 color_ebc: 39.4, extract_potential: 75 },
  { name: 'Caramel 40L',                 color_ebc: 78.7, extract_potential: 74 },
  { name: 'Caramel 60L',                 color_ebc: 118.1,extract_potential: 73 },
  { name: 'Caramel 80L',                 color_ebc: 157.5,extract_potential: 72 },
  { name: 'Caramel 120L',               color_ebc: 236.2,extract_potential: 70 },
  { name: 'Chocolate Malt',             color_ebc: 591,  extract_potential: 66 },
  { name: 'Roasted Barley',             color_ebc: 591,  extract_potential: 65 },
  { name: 'Black Malt',                 color_ebc: 1299, extract_potential: 64 },
  { name: 'Oats (Flaked)',              color_ebc: 3.4,  extract_potential: 70 },
  { name: 'Wheat Malt',                 color_ebc: 3.9,  extract_potential: 84 },
  { name: 'Rye Malt',                   color_ebc: 5.9,  extract_potential: 75 },
  { name: 'Smoked Malt',               color_ebc: 4.9,  extract_potential: 75 },
]

export const COMMON_HOPS = [
  { name: 'Cascade',     alpha_acid: 5.5  },
  { name: 'Centennial',  alpha_acid: 9.5  },
  { name: 'Citra',       alpha_acid: 12.0 },
  { name: 'Mosaic',      alpha_acid: 12.5 },
  { name: 'Simcoe',      alpha_acid: 13.0 },
  { name: 'Amarillo',    alpha_acid: 9.0  },
  { name: 'Columbus',    alpha_acid: 15.0 },
  { name: 'Saaz',        alpha_acid: 3.5  },
  { name: 'Hallertau',   alpha_acid: 4.0  },
  { name: 'Fuggle',      alpha_acid: 4.5  },
  { name: 'East Kent Goldings', alpha_acid: 5.0 },
  { name: 'Magnum',      alpha_acid: 14.0 },
  { name: 'Ekuanot',     alpha_acid: 13.5 },
  { name: 'Galaxy',      alpha_acid: 14.0 },
  { name: 'Nelson Sauvin', alpha_acid: 12.5 },
  { name: 'Perle',       alpha_acid: 8.0  },
]

export const COMMON_YEASTS = [
  { name: 'US-05',    brand: 'Fermentis',   attenuation: 81, temp_min: 15, temp_max: 24 },
  { name: 'S-04',     brand: 'Fermentis',   attenuation: 75, temp_min: 15, temp_max: 22 },
  { name: 'BE-134',   brand: 'Fermentis',   attenuation: 93, temp_min: 15, temp_max: 30 },
  { name: 'W-34/70',  brand: 'Fermentis',   attenuation: 80, temp_min: 7,  temp_max: 15 },
  { name: 'WY1056',   brand: 'Wyeast',      attenuation: 80, temp_min: 16, temp_max: 22 },
  { name: 'WY3787',   brand: 'Wyeast',      attenuation: 80, temp_min: 18, temp_max: 26 },
  { name: 'WY3944',   brand: 'Wyeast',      attenuation: 72, temp_min: 16, temp_max: 22 },
  { name: 'WLP001',   brand: 'White Labs',  attenuation: 76, temp_min: 18, temp_max: 23 },
  { name: 'WLP500',   brand: 'White Labs',  attenuation: 78, temp_min: 18, temp_max: 24 },
  { name: 'WLP830',   brand: 'White Labs',  attenuation: 77, temp_min: 8,  temp_max: 14 },
  { name: 'Kveik',    brand: 'Various',     attenuation: 80, temp_min: 20, temp_max: 42 },
  { name: 'Omega OYL-057', brand: 'Omega', attenuation: 78, temp_min: 18, temp_max: 28 },
]
