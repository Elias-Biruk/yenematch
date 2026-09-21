'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useTranslations } from 'next-intl'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ErrorState } from '@/components/ui/error'
import { BottomNav } from '@/components/layout/bottom-nav'
import { Header } from '@/components/layout/header'
import { LanguageSelector } from '@/components/language-selector'
import { LogOut, User, Shield, Users, Trash2, ArrowRight } from 'lucide-react'

interface BlockedUser {
  id: string
  blocked: {
    id: string
    firstName: string
    profile: {
      age: number
      city: string
      photos: Array<{ url: string; isPrimary: boolean }>
    }
  }
  createdAt: string
}

export default function SettingsPage() {
  const t = useTranslations('settings')
  const tCommon = useTranslations('common')
  const tAccount = useTranslations('account')
  const tApp = useTranslations('app')
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [blockedUsers, setBlockedUsers] = useState<BlockedUser[]>([])
  const [isAdmin, setIsAdmin] = useState(false)

  useEffect(() => {
    fetchBlockedUsers()
    fetchUserRole()
  }, [])

  const fetchUserRole = async () => {
    try {
      const response = await fetch('/api/user/role')
      if (response.ok) {
        const data = await response.json()
        setIsAdmin(data.isAdmin)
      }
    } catch (err) {
      console.error('Failed to fetch user role:', err)
    }
  }

  const fetchBlockedUsers = async () => {
    try {
      const response = await fetch('/api/blocks')
      if (!response.ok) {
        throw new Error('Failed to fetch blocked users')
      }
      const data = await response.json()
      setBlockedUsers(data)
    } catch (err) {
      console.error('Failed to fetch blocked users:', err)
    }
  }

  const handleLogout = async () => {
    if (!confirm(t('logout') + '?')) {
      return
    }

    try {
      setLoading(true)
      const response = await fetch('/api/auth/logout', {
        method: 'POST',
      })

      if (!response.ok) {
        throw new Error(t('logout'))
      }

      router.push('/login')
    } catch (err) {
      setError(err instanceof Error ? err.message : tCommon('somethingWentWrong'))
    } finally {
      setLoading(false)
    }
  }

  const handleDeleteAccount = async () => {
    const confirmation = prompt('To delete your account, type DELETE:')
    if (confirmation !== 'DELETE') {
      setError('Account deletion cancelled')
      return
    }

    if (!confirm('Are you sure you want to delete your account? This action cannot be undone.')) {
      return
    }

    try {
      setLoading(true)
      const response = await fetch('/api/account', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ confirmation: 'DELETE' }),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Failed to delete account')
      }

      // Account deleted, redirect to login
      router.push('/login')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-cream-300 pb-20">
      <div className="max-w-md mx-auto">
        {/* Header */}
        <Header title={tCommon('settings')} showLanguageSelector={true} />

        {/* Settings Options */}
        <div className="p-4 space-y-3">
          {error && (
            <ErrorState
              message={error}
              onRetry={() => setError(null)}
            />
          )}

          {/* Account Section */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">{t('accountSettings')}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <Button
                variant="ghost"
                className="w-full justify-start"
                onClick={() => router.push('/profile/edit')}
              >
                <User className="h-5 w-5 mr-3" />
                {t('editProfile')}
                <ArrowRight className="h-5 w-5 ml-auto" />
              </Button>
              <Button
                variant="ghost"
                className="w-full justify-start"
                onClick={() => router.push('/profile/preferences')}
              >
                <Shield className="h-5 w-5 mr-3" />
                {t('editPreferences')}
                <ArrowRight className="h-5 w-5 ml-auto" />
              </Button>
              {isAdmin && (
                <Button
                  variant="ghost"
                  className="w-full justify-start"
                  onClick={() => router.push('/admin/dashboard')}
                >
                  <Users className="h-5 w-5 mr-3" />
                  Admin Panel
                  <ArrowRight className="h-5 w-5 ml-auto" />
                </Button>
              )}
              <Button
                variant="ghost"
                className="w-full justify-start text-red-500 hover:text-red-600"
                onClick={handleLogout}
                disabled={loading}
              >
                <LogOut className="h-5 w-5 mr-3" />
                {loading ? tCommon('loading') : t('logout')}
              </Button>
            </CardContent>
          </Card>

          {/* Privacy & Safety Section */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">{t('privacy')} & {t('notifications')}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Button
                variant="ghost"
                className="w-full justify-start"
                onClick={() => router.push('/settings/blocked')}
              >
                <Users className="h-5 w-5 mr-3" />
                {t('blockedUsers')}
                <span className="ml-auto text-xs text-ink-500">{blockedUsers.length}</span>
                <ArrowRight className="h-5 w-5 ml-2" />
              </Button>
            </CardContent>
          </Card>

          {/* Account Deletion Section */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg text-red-600">Danger Zone</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <Button
                variant="ghost"
                className="w-full justify-start text-red-500 hover:text-red-600 hover:bg-red-50"
                onClick={handleDeleteAccount}
                disabled={loading}
              >
                <Trash2 className="h-5 w-5 mr-3" />
                {loading ? tCommon('deleting') : t('deleteAccount')}
              </Button>
              <p className="text-xs text-ink-500 mt-2">
                {tAccount('deleteAccountWarning')}
              </p>
            </CardContent>
          </Card>

          {/* App Info */}
          <div className="text-center text-sm text-ink-500 pt-4">
            <p>{tApp('name')} v1.0.0</p>
            <p className="mt-1">{tApp('tagline')}</p>
          </div>
        </div>
      </div>
      <BottomNav />
    </div>
  )
}
