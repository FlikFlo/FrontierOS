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

export const MOCK_EQUIPMENT: Equipment[] = [
  // Hot side row
  { id: 'hlt-01', name: 'HLT-01',  type: 'hlt',            volume_l: 500, position: { x: 1,  y: 1 }, size: { w: 2, h: 2 }, status: 'idle', last_cip: '2026-04-30' },
  { id: 'mlt-01', name: 'MLT-01',  type: 'mlt',            volume_l: 350, position: { x: 4,  y: 1 }, size: { w: 2, h: 2 }, status: 'idle', last_cip: '2026-04-30' },
  { id: 'bk-01',  name: 'BK-01',   type: 'bk',             volume_l: 350, position: { x: 7,  y: 1 }, size: { w: 2, h: 2 }, status: 'idle', last_cip: '2026-04-30' },
  { id: 'wp-01',  name: 'WP-01',   type: 'whirlpool',      volume_l: 350, position: { x: 10, y: 1 }, size: { w: 2, h: 2 }, status: 'idle' },
  { id: 'hex-01', name: 'HEX-01',  type: 'heat_exchanger', volume_l: 0,   position: { x: 13, y: 1 }, size: { w: 1, h: 1 }, status: 'idle' },

  // Fermenter row
  {
    id: 'fv-01', name: 'FV-01', type: 'fv', volume_l: 300,
    position: { x: 1, y: 4 }, size: { w: 2, h: 3 },
    status: 'in_use',
    contents: {
      brew_id: '1', brew_name: 'West Coast IPA', batch_number: '#042',
      stage: 'Первичная', start_date: '2026-04-28', days: 7,
      temp_c: 20.5, sg: 1.022, fill_pct: 90,
    },
  },
  {
    id: 'fv-02', name: 'FV-02', type: 'fv', volume_l: 300,
    position: { x: 4, y: 4 }, size: { w: 2, h: 3 },
    status: 'in_use',
    contents: {
      brew_id: '2', brew_name: 'Oatmeal Stout', batch_number: '#041',
      stage: 'Вторичная', start_date: '2026-04-15', days: 20,
      temp_c: 18.0, sg: 1.016, fill_pct: 85,
    },
  },
  {
    id: 'fv-03', name: 'FV-03', type: 'fv', volume_l: 300,
    position: { x: 7, y: 4 }, size: { w: 2, h: 3 },
    status: 'cip', last_cip: '2026-05-04',
  },
  {
    id: 'fv-04', name: 'FV-04', type: 'fv', volume_l: 500,
    position: { x: 10, y: 4 }, size: { w: 2, h: 3 },
    status: 'idle',
  },
  {
    id: 'fv-05', name: 'FV-05', type: 'fv', volume_l: 500,
    position: { x: 13, y: 4 }, size: { w: 2, h: 3 },
    status: 'idle',
  },

  // Bright tank row
  {
    id: 'bbt-01', name: 'BBT-01', type: 'bbt', volume_l: 300,
    position: { x: 1, y: 8 }, size: { w: 2, h: 2 },
    status: 'in_use',
    contents: {
      brew_id: '3', brew_name: 'Belgian Tripel', batch_number: '#040',
      stage: 'Карбонизация', start_date: '2026-05-01', days: 4,
      temp_c: 4.0, fill_pct: 70,
    },
  },
  {
    id: 'bbt-02', name: 'BBT-02', type: 'bbt', volume_l: 300,
    position: { x: 4, y: 8 }, size: { w: 2, h: 2 },
    status: 'idle',
  },

  // Utility column
  { id: 'gly-01', name: 'Glycol',    type: 'glycol',  volume_l: 0, position: { x: 16, y: 1 }, size: { w: 2, h: 2 }, status: 'in_use' },
  { id: 'co2-01', name: 'CO₂',       type: 'co2',     volume_l: 0, position: { x: 16, y: 4 }, size: { w: 1, h: 2 }, status: 'in_use' },
  { id: 'cip-01', name: 'CIP',       type: 'cip',     volume_l: 200, position: { x: 17, y: 4 }, size: { w: 1, h: 2 }, status: 'idle' },
  { id: 'ctl-01', name: 'Контроль', type: 'control', volume_l: 0, position: { x: 16, y: 7 }, size: { w: 2, h: 2 }, status: 'in_use' },
]
