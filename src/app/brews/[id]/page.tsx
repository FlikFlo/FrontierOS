import Link from 'next/link'
import { notFound } from 'next/navigation'
import { ArrowLeft, Calendar, Droplets, Beer } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { formatDate, getBrewStatusLabel, getBrewStatusBadge } from '@/lib/utils'
import { BEVERAGE_CATEGORIES } from '@/types/database'
import StatCard from '@/components/ui/StatCard'

export default async function BrewDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()

  if (!supabase) {
    return (
      <div className="max-w-4xl mx-auto fade-in">
        <Link href="/brews" className="btn-glass px-3 py-2 text-sm inline-flex items-center gap-2 mb-6">
          <ArrowLeft size={14} /> Назад
        </Link>
        <div className="glass p-8 text-center">
          <p className="text-sm text-white/50">
            Подключите Supabase (NEXT_PUBLIC_SUPABASE_URL и NEXT_PUBLIC_SUPABASE_ANON_KEY), чтобы открывать партии.
          </p>
          <p className="text-xs text-white/30 mt-2">id: {id}</p>
        </div>
      </div>
    )
  }

  const { data: brew, error } = await supabase
    .from('brew_logs')
    .select('*')
    .eq('id', id)
    .single()

  if (error || !brew) notFound()

  const cat = BEVERAGE_CATEGORIES.find(c => c.value === brew.category)
  const badge = getBrewStatusBadge(brew.status)

  return (
    <div className="max-w-5xl mx-auto fade-in space-y-6">
      <div className="flex items-center justify-between">
        <Link href="/brews" className="btn-glass px-3 py-2 text-sm inline-flex items-center gap-2">
          <ArrowLeft size={14} /> Все варки
        </Link>
        <span className={`badge ${badge}`}>{getBrewStatusLabel(brew.status)}</span>
      </div>

      <div className="glass p-6">
        <div className="flex items-center gap-3 mb-4">
          <span className="text-2xl">{cat?.emoji ?? '🍺'}</span>
          <div>
            <h1 className="text-xl font-bold text-white">{brew.recipe_name}</h1>
            <p className="text-sm text-white/40">{brew.batch_number} · {brew.batch_size_l} л</p>
          </div>
        </div>

        <div className="flex items-center gap-4 text-sm text-white/60">
          {brew.brew_date && (
            <span className="inline-flex items-center gap-1.5">
              <Calendar size={14} /> Старт: {formatDate(brew.brew_date)}
            </span>
          )}
          {brew.package_date && (
            <span className="inline-flex items-center gap-1.5">
              <Calendar size={14} /> Розлив: {formatDate(brew.package_date)}
            </span>
          )}
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="OG"  value={brew.og_actual ? brew.og_actual.toFixed(3) : '—'} icon={Droplets} color="amber" />
        <StatCard label="FG"  value={brew.fg_actual ? brew.fg_actual.toFixed(3) : '—'} icon={Droplets} color="blue" />
        <StatCard label="ABV" value={brew.abv_actual ? `${brew.abv_actual}%` : '—'}    icon={Beer}     color="green" />
        <StatCard label="КПД" value={brew.efficiency_actual ? `${brew.efficiency_actual}%` : '—'} icon={Droplets} color="purple" />
      </div>

      {brew.notes && (
        <div className="glass p-5">
          <h2 className="text-sm font-semibold text-white/80 mb-2">Заметки</h2>
          <p className="text-sm text-white/60 whitespace-pre-wrap">{brew.notes}</p>
        </div>
      )}
    </div>
  )
}
