export type Json = string | number | boolean | null | { [key: string]: Json } | Json[]

export type BeverageCategory =
  | 'beer'        // Пиво
  | 'kombucha'    // Комбуча
  | 'kvass'       // Квас
  | 'lemonade'    // Лимонад / газировка
  | 'cider'       // Сидр
  | 'mead'        // Медовуха
  | 'wine'        // Вино
  | 'ginger_beer' // Имбирное пиво
  | 'tepache'     // Тепаче
  | 'other'       // Прочее

export type BrewStatus = 'planned' | 'mashing' | 'boiling' | 'fermenting' | 'conditioning' | 'ready' | 'archived'
export type IngredientType = 'malt' | 'hop' | 'yeast' | 'adjunct' | 'chemical' | 'fruit' | 'sugar' | 'spice' | 'tea' | 'juice' | 'other'
export type HopUse = 'bittering' | 'flavor' | 'aroma' | 'dry_hop' | 'whirlpool'
export type FermentationStage = 'primary' | 'secondary' | 'conditioning'

export type EquipmentType =
  | 'mash_tun'
  | 'brew_kettle'
  | 'hlt'              // hot liquor tank
  | 'fermenter'
  | 'conditioning_tank'
  | 'bright_tank'
  | 'keg'
  | 'bottle'
  | 'chiller'
  | 'pump'
  | 'co2_tank'
  | 'other'

export type EquipmentStatus =
  | 'clean'
  | 'dirty'
  | 'in_use'
  | 'cleaning'
  | 'maintenance'
  | 'retired'

export type Equipment = {
  id: string
  created_at: string
  updated_at: string
  name: string
  type: EquipmentType
  capacity_l: number | null
  status: EquipmentStatus
  current_brew_id: string | null
  position_x: number | null
  position_y: number | null
  notes: string | null
}

export const EQUIPMENT_TYPES: { value: EquipmentType; label: string; emoji: string; defaultCapacity: number | null }[] = [
  { value: 'mash_tun',          label: 'Затирочный чан',  emoji: '🥣', defaultCapacity: 50 },
  { value: 'brew_kettle',       label: 'Сусловарочник',   emoji: '🍲', defaultCapacity: 50 },
  { value: 'hlt',               label: 'HLT (горячая)',   emoji: '🫗', defaultCapacity: 50 },
  { value: 'fermenter',         label: 'Ферментер',       emoji: '🛢️', defaultCapacity: 30 },
  { value: 'conditioning_tank', label: 'Танк дображивания', emoji: '🛢️', defaultCapacity: 30 },
  { value: 'bright_tank',       label: 'Форфас',          emoji: '⚗️', defaultCapacity: 50 },
  { value: 'keg',               label: 'Кега',            emoji: '🛢️', defaultCapacity: 30 },
  { value: 'bottle',            label: 'Бутылки',         emoji: '🍾', defaultCapacity: null },
  { value: 'chiller',           label: 'Чиллер',          emoji: '❄️', defaultCapacity: null },
  { value: 'pump',              label: 'Насос',           emoji: '🔧', defaultCapacity: null },
  { value: 'co2_tank',          label: 'Баллон CO₂',      emoji: '🧯', defaultCapacity: null },
  { value: 'other',             label: 'Другое',          emoji: '📦', defaultCapacity: null },
]

export const EQUIPMENT_STATUSES: { value: EquipmentStatus; label: string; badge: string }[] = [
  { value: 'clean',       label: 'Чистый',          badge: 'badge-green'  },
  { value: 'dirty',       label: 'Грязный',         badge: 'badge-orange' },
  { value: 'in_use',      label: 'В работе',        badge: 'badge-blue'   },
  { value: 'cleaning',    label: 'Мойка',           badge: 'badge-amber'  },
  { value: 'maintenance', label: 'ТО',              badge: 'badge-purple' },
  { value: 'retired',     label: 'Списано',         badge: 'badge-gray'   },
]

export type Recipe = {
  id: string
  created_at: string
  updated_at: string
  name: string
  category: BeverageCategory
  style: string
  description: string | null
  batch_size_l: number
  efficiency: number
  boil_time_min: number
  notes: string | null
  // Calculated targets
  og_target: number | null
  fg_target: number | null
  abv_target: number | null
  ibu_target: number | null
  srm_target: number | null
  brix_target: number | null   // for lemonade/juice based
  ph_target: number | null     // for kombucha/sour
  // Ingredients stored as JSON
  malts: RecipeMalt[]
  hops: RecipeHop[]
  yeasts: RecipeYeast[]
  adjuncts: RecipeAdjunct[]
}

