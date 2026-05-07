import { Settings, Database, Bell, Palette } from 'lucide-react'
import { Page, PageHeader } from '@/components/ui/Page'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'

export default function SettingsPage() {
  const items = [
    { icon: Database, title: 'База данных',  desc: 'Подключение к Supabase',                              action: 'Настроить' },
    { icon: Bell,     title: 'Уведомления',  desc: 'Email и push-уведомления',                            action: 'Настроить' },
    { icon: Palette,  title: 'Внешний вид',  desc: 'Тема и язык интерфейса',                              action: 'Изменить' },
    { icon: Settings, title: 'Пивоварня',    desc: 'Название, адрес, объём варки по умолчанию',           action: 'Редактировать' },
  ]

  return (
    <Page>
      <PageHeader title="Настройки" subtitle="Конфигурация системы" />

      <div style={{ display: 'flex', flexDirection: 'column', gap: 12, maxWidth: 760 }}>
        {items.map(({ icon: Icon, title, desc, action }) => (
          <Card key={title} pad="md" style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            <div style={{
              width: 40, height: 40, borderRadius: 'var(--r-md)',
              background: 'var(--surface-2)', border: '1px solid var(--hairline)',
              display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
            }}>
              <Icon size={17} strokeWidth={1.9} style={{ color: 'var(--accent)' }} />
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <p style={{ fontSize: 14, fontWeight: 600, color: 'var(--t-1)' }}>{title}</p>
              <p className="t-meta" style={{ marginTop: 3 }}>{desc}</p>
            </div>
            <Button size="sm" variant="ghost">{action}</Button>
          </Card>
        ))}

        <Card pad="md" style={{ borderColor: 'var(--accent-edge)', background: 'rgba(251,191,36,0.04)' }}>
          <p style={{ fontSize: 13.5, fontWeight: 600, color: 'var(--accent)' }}>Supabase подключение</p>
          <p className="t-meta" style={{ marginTop: 4 }}>Заполните NEXT_PUBLIC_SUPABASE_URL и NEXT_PUBLIC_SUPABASE_ANON_KEY в .env.local</p>
          <div className="t-mono" style={{
            marginTop: 12, padding: 14,
            background: 'rgba(0,0,0,0.3)', border: '1px solid var(--hairline)', borderRadius: 'var(--r-sm)',
            fontSize: 12, color: 'var(--t-2)', lineHeight: 1.7,
          }}>
            <p>NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co</p>
            <p>NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciO...</p>
          </div>
        </Card>
      </div>
    </Page>
  )
}
