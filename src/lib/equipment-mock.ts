// Equipment registry — vessels and tools used in the brewing cycle.

export type EquipmentType =
  | 'hlt'           // Hot Liquor Tank
  | 'mlt'           // Mash Lauter Tun
  | 'bk'            // Boil Kettle
  | 'whirlpool'     // Whirlpool
  | 'heat_exchanger'// Plate chiller
  | 'fv'            // Fermentation Vessel
  | 'bbt'           // Bright Beer Tank
  | 'keg'           // Keg
  | 'pump'          // Pump
  | 'glycol'        // Glycol chiller
  | 'co2'           // CO₂ tank
  | 'cip'           // CIP station
  | 'control'       // Control panel
  | 'storage'       // Storage rack

export type EquipmentStatus =
  | 'idle'          // Free / available
  | 'in_use'        // Currently holding product
  | 'cip'           // Being cleaned
  | 'maintenance'   // Out of service
  | 'dirty'         // Awaiting cleaning

export interface EquipmentContents {
  brew_id: string
  brew_name: string
  batch_number: string
  stage: string
  start_date: string
  days: number
  temp_c?: number
  sg?: number
  fill_pct?: number  // 0-100, how full it is
}

export interface Equipment {
  id: string
  name: string                // e.g. "FV-01"
  type: EquipmentType
  volume_l: number
  diameter_mm?: number
  height_mm?: number
  position: { x: number; y: number }   // top-left grid cell
  size: { w: number; h: number }       // cells
  status: EquipmentStatus
  contents?: EquipmentContents
  notes?: string
  installed?: string           // ISO date
  last_cip?: string
}

export const EQUIPMENT_TYPE_META: Record<EquipmentType, {
  label: string
  short: string
  icon: string
  category: 'hot_side' | 'cold_side' | 'fermentation' | 'packaging' | 'utility'
}> = {
  hlt:            { label: 'Hot Liquor Tank',       short: 'HLT',    icon: 'flame',     category: 'hot_side' },
  mlt:            { label: 'Mash / Lauter Tun',     short: 'MLT',    icon: 'wheat',     category: 'hot_side' },
  bk:             { label: 'Boil Kettle',            short: 'BK',     icon: 'flame',     category: 'hot_side' },
  whirlpool:      { label: 'Whirlpool',              short: 'WP',     icon: 'wind',      category: 'hot_side' },
  heat_exchanger: { label: 'Plate Chiller',          short: 'HEX',    icon: 'snow',      category: 'cold_side' },
  fv:             { label: 'Fermenter (FV)',         short: 'FV',     icon: 'cylinder',  category: 'fermentation' },
  bbt:            { label: 'Bright Beer Tank',       short: 'BBT',    icon: 'beer',      category: 'fermentation' },
  keg:            { label: 'Keg',                    short: 'KEG',    icon: 'container', category: 'packaging' },
  pump:           { label: 'Pump',                   short: 'PMP',    icon: 'activity',  category: 'utility' },
  glycol:         { label: 'Glycol Chiller',         short: 'GLY',    icon: 'snow',      category: 'utility' },
  co2:            { label: 'CO₂ Tank',               short: 'CO₂',    icon: 'wind',      category: 'utility' },
  cip:            { label: 'CIP Station',            short: 'CIP',    icon: 'droplets',  category: 'utility' },
  control:        { label: 'Control Panel',          short: 'CTL',    icon: 'cpu',       category: 'utility' },
  storage:        { label: 'Storage Rack',           short: 'STR',    icon: 'package',   category: 'utility' },
}

export const STATUS_META: Record<EquipmentStatus, { label: string; tone: 'neutral' | 'ok' | 'info' | 'warn' | 'bad' }> = {
  idle:        { label: 'Свободна',     tone: 'ok' },
  in_use:      { label: 'В работе',     tone: 'info' },
  cip:         { label: 'CIP',          tone: 'warn' },
  maintenance: { label: 'Обслуживание', tone: 'bad' },
  dirty:       { label: 'Нужна мойка',  tone: 'warn' },
}

// ─── Mock equipment park ────────────────────────────────────────────────────

// Grid is 18 cols × 10 rows. Layout sections:
//   y=0..2 : Hot side (HLT, MLT, BK, WP) + HEX
//   y=3..6 : Fermenter row (5×FV)
//   y=7..8 : Bright tanks + kegs
//   x=15.. : Utility column (Glycol / CO₂ / CIP / Control / Pump)

