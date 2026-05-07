import Link from 'next/link'
import type { ReactNode, ButtonHTMLAttributes } from 'react'

type Variant = 'primary' | 'ghost' | 'subtle'
type Size = 'md' | 'sm'

interface BaseProps {
  variant?: Variant
  size?: Size
  icon?: boolean
  className?: string
  children?: ReactNode
}

function classes({ variant = 'ghost', size = 'md', icon = false, className = '' }: BaseProps) {
  return [
    'btn',
    size === 'sm' ? 'btn-sm' : '',
    `btn-${variant}`,
    icon ? 'btn-icon' : '',
    className,
  ].filter(Boolean).join(' ')
}

export function Button({
  variant, size, icon, className, children, ...rest
}: BaseProps & ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button className={classes({ variant, size, icon, className })} {...rest}>
      {children}
    </button>
  )
}

export function LinkButton({
  href, variant, size, icon, className, children,
}: BaseProps & { href: string }) {
  return (
    <Link href={href} className={classes({ variant, size, icon, className })}>
      {children}
    </Link>
  )
}
