import Link from 'next/link'
import { Plus, FlaskConical, Clock, Droplets } from 'lucide-react'
import { srmToColor } from '@/lib/utils'

const mockRecipes = [
  { id: '1', name: 'West Coast IPA', style: 'American IPA', batch_size_l: 25, og_target: 1.068, fg_target: 1.012, abv_target: 7.3, ibu_target: 65, srm_target: 8, boil_time_min: 60 },
  { id: '2', name: 'Oatmeal Stout', style: 'Oatmeal Stout', batch_size_l: 20, og_target: 1.072, fg_target: 1.018, abv_target: 7.1, ibu_target: 32, srm_target: 35, boil_time_min: 60 },
  { id: '3', name: 'Belgian Tripel', style: 'Belgian Tripel', batch_size_l: 25, og_target: 1.082, fg_target: 1.010, abv_target: 9.4, ibu_target: 28, srm_target: 5, boil_time_min: 90 },
  { id: '4', name: 'Pilsner Classic', style: 'German Pilsner', batch_size_l: 30, og_target: 1.048, fg_target: 1.010, abv_target: 5.0, ibu_target: 38, srm_target: 3, boil_time_min: 90 },
  { id: '5', name: 'New England IPA', style: 'New England IPA', batch_size_l: 25, og_target: 1.070, fg_target: 1.014, abv_target: 7.3, ibu_target: 45, srm_target: 5, boil_time_min: 60 },
  { id: '6', name: 'Weizen', style: 'Hefeweizen', batch_size_l: 20, og_target: 1.050, fg_target: 1.012, abv_target: 5.0, ibu_target: 12, srm_target: 4, boil_time_min: 60 },
]

export default function RecipesPage() {
  return (
    <div className="max-w-7xl mx-auto space-y-6 fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-white">Рецепты</h1>
          <p className="text-sm text-white/40 mt-0.5">{mockRecipes.length} рецептов в базе</p>
        </div>
        <Link href="/recipes/new" className="btn-primary">
          <Plus size={16} />
          Новый рецепт
        </Link>
      </div>

      {/* Recipe Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {mockRecipes.map((recipe) => {
          const color = srmToColor(recipe.srm_target ?? 5)
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
                    <h3 className="font-semibold text-white text-base leading-tight">{recipe.name}</h3>
                    <p className="text-xs text-white/40 mt-1">{recipe.style}</p>
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
