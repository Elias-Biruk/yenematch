'use client'

import * as React from 'react'
import { usePathname } from 'next/navigation'
import Link from 'next/link'
import { Heart, MessageSquare, User, Compass, Settings } from 'lucide-react'
import { cn } from '@/lib/utils'

interface NavItem {
  label: string
  icon: React.ReactNode
  href: string
}

const navItems: NavItem[] = [
  { label: 'Discover', icon: <Compass className="h-5 w-5" />, href: '/discover' },
  { label: 'Likes', icon: <Heart className="h-5 w-5" />, href: '/likes' },
  { label: 'Matches', icon: <Heart className="h-5 w-5" />, href: '/matches' },
  { label: 'Messages', icon: <MessageSquare className="h-5 w-5" />, href: '/messages' },
  { label: 'Profile', icon: <User className="h-5 w-5" />, href: '/profile' },
  { label: 'Settings', icon: <Settings className="h-5 w-5" />, href: '/settings' },
]

export function BottomNav() {
  const pathname = usePathname()
  
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
              <span className="text-xs font-medium">{item.label}</span>
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
