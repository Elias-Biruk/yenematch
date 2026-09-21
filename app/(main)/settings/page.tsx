'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useTranslations } from 'next-intl'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { LoadingState } from '@/components/ui/loading'
import { ErrorState } from '@/components/ui/error'
import { BottomNav } from '@/components/layout/bottom-nav'
import { Header } from '@/components/layout/header'
import { LogOut, Shield, Trash2, User, Lock } from 'lucide-react'

interface BlockedUser {
  id: string
  firstName: string
  lastName: string
}

export default function SettingsPage() {
  const t = useTranslations('settings')
  const tCommon = useTranslations('common')
  const router = useRouter()
  const [blockedUsers, setBlockedUsers] = useState<BlockedUser[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isAdmin, setIsAdmin] = useState(false)

  useEffect(() => {
    fetchBlockedUsers()
    fetchUserRole()
  }, [])

  const fetchBlockedUsers = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/blocks')
      if (!response.ok) {
        if (response.status === 401) {
          router.push('/login')
          return
        }
        throw new Error(t('failedToFetchBlockedUsers'))
      }
      const data = await response.json()
      // Transform the data to match the expected format
      const transformed = data.map((block: any) => ({
        id: block.blockedId,
        firstName: block.blocked.firstName,
        lastName: block.blocked.lastName || '',
      }))
      setBlockedUsers(transformed)
    } catch (err) {
      setError(err instanceof Error ? err.message : tCommon('somethingWentWrong'))
    } finally {
      setLoading(false)
    }
  }

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

  const handleUnblock = async (userId: string) => {
    if (!confirm(t('confirmUnblock'))) {
      return
    }

    try {
      const response = await fetch(`/api/blocks?targetUserId=${userId}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        throw new Error(t('failedToUnblock'))
      }

      setBlockedUsers(blockedUsers.filter(u => u.id !== userId))
    } catch (err) {
      setError(err instanceof Error ? err.message : tCommon('somethingWentWrong'))
    }
  }

  const handleLogout = async () => {
    if (!confirm(t('logoutConfirm'))) {
      return
    }

    try {
      const response = await fetch('/api/auth/logout', {
        method: 'POST',
      })

      if (!response.ok) {
        throw new Error(t('logoutFailed'))
      }

      router.push('/login')
    } catch (err) {
      setError(err instanceof Error ? err.message : tCommon('somethingWentWrong'))
    }
  }

  const handleDeleteAccount = async () => {
    if (!confirm(t('deleteAccountConfirm'))) {
      return
    }

    try {
      const response = await fetch('/api/settings/account', {
        method: 'DELETE',
      })

      if (!response.ok) {
        throw new Error(t('deleteAccountFailed'))
      }

      router.push('/login')
    } catch (err) {
      setError(err instanceof Error ? err.message : tCommon('somethingWentWrong'))
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-cream-300 flex flex-col items-center justify-center p-4 safe-top safe-bottom">
        <LoadingState message={t('loadingSettings')} />
      </div>
    )
  }

  if (error && blockedUsers.length === 0) {
    return (
      <div className="min-h-screen bg-cream-300 flex flex-col items-center justify-center p-4 safe-top safe-bottom">
        <ErrorState
          message={error}
          onRetry={fetchBlockedUsers}
        />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-cream-300 pb-20">
      <div className="max-w-md mx-auto">
        <Header title={t('settings')} showLanguageSelector={true} />

        <div className="p-4 space-y-4">
          {/* Account Settings */}
          <Card className="shadow-premium">
            <CardHeader>
              <CardTitle className="text-h2 flex items-center">
                <User className="w-5 h-5 mr-2 text-emerald-500" />
                {t('account')}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Button
                variant="outline"
                className="w-full h-12 text-base"
                onClick={() => router.push('/profile/edit')}
              >
                {t('editProfile')}
              </Button>
              <Button
                variant="outline"
                className="w-full h-12 text-base"
                onClick={() => router.push('/profile/preferences')}
              >
                {t('editPreferences')}
              </Button>
            </CardContent>
          </Card>

          {/* Privacy Settings */}
          <Card className="shadow-premium">
            <CardHeader>
              <CardTitle className="text-h2 flex items-center">
                <Lock className="w-5 h-5 mr-2 text-gold-500" />
                {t('privacy')}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <h3 className="text-body font-medium text-ink-900 mb-2">{t('blockedUsers')}</h3>
                {blockedUsers.length === 0 ? (
                  <p className="text-body-sm text-ink-500">{t('noBlockedUsers')}</p>
                ) : (
                  <div className="space-y-2">
                    {blockedUsers.map((user) => (
                      <div key={user.id} className="flex items-center justify-between p-3 bg-cream-100 rounded-xl">
                        <span className="text-body text-ink-900">
                          {user.firstName} {user.lastName}
                        </span>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleUnblock(user.id)}
                          className="text-emerald-600 hover:text-emerald-700"
                        >
                          {t('unblock')}
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Admin Panel */}
          {isAdmin && (
            <Card className="shadow-premium">
              <CardHeader>
                <CardTitle className="text-h2 flex items-center">
                  <Shield className="w-5 h-5 mr-2 text-burgundy-500" />
                  {t('adminPanel')}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Button
                  variant="outline"
                  className="w-full h-12 text-base"
                  onClick={() => router.push('/admin/dashboard')}
                >
                  {t('goToAdminPanel')}
                </Button>
              </CardContent>
            </Card>
          )}

          {/* Danger Zone */}
          <Card className="shadow-premium border-2 border-burgundy-200">
            <CardHeader>
              <CardTitle className="text-h2 text-burgundy-600 flex items-center">
                <Trash2 className="w-5 h-5 mr-2" />
                {t('dangerZone')}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Button
                variant="outline"
                className="w-full h-12 text-base border-burgundy-300 text-burgundy-600 hover:bg-burgundy-50"
                onClick={handleLogout}
              >
                <LogOut className="w-5 h-5 mr-2" />
                {t('logout')}
              </Button>
              <Button
                variant="destructive"
                className="w-full h-12 text-base"
                onClick={handleDeleteAccount}
              >
                <Trash2 className="w-5 h-5 mr-2" />
                {t('deleteAccount')}
              </Button>
            </CardContent>
          </Card>

          {/* App Info */}
          <div className="text-center text-caption text-ink-500 pt-4">
            <p>YeneMatch v1.0.0</p>
          </div>
        </div>
      </div>
      <BottomNav />
    </div>
  )
}
