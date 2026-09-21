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
}

export function Header({ title, showLogo = true, showLanguageSelector = false, isAdmin = false, className }: HeaderProps) {
  return (
    <div className={cn('flex items-center justify-between p-4 bg-white border-b border-cream-400', className)}>
      <div className="flex items-center">
        {showLogo && <Logo size="sm" className="mr-3" />}
        {title && <h1 className="text-xl font-semibold text-ink-900">{title}</h1>}
      </div>
      <div className="flex items-center space-x-4">
        {isAdmin && (
          <Link
            href="/admin/dashboard"
            className="flex items-center text-sm font-medium text-gray-600 hover:text-gray-900"
          >
            <Shield className="w-4 h-4 mr-1" />
            Admin
          </Link>
        )}
        {showLanguageSelector && <LanguageSelector />}
      </div>
    </div>
  )
}
