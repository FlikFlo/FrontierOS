import Link from 'next/link'
import { notFound } from 'next/navigation'
import { ArrowLeft, Droplets, Clock, Percent } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { srmToColor } from '@/lib/utils'
import { mockRecipes } from '@/lib/mock-data'
import type { Recipe } from '@/types/database'
import { BEVERAGE_CATEGORIES } from '@/types/database'

export default async function RecipeDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()

  let recipe: Recipe | null = null

  if (supabase) {
    const { data } = await supabase.from('recipes').select('*').eq('id', id).single()
    if (data) recipe = data as Recipe
  }

  if (!recipe) {
    recipe = mockRecipes.find(r => r.id === id) ?? null
  }

  if (!recipe) notFound()

  const cat = BEVERAGE_CATEGORIES.find(c => c.value === recipe.category)
  const color = srmToColor(recipe.srm_target ?? 5)
  const isMock = recipe.id.startsWith('mock-')

  return (
    <div className="max-w-5xl mx-auto fade-in space-y-6">
      <div className="flex items-center justify-between">
        <Link href="/recipes" className="btn-glass px-3 py-2 text-sm inline-flex items-center gap-2">
          <ArrowLeft size={14} /> Все рецепты
        </Link>
        {isMock && <span className="badge badge-gray">демо-данные</span>}
      </div>

      <div className="glass p-6 flex items-start gap-4">
        <div
          className="w-3 self-stretch rounded-full"
          style={{ background: `linear-gradient(180deg, ${color}, ${color}88)` }}
        />
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <span className="text-xl">{cat?.emoji ?? '🍺'}</span>
            <h1 className="text-xl font-bold text-white">{recipe.name}</h1>
          </div>
          <p className="text-sm text-white/40 mt-1">{recipe.style || cat?.label}</p>
          {recipe.description && (
            <p className="text-sm text-white/60 mt-3">{recipe.description}</p>
          )}
          <div className="flex items-center gap-4 mt-4 text-xs text-white/40">
            <span className="inline-flex items-center gap-1"><Droplets size={11} />{recipe.batch_size_l} л</span>
            <span className="inline-flex items-center gap-1"><Clock size={11} />{recipe.boil_time_min} мин</span>
            <span className="inline-flex items-center gap-1"><Percent size={11} />{recipe.efficiency}% КПД</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: 'OG',  value: recipe.og_target?.toFixed(3) ?? '—' },
          { label: 'FG',  value: recipe.fg_target?.toFixed(3) ?? '—' },
          { label: 'ABV', value: recipe.abv_target ? `${recipe.abv_target}%` : '—' },
          { label: 'IBU', value: recipe.ibu_target?.toFixed(0) ?? '—' },
          { label: 'SRM', value: recipe.srm_target?.toFixed(1) ?? '—' },
          { label: 'EBC', value: recipe.srm_target ? (recipe.srm_target * 1.97).toFixed(1) : '—' },
          { label: 'Brix', value: recipe.brix_target?.toFixed(1) ?? '—' },
          { label: 'pH',  value: recipe.ph_target?.toFixed(2) ?? '—' },
        ].map(({ label, value }) => (
          <div key={label} className="glass-sm p-3 text-center">
            <p className="text-[10px] text-white/30 uppercase tracking-wide">{label}</p>
            <p className="text-base font-semibold text-white mt-1">{value}</p>
          </div>
        ))}
      </div>

      {recipe.notes && (
        <div className="glass p-5">
          <h2 className="text-sm font-semibold text-white/80 mb-2">Заметки</h2>
          <p className="text-sm text-white/60 whitespace-pre-wrap">{recipe.notes}</p>
        </div>
      )}
    </div>
  )
}
