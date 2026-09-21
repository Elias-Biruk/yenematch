'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useTranslations } from 'next-intl'
import { Avatar } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { LoadingState } from '@/components/ui/loading'
import { ErrorState } from '@/components/ui/error'
import { BottomNav } from '@/components/layout/bottom-nav'
import { Header } from '@/components/layout/header'
import { ArrowLeft, Heart, X, MapPin, Sparkles } from 'lucide-react'

interface PublicProfile {
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
  preferences: {
    preferredGender: string | null
    minAge: number
    maxAge: number
    preferredCity: string | null
    openToLongDistance: boolean
  } | null
}

export default function PublicProfilePage({ params }: { params: Promise<{ userId: string }> }) {
  const t = useTranslations('profile')
  const tCommon = useTranslations('common')
  const router = useRouter()
  const [profile, setProfile] = useState<PublicProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [actionLoading, setActionLoading] = useState(false)
  const [userId, setUserId] = useState<string>('')

  useEffect(() => {
    params.then(p => {
      setUserId(p.userId)
      fetchProfile(p.userId)
    })
  }, [params])

  const fetchProfile = async (targetUserId: string) => {
    try {
      setLoading(true)
      const response = await fetch(`/api/profiles/${targetUserId}`)
      if (!response.ok) {
        if (response.status === 401) {
          router.push('/login')
          return
        }
        throw new Error(t('failedToFetchProfile'))
      }
      const data = await response.json()
      setProfile(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : tCommon('somethingWentWrong'))
    } finally {
      setLoading(false)
    }
  }

  const handleLike = async () => {
    if (!profile) return
    setActionLoading(true)
    try {
      const response = await fetch('/api/likes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ likedId: profile.userId }),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || t('failedToLikeProfile'))
      }

      const result = await response.json()
      
      if (result.isMatch) {
        router.push(`/messages/${result.match.id}`)
      } else {
        router.push('/discover')
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : tCommon('somethingWentWrong'))
    } finally {
      setActionLoading(false)
    }
  }

  const handlePass = async () => {
    if (!profile) return
    setActionLoading(true)
    try {
      const response = await fetch('/api/passes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ passedId: profile.userId }),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || t('failedToPassProfile'))
      }

      router.push('/discover')
    } catch (err) {
      setError(err instanceof Error ? err.message : tCommon('somethingWentWrong'))
    } finally {
      setActionLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-cream-300 flex flex-col items-center justify-center p-4 safe-top safe-bottom">
        <LoadingState message={t('loadingProfile')} />
      </div>
    )
  }

  if (error && !profile) {
    return (
      <div className="min-h-screen bg-cream-300 flex flex-col items-center justify-center p-4 safe-top safe-bottom">
        <ErrorState
          message={error}
          onRetry={() => userId && fetchProfile(userId)}
        />
      </div>
    )
  }

  if (!profile) return null

  const primaryPhoto = profile.photos.find(p => p.isPrimary) || profile.photos[0]
  const sortedPhotos = profile.photos.sort((a, b) => a.order - b.order)

  return (
    <div className="min-h-screen bg-cream-300 pb-20">
      <div className="max-w-md mx-auto">
        <Header 
          showBack 
          onBack={() => router.back()}
          title={`${profile.user.firstName}, ${profile.age}`}
        />

        {/* Photo Section */}
        <div className="relative aspect-[3/4] bg-cream-200">
          {primaryPhoto ? (
            <img
              src={primaryPhoto.url}
              alt={`${profile.user.firstName} profile`}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-emerald-100 to-cream-200">
              <Avatar
                fallback={profile.user.firstName[0]}
                className="h-32 w-32 text-4xl bg-emerald-500 text-white"
              />
            </div>
          )}

          {/* Photo count badge */}
          {profile.photos.length > 0 && (
            <div className="absolute top-4 right-4 bg-black/50 backdrop-blur-sm text-white px-3 py-1.5 rounded-full text-caption font-medium">
              {profile.photos.length} {profile.photos.length === 1 ? 'photo' : 'photos'}
            </div>
          )}
        </div>

        {/* Profile Info */}
        <div className="p-4 space-y-4 -mt-6 relative z-10">
          <Card className="shadow-premium-lg">
            <CardContent className="p-5 space-y-4">
              {/* Name and Location */}
              <div>
                <h1 className="text-display-sm text-ink-900 font-bold">
                  {profile.user.firstName}, {profile.age}
                </h1>
                <p className="text-body text-ink-600 flex items-center mt-1">
                  <MapPin className="w-4 h-4 mr-1.5" />
                  {profile.city}
                </p>
              </div>

              {/* Bio */}
              {profile.bio && (
                <div>
                  <h2 className="text-h3 text-ink-900 mb-2">{t('about')}</h2>
                  <p className="text-body text-ink-700 leading-relaxed">{profile.bio}</p>
                </div>
              )}

              {/* Interests */}
              {profile.interests.length > 0 && (
                <div>
                  <h2 className="text-h3 text-ink-900 mb-3">{t('interests')}</h2>
                  <div className="flex flex-wrap gap-2">
                    {profile.interests.map((interest) => (
                      <span
                        key={interest.id}
                        className="inline-flex items-center px-4 py-2 rounded-full bg-emerald-50 text-emerald-700 text-sm font-medium border border-emerald-200"
                      >
                        <Sparkles className="w-3.5 h-3.5 mr-1.5" />
                        {interest.name}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Dating Preferences */}
              {profile.preferences && (
                <div>
                  <h2 className="text-h3 text-ink-900 mb-3">{t('preferences')}</h2>
                  <div className="space-y-2 text-body text-ink-700">
                    <p><strong>{t('lookingFor')}:</strong> {profile.preferences.preferredGender || t('any')}</p>
                    <p><strong>{t('ageRange')}:</strong> {profile.preferences.minAge} - {profile.preferences.maxAge}</p>
                    <p><strong>{t('location')}:</strong> {profile.preferences.preferredCity || t('any')}</p>
                    {profile.preferences.openToLongDistance && (
                      <p><strong>{t('openToLongDistance')}</strong></p>
                    )}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Actions */}
          <div className="space-y-3">
            <div className="flex items-center justify-center space-x-4">
              <Button
                variant="outline"
                className="flex-1 h-16 border-2 border-ink-200 hover:border-ink-300 hover:bg-ink-50 text-ink-700 rounded-full shadow-sm"
                onClick={handlePass}
                disabled={actionLoading}
                aria-label="Pass"
              >
                <X className="h-8 w-8" />
              </Button>
              <Button
                className="flex-1 h-16 bg-burgundy-600 hover:bg-burgundy-700 text-white rounded-full shadow-md hover:shadow-lg transition-shadow"
                onClick={handleLike}
                disabled={actionLoading}
                aria-label="Like"
              >
                <Heart className="h-8 w-8" />
              </Button>
            </div>
          </div>
        </div>
      </div>
      <BottomNav />
    </div>
  )
}
