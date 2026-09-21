import * as React from 'react'
import { Logo } from '@/components/brand/logo'
import { cn } from '@/lib/utils'

interface HeaderProps {
  title?: string
  showLogo?: boolean
  className?: string
}

export function Header({ title, showLogo = true, className }: HeaderProps) {
  return (
    <div className={cn('flex items-center justify-between p-4 bg-white border-b border-cream-400', className)}>
      {showLogo && <Logo size="sm" className="mr-3" />}
      {title && <h1 className="text-xl font-semibold text-ink-900">{title}</h1>}
    </div>
  )
}
