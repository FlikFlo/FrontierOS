import type { InputHTMLAttributes, SelectHTMLAttributes, ReactNode } from 'react'

export function Field({
  label, hint, children,
}: {
  label?: string
  hint?: string
  children: ReactNode
}) {
  return (
    <div className="field">
      {label && <label className="field-label">{label}</label>}
      {children}
      {hint && <p className="field-hint">{hint}</p>}
    </div>
  )
}

export function Input({
  suffix, large, className = '', ...props
}: InputHTMLAttributes<HTMLInputElement> & { suffix?: string; large?: boolean }) {
  if (suffix) {
    return (
      <div className="input-group">
        <input className={`input ${large ? 'input-lg' : ''} ${className}`} {...props} />
        <span className="input-suffix">{suffix}</span>
      </div>
    )
  }
  return <input className={`input ${large ? 'input-lg' : ''} ${className}`} {...props} />
}

export function Select({
  className = '', children, ...props
}: SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select className={`select ${className}`} {...props}>
      {children}
    </select>
  )
}
