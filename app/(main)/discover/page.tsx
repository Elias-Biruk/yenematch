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
import { Header } from '@/components/layout/header'
import { Compass, RefreshCw } from 'lucide-react'
import { Button } from '@/components/ui/button'

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
    if (currentIndex < profiles.length - 1) {
      setCurrentIndex(prev => prev + 1)
      return
    }
    
    await fetchProfiles()
  }

  const handleViewProfile = (userId: string) => {
    router.push(`/profiles/${userId}`)
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
      <div className="min-h-screen bg-cream-300 flex flex-col items-center justify-center p-4 safe-top safe-bottom">
        <div className="text-center space-y-4 animate-fade-in">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-emerald-100">
            <svg className="animate-spin h-8 w-8 text-emerald-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
          </div>
          <p className="text-body text-ink-600">{t('findingProfiles')}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-cream-300 pb-20">
      <div className="max-w-md mx-auto px-4 sm:px-6">
        <Header title={t('discover')} showLanguageSelector={true} />

        {loading && (
          <div className="flex items-center justify-center py-12">
            <LoadingState message={t('loadingProfiles')} />
          </div>
        )}

        {error && (
          <div className="py-12">
            <ErrorState
              message={error}
              onRetry={fetchProfiles}
            />
          </div>
        )}

        {!loading && !error && profiles.length === 0 && (
          <div className="py-12">
            <EmptyState
              icon={<Compass className="w-16 h-16 text-ink-400 mx-auto" />}
              title={t('noProfiles')}
              description={t('noProfilesDesc')}
              action={
                <Button onClick={fetchProfiles}>
                  <RefreshCw className="w-5 h-5 mr-2" />
                  {t('refresh')}
                </Button>
              }
            />
          </div>
        )}

        {!loading && !error && profiles.length > 0 && (
          <div className="py-4 sm:py-6">
            <ProfileCard
              profile={profiles[currentIndex]}
              onLike={handleLike}
              onPass={handlePass}
              onViewProfile={handleViewProfile}
              onReport={(userId, userName) => {
                setReportModalUser({ userId, userName })
              }}
              loading={actionLoading}
            />
          </div>
        )}
      </div>
      <BottomNav />
      
      {match && currentProfile && (
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
            fetchProfiles()
          }}
        />
      )}
    </div>
  )
}
