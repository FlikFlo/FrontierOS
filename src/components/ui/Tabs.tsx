import type { ReactNode } from 'react'

interface TabItem<T extends string> {
  value: T
  label: string
  icon?: ReactNode
}

export function Tabs<T extends string>({
  items, value, onChange, size = 'md',
}: {
  items: TabItem<T>[]
  value: T
  onChange: (v: T) => void
  size?: 'md' | 'lg'
}) {
  return (
    <div className={`tabs ${size === 'lg' ? 'tabs-lg' : ''}`}>
      {items.map(it => (
        <button
          key={it.value}
          type="button"
          className={`tab ${it.value === value ? 'tab-active' : ''}`}
          onClick={() => onChange(it.value)}
        >
          {it.icon}
          {it.label}
        </button>
      ))}
    </div>
  )
}
