'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Avatar } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { LoadingState } from '@/components/ui/loading'
import { ErrorState } from '@/components/ui/error'
import { EmptyState } from '@/components/ui/empty'
import { Edit2, Settings, LogOut } from 'lucide-react'

interface Profile {
  id: string
  age: number
  gender: string
  city: string
  bio: string | null
  photos: Array<{ id: string; url: string; isPrimary: boolean }>
  interests: Array<{ id: string; name: string }>
  user: {
    id: string
    firstName: string
    lastName: string | null
  }
  preferences: {
    preferredGender: string | null
    minAge: number
    maxAge: number
    preferredCity: string | null
    relationshipIntention: string | null
    openToLongDistance: boolean
    smoking: string | null
    drinking: string | null
    childrenPreference: string | null
    languages: string[]
  } | null
}

export default function ProfilePage() {
  const router = useRouter()
  const [profile, setProfile] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchProfile()
  }, [])

  const fetchProfile = async () => {
    try {
      const response = await fetch('/api/profile/me')
      if (!response.ok) {
        if (response.status === 401) {
          router.push('/onboarding')
          return
        }
        throw new Error('Failed to fetch profile')
      }
      const data = await response.json()
      setProfile(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setLoading(false)
    }
  }

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' })
      router.push('/')
    } catch (err) {
      console.error('Logout failed:', err)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <LoadingState message="Loading profile..." />
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <ErrorState
          message={error}
          onRetry={fetchProfile}
        />
      </div>
    )
  }

  if (!profile) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <EmptyState
          title="No profile found"
          description="Complete onboarding to create your profile"
          action={
            <Button onClick={() => router.push('/onboarding')}>
              Start Onboarding
            </Button>
          }
        />
      </div>
    )
  }

  const primaryPhoto = profile.photos.find(p => p.isPrimary) || profile.photos[0]

  return (
    <div className="min-h-screen bg-cream-300 pb-20">
      <div className="max-w-md mx-auto">
        {/* Header */}
        <div className="bg-white p-4 border-b border-cream-400 flex items-center justify-between">
          <h1 className="text-xl font-semibold text-ink-900">My Profile</h1>
          <div className="flex space-x-2">
            <Button variant="ghost" size="sm" onClick={() => router.push('/profile/edit')}>
              <Edit2 className="h-5 w-5" />
            </Button>
            <Button variant="ghost" size="sm" onClick={() => router.push('/settings')}>
              <Settings className="h-5 w-5" />
            </Button>
          </div>
        </div>

        {/* Profile Content */}
        <div className="p-4 space-y-4">
          {/* Photo */}
          <Card>
            <CardContent className="p-6">
              <div className="flex flex-col items-center space-y-4">
                {primaryPhoto ? (
                  <Avatar
                    src={primaryPhoto.url}
                    alt={profile.user.firstName}
                    fallback={profile.user.firstName[0]}
                    className="h-32 w-32"
                  />
                ) : (
                  <Avatar
                    fallback={profile.user.firstName[0]}
                    className="h-32 w-32"
                  />
                )}
                <div className="text-center">
                  <h2 className="text-2xl font-bold text-ink-900">
                    {profile.user.firstName}, {profile.age}
                  </h2>
                  <p className="text-ink-700">{profile.city}</p>
                  <p className="text-sm text-ink-500 mt-1">{profile.gender}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Bio */}
          {profile.bio && (
            <Card>
              <CardContent className="p-6">
                <h3 className="font-semibold text-ink-900 mb-2">About</h3>
                <p className="text-ink-700">{profile.bio}</p>
              </CardContent>
            </Card>
          )}

          {/* Interests */}
          {profile.interests.length > 0 && (
            <Card>
              <CardContent className="p-6">
                <h3 className="font-semibold text-ink-900 mb-3">Interests</h3>
                <div className="flex flex-wrap gap-2">
                  {profile.interests.map((interest) => (
                    <span
                      key={interest.id}
                      className="inline-flex items-center px-3 py-1 rounded-full bg-emerald-100 text-emerald-700 text-sm"
                    >
                      {interest.name}
                    </span>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Dating Preferences */}
          {profile.preferences && (
            <Card>
              <CardContent className="p-6">
                <h3 className="font-semibold text-ink-900 mb-3">Dating Preferences</h3>
                <div className="space-y-2 text-sm text-ink-700">
                  {profile.preferences.preferredGender && (
                    <p><span className="font-medium">Looking for:</span> {profile.preferences.preferredGender}</p>
                  )}
                  <p><span className="font-medium">Age range:</span> {profile.preferences.minAge} - {profile.preferences.maxAge}</p>
                  {profile.preferences.preferredCity && (
                    <p><span className="font-medium">Preferred city:</span> {profile.preferences.preferredCity}</p>
                  )}
                  {profile.preferences.relationshipIntention && (
                    <p><span className="font-medium">Relationship intention:</span> {profile.preferences.relationshipIntention.replace(/_/g, ' ').toLowerCase()}</p>
                  )}
                  {profile.preferences.openToLongDistance && (
                    <p><span className="font-medium">Open to long distance</span></p>
                  )}
                  {profile.preferences.smoking && (
                    <p><span className="font-medium">Smoking:</span> {profile.preferences.smoking.replace(/_/g, ' ').toLowerCase()}</p>
                  )}
                  {profile.preferences.drinking && (
                    <p><span className="font-medium">Drinking:</span> {profile.preferences.drinking.replace(/_/g, ' ').toLowerCase()}</p>
                  )}
                  {profile.preferences.childrenPreference && (
                    <p><span className="font-medium">Children:</span> {profile.preferences.childrenPreference.replace(/_/g, ' ').toLowerCase()}</p>
                  )}
                  {profile.preferences.languages && profile.preferences.languages.length > 0 && (
                    <p><span className="font-medium">Languages:</span> {profile.preferences.languages.join(', ')}</p>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Photos */}
          {profile.photos.length > 1 && (
            <Card>
              <CardContent className="p-6">
                <h3 className="font-semibold text-ink-900 mb-3">Photos</h3>
                <div className="grid grid-cols-3 gap-2">
                  {profile.photos.map((photo) => (
                    <div
                      key={photo.id}
                      className={`aspect-square rounded-lg overflow-hidden border-2 ${
                        photo.isPrimary ? 'border-emerald-500' : 'border-cream-400'
                      }`}
                    >
                      <img
                        src={photo.url}
                        alt=""
                        className="w-full h-full object-cover"
                      />
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Logout */}
          <Button
            variant="outline"
            className="w-full"
            onClick={handleLogout}
          >
            <LogOut className="h-5 w-5 mr-2" />
            Log Out
          </Button>
        </div>
      </div>
    </div>
  )
}
