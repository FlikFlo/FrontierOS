import Link from 'next/link'
import { Plus, Calendar } from 'lucide-react'
import { formatDate, getBrewStatusLabel } from '@/lib/utils'
import { BEVERAGE_CATEGORIES } from '@/types/database'
import type { BrewStatus, BeverageCategory } from '@/types/database'
import { Page, PageHeader } from '@/components/ui/Page'
import { Card } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { LinkButton } from '@/components/ui/Button'

interface MockBrew {
  id: string
  recipe_name: string
  category: BeverageCategory
  batch_number: string
  status: BrewStatus
  brew_date: string
  batch_size_l: number
  og_actual: number | null
  fg_actual: number | null
  abv_actual: number | null
}

const mockBrews: MockBrew[] = [
  { id: '1', recipe_name: 'West Coast IPA',   category: 'beer',     batch_number: '#042', status: 'fermenting',   brew_date: '2026-04-28', batch_size_l: 25, og_actual: 1.068, fg_actual: null,  abv_actual: null },
  { id: '2', recipe_name: 'Oatmeal Stout',    category: 'beer',     batch_number: '#041', status: 'conditioning', brew_date: '2026-04-15', batch_size_l: 20, og_actual: 1.072, fg_actual: null,  abv_actual: null },
  { id: '3', recipe_name: 'Belgian Tripel',   category: 'beer',     batch_number: '#040', status: 'ready',        brew_date: '2026-04-01', batch_size_l: 25, og_actual: 1.082, fg_actual: 1.010, abv_actual: 9.4 },
  { id: '4', recipe_name: 'Pilsner Classic',  category: 'beer',     batch_number: '#039', status: 'planned',      brew_date: '2026-05-12', batch_size_l: 30, og_actual: null,  fg_actual: null,  abv_actual: null },
  { id: '5', recipe_name: 'Манго Комбуча',    category: 'kombucha', batch_number: '#K01', status: 'fermenting',   brew_date: '2026-05-01', batch_size_l: 10, og_actual: 1.030, fg_actual: null,  abv_actual: null },
  { id: '6', recipe_name: 'Лимонад Citrus',   category: 'lemonade', batch_number: '#L01', status: 'ready',        brew_date: '2026-04-20', batch_size_l: 15, og_actual: null,  fg_actual: null,  abv_actual: null },
]

const statusProgress: Record<BrewStatus, number> = {
  planned: 5, mashing: 20, boiling: 40, fermenting: 65, conditioning: 85, ready: 100, archived: 100,
}

const statusTone: Record<BrewStatus, 'neutral' | 'accent' | 'ok' | 'warn' | 'info'> = {
  planned: 'neutral', mashing: 'warn', boiling: 'warn',
  fermenting: 'info', conditioning: 'accent', ready: 'ok', archived: 'neutral',
}

export default function BrewsPage() {
  const order: BrewStatus[] = ['fermenting', 'conditioning', 'mashing', 'boiling', 'ready', 'planned']
  const grouped = mockBrews.reduce((acc, b) => {
    if (!acc[b.status]) acc[b.status] = []
    acc[b.status].push(b)
    return acc
  }, {} as Record<string, MockBrew[]>)

  return (
    <Page>
      <PageHeader
        title="Варки"
        subtitle={`${mockBrews.length} партий всего`}
        actions={
          <LinkButton href="/brews/new" variant="primary">
            <Plus size={15} strokeWidth={2.5} />Новая партия
          </LinkButton>
        }
      />

      {/* Status overview */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 10 }}>
        {order.map(s => {
          const count = grouped[s]?.length ?? 0
          return (
            <Card key={s} pad="sm" style={{ textAlign: 'center', padding: '14px 12px' }}>
              <p className="t-mono" style={{ fontSize: 22, fontWeight: 600, color: 'var(--t-1)', lineHeight: 1 }}>{count}</p>
              <p style={{ fontSize: 11, color: 'var(--t-3)', marginTop: 6 }}>{getBrewStatusLabel(s)}</p>
            </Card>
          )
        })}
      </div>

      {/* Brew cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 16 }}>
        {mockBrews.map(brew => {
          const cat = BEVERAGE_CATEGORIES.find(c => c.value === brew.category)
          const progress = statusProgress[brew.status]
          return (
            <Link key={brew.id} href={`/brews/${brew.id}`}>
              <Card hover pad="md" style={{ cursor: 'pointer', height: '100%', display: 'flex', flexDirection: 'column', gap: 14 }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12 }}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span style={{ fontSize: 16 }}>{cat?.emoji}</span>
                      <h3 style={{ fontSize: 14.5, fontWeight: 600, color: 'var(--t-1)' }}>{brew.recipe_name}</h3>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 4 }}>
                      <span className="t-meta">{brew.batch_number}</span>
                      <span style={{ color: 'var(--t-4)' }}>·</span>
                      <span className="t-meta">{brew.batch_size_l} л</span>
                    </div>
                  </div>
                  <Badge tone={statusTone[brew.status]}>{getBrewStatusLabel(brew.status)}</Badge>
                </div>

                <div className="progress">
                  <div
                    className={`progress-bar ${brew.status === 'ready' ? 'progress-bar-ok' : brew.status === 'fermenting' ? 'progress-bar-info' : ''}`}
                    style={{ width: `${progress}%` }}
                  />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8 }}>
                  {[
                    { label: 'OG', value: brew.og_actual?.toFixed(3) ?? '—' },
                    { label: 'FG', value: brew.fg_actual?.toFixed(3) ?? '—' },
                    { label: 'ABV', value: brew.abv_actual ? `${brew.abv_actual}%` : '—' },
                  ].map(it => (
                    <div key={it.label} style={{
                      padding: '8px', textAlign: 'center',
                      borderRadius: 'var(--r-sm)',
                      background: 'var(--surface-1)',
                      border: '1px solid var(--hairline)',
                    }}>
                      <p style={{ fontSize: 9.5, fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--t-3)' }}>{it.label}</p>
                      <p className="t-mono" style={{ fontSize: 13, fontWeight: 600, color: 'var(--t-1)', marginTop: 3 }}>{it.value}</p>
                    </div>
                  ))}
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: 5, color: 'var(--t-3)', fontSize: 11.5 }}>
                  <Calendar size={11} />
                  {brew.status === 'planned' ? `Запланирована ${formatDate(brew.brew_date)}` : formatDate(brew.brew_date)}
                </div>
              </Card>
            </Link>
          )
        })}
      </div>
    </Page>
  )
}
