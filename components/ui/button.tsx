import * as React from 'react'
import { cn } from '@/lib/utils'

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'burgundy' | 'outline' | 'ghost'
  size?: 'sm' | 'md' | 'lg'
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'primary', size = 'md', ...props }, ref) => {
    const baseStyles = 'inline-flex items-center justify-center rounded-xl font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50'
    
    const variants = {
      primary: 'bg-emerald-500 text-white hover:bg-emerald-600 active:bg-emerald-700',
      secondary: 'bg-gold-500 text-white hover:bg-gold-600 active:bg-gold-700',
      burgundy: 'bg-burgundy-500 text-white hover:bg-burgundy-600 active:bg-burgundy-700',
      outline: 'border-2 border-emerald-500 text-emerald-500 hover:bg-emerald-50 active:bg-emerald-100',
      ghost: 'text-emerald-500 hover:bg-emerald-50 active:bg-emerald-100',
    }
    
    const sizes = {
      sm: 'h-9 px-4 text-sm',
      md: 'h-11 px-6 text-base',
      lg: 'h-13 px-8 text-lg',
    }
    
    return (
      <button
        className={cn(baseStyles, variants[variant], sizes[size], className)}
        ref={ref}
        {...props}
      />
    )
  }
)

Button.displayName = 'Button'

export { Button }
