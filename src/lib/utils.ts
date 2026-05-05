import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatDate(date: string | null): string {
  if (!date) return '—'
  return new Date(date).toLocaleDateString('ru-RU', { day: '2-digit', month: 'short', year: 'numeric' })
}

export function formatNumber(n: number | null | undefined, decimals = 2): string {
  if (n == null) return '—'
  return n.toFixed(decimals)
}

export function formatCurrency(n: number | null | undefined): string {
  if (n == null) return '—'
  return new Intl.NumberFormat('ru-RU', { style: 'currency', currency: 'RUB' }).format(n)
}

export function srmToColor(srm: number): string {
  const colors: Record<number, string> = {
    1: '#FFE699', 2: '#FFD878', 3: '#FFCA5A', 4: '#FFBF42',
    5: '#FBB123', 6: '#F8A600', 7: '#F39C00', 8: '#EA8F00',
    9: '#E58500', 10: '#DE7C00', 11: '#D77200', 12: '#CF6900',
    13: '#CB6200', 14: '#C35900', 15: '#BB5100', 16: '#B54C00',
    17: '#B04500', 18: '#A63E00', 19: '#A13700', 20: '#9B3200',
    24: '#8D2200', 29: '#7F1700', 35: '#700F01', 40: '#630400',
  }
  const keys = Object.keys(colors).map(Number).sort((a, b) => a - b)
  const clamped = Math.max(1, Math.min(40, Math.round(srm)))
  const closest = keys.reduce((prev, curr) =>
    Math.abs(curr - clamped) < Math.abs(prev - clamped) ? curr : prev
  )
  return colors[closest]
}

export function getBrewStatusLabel(status: string): string {
  const labels: Record<string, string> = {
    planned: 'Запланировано',
    mashing: 'Затирание',
    boiling: 'Кипячение',
    fermenting: 'Брожение',
    conditioning: 'Дображивание',
    ready: 'Готово',
    archived: 'Архив',
  }
  return labels[status] ?? status
}

export function getBrewStatusBadge(status: string): string {
  const badges: Record<string, string> = {
    planned: 'badge-gray',
    mashing: 'badge-amber',
    boiling: 'badge-orange',
    fermenting: 'badge-blue',
    conditioning: 'badge-purple',
    ready: 'badge-green',
    archived: 'badge-gray',
  }
  return badges[status] ?? 'badge-gray'
}

export function getIngredientTypeLabel(type: string): string {
  const labels: Record<string, string> = {
    malt: 'Солод', hop: 'Хмель', yeast: 'Дрожжи',
    adjunct: 'Добавка', chemical: 'Химия', other: 'Прочее',
  }
  return labels[type] ?? type
}
