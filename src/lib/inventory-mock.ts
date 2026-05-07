import type { IngredientType } from '@/types/database'

export interface InventoryItem {
  id: string
  name: string
  type: IngredientType
  quantity: number
  unit: string
  min_stock: number | null
  cost_per_unit: number | null
  supplier: string | null
}

export const MOCK_INVENTORY: InventoryItem[] = [
  { id: '1',  name: 'Pale Ale Malt (Maris Otter)', type: 'malt',     quantity: 25.0, unit: 'кг', min_stock: 5,   cost_per_unit: 1.80,  supplier: 'Crisp Malting' },
  { id: '2',  name: 'Pilsner Malt',                type: 'malt',     quantity: 15.5, unit: 'кг', min_stock: 5,   cost_per_unit: 1.60,  supplier: 'Weyermann' },
  { id: '3',  name: 'Caramel 60L',                 type: 'malt',     quantity: 8.0,  unit: 'кг', min_stock: 2,   cost_per_unit: 2.20,  supplier: 'Briess' },
  { id: '4',  name: 'Roasted Barley',              type: 'malt',     quantity: 3.0,  unit: 'кг', min_stock: 1,   cost_per_unit: 2.50,  supplier: 'Crisp Malting' },
  { id: '5',  name: 'Centennial Hops',             type: 'hop',      quantity: 500,  unit: 'г',  min_stock: 100, cost_per_unit: 0.035, supplier: 'Yakima Chief' },
  { id: '6',  name: 'Cascade Hops',                type: 'hop',      quantity: 300,  unit: 'г',  min_stock: 100, cost_per_unit: 0.030, supplier: 'Yakima Chief' },
  { id: '7',  name: 'Citra Hops',                  type: 'hop',      quantity: 200,  unit: 'г',  min_stock: 300, cost_per_unit: 0.055, supplier: 'Hopunion' },
  { id: '8',  name: 'Saaz Hops',                   type: 'hop',      quantity: 400,  unit: 'г',  min_stock: 100, cost_per_unit: 0.028, supplier: 'Select Botanicals' },
  { id: '9',  name: 'US-05 American Ale',          type: 'yeast',    quantity: 10,   unit: 'пак',min_stock: 2,   cost_per_unit: 4.50,  supplier: 'Fermentis' },
  { id: '10', name: 'S-04 English Ale',            type: 'yeast',    quantity: 2,    unit: 'пак',min_stock: 3,   cost_per_unit: 4.50,  supplier: 'Fermentis' },
  { id: '11', name: 'Сахар тростниковый',          type: 'sugar',    quantity: 10.0, unit: 'кг', min_stock: 2,   cost_per_unit: 0.80,  supplier: 'Местный поставщик' },
  { id: '12', name: 'Чай чёрный (для комбучи)',    type: 'tea',      quantity: 500,  unit: 'г',  min_stock: 100, cost_per_unit: 0.04,  supplier: 'Чайный мир' },
  { id: '13', name: 'Имбирь свежий',               type: 'fruit',    quantity: 2.0,  unit: 'кг', min_stock: 0.5, cost_per_unit: 2.20,  supplier: 'Рынок' },
  { id: '14', name: 'Gypsum (CaSO4)',              type: 'chemical', quantity: 500,  unit: 'г',  min_stock: 100, cost_per_unit: 0.008, supplier: 'BrewLab' },
  { id: '15', name: 'Lactic Acid 88%',             type: 'chemical', quantity: 250,  unit: 'мл', min_stock: 50,  cost_per_unit: 0.012, supplier: 'BrewLab' },
]

export function inventoryByType(type: IngredientType): InventoryItem[] {
  return MOCK_INVENTORY.filter(i => i.type === type)
}
