import { Settings, Database, Bell, Palette } from 'lucide-react'

export default function SettingsPage() {
  return (
    <div className="max-w-3xl mx-auto space-y-6 fade-in">
      <div>
        <h1 className="text-xl font-bold text-white">Настройки</h1>
        <p className="text-sm text-white/40 mt-0.5">Конфигурация системы</p>
      </div>

      {[
        { icon: Database, title: 'База данных', desc: 'Подключение к Supabase', action: 'Настроить' },
        { icon: Bell, title: 'Уведомления', desc: 'Email и push-уведомления', action: 'Настроить' },
        { icon: Palette, title: 'Внешний вид', desc: 'Тема и язык интерфейса', action: 'Изменить' },
        { icon: Settings, title: 'Пивоварня', desc: 'Название, адрес, объём варки по умолчанию', action: 'Редактировать' },
      ].map(({ icon: Icon, title, desc, action }) => (
        <div key={title} className="glass p-5 flex items-center gap-4">
          <div className="w-10 h-10 rounded-xl bg-white/8 border border-white/10 flex items-center justify-center flex-shrink-0">
            <Icon size={18} className="text-amber-400" />
          </div>
          <div className="flex-1">
            <p className="font-medium text-white text-sm">{title}</p>
            <p className="text-xs text-white/40 mt-0.5">{desc}</p>
          </div>
          <button className="btn-glass py-2 px-4 text-sm">{action}</button>
        </div>
      ))}

      <div className="glass p-5 border border-amber-500/20 bg-amber-500/5">
        <p className="text-sm text-amber-300 font-medium">Supabase подключение</p>
        <p className="text-xs text-white/40 mt-1">Заполните NEXT_PUBLIC_SUPABASE_URL и NEXT_PUBLIC_SUPABASE_ANON_KEY в .env.local</p>
        <div className="mt-3 glass-sm p-3 font-mono text-xs text-white/50">
          <p>NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co</p>
          <p>NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciO...</p>
        </div>
      </div>
    </div>
  )
}