export const MOCK_EQUIPMENT: Equipment[] = [
  // Hot side
  { id: 'hlt-01', name: 'HLT-01',  type: 'hlt',            volume_l: 500, position: { x: 0,  y: 0 }, size: { w: 3, h: 3 }, status: 'in_use',
    contents: { brew_id: '4', brew_name: 'Hot Liquor', batch_number: '—', stage: 'Нагрев', start_date: '2026-05-07', days: 0, temp_c: 76, fill_pct: 80 },
    last_cip: '2026-04-30' },
  { id: 'mlt-01', name: 'MLT-01',  type: 'mlt',            volume_l: 350, position: { x: 3,  y: 0 }, size: { w: 3, h: 3 }, status: 'in_use',
    contents: { brew_id: '4', brew_name: 'Hazy IPA #043', batch_number: '#043', stage: 'Затирание', start_date: '2026-05-07', days: 0, temp_c: 67, fill_pct: 70 },
    last_cip: '2026-04-30' },
  { id: 'bk-01',  name: 'BK-01',   type: 'bk',             volume_l: 350, position: { x: 6,  y: 0 }, size: { w: 3, h: 3 }, status: 'idle', last_cip: '2026-04-30' },
  { id: 'wp-01',  name: 'WP-01',   type: 'whirlpool',      volume_l: 350, position: { x: 9,  y: 0 }, size: { w: 3, h: 3 }, status: 'idle' },
  { id: 'hex-01', name: 'HEX-01',  type: 'heat_exchanger', volume_l: 0,   position: { x: 12, y: 0 }, size: { w: 2, h: 3 }, status: 'idle' },

  // Fermenter row
  { id: 'fv-01', name: 'FV-01', type: 'fv', volume_l: 300, position: { x: 0,  y: 3 }, size: { w: 2, h: 4 },
    status: 'in_use',
    contents: { brew_id: '1', brew_name: 'West Coast IPA', batch_number: '#042', stage: 'Первичная', start_date: '2026-04-28', days: 7, temp_c: 20.5, sg: 1.022, fill_pct: 90 } },
  { id: 'fv-02', name: 'FV-02', type: 'fv', volume_l: 300, position: { x: 2,  y: 3 }, size: { w: 2, h: 4 },
    status: 'in_use',
    contents: { brew_id: '2', brew_name: 'Oatmeal Stout', batch_number: '#041', stage: 'Вторичная', start_date: '2026-04-15', days: 20, temp_c: 18.0, sg: 1.016, fill_pct: 85 } },
  { id: 'fv-03', name: 'FV-03', type: 'fv', volume_l: 300, position: { x: 4,  y: 3 }, size: { w: 2, h: 4 },
    status: 'cip', last_cip: '2026-05-04' },
  { id: 'fv-04', name: 'FV-04', type: 'fv', volume_l: 500, position: { x: 6,  y: 3 }, size: { w: 2, h: 4 }, status: 'idle' },
  { id: 'fv-05', name: 'FV-05', type: 'fv', volume_l: 500, position: { x: 8,  y: 3 }, size: { w: 2, h: 4 }, status: 'idle' },
  { id: 'fv-06', name: 'FV-06', type: 'fv', volume_l: 500, position: { x: 10, y: 3 }, size: { w: 2, h: 4 },
    status: 'in_use',
    contents: { brew_id: '5', brew_name: 'Pilsner', batch_number: '#039', stage: 'Первичная', start_date: '2026-05-02', days: 5, temp_c: 12.5, sg: 1.030, fill_pct: 95 } },
  { id: 'fv-07', name: 'FV-07', type: 'fv', volume_l: 500, position: { x: 12, y: 3 }, size: { w: 2, h: 4 }, status: 'idle' },

  // Bright + kegs
  { id: 'bbt-01', name: 'BBT-01', type: 'bbt', volume_l: 300, position: { x: 0, y: 7 }, size: { w: 3, h: 3 },
    status: 'in_use',
    contents: { brew_id: '3', brew_name: 'Belgian Tripel', batch_number: '#040', stage: 'Карбонизация', start_date: '2026-05-01', days: 4, temp_c: 4.0, fill_pct: 70 } },
  { id: 'bbt-02', name: 'BBT-02', type: 'bbt', volume_l: 300, position: { x: 3, y: 7 }, size: { w: 3, h: 3 }, status: 'idle' },
  { id: 'keg-01', name: 'KEG-01', type: 'keg', volume_l: 50, position: { x: 6,  y: 7 }, size: { w: 1, h: 2 },
    status: 'in_use',
    contents: { brew_id: '3', brew_name: 'Tripel', batch_number: '#040', stage: 'Готов', start_date: '2026-05-05', days: 2, fill_pct: 100 } },
  { id: 'keg-02', name: 'KEG-02', type: 'keg', volume_l: 50, position: { x: 7,  y: 7 }, size: { w: 1, h: 2 },
    status: 'in_use',
    contents: { brew_id: '3', brew_name: 'Tripel', batch_number: '#040', stage: 'Готов', start_date: '2026-05-05', days: 2, fill_pct: 100 } },
  { id: 'keg-03', name: 'KEG-03', type: 'keg', volume_l: 50, position: { x: 8,  y: 7 }, size: { w: 1, h: 2 }, status: 'idle' },
  { id: 'keg-04', name: 'KEG-04', type: 'keg', volume_l: 50, position: { x: 9,  y: 7 }, size: { w: 1, h: 2 }, status: 'idle' },
  { id: 'pmp-01', name: 'PMP-01', type: 'pump', volume_l: 0, position: { x: 10, y: 7 }, size: { w: 1, h: 2 }, status: 'in_use' },
  { id: 'pmp-02', name: 'PMP-02', type: 'pump', volume_l: 0, position: { x: 11, y: 7 }, size: { w: 1, h: 2 }, status: 'idle' },
  { id: 'str-01', name: 'Склад', type: 'storage', volume_l: 0, position: { x: 12, y: 7 }, size: { w: 2, h: 3 }, status: 'idle' },

  // Utility column
  { id: 'gly-01', name: 'Glycol', type: 'glycol',  volume_l: 0,   position: { x: 14, y: 0 }, size: { w: 2, h: 3 }, status: 'in_use' },
  { id: 'co2-01', name: 'CO₂',    type: 'co2',     volume_l: 0,   position: { x: 14, y: 3 }, size: { w: 1, h: 4 }, status: 'in_use' },
  { id: 'cip-01', name: 'CIP',    type: 'cip',     volume_l: 200, position: { x: 15, y: 3 }, size: { w: 1, h: 4 }, status: 'idle' },
  { id: 'ctl-01', name: 'CTRL',   type: 'control', volume_l: 0,   position: { x: 14, y: 7 }, size: { w: 2, h: 3 }, status: 'in_use' },
]
