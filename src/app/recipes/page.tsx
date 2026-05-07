import Link from 'next/link'
import { Plus, Clock, Droplets } from 'lucide-react'
import { srmToColor } from '@/lib/utils'
import { Page, PageHeader } from '@/components/ui/Page'
import { Card } from '@/components/ui/Card'
import { LinkButton } from '@/components/ui/Button'

const mockRecipes = [
  { id: '1', name: 'West Coast IPA',  style: 'American IPA',     batch_size_l: 25, og_target: 1.068, fg_target: 1.012, abv_target: 7.3, ibu_target: 65, srm_target: 8,  boil_time_min: 60 },
  { id: '2', name: 'Oatmeal Stout',   style: 'Oatmeal Stout',    batch_size_l: 20, og_target: 1.072, fg_target: 1.018, abv_target: 7.1, ibu_target: 32, srm_target: 35, boil_time_min: 60 },
  { id: '3', name: 'Belgian Tripel',  style: 'Belgian Tripel',   batch_size_l: 25, og_target: 1.082, fg_target: 1.010, abv_target: 9.4, ibu_target: 28, srm_target: 5,  boil_time_min: 90 },
  { id: '4', name: 'Pilsner Classic', style: 'German Pilsner',   batch_size_l: 30, og_target: 1.048, fg_target: 1.010, abv_target: 5.0, ibu_target: 38, srm_target: 3,  boil_time_min: 90 },
  { id: '5', name: 'New England IPA', style: 'New England IPA',  batch_size_l: 25, og_target: 1.070, fg_target: 1.014, abv_target: 7.3, ibu_target: 45, srm_target: 5,  boil_time_min: 60 },
  { id: '6', name: 'Weizen',          style: 'Hefeweizen',       batch_size_l: 20, og_target: 1.050, fg_target: 1.012, abv_target: 5.0, ibu_target: 12, srm_target: 4,  boil_time_min: 60 },
]

export default function RecipesPage() {
  return (
    <Page>
      <PageHeader
        title="Рецепты"
        subtitle={`${mockRecipes.length} рецептов в базе`}
        actions={
          <LinkButton href="/recipes/new" variant="primary">
            <Plus size={15} strokeWidth={2.5} />
            Новый рецепт
          </LinkButton>
        }
      />

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 16 }}>
        {mockRecipes.map(recipe => {
          const color = srmToColor(recipe.srm_target ?? 5)
          return (
            <Link key={recipe.id} href={`/recipes/${recipe.id}`}>
              <Card hover pad="md" style={{ cursor: 'pointer', height: '100%' }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: 14, marginBottom: 16 }}>
                  <div style={{
                    width: 4, alignSelf: 'stretch', minHeight: 56,
                    borderRadius: 4,
                    background: `linear-gradient(180deg, ${color}, ${color}99)`,
                    boxShadow: `0 0 16px ${color}33`,
                    flexShrink: 0,
                  }} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <h3 style={{ fontSize: 15.5, fontWeight: 600, color: 'var(--t-1)', letterSpacing: '-0.01em' }}>{recipe.name}</h3>
                    <p className="t-meta" style={{ marginTop: 3 }}>{recipe.style}</p>
                    <div style={{ display: 'flex', gap: 14, marginTop: 8 }}>
                      <span className="t-meta" style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                        <Droplets size={11} />{recipe.batch_size_l} л
                      </span>
                      <span className="t-meta" style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                        <Clock size={11} />{recipe.boil_time_min} мин
                      </span>
                    </div>
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8 }}>
                  {[
                    { label: 'OG',  value: recipe.og_target?.toFixed(3) ?? '—' },
                    { label: 'FG',  value: recipe.fg_target?.toFixed(3) ?? '—' },
                    { label: 'ABV', value: recipe.abv_target ? `${recipe.abv_target}%` : '—' },
                    { label: 'IBU', value: recipe.ibu_target?.toFixed(0) ?? '—' },
                  ].map(({ label, value }) => (
                    <div key={label} style={{
                      padding: '10px 8px', textAlign: 'center',
                      background: 'var(--surface-1)',
                      border: '1px solid var(--hairline)',
                      borderRadius: 'var(--r-sm)',
                    }}>
                      <p style={{ fontSize: 9.5, fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--t-3)' }}>{label}</p>
                      <p className="t-mono" style={{ fontSize: 13, fontWeight: 600, color: 'var(--t-1)', marginTop: 3 }}>{value}</p>
                    </div>
                  ))}
                </div>
              </Card>
            </Link>
          )
        })}
      </div>
    </Page>
  )
}
