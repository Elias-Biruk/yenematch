'use client'

import * as React from 'react'
import { usePathname } from 'next/navigation'
import { useTranslations } from 'next-intl'
import Link from 'next/link'
import { Heart, MessageSquare, User, Compass, Settings, Languages } from 'lucide-react'
import { cn } from '@/lib/utils'
import { LanguageSelector } from '@/components/language-selector'

interface NavItem {
  labelKey: string
  icon: React.ReactNode
  href: string
}

export function BottomNav() {
  const t = useTranslations('navigation')
  const pathname = usePathname()
  
  const navItems: NavItem[] = [
    { labelKey: 'discover', icon: <Compass className="h-5 w-5" />, href: '/discover' },
    { labelKey: 'likes', icon: <Heart className="h-5 w-5" />, href: '/likes' },
    { labelKey: 'matches', icon: <Heart className="h-5 w-5" />, href: '/matches' },
    { labelKey: 'messages', icon: <MessageSquare className="h-5 w-5" />, href: '/messages' },
    { labelKey: 'profile', icon: <User className="h-5 w-5" />, href: '/profile' },
    { labelKey: 'settings', icon: <Settings className="h-5 w-5" />, href: '/settings' },
  ]
  
  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-cream-400 z-50">
      <div className="flex items-center justify-around h-16 max-w-md mx-auto">
        {navItems.map((item) => {
          const isActive = pathname === item.href || (item.href === '/messages' && pathname.startsWith('/messages/'))
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex flex-col items-center justify-center space-y-1 px-3 py-2 rounded-lg transition-colors',
                isActive ? 'text-emerald-500' : 'text-ink-500 hover:text-ink-700'
              )}
            >
              {item.icon}
              <span className="text-xs font-medium">{t(item.labelKey)}</span>
            </Link>
          )
        })}
        <button
          onClick={() => {
            const selector = document.querySelector('[data-language-selector-trigger]') as HTMLButtonElement
            selector?.click()
          }}
          className="flex flex-col items-center justify-center space-y-1 px-3 py-2 rounded-lg transition-colors text-ink-500 hover:text-ink-700"
        >
          <Languages className="h-5 w-5" />
          <span className="text-xs font-medium">{t('language')}</span>
        </button>
      </div>
      <div className="hidden">
        <LanguageSelector />
      </div>
    </nav>
  )
}
