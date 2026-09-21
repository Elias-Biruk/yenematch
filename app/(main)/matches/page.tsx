'use client'

import { useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { Avatar } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { LoadingState } from '@/components/ui/loading'
import { ErrorState } from '@/components/ui/error'
import { EmptyState } from '@/components/ui/empty'
import { BottomNav } from '@/components/layout/bottom-nav'
import { ReportModal } from '@/components/report/report-modal'
import { MessageCircle, X, Flag } from 'lucide-react'

interface Match {
  id: string
  createdAt: string
  otherUser: {
    id: string
    firstName: string
    profile: {
      age: number
      city: string
      photos: Array<{ id: string; url: string; isPrimary: boolean }>
    }
  }
  latestMessage: {
    content: string
    createdAt: string
  } | null
  unreadCount: number
}

export default function MatchesPage() {
  const router = useRouter()
  const [matches, setMatches] = useState<Match[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [reportModalUser, setReportModalUser] = useState<{ userId: string; userName: string } | null>(null)

  const fetchMatches = useCallback(async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/matches')
      if (!response.ok) {
        if (response.status === 401) {
          router.push('/onboarding')
          return
        }
        throw new Error('Failed to fetch matches')
      }
      const data = await response.json()
      setMatches(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setLoading(false)
    }
  }, [router])

  useEffect(() => {
    fetchMatches()
  }, [fetchMatches])

  const handleMessage = (matchId: string, _userId: string) => {
    router.push(`/messages/${matchId}`)
  }

  const handleUnmatch = async (matchId: string) => {
    if (!confirm('Are you sure you want to unmatch?')) {
      return
    }

    try {
      const response = await fetch(`/api/matches/${matchId}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        throw new Error('Failed to unmatch')
      }

      setMatches(matches.filter(m => m.id !== matchId))
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <LoadingState message="Loading matches..." />
      </div>
    )
  }

  if (error && matches.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <ErrorState
          message={error}
          onRetry={fetchMatches}
        />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-cream-300 pb-20">
      <div className="max-w-md mx-auto">
        {/* Header */}
        <div className="bg-white p-4 border-b border-cream-400">
          <h1 className="text-xl font-semibold text-ink-900">Matches</h1>
        </div>

        {/* Matches List */}
        <div className="p-4 space-y-3">
          {matches.length === 0 ? (
            <EmptyState
              icon="💕"
              title="No matches yet"
              description="Start discovering people to find your matches"
              action={
                <Button onClick={() => router.push('/discover')}>
                  Start Discovering
                </Button>
              }
            />
          ) : (
            matches.map((match) => {
              const primaryPhoto = match.otherUser.profile.photos.find(p => p.isPrimary) || match.otherUser.profile.photos[0]

              return (
                <Card key={match.id}>
                  <CardContent className="p-4">
                    <div className="flex items-center space-x-4">
                      {primaryPhoto ? (
                        <Avatar
                          src={primaryPhoto.url}
                          alt={match.otherUser.firstName}
                          fallback={match.otherUser.firstName[0]}
                          className="h-16 w-16"
                        />
                      ) : (
                        <Avatar
                          fallback={match.otherUser.firstName[0]}
                          className="h-16 w-16"
                        />
                      )}

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <h3 className="font-semibold text-ink-900">
                            {match.otherUser.firstName}, {match.otherUser.profile.age}
                          </h3>
                          {match.unreadCount > 0 && (
                            <div className="bg-burgundy-600 text-white text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center">
                              {match.unreadCount}
                            </div>
                          )}
                        </div>
                        <p className="text-sm text-ink-700">{match.otherUser.profile.city}</p>
                        {match.latestMessage ? (
                          <p className="text-sm text-ink-500 mt-1 truncate">
                            {match.latestMessage.content}
                          </p>
                        ) : (
                          <p className="text-xs text-ink-500 mt-1">
                            Matched {new Date(match.createdAt).toLocaleDateString()}
                          </p>
                        )}
                      </div>

                      <div className="flex space-x-2">
                        <Button
                          size="sm"
                          onClick={() => handleMessage(match.id, match.otherUser.id)}
                        >
                          <MessageCircle className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setReportModalUser({ userId: match.otherUser.id, userName: match.otherUser.firstName })}
                        >
                          <Flag className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleUnmatch(match.id)}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )
            })
          )}
        </div>
      </div>
      <BottomNav />
      
      {reportModalUser && (
        <ReportModal
          isOpen={!!reportModalUser}
          onClose={() => setReportModalUser(null)}
          reportedUserId={reportModalUser.userId}
          reportedUserName={reportModalUser.userName}
          onSuccess={() => {
            setReportModalUser(null)
            fetchMatches()
          }}
        />
      )}
    </div>
  )
}