export type RecipeMalt = {
  id: string
  name: string
  amount_kg: number
  color_ebc: number
  extract_potential: number
}

export type RecipeHop = {
  id: string
  name: string
  amount_g: number
  alpha_acid: number
  use: HopUse
  time_min: number
}

export type RecipeYeast = {
  id: string
  name: string
  brand: string
  attenuation: number
  temp_min: number
  temp_max: number
}

export type RecipeAdjunct = {
  id: string
  name: string
  amount: number
  unit: string
  use: string
  time_min: number | null
  sugar_content?: number | null // g/100g or g/100ml for sugar calculation
}

export type BrewLog = {
  id: string
  created_at: string
  updated_at: string
  recipe_id: string | null
  recipe_name: string
  category: BeverageCategory
  batch_number: string
  status: BrewStatus
  brew_date: string | null
  package_date: string | null
  batch_size_l: number
  notes: string | null
  og_actual: number | null
  fg_actual: number | null
  abv_actual: number | null
  efficiency_actual: number | null
  total_cost: number | null
  cost_per_liter: number | null
}

export type FermentationLog = {
  id: string
  created_at: string
  brew_log_id: string
  stage: FermentationStage
  measured_at: string
  gravity: number | null
  temperature_c: number | null
  ph: number | null
  brix: number | null
  notes: string | null
}

export type InventoryItem = {
  id: string
  created_at: string
  updated_at: string
  name: string
  type: IngredientType
  quantity: number
  unit: string
  min_stock: number | null
  cost_per_unit: number | null
  supplier: string | null
  notes: string | null
}

export type Database = {
  public: {
    Tables: {
      recipes: {
        Row: Recipe
        Insert: Omit<Recipe, 'id'|'created_at'|'updated_at'>
        Update: Partial<Recipe>
        Relationships: []
      }
      brew_logs: {
        Row: BrewLog
        Insert: Omit<BrewLog, 'id'|'created_at'|'updated_at'>
        Update: Partial<BrewLog>
        Relationships: []
      }
      fermentation_logs: {
        Row: FermentationLog
        Insert: Omit<FermentationLog, 'id'|'created_at'>
        Update: Partial<FermentationLog>
        Relationships: []
      }
      inventory: {
        Row: InventoryItem
        Insert: Omit<InventoryItem, 'id'|'created_at'|'updated_at'>
        Update: Partial<InventoryItem>
        Relationships: []
      }
      equipment: {
        Row: Equipment
        Insert: Omit<Equipment, 'id'|'created_at'|'updated_at'>
        Update: Partial<Equipment>
        Relationships: []
      }
    }
    Views: { [_ in never]: never }
    Functions: { [_ in never]: never }
    Enums: {
      beverage_category: BeverageCategory
      brew_status: BrewStatus
      ingredient_type: IngredientType
      fermentation_stage: FermentationStage
      equipment_type: EquipmentType
      equipment_status: EquipmentStatus
    }
    CompositeTypes: { [_ in never]: never }
  }
}

export const BEVERAGE_CATEGORIES: { value: BeverageCategory; label: string; emoji: string; color: string }[] = [
  { value: 'beer',        label: 'Пиво',          emoji: '🍺', color: 'badge-amber'  },
  { value: 'kombucha',    label: 'Комбуча',        emoji: '🫖', color: 'badge-green'  },
  { value: 'kvass',       label: 'Квас',           emoji: '🍶', color: 'badge-orange' },
  { value: 'lemonade',    label: 'Лимонад',        emoji: '🍋', color: 'badge-blue'   },
  { value: 'cider',       label: 'Сидр',           emoji: '🍎', color: 'badge-green'  },
  { value: 'mead',        label: 'Медовуха',       emoji: '🍯', color: 'badge-amber'  },
  { value: 'wine',        label: 'Вино',           emoji: '🍷', color: 'badge-purple' },
  { value: 'ginger_beer', label: 'Имбирное пиво',  emoji: '🫚', color: 'badge-orange' },
  { value: 'tepache',     label: 'Тепаче',         emoji: '🍍', color: 'badge-green'  },
  { value: 'other',       label: 'Прочее',         emoji: '🧃', color: 'badge-gray'   },
]
