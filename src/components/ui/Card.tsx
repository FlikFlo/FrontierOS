import type { ReactNode, CSSProperties } from 'react'

type Pad = 'sm' | 'md' | 'lg' | 'none'

export function Card({
  children,
  pad = 'md',
  hover = false,
  className = '',
  style,
  onClick,
}: {
  children: ReactNode
  pad?: Pad
  hover?: boolean
  className?: string
  style?: CSSProperties
  onClick?: () => void
}) {
  const padClass = pad === 'none' ? '' : pad === 'sm' ? 'card-pad-sm' : pad === 'lg' ? 'card-pad-lg' : 'card-pad'
  return (
    <div
      className={`card ${padClass} ${hover ? 'card-hover' : ''} ${className}`}
      style={style}
      onClick={onClick}
    >
      {children}
    </div>
  )
}

export function CardHeader({
  title,
  action,
  eyebrow,
}: {
  title: string
  action?: ReactNode
  eyebrow?: string
}) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
      <div>
        {eyebrow && <p className="t-eyebrow" style={{ marginBottom: 4 }}>{eyebrow}</p>}
        <h3 className="t-title">{title}</h3>
      </div>
      {action}
    </div>
  )
}
