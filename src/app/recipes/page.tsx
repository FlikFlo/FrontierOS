import Link from 'next/link'
import { Plus, Clock, Droplets } from 'lucide-react'
import { srmToColor } from '@/lib/utils'
import { createClient } from '@/lib/supabase/server'
import { mockRecipes } from '@/lib/mock-data'
import type { Recipe } from '@/types/database'
import { BEVERAGE_CATEGORIES } from '@/types/database'

export default async function RecipesPage() {
  const supabase = await createClient()
  let recipes: Recipe[] = mockRecipes
  let isMock = true

  if (supabase) {
    const { data } = await supabase.from('recipes').select('*').order('created_at', { ascending: false })
    if (data && data.length) {
      recipes = data as Recipe[]
      isMock = false
    }
  }

  return (
    <div className="max-w-7xl mx-auto space-y-6 fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-white">Рецепты</h1>
          <p className="text-sm text-white/40 mt-0.5">
            {recipes.length} рецептов в базе
            {isMock && <span className="ml-2 badge badge-gray">демо-данные</span>}
          </p>
        </div>
        <Link href="/recipes/new" className="btn-primary">
          <Plus size={16} />
          Новый рецепт
        </Link>
      </div>

      {/* Recipe Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {recipes.map((recipe) => {
          const color = srmToColor(recipe.srm_target ?? 5)
          const cat = BEVERAGE_CATEGORIES.find(c => c.value === recipe.category)
          return (
            <Link key={recipe.id} href={`/recipes/${recipe.id}`}>
              <div className="glass p-5 cursor-pointer glass-hover transition-all duration-200 h-full">
                {/* Color strip + name */}
                <div className="flex items-start gap-3 mb-4">
                  <div
                    className="w-3 h-full min-h-[60px] rounded-full flex-shrink-0"
                    style={{ background: `linear-gradient(180deg, ${color}, ${color}88)` }}
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-base">{cat?.emoji ?? '🍺'}</span>
                      <h3 className="font-semibold text-white text-base leading-tight">{recipe.name}</h3>
                    </div>
                    <p className="text-xs text-white/40 mt-1">{recipe.style || cat?.label}</p>
                    <div className="flex items-center gap-3 mt-2">
                      <span className="flex items-center gap-1 text-xs text-white/40">
                        <Droplets size={11} />{recipe.batch_size_l} л
                      </span>
                      <span className="flex items-center gap-1 text-xs text-white/40">
                        <Clock size={11} />{recipe.boil_time_min} мин
                      </span>
                    </div>
                  </div>
                </div>

                {/* Stats grid */}
                <div className="grid grid-cols-4 gap-2">
                  {[
                    { label: 'OG', value: recipe.og_target?.toFixed(3) ?? '—' },
                    { label: 'FG', value: recipe.fg_target?.toFixed(3) ?? '—' },
                    { label: 'ABV', value: recipe.abv_target ? `${recipe.abv_target}%` : '—' },
                    { label: 'IBU', value: recipe.ibu_target?.toFixed(0) ?? '—' },
                  ].map(({ label, value }) => (
                    <div key={label} className="glass-sm p-2 text-center">
                      <p className="text-[10px] text-white/30 uppercase tracking-wide">{label}</p>
                      <p className="text-sm font-semibold text-white mt-0.5">{value}</p>
                    </div>
                  ))}
                </div>
              </div>
            </Link>
          )
        })}
      </div>
    </div>
  )
}
