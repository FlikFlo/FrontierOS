import type { ReactNode } from 'react'

type Tone = 'neutral' | 'accent' | 'ok' | 'warn' | 'bad' | 'info'

export function Badge({
  children, tone = 'neutral', dot = false,
}: {
  children: ReactNode
  tone?: Tone
  dot?: boolean
}) {
  return (
    <span className={`badge badge-${tone}`}>
      {dot && <span className={`badge-dot`} style={{ background: 'currentColor' }} />}
      {children}
    </span>
  )
}
