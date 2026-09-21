import * as React from 'react'
import { cn } from '@/lib/utils'

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  error?: boolean
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, error, ...props }, ref) => {
    return (
      <input
        className={cn(
          'flex h-12 w-full rounded-xl border-2 bg-white px-4 text-base transition-all duration-200 focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2 focus-visible:outline-none disabled:opacity-50 disabled:cursor-not-allowed',
          error ? 'border-burgundy-500 focus-visible:ring-burgundy-500' : 'border-cream-400 focus-visible:border-emerald-500',
          className
        )}
        ref={ref}
        aria-invalid={error ? 'true' : undefined}
        aria-describedby={error ? 'input-error' : undefined}
        {...props}
      />
    )
  }
)

Input.displayName = 'Input'

export { Input }
