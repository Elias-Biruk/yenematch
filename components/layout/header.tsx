'use client'

import * as React from 'react'
import Link from 'next/link'
import { Logo } from '@/components/brand/logo'
import { LanguageSelector } from '@/components/language-selector'
import { Shield } from 'lucide-react'
import { cn } from '@/lib/utils'

interface HeaderProps {
  title?: string
  showLogo?: boolean
  showLanguageSelector?: boolean
  isAdmin?: boolean
  className?: string
  showBack?: boolean
  onBack?: () => void
}

export function Header({ title, showLogo = true, showLanguageSelector = false, isAdmin = false, className, showBack, onBack }: HeaderProps) {
  return (
    <div className={cn('flex items-center justify-between px-4 py-4 bg-white border-b border-cream-400 safe-top', className)}>
      <div className="flex items-center">
        {showBack && (
          <button
            onClick={onBack}
            className="mr-3 p-2 -ml-2 rounded-full hover:bg-cream-100 transition-colors active:scale-95"
            aria-label="Go back"
          >
            <svg className="w-6 h-6 text-ink-700" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
        )}
        {showLogo && <Logo size="sm" className="mr-3" />}
        {title && <h1 className="text-h1 text-ink-900">{title}</h1>}
      </div>
      <div className="flex items-center space-x-2">
        {isAdmin && (
          <Link
            href="/admin/dashboard"
            className="flex items-center px-3 py-2 rounded-lg text-sm font-medium text-ink-600 hover:bg-cream-100 transition-colors"
          >
            <Shield className="w-4 h-4 mr-2" />
            Admin
          </Link>
        )}
        {showLanguageSelector && <LanguageSelector />}
      </div>
    </div>
  )
}
