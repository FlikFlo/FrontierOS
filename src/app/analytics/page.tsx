import { BarChart3 } from 'lucide-react'
import { Page, PageHeader } from '@/components/ui/Page'
import { Card } from '@/components/ui/Card'
import { Stat } from '@/components/ui/Stat'

export default function AnalyticsPage() {
  return (
    <Page>
      <PageHeader title="Аналитика" subtitle="Себестоимость, выход, эффективность" />

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 16 }}>
        <Stat label="Себест. литра"   value="42 ₽" />
        <Stat label="Выход пива"      value="87%" />
        <Stat label="Рост за месяц"   value="+18%" trend={{ value: '18%', direction: 'up' }} />
        <Stat label="Выпущено всего"  value="1 420 л" />
      </div>

      <Card pad="lg" style={{ textAlign: 'center', padding: 56 }}>
        <BarChart3 size={36} style={{ margin: '0 auto', color: 'var(--t-4)', opacity: 0.6 }} />
        <p style={{ fontSize: 14, color: 'var(--t-2)', marginTop: 14, fontWeight: 500 }}>Графики и аналитика в разработке</p>
        <p className="t-meta" style={{ marginTop: 6 }}>Динамика по партиям, сравнение рецептов, анализ потерь</p>
      </Card>
    </Page>
  )
}
