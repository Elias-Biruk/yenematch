'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowLeft, Shield, Ban, CheckCircle, AlertTriangle, User as UserIcon, MapPin, Calendar } from 'lucide-react'

interface UserDetail {
  id: string
  firstName: string
  lastName: string | null
  username: string | null
  role: string
  createdAt: string
  updatedAt: string
  profile: {
    id: string
    age: number
    gender: string
    city: string
    bio: string | null
    moderationStatus: string
    completedOnboarding: boolean
    createdAt: string
    photos: Array<{
      id: string
      url: string
      order: number
      isPrimary: boolean
    }>
    interests: Array<{
      id: string
      name: string
    }>
    preferences: {
      id: string
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
  } | null
}

export default function UserDetail({ params }: { params: Promise<{ userId: string }> }) {
  const router = useRouter()
  const [userId, setUserId] = useState<string>('')
  const [user, setUser] = useState<UserDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [actionLoading, setActionLoading] = useState(false)
  const [reason, setReason] = useState('')

  useEffect(() => {
    params.then(p => setUserId(p.userId))
  }, [params])

  useEffect(() => {
    if (!userId) return

    async function fetchUser() {
      try {
        const response = await fetch(`/api/admin/users/${userId}`)
        if (!response.ok) {
          throw new Error('Failed to fetch user')
        }
        const data = await response.json()
        setUser(data)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred')
      } finally {
        setLoading(false)
      }
    }

    fetchUser()
  }, [userId])

  const handleModerationAction = async (action: string) => {
    if (!userId) return

    if (!reason.trim()) {
      alert('Please provide a reason for this action')
      return
    }

    setActionLoading(true)
    try {
      const response = await fetch(`/api/admin/moderation/${userId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ action, reason }),
      })

      if (!response.ok) {
        throw new Error('Failed to perform moderation action')
      }

      // Refresh user data
      const userResponse = await fetch(`/api/admin/users/${userId}`)
      if (userResponse.ok) {
        const userData = await userResponse.json()
        setUser(userData)
      }

      setReason('')
      alert('Action completed successfully')
    } catch (err) {
      alert(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setActionLoading(false)
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ACTIVE':
        return 'bg-green-100 text-green-800'
      case 'SUSPENDED':
        return 'bg-yellow-100 text-yellow-800'
      case 'BANNED':
        return 'bg-red-100 text-red-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-gray-600">Loading user...</div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-red-600">Error: {error}</div>
      </div>
    )
  }

  if (!user) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-gray-600">User not found</div>
      </div>
    )
  }

  return (
    <div>
      <button
        onClick={() => router.back()}
        className="flex items-center text-gray-600 hover:text-gray-900 mb-6"
      >
        <ArrowLeft className="w-4 h-4 mr-2" />
        Back to Users
      </button>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* User Info */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-start justify-between mb-4">
              <div>
                <h2 className="text-2xl font-bold text-gray-900">
                  {user.firstName} {user.lastName || ''}
                </h2>
                <p className="text-gray-600">{user.username || 'No username'}</p>
              </div>
              <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(user.profile?.moderationStatus || 'ACTIVE')}`}>
                {user.profile?.moderationStatus || 'ACTIVE'}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-gray-500">Role</p>
                <p className="font-medium text-gray-900">{user.role}</p>
              </div>
              <div>
                <p className="text-gray-500">Joined</p>
                <p className="font-medium text-gray-900">
                  {new Date(user.createdAt).toLocaleDateString()}
                </p>
              </div>
            </div>
          </div>

          {user.profile && (
            <>
              {/* Profile Info */}
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Profile Information</h3>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div className="flex items-center">
                    <UserIcon className="w-4 h-4 text-gray-400 mr-2" />
                    <div>
                      <p className="text-gray-500">Age</p>
                      <p className="font-medium text-gray-900">{user.profile.age}</p>
                    </div>
                  </div>
                  <div className="flex items-center">
                    <UserIcon className="w-4 h-4 text-gray-400 mr-2" />
                    <div>
                      <p className="text-gray-500">Gender</p>
                      <p className="font-medium text-gray-900">{user.profile.gender}</p>
                    </div>
                  </div>
                  <div className="flex items-center">
                    <MapPin className="w-4 h-4 text-gray-400 mr-2" />
                    <div>
                      <p className="text-gray-500">City</p>
                      <p className="font-medium text-gray-900">{user.profile.city}</p>
                    </div>
                  </div>
                  <div className="flex items-center">
                    <Calendar className="w-4 h-4 text-gray-400 mr-2" />
                    <div>
                      <p className="text-gray-500">Onboarding</p>
                      <p className="font-medium text-gray-900">
                        {user.profile.completedOnboarding ? 'Completed' : 'Not completed'}
                      </p>
                    </div>
                  </div>
                </div>

                {user.profile.bio && (
                  <div className="mt-4">
                    <p className="text-gray-500 text-sm mb-1">Bio</p>
                    <p className="text-gray-900">{user.profile.bio}</p>
                  </div>
                )}

                {user.profile.interests.length > 0 && (
                  <div className="mt-4">
                    <p className="text-gray-500 text-sm mb-2">Interests</p>
                    <div className="flex flex-wrap gap-2">
                      {user.profile.interests.map((interest) => (
                        <span
                          key={interest.id}
                          className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-sm"
                        >
                          {interest.name}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Photos */}
              {user.profile.photos.length > 0 && (
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Photos</h3>
                  <div className="grid grid-cols-3 gap-4">
                    {user.profile.photos.map((photo) => (
                      <img
                        key={photo.id}
                        src={photo.url}
                        alt="Profile photo"
                        className="w-full h-32 object-cover rounded-lg"
                      />
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        {/* Moderation Actions */}
        <div className="space-y-6">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Moderation Actions</h3>
            
            <div className="space-y-4">
              <textarea
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="Reason for moderation action..."
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                rows={3}
              />

              <div className="space-y-2">
                {user.profile?.moderationStatus === 'ACTIVE' && (
                  <>
                    <button
                      onClick={() => handleModerationAction('suspend')}
                      disabled={actionLoading}
                      className="w-full flex items-center justify-center px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 transition-colors disabled:opacity-50"
                    >
                      <Shield className="w-4 h-4 mr-2" />
                      Suspend User
                    </button>
                    <button
                      onClick={() => handleModerationAction('ban')}
                      disabled={actionLoading}
                      className="w-full flex items-center justify-center px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50"
                    >
                      <Ban className="w-4 h-4 mr-2" />
                      Ban User
                    </button>
                  </>
                )}

                {user.profile?.moderationStatus === 'SUSPENDED' && (
                  <button
                    onClick={() => handleModerationAction('unsuspend')}
                    disabled={actionLoading}
                    className="w-full flex items-center justify-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50"
                  >
                    <CheckCircle className="w-4 h-4 mr-2" />
                    Unsuspend User
                  </button>
                )}

                {user.profile?.moderationStatus === 'BANNED' && (
                  <button
                    onClick={() => handleModerationAction('unban')}
                    disabled={actionLoading}
                    className="w-full flex items-center justify-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50"
                  >
                    <CheckCircle className="w-4 h-4 mr-2" />
                    Unban User
                  </button>
                )}
              </div>
            </div>
          </div>

          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <div className="flex items-start">
              <AlertTriangle className="w-5 h-5 text-yellow-600 mr-2 mt-0.5" />
              <div className="text-sm text-yellow-800">
                <p className="font-medium mb-1">Important Notes</p>
                <ul className="list-disc list-inside space-y-1">
                  <li>Provide a clear reason for all moderation actions</li>
                  <li>All actions are logged in the audit trail</li>
                  <li>Suspended users cannot use dating features</li>
                  <li>Banned users cannot access the platform</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
