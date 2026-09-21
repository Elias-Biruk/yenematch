'use client'

import { ReactNode } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { LayoutDashboard, Users, AlertTriangle, Shield, Heart } from 'lucide-react'

export default function AdminLayoutClient({ children }: { children: ReactNode }) {
  const pathname = usePathname()

  const navItems = [
    { href: '/admin/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { href: '/admin/users', label: 'Users', icon: Users },
    { href: '/admin/reports', label: 'Reports', icon: AlertTriangle },
    { href: '/admin/matches', label: 'Matches', icon: Heart },
    { href: '/admin/audit', label: 'Audit Log', icon: Shield },
  ]

  return (
    <div className="min-h-screen bg-cream-100">
      <header className="bg-white border-b border-cream-400 sticky top-0 z-10 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold text-emerald-500">YeneMatch Admin</h1>
              <p className="text-sm text-ink-600">Administration Panel</p>
            </div>
            <nav className="flex flex-wrap gap-1 sm:gap-2">
              {navItems.map((item) => {
                const Icon = item.icon
                const isActive = pathname === item.href
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`flex items-center px-3 sm:px-4 py-2 sm:py-2.5 rounded-xl text-sm font-medium transition-all duration-200 ${
                      isActive
                        ? 'bg-emerald-500 text-white shadow-sm'
                        : 'text-ink-600 hover:text-ink-900 hover:bg-cream-200'
                    }`}
                  >
                    <Icon className="w-4 h-4 mr-2" />
                    <span className="hidden sm:inline">{item.label}</span>
                    <span className="sm:hidden">{item.label}</span>
                  </Link>
                )
              })}
            </nav>
          </div>
        </div>
      </header>
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        {children}
      </main>
    </div>
  )
}
