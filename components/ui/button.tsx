import * as React from 'react'
import { cn } from '@/lib/utils'

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'burgundy' | 'outline' | 'ghost' | 'destructive'
  size?: 'sm' | 'md' | 'lg' | 'icon'
  loading?: boolean
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ variant = 'primary', size = 'md', loading, disabled, children, className, ...props }, ref) => {
    const baseStyles = 'inline-flex items-center justify-center font-medium transition-all duration-200 focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2 focus-visible:outline-none disabled:opacity-50 disabled:cursor-not-allowed active:scale-[0.98]'
    
    const variants = {
      primary: 'bg-emerald-500 text-white hover:bg-emerald-600 shadow-sm hover:shadow-md',
      secondary: 'bg-gold-500 text-white hover:bg-gold-600 shadow-sm hover:shadow-md',
      burgundy: 'bg-burgundy-500 text-white hover:bg-burgundy-600 shadow-sm hover:shadow-md',
      destructive: 'bg-burgundy-500 text-white hover:bg-burgundy-600 shadow-sm hover:shadow-md',
      outline: 'border-2 border-emerald-500 text-emerald-500 hover:bg-emerald-50 hover:border-emerald-600',
      ghost: 'text-emerald-500 hover:bg-emerald-50',
    }
    
    const sizes = {
      sm: 'h-9 px-4 text-sm rounded-lg',
      md: 'h-11 px-6 text-base rounded-xl',
      lg: 'h-14 px-8 text-lg rounded-2xl',
      icon: 'h-10 w-10 rounded-full',
    }
    
    return (
      <button
        className={cn(baseStyles, variants[variant], sizes[size], className)}
        ref={ref}
        disabled={disabled || loading}
        {...props}
      >
        {loading ? (
          <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
        ) : (
          children
        )}
      </button>
    )
  }
)

Button.displayName = 'Button'

export { Button }
