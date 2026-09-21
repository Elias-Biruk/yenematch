'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useTranslations } from 'next-intl'
import { Avatar } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { LoadingState } from '@/components/ui/loading'
import { ErrorState } from '@/components/ui/error'
import { EmptyState } from '@/components/ui/empty'
import { BottomNav } from '@/components/layout/bottom-nav'
import { MessageCircle, Flag, X, Heart } from 'lucide-react'

interface Match {
  id: string
  user1Id: string
  user2Id: string
  otherUser: {
    id: string
    firstName: string
    profile: {
      age: number
      city: string
      photos: Array<{ id: string; url: string; isPrimary: boolean }>
    }
  }
  createdAt: string
  lastMessage?: {
    content: string
    createdAt: string
  }
}

export default function MatchesPage() {
  const t = useTranslations('matches')
  const tCommon = useTranslations('common')
  const router = useRouter()
  const [matches, setMatches] = useState<Match[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchMatches = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/messages')
      if (!response.ok) {
        if (response.status === 401) {
          router.push('/login')
          return
        }
        throw new Error(t('failedToFetchMatches'))
      }
      const data = await response.json()
      setMatches(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : tCommon('somethingWentWrong'))
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchMatches()
  }, [])

  const handleUnmatch = async (matchId: string) => {
    if (!confirm(t('confirmUnmatch'))) {
      return
    }

    try {
      const response = await fetch(`/api/matches/${matchId}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        throw new Error(t('failedToUnmatch'))
      }

      setMatches(matches.filter(m => m.id !== matchId))
    } catch (err) {
      setError(err instanceof Error ? err.message : tCommon('somethingWentWrong'))
    }
  }

  const formatMessageTime = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffMins = Math.floor(diffMs / 60000)
    const diffHours = Math.floor(diffMs / 3600000)
    const diffDays = Math.floor(diffMs / 86400000)

    if (diffMins < 1) return 'now'
    if (diffMins < 60) return `${diffMins}m`
    if (diffHours < 24) return `${diffHours}h`
    if (diffDays < 7) return `${diffDays}d`
    return date.toLocaleDateString()
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-cream-300 flex flex-col items-center justify-center p-4 safe-top safe-bottom">
        <LoadingState message={t('loadingMatches')} />
      </div>
    )
  }

  if (error && matches.length === 0) {
    return (
      <div className="min-h-screen bg-cream-300 flex flex-col items-center justify-center p-4 safe-top safe-bottom">
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
        <div className="bg-white px-4 py-4 border-b border-cream-400 safe-top">
          <h1 className="text-h2 text-ink-900">{t('yourMatches')}</h1>
        </div>

        {/* Matches List */}
        <div className="p-4 space-y-3">
          {matches.length === 0 ? (
            <EmptyState
              icon={<Heart className="w-16 h-16 text-ink-400 mx-auto" />}
              title={t('noMatches')}
              description={t('startLiking')}
              action={
                <Button onClick={() => router.push('/discover')}>
                  {t('startDiscovering')}
                </Button>
              }
            />
          ) : (
            matches.map((match) => {
              const primaryPhoto = match.otherUser.profile.photos.find(p => p.isPrimary) || match.otherUser.profile.photos[0]

              return (
                <Card key={match.id} className="hover:shadow-md transition-all duration-200 active:scale-[0.98]">
                  <CardContent className="p-4">
                    <div className="flex items-center space-x-4">
                      <div className="relative">
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
                        <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-emerald-500 rounded-full border-2 border-white flex items-center justify-center">
                          <Heart className="w-3 h-3 text-white fill-white" />
                        </div>
                      </div>

                      <div className="flex-1 min-w-0">
                        <h3 className="text-h3 text-ink-900">
                          {match.otherUser.firstName}, {match.otherUser.profile.age}
                        </h3>
                        <p className="text-body-sm text-ink-600">{match.otherUser.profile.city}</p>
                        {match.lastMessage && (
                          <p className="text-caption text-ink-500 mt-1 truncate">
                            {match.lastMessage.content}
                          </p>
                        )}
                      </div>

                      <div className="flex space-x-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => router.push(`/messages/${match.id}`)}
                          className="rounded-full"
                        >
                          <MessageCircle className="h-5 w-5" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleUnmatch(match.id)}
                          className="rounded-full text-ink-400 hover:text-burgundy-600"
                        >
                          <X className="h-5 w-5" />
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
    </div>
  )
}
