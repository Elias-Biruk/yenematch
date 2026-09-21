'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { LoadingState } from '@/components/ui/loading'
import { ErrorState } from '@/components/ui/error'
import { EmptyState } from '@/components/ui/empty'
import { BottomNav } from '@/components/layout/bottom-nav'
import { Avatar } from '@/components/ui/avatar'
import { ArrowLeft, UserMinus } from 'lucide-react'

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

export default function BlockedUsersPage() {
  const router = useRouter()
  const [blockedUsers, setBlockedUsers] = useState<BlockedUser[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchBlockedUsers()
  }, [])

  const fetchBlockedUsers = async () => {
    try {
      const response = await fetch('/api/blocks')
      if (!response.ok) {
        throw new Error('Failed to fetch blocked users')
      }
      const data = await response.json()
      setBlockedUsers(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setLoading(false)
    }
  }

  const handleUnblock = async (targetUserId: string) => {
    if (!confirm('Are you sure you want to unblock this user?')) {
      return
    }

    try {
      const response = await fetch(`/api/blocks?targetUserId=${targetUserId}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        throw new Error('Failed to unblock user')
      }

      setBlockedUsers(blockedUsers.filter((b) => b.blocked.id !== targetUserId))
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <LoadingState message="Loading blocked users..." />
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
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
        {/* Header */}
        <div className="bg-white p-4 border-b border-cream-400 flex items-center">
          <Button variant="ghost" size="sm" onClick={() => router.push('/settings')}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-xl font-semibold text-ink-900 ml-2">Blocked Users</h1>
        </div>

        {/* Blocked Users List */}
        <div className="p-4 space-y-3">
          {blockedUsers.length === 0 ? (
            <EmptyState
              icon="🛡️"
              title="No blocked users"
              description="You haven't blocked anyone yet"
            />
          ) : (
            blockedUsers.map((blockedUser) => {
              const primaryPhoto = blockedUser.blocked.profile.photos.find(p => p.isPrimary) || blockedUser.blocked.profile.photos[0]

              return (
                <Card key={blockedUser.id}>
                  <CardContent className="p-4">
                    <div className="flex items-center space-x-4">
                      {primaryPhoto ? (
                        <Avatar
                          src={primaryPhoto.url}
                          alt={blockedUser.blocked.firstName}
                          fallback={blockedUser.blocked.firstName[0]}
                          className="h-12 w-12"
                        />
                      ) : (
                        <Avatar
                          fallback={blockedUser.blocked.firstName[0]}
                          className="h-12 w-12"
                        />
                      )}
                      <div className="flex-1">
                        <h3 className="font-semibold text-ink-900">
                          {blockedUser.blocked.firstName}, {blockedUser.blocked.profile.age}
                        </h3>
                        <p className="text-sm text-ink-700">{blockedUser.blocked.profile.city}</p>
                        <p className="text-xs text-ink-500 mt-1">
                          Blocked {new Date(blockedUser.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleUnblock(blockedUser.blocked.id)}
                        className="text-emerald-600 hover:text-emerald-700"
                      >
                        <UserMinus className="h-4 w-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              )
            })
          )}
        </div>
      </div>
      <BottomNav />
    </div>
  )
}
