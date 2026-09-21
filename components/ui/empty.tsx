import * as React from 'react'
import { cn } from '@/lib/utils'

interface EmptyStateProps extends React.HTMLAttributes<HTMLDivElement> {
  icon?: React.ReactNode
  title?: string
  description?: string
  action?: React.ReactNode
}

export function EmptyState({
  icon,
  title = 'No data',
  description = 'There is nothing to show here.',
  action,
  className,
  ...props
}: EmptyStateProps) {
  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center p-8 space-y-4 text-center',
        className
      )}
      {...props}
    >
      {icon && <div className="text-ink-400 text-4xl">{icon}</div>}
      <h3 className="text-lg font-semibold text-ink-900">{title}</h3>
      <p className="text-ink-700 max-w-sm">{description}</p>
      {action && <div className="mt-2">{action}</div>}
    </div>
  )
}
