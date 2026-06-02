'use client'

import { useState } from 'react'
import { Sun, Moon } from 'lucide-react'
import type { Theme } from '@/lib/theme'
import { THEME_COOKIE } from '@/lib/theme'

/**
 * ThemeToggle — flips dark/light instantly (sets <html data-theme> + cookie so
 * the next server render matches and there's no flash). Seeded from the server
 * so the icon is correct on first paint.
 */
export function ThemeToggle({ initial }: { initial: Theme }) {
  const [theme, setTheme] = useState<Theme>(initial)

  function toggle() {
    const next: Theme = theme === 'dark' ? 'light' : 'dark'
    setTheme(next)
    document.documentElement.dataset.theme = next
    document.cookie = `${THEME_COOKIE}=${next}; path=/; max-age=31536000; samesite=lax`
  }

  const Icon = theme === 'dark' ? Sun : Moon
  return (
    <button
      type="button"
      onClick={toggle}
      aria-label="Toggle theme"
      className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-white/55 transition-colors hover:bg-white/[0.08] hover:text-white"
    >
      <Icon size={16} />
    </button>
  )
}
