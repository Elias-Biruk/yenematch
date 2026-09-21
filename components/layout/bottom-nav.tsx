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
    { labelKey: 'discover', icon: <Compass className="h-6 w-6" />, href: '/discover' },
    { labelKey: 'likes', icon: <Heart className="h-6 w-6" />, href: '/likes' },
    { labelKey: 'matches', icon: <Heart className="h-6 w-6" />, href: '/matches' },
    { labelKey: 'messages', icon: <MessageSquare className="h-6 w-6" />, href: '/messages' },
    { labelKey: 'profile', icon: <User className="h-6 w-6" />, href: '/profile' },
  ]
  
  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur-md border-t border-cream-400 z-50 safe-bottom">
      <div className="flex items-center justify-around h-20 max-w-md mx-auto px-2">
        {navItems.map((item) => {
          const isActive = pathname === item.href || (item.href === '/messages' && pathname.startsWith('/messages/'))
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex flex-col items-center justify-center space-y-1 px-4 py-2 rounded-2xl transition-all duration-200 min-w-[64px] active:scale-95',
                isActive 
                  ? 'text-emerald-500 bg-emerald-50' 
                  : 'text-ink-500 hover:text-ink-700 hover:bg-cream-100'
              )}
              aria-label={t(item.labelKey)}
              aria-current={isActive ? 'page' : undefined}
            >
              {item.icon}
              <span className="text-xs font-medium">{t(item.labelKey)}</span>
            </Link>
          )
        })}
        <div className="flex flex-col items-center justify-center space-y-1 px-4 py-2 rounded-2xl min-w-[64px]">
          <button
            onClick={() => {
              const selector = document.querySelector('[data-language-selector-trigger]') as HTMLButtonElement
              selector?.click()
            }}
            className={cn(
              'flex flex-col items-center justify-center space-y-1 transition-all duration-200 active:scale-95',
              'text-ink-500 hover:text-ink-700 hover:bg-cream-100'
            )}
            aria-label={t('language')}
          >
            <Languages className="h-6 w-6" />
            <span className="text-xs font-medium">{t('language')}</span>
          </button>
        </div>
      </div>
      <div className="hidden">
        <LanguageSelector />
      </div>
    </nav>
  )
}
