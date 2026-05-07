import Link from 'next/link'
import { Beer, ArrowLeft } from 'lucide-react'

export default function NewBrewPage() {
  return (
    <div className="max-w-3xl mx-auto fade-in">
      <Link href="/brews" className="btn-glass px-3 py-2 text-sm inline-flex items-center gap-2 mb-6">
        <ArrowLeft size={14} />
        Назад к варкам
      </Link>

      <div className="glass p-8 text-center">
        <Beer size={48} className="mx-auto text-amber-400 opacity-50 mb-4" />
        <h1 className="text-xl font-bold text-white mb-2">Новая варка</h1>
        <p className="text-sm text-white/40 mb-6">
          Форма создания партии будет на этой странице.<br />
          Пока используйте <Link href="/recipes" className="text-amber-400 hover:underline">список рецептов</Link>, чтобы выбрать рецепт.
        </p>
        <div className="text-xs text-white/30">
          Раздел в разработке — выбор рецепта, номер партии, объём, дата старта
        </div>
      </div>
    </div>
  )
}
