import { ShoppingCart } from 'lucide-react'
import { Page, PageHeader } from '@/components/ui/Page'
import { Card } from '@/components/ui/Card'
import { Stat } from '@/components/ui/Stat'

export default function SalesPage() {
  return (
    <Page>
      <PageHeader title="Продажи" subtitle="Отгрузки, кеги, клиенты" />

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 16 }}>
        <Stat label="Продано (май)" value="320 л" />
        <Stat label="Выручка"        value="96 000 ₽" />
        <Stat label="Кеги в обороте" value="12" />
        <Stat label="Клиентов"       value="8" />
      </div>

      <Card pad="lg" style={{ textAlign: 'center', padding: 56 }}>
        <ShoppingCart size={36} style={{ margin: '0 auto', color: 'var(--t-4)', opacity: 0.6 }} />
        <p style={{ fontSize: 14, color: 'var(--t-2)', marginTop: 14, fontWeight: 500 }}>Модуль продаж в разработке</p>
        <p className="t-meta" style={{ marginTop: 6 }}>Отгрузки по клиентам, остатки кег, история заказов</p>
      </Card>
    </Page>
  )
}
