'use client'

import { useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { useTranslations } from 'next-intl'
import { ProfileCard } from '@/components/discovery/profile-card'
import { MatchModal } from '@/components/discovery/match-modal'
import { ReportModal } from '@/components/report/report-modal'
import { LoadingState } from '@/components/ui/loading'
import { ErrorState } from '@/components/ui/error'
import { EmptyState } from '@/components/ui/empty'
import { BottomNav } from '@/components/layout/bottom-nav'

interface DiscoveryProfile {
  id: string
  userId: string
  age: number
  gender: string
  city: string
  bio: string | null
  photos: Array<{ id: string; url: string; isPrimary: boolean; order: number }>
  interests: Array<{ id: string; name: string }>
  user: {
    id: string
    firstName: string
  }
}

interface MatchData {
  id: string
  users: {
    liker: {
      id: string
      firstName: string
      profile?: {
        photos: Array<{ url: string; isPrimary: boolean }>
      }
    }
    liked: {
      id: string
      firstName: string
      profile?: {
        photos: Array<{ url: string; isPrimary: boolean }>
      }
    }
  }
}

export default function DiscoverPage() {
  const t = useTranslations('discovery')
  const tCommon = useTranslations('common')
  const router = useRouter()
  const [profiles, setProfiles] = useState<DiscoveryProfile[]>([])
  const [currentIndex, setCurrentIndex] = useState(0)
  const [loading, setLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [match, setMatch] = useState<MatchData | null>(null)
  const [reportModalUser, setReportModalUser] = useState<{ userId: string; userName: string } | null>(null)

  const currentProfile = profiles[currentIndex] || null

  const fetchProfiles = useCallback(async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/discovery?limit=10')
      if (!response.ok) {
        if (response.status === 401) {
          router.push('/login')
          return
        }
        if (response.status === 400) {
          const data = await response.json()
          if (data.error === 'Please complete onboarding first') {
            router.push('/onboarding')
            return
          }
        }
        throw new Error(t('failedToFetchProfiles'))
      }
      const data = await response.json()
      setProfiles(data.profiles || [])
      setCurrentIndex(0)
    } catch (err) {
      setError(err instanceof Error ? err.message : tCommon('somethingWentWrong'))
    } finally {
      setLoading(false)
    }
  }, [router, t, tCommon])

  useEffect(() => {
    fetchProfiles()
  }, [fetchProfiles])

  const fetchNextProfile = async () => {
    // If we have more profiles in the queue, move to the next one
    if (currentIndex < profiles.length - 1) {
      setCurrentIndex(prev => prev + 1)
      return
    }
    
    // Otherwise, fetch more profiles
    await fetchProfiles()
  }

  const handleLike = async (userId: string) => {
    setActionLoading(true)
    try {
      const response = await fetch('/api/likes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ likedId: userId }),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || t('failedToLikeProfile'))
      }

      const result = await response.json()
      
      if (result.isMatch) {
        setMatch(result)
      } else {
        // Simply fetch next profile - simpler approach
        await fetchProfiles()
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : tCommon('somethingWentWrong'))
    } finally {
      setActionLoading(false)
    }
  }

  const handlePass = async (userId: string) => {
    setActionLoading(true)
    try {
      const response = await fetch('/api/passes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ passedId: userId }),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || t('failedToPassProfile'))
      }

      // Simply fetch next profile - simpler approach
      await fetchProfiles()
    } catch (err) {
      setError(err instanceof Error ? err.message : tCommon('somethingWentWrong'))
    } finally {
      setActionLoading(false)
    }
  }

  const handleSendMessage = (matchId: string) => {
    setMatch(null)
    router.push(`/messages/${matchId}`)
  }

  const handleKeepDiscovering = () => {
    setMatch(null)
    fetchNextProfile()
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <LoadingState message={t('findingProfiles')} />
      </div>
    )
  }

  if (error && profiles.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <ErrorState
          message={error}
          onRetry={fetchProfiles}
        />
      </div>
    )
  }

  if (!currentProfile) {
    return (
      <div className="min-h-screen bg-cream-300 pb-20">
        <div className="max-w-md mx-auto p-4">
          <EmptyState
            icon="🔍"
            title={t('noProfiles')}
            description={t('checkBackLater')}
            action={
              <button
                onClick={() => router.push('/profile/edit')}
                className="mt-4 text-emerald-600 font-medium"
              >
                {t('adjustPreferences')}
              </button>
            }
          />
        </div>
        <BottomNav />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-cream-300 pb-20">
      <div className="max-w-md mx-auto p-4">
        <ProfileCard
          profile={currentProfile}
          onLike={handleLike}
          onPass={handlePass}
          onReport={(userId, userName) => {
            setReportModalUser({ userId, userName })
          }}
          loading={actionLoading}
        />
      </div>
      <BottomNav />
      
      {match && (
        <MatchModal
          match={match}
          currentUserId={currentProfile.userId}
          onSendMessage={handleSendMessage}
          onKeepDiscovering={handleKeepDiscovering}
        />
      )}
      
      {reportModalUser && (
        <ReportModal
          isOpen={!!reportModalUser}
          onClose={() => setReportModalUser(null)}
          reportedUserId={reportModalUser.userId}
          reportedUserName={reportModalUser.userName}
          onSuccess={() => {
            setReportModalUser(null)
            // Optionally refresh profiles
            fetchProfiles()
          }}
        />
      )}
    </div>
  )
}
