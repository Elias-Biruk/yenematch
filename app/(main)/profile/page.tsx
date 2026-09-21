'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useTranslations } from 'next-intl'
import { Avatar } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { LoadingState } from '@/components/ui/loading'
import { ErrorState } from '@/components/ui/error'
import { BottomNav } from '@/components/layout/bottom-nav'
import { Header } from '@/components/layout/header'
import { MapPin, Heart, Edit, LogOut, Shield, Camera, Sparkles } from 'lucide-react'

interface ProfileData {
  id: string
  age: number
  gender: string
  city: string
  bio: string | null
  photos: Array<{ id: string; url: string; isPrimary: boolean; order: number }>
  interests: Array<{ id: string; name: string }>
  preferences: {
    gender: string
    minAge: number
    maxAge: number
    city: string
  }
  user: {
    id: string
    firstName: string
  }
}

export default function ProfilePage() {
  const t = useTranslations('profile')
  const tCommon = useTranslations('common')
  const router = useRouter()
  const [profile, setProfile] = useState<ProfileData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isAdmin, setIsAdmin] = useState(false)

  useEffect(() => {
    fetchProfile()
    fetchUserRole()
  }, [])

  const fetchProfile = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/profile/me')
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
          onRetry={fetchProfile}
        />
      </div>
    )
  }

  if (!profile) {
    return null
  }

  const primaryPhoto = profile.photos.find(p => p.isPrimary) || profile.photos[0]

  return (
    <div className="min-h-screen bg-cream-300 pb-20">
      <div className="max-w-md mx-auto">
        <Header title={t('myProfile')} showLanguageSelector={true} />

        {/* Profile Photo */}
        <div className="relative aspect-[3/4] bg-cream-200">
          {primaryPhoto ? (
            <img
              src={primaryPhoto.url}
              alt={`${profile.user.firstName} profile`}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-emerald-100 to-cream-200">
              <div className="text-center">
                <Avatar
                  fallback={profile.user.firstName[0]}
                  className="h-32 w-32 text-4xl bg-emerald-500 text-white mx-auto"
                />
                <p className="text-body-sm text-ink-600 mt-4">Add your photos</p>
              </div>
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
              <div className="flex items-start justify-between">
                <div>
                  <h1 className="text-display-sm text-ink-900 font-bold">
                    {profile.user.firstName}, {profile.age}
                  </h1>
                  <p className="text-body text-ink-600 flex items-center mt-1">
                    <MapPin className="w-4 h-4 mr-1.5" />
                    {profile.city}
                  </p>
                </div>
                <Button
                  size="icon"
                  variant="ghost"
                  onClick={() => router.push('/profile/edit')}
                  className="rounded-full"
                >
                  <Edit className="h-5 w-5" />
                </Button>
              </div>

              {profile.bio && (
                <div>
                  <h2 className="text-h3 text-ink-900 mb-2">{t('about')}</h2>
                  <p className="text-body text-ink-700 leading-relaxed">{profile.bio}</p>
                </div>
              )}

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
            </CardContent>
          </Card>

          {/* Preferences */}
          <Card className="shadow-premium">
            <CardHeader className="pb-3">
              <CardTitle className="text-h2">{t('preferences')}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex justify-between items-center py-2 border-b border-cream-400 last:border-0">
                <span className="text-body text-ink-600">{t('lookingFor')}</span>
                <span className="text-body font-medium text-ink-900">{profile.preferences.gender}</span>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-cream-400 last:border-0">
                <span className="text-body text-ink-600">{t('ageRange')}</span>
                <span className="text-body font-medium text-ink-900">
                  {profile.preferences.minAge} - {profile.preferences.maxAge}
                </span>
              </div>
              <div className="flex justify-between items-center py-2">
                <span className="text-body text-ink-600">{t('location')}</span>
                <span className="text-body font-medium text-ink-900">{profile.preferences.city}</span>
              </div>
            </CardContent>
          </Card>

          {/* Actions */}
          <div className="space-y-3">
            <Button
              className="w-full h-12 text-base"
              onClick={() => router.push('/profile/edit')}
            >
              <Camera className="w-5 h-5 mr-2" />
              {t('editProfile')}
            </Button>
            <Button
              className="w-full h-12 text-base"
              variant="outline"
              onClick={() => router.push('/profile/preferences')}
            >
              <Heart className="w-5 h-5 mr-2" />
              {t('editPreferences')}
            </Button>
            {isAdmin && (
              <Button
                className="w-full h-12 text-base"
                variant="outline"
                onClick={() => router.push('/admin/dashboard')}
              >
                <Shield className="w-5 h-5 mr-2" />
                Admin Panel
              </Button>
            )}
            <Button
              className="w-full h-12 text-base"
              variant="ghost"
              onClick={handleLogout}
            >
              <LogOut className="w-5 h-5 mr-2" />
              {t('logout')}
            </Button>
          </div>
        </div>
      </div>
      <BottomNav />
    </div>
  )
}
