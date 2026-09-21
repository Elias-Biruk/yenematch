import * as React from 'react'
import { cn } from '@/lib/utils'

export interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  error?: boolean
}

const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, error, ...props }, ref) => {
    return (
      <textarea
        className={cn(
          'flex min-h-[120px] w-full rounded-xl border-2 bg-white px-4 py-3 text-base transition-all duration-200 placeholder:text-ink-400 focus-visible:outline-none resize-none disabled:cursor-not-allowed disabled:opacity-50',
          error
            ? 'border-burgundy-500 focus-visible:ring-2 focus-visible:ring-burgundy-500'
            : 'border-cream-400 focus-visible:border-emerald-500 focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2 focus-visible:ring-offset-cream-300',
          className
        )}
        ref={ref}
        {...props}
      />
    )
  }
)

Textarea.displayName = 'Textarea'

export { Textarea }
