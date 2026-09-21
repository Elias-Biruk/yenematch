import * as React from 'react'
import { cn } from '@/lib/utils'

interface LogoProps {
  size?: 'sm' | 'md' | 'lg'
  className?: string
}

export function Logo({ size = 'md', className }: LogoProps) {
  const sizes = {
    sm: 'h-8 w-8',
    md: 'h-12 w-12',
    lg: 'h-16 w-16',
  }
  
  return (
    <svg
      viewBox="0 0 100 100"
      className={cn(sizes[size], className)}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* Y shape */}
      <path
        d="M20 20 L35 45 L50 20 L65 45 L80 20"
        stroke="#006B4F"
        strokeWidth="6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {/* M shape */}
      <path
        d="M20 50 L20 80 L35 65 L50 80 L65 65 L80 80 L80 50"
        stroke="#006B4F"
        strokeWidth="6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {/* Heart */}
      <path
        d="M50 35 C50 35 45 30 40 30 C35 30 30 35 30 40 C30 45 35 50 50 60 C65 50 70 45 70 40 C70 35 65 30 60 30 C55 30 50 35 50 35"
        fill="#7A1235"
      />
    </svg>
  )
}
