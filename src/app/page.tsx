import {
  Beer, FlaskConical, Package, TrendingUp,
  Clock, AlertTriangle, ArrowRight, Plus,
} from 'lucide-react'
import Link from 'next/link'
import { Page, PageHeader } from '@/components/ui/Page'
import { Card, CardHeader } from '@/components/ui/Card'
import { Stat } from '@/components/ui/Stat'
import { Badge } from '@/components/ui/Badge'
import { LinkButton } from '@/components/ui/Button'

const recentBrews = [
  { name: 'West Coast IPA',  batch: '#042', status: 'fermenting',   date: '28 апр', og: '1.068', progress: 65 },
  { name: 'Oatmeal Stout',   batch: '#041', status: 'conditioning', date: '15 апр', og: '1.072', progress: 85 },
  { name: 'Belgian Tripel',  batch: '#040', status: 'ready',        date: '1 апр',  og: '1.082', progress: 100 },
  { name: 'Pilsner Classic', batch: '#039', status: 'planned',      date: '12 май', og: '—',     progress: 0 },
]

type Status = 'planned' | 'mashing' | 'boiling' | 'fermenting' | 'conditioning' | 'ready'
const statusConfig: Record<Status, { label: string; tone: 'neutral' | 'accent' | 'ok' | 'warn' | 'info' }> = {
  planned:      { label: 'Запланирована',   tone: 'neutral' },
  mashing:      { label: 'Затирание',       tone: 'warn' },
  boiling:      { label: 'Кипячение',       tone: 'warn' },
  fermenting:   { label: 'Брожение',        tone: 'info' },
  conditioning: { label: 'Дображивание',    tone: 'accent' },
  ready:        { label: 'Готово',          tone: 'ok' },
}

const lowStock = [
  { name: 'Citra Hops',        qty: '200 г',  min: '300 г' },
  { name: 'S-04 English Ale',  qty: '2 пак',  min: '3 пак' },
]

export default function Dashboard() {
  return (
    <Page>
      <PageHeader
        title="Дашборд"
        subtitle="Обзор пивоварни на сегодня"
        actions={
          <LinkButton href="/brews/new" variant="primary">
            <Plus size={15} strokeWidth={2.5} />
            Новая варка
          </LinkButton>
        }
      />

      {/* KPI grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 16 }}>
        <Stat label="Активных варок"  value="3"      sub="1 запланирована" />
        <Stat label="Рецептов"        value="18"     sub="5 в разработке" />
        <Stat label="Позиций склада"  value="12"     sub="2 ниже минимума" />
        <Stat label="Выпущено в апр." value="420 л"  trend={{ value: '18%', direction: 'up' }} />
      </div>

      {/* Two-column row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 2fr) minmax(0, 1fr)', gap: 20 }}>
        {/* Recent brews */}
        <Card pad="lg">
          <CardHeader
            title="Последние варки"
            action={
              <Link href="/brews" style={{ fontSize: 12.5, color: 'var(--accent)', display: 'inline-flex', alignItems: 'center', gap: 4, fontWeight: 600 }}>
                Все варки <ArrowRight size={12} />
              </Link>
            }
          />
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {recentBrews.map(brew => {
              const s = statusConfig[brew.status as Status]
              return (
                <div
                  key={brew.batch}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 16,
                    padding: '12px 14px',
                    borderRadius: 'var(--r-md)',
                    background: 'var(--surface-1)',
                    border: '1px solid var(--hairline)',
                  }}
                >
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                      <span style={{ fontSize: 14, fontWeight: 600, color: 'var(--t-1)' }}>{brew.name}</span>
                      <span style={{ fontSize: 12, color: 'var(--t-4)' }}>{brew.batch}</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <Badge tone={s.tone}>{s.label}</Badge>
                      <span className="t-meta">{brew.date}</span>
                      {brew.og !== '—' && <span className="t-meta t-mono">OG {brew.og}</span>}
                    </div>
                  </div>
                  <div style={{ width: 120, display: 'flex', flexDirection: 'column', gap: 6, alignItems: 'flex-end' }}>
                    <span className="t-meta t-mono">{brew.progress}%</span>
                    <div className="progress" style={{ width: '100%' }}>
                      <div className={`progress-bar ${brew.progress === 100 ? 'progress-bar-ok' : brew.status === 'fermenting' ? 'progress-bar-info' : ''}`} style={{ width: `${brew.progress}%` }} />
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </Card>

        {/* Right column */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          <Card pad="md">
            <CardHeader title="Низкий остаток" />
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {lowStock.map(it => (
                <div key={it.name} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10 }}>
                  <div>
                    <p style={{ fontSize: 13.5, color: 'var(--t-1)' }}>{it.name}</p>
                    <p className="t-meta" style={{ marginTop: 2 }}>Минимум: {it.min}</p>
                  </div>
                  <Badge tone="bad">{it.qty}</Badge>
                </div>
              ))}
              <Link href="/inventory" style={{ marginTop: 4, fontSize: 12.5, color: 'var(--accent)', fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                Управление складом <ArrowRight size={12} />
              </Link>
            </div>
          </Card>

          <Card pad="md">
            <CardHeader title="Сегодня" />
            <ul style={{ display: 'flex', flexDirection: 'column', gap: 10, listStyle: 'none' }}>
              <li style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 13, color: 'var(--t-2)' }}>
                <span className="dot dot-info" />
                Замер SG — West Coast IPA
              </li>
              <li style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 13, color: 'var(--t-2)' }}>
                <span className="dot dot-warn" />
                Перелив — Oatmeal Stout
              </li>
              <li style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 13, color: 'var(--t-2)' }}>
                <span className="dot dot-ok" />
                Розлив — Belgian Tripel
              </li>
            </ul>
          </Card>
        </div>
      </div>

      {/* Quick actions */}
      <Card pad="lg">
        <CardHeader title="Быстрые действия" />
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 10 }}>
          <LinkButton href="/recipes/new" variant="primary"><FlaskConical size={14} strokeWidth={2.4} />Новый рецепт</LinkButton>
          <LinkButton href="/brews/new" variant="ghost"><Beer size={14} strokeWidth={2.2} />Начать варку</LinkButton>
          <LinkButton href="/inventory" variant="ghost"><Package size={14} strokeWidth={2.2} />Пополнить склад</LinkButton>
          <LinkButton href="/calculator" variant="ghost"><TrendingUp size={14} strokeWidth={2.2} />Калькулятор</LinkButton>
        </div>
      </Card>
    </Page>
  )
}
