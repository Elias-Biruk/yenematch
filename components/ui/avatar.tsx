import * as React from 'react'
import { cn } from '@/lib/utils'

interface AvatarProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  fallback?: string
}

const Avatar = React.forwardRef<HTMLImageElement, AvatarProps>(
  ({ className, fallback, alt = '', ...props }, ref) => {
    const [error, setError] = React.useState(false)
    
    if (error || !props.src) {
      return (
        <div
          className={cn(
            'flex items-center justify-center rounded-full bg-cream-400 text-ink-700 font-medium',
            className
          )}
        >
          {fallback || '?'}
        </div>
      )
    }
    
    return (
      <img
        ref={ref}
        className={cn('rounded-full object-cover', className)}
        onError={() => setError(true)}
        alt={alt}
        {...props}
      />
    )
  }
)

Avatar.displayName = 'Avatar'

export { Avatar }
