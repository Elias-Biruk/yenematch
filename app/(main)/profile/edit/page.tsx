'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent } from '@/components/ui/card'
import { LoadingState } from '@/components/ui/loading'
import { ErrorState } from '@/components/ui/error'
import { ArrowLeft, Save, Upload, X, Star } from 'lucide-react'
import { MIN_AGE, MAX_AGE, MAX_BIO_LENGTH } from '@/lib/constants'

interface Profile {
  id: string
  age: number
  gender: string
  city: string
  bio: string | null
  interests: Array<{ id: string; name: string }>
  user: {
    id: string
    firstName: string
    lastName: string | null
  }
  photos: Array<{ id: string; url: string; isPrimary: boolean; order: number }>
}

export default function EditProfilePage() {
  const router = useRouter()
  const [profile, setProfile] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    age: '',
    gender: '',
    city: '',
    bio: '',
    interests: [] as string[],
  })
  const [uploadingPhoto, setUploadingPhoto] = useState(false)
  const [photoError, setPhotoError] = useState<string | null>(null)

  useEffect(() => {
    fetchProfile()
  }, [])

  const fetchProfile = async () => {
    try {
      const response = await fetch('/api/profile/me')
      if (!response.ok) {
        throw new Error('Failed to fetch profile')
      }
      const data = await response.json()
      setProfile(data)
      setFormData({
        firstName: data.user.firstName,
        lastName: data.user.lastName || '',
        age: data.age.toString(),
        gender: data.gender,
        city: data.city,
        bio: data.bio || '',
        interests: data.interests.map((i: any) => i.name),
      })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setLoading(false)
    }
  }

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setUploadingPhoto(true)
    setPhotoError(null)

    try {
      const formData = new FormData()
      formData.append('file', file)

      const response = await fetch('/api/photos', {
        method: 'POST',
        body: formData,
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Failed to upload photo')
      }

      // Refresh profile to get updated photos
      await fetchProfile()
    } catch (err) {
      setPhotoError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setUploadingPhoto(false)
    }
  }

  const handleDeletePhoto = async (photoId: string) => {
    if (!confirm('Are you sure you want to delete this photo?')) {
      return
    }

    try {
      const response = await fetch(`/api/photos/${photoId}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Failed to delete photo')
      }

      // Refresh profile to get updated photos
      await fetchProfile()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    }
  }

  const handleSetPrimaryPhoto = async (photoId: string) => {
    try {
      const response = await fetch(`/api/photos/${photoId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isPrimary: true }),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Failed to set primary photo')
      }

      // Refresh profile to get updated photos
      await fetchProfile()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    setError(null)

    try {
      const age = parseInt(formData.age)
      if (age < MIN_AGE || age > MAX_AGE) {
        throw new Error(`Age must be between ${MIN_AGE} and ${MAX_AGE}`)
      }

      const response = await fetch('/api/profile/me', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          firstName: formData.firstName,
          lastName: formData.lastName || undefined,
          age,
          gender: formData.gender,
          city: formData.city,
          bio: formData.bio || undefined,
          interests: formData.interests,
        }),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Failed to update profile')
      }

      router.push('/profile')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <LoadingState message="Loading profile..." />
      </div>
    )
  }

  if (error && !profile) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <ErrorState
          message={error}
          onRetry={fetchProfile}
        />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-cream-300 pb-20">
      <div className="max-w-md mx-auto">
        {/* Header */}
        <div className="bg-white p-4 border-b border-cream-400 flex items-center justify-between">
          <div className="flex items-center">
            <Button variant="ghost" size="sm" onClick={() => router.push('/profile')}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <h1 className="text-xl font-semibold text-ink-900 ml-2">Edit Profile</h1>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.push('/profile/preferences')}
          >
            Dating Preferences
          </Button>
        </div>

        {/* Form */}
        <div className="p-4">
          <Card>
            <CardContent className="p-6">
              <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-ink-900 mb-2">First Name</label>
                  <Input
                    type="text"
                    value={formData.firstName}
                    onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                    placeholder="Enter your first name"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-ink-900 mb-2">Last Name (Optional)</label>
                  <Input
                    type="text"
                    value={formData.lastName}
                    onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                    placeholder="Enter your last name"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-ink-900 mb-2">Age</label>
                  <Input
                    type="number"
                    min={MIN_AGE}
                    max={MAX_AGE}
                    value={formData.age}
                    onChange={(e) => setFormData({ ...formData, age: e.target.value })}
                    placeholder={`Enter your age (${MIN_AGE}-${MAX_AGE})`}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-ink-900 mb-2">Gender</label>
                  <Select
                    value={formData.gender}
                    onChange={(e) => setFormData({ ...formData, gender: e.target.value })}
                  >
                    <option value="MALE">Male</option>
                    <option value="FEMALE">Female</option>
                    <option value="OTHER">Other</option>
                  </Select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-ink-900 mb-2">City</label>
                  <Input
                    type="text"
                    value={formData.city}
                    onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                    placeholder="Enter your city"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-ink-900 mb-2">Bio</label>
                  <Textarea
                    value={formData.bio}
                    onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                    placeholder="Write something about yourself..."
                    rows={4}
                    maxLength={MAX_BIO_LENGTH}
                  />
                  <p className="text-sm text-ink-500 mt-1">{formData.bio.length}/{MAX_BIO_LENGTH}</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-ink-900 mb-2">Interests</label>
                  <div className="space-y-2">
                    <div className="flex space-x-2">
                      <Input
                        type="text"
                        value={formData.interests.join(', ')}
                        onChange={(e) => {
                          const interests = e.target.value.split(',').map(i => i.trim()).filter(i => i)
                          setFormData({ ...formData, interests })
                        }}
                        placeholder="Enter interests separated by commas"
                      />
                    </div>
                    <p className="text-sm text-ink-500">Separate multiple interests with commas (e.g., hiking, music, travel)</p>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-ink-900 mb-2">Photos</label>
                  <div className="space-y-3">
                    {/* Upload Button */}
                    <div className="flex items-center space-x-3">
                      <input
                        type="file"
                        id="photo-upload"
                        accept="image/jpeg,image/png,image/webp"
                        onChange={handlePhotoUpload}
                        disabled={uploadingPhoto}
                        className="hidden"
                      />
                      <label
                        htmlFor="photo-upload"
                        className="flex items-center px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <Upload className="h-5 w-5 mr-2" />
                        {uploadingPhoto ? 'Uploading...' : 'Add Photo'}
                      </label>
                      <p className="text-sm text-ink-500">JPEG, PNG, WebP (max 5MB)</p>
                    </div>
                    {photoError && <p className="text-sm text-burgundy-500">{photoError}</p>}

                    {/* Photos Grid */}
                    {profile && profile.photos.length > 0 && (
                      <div className="grid grid-cols-3 gap-2">
                        {profile.photos.map((photo) => (
                          <div
                            key={photo.id}
                            className={`relative aspect-square rounded-lg overflow-hidden border-2 ${
                              photo.isPrimary ? 'border-emerald-500' : 'border-cream-400'
                            }`}
                          >
                            <img
                              src={photo.url}
                              alt=""
                              className="w-full h-full object-cover"
                            />
                            {photo.isPrimary && (
                              <div className="absolute top-1 right-1 bg-emerald-500 text-white rounded-full p-1">
                                <Star className="h-3 w-3 fill-current" />
                              </div>
                            )}
                            <button
                              onClick={() => handleDeletePhoto(photo.id)}
                              className="absolute top-1 left-1 bg-red-500 text-white rounded-full p-1 hover:bg-red-600"
                            >
                              <X className="h-3 w-3" />
                            </button>
                            {!photo.isPrimary && (
                              <button
                                onClick={() => handleSetPrimaryPhoto(photo.id)}
                                className="absolute bottom-1 right-1 bg-ink-900 text-white rounded-full p-1 hover:bg-ink-800"
                                title="Set as primary"
                              >
                                <Star className="h-3 w-3" />
                              </button>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                {error && <p className="text-sm text-burgundy-500">{error}</p>}

                <Button type="submit" className="w-full" disabled={saving}>
                  <Save className="h-5 w-5 mr-2" />
                  {saving ? 'Saving...' : 'Save Changes'}
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
