import type { HTMLAttributes } from 'react'

interface Props extends HTMLAttributes<HTMLDivElement> {
  /** 'chrome' = darker frame; 'chrome-r' = recessed inner panel. */
  variant?: 'chrome' | 'chrome-r'
}

export default function GlassPanel({
  variant = 'chrome',
  className = '',
  children,
  ...rest
}: Props) {
  return (
    <div className={`${variant} rounded-2xl ${className}`} {...rest}>
      {children}
    </div>
  )
}
