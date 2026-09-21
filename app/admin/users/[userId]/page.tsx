'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowLeft, Shield, Ban, CheckCircle, AlertTriangle, User as UserIcon, MapPin, Calendar } from 'lucide-react'

interface UserDetail {
  id: string
  telegramId: string
  firstName: string
  lastName: string | null
  username: string | null
  role: string
  createdAt: string
  updatedAt: string
  isSeed: boolean
  _count: {
    sentLikes: number
    receivedLikes: number
    sentPasses: number
    receivedPasses: number
    matches1: number
    matches2: number
    sentMessages: number
    receivedMessages: number
    sentReports: number
    receivedReports: number
    blockedUsers: number
    blockedBy: number
  }
  profile: {
    id: string
    age: number
    gender: string
    city: string
    bio: string | null
    moderationStatus: string
    completedOnboarding: boolean
    createdAt: string
    updatedAt: string
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
  const [editMode, setEditMode] = useState(false)
  const [editData, setEditData] = useState({ city: '', bio: '', age: '', gender: '' })
  const [updateLoading, setUpdateLoading] = useState(false)

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
        // Initialize edit data when user is loaded
        if (userData.profile) {
          setEditData({
            city: userData.profile.city || '',
            bio: userData.profile.bio || '',
            age: userData.profile.age?.toString() || '',
            gender: userData.profile.gender || '',
          })
        }
      }

      setReason('')
      alert('Action completed successfully')
    } catch (err) {
      alert(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setActionLoading(false)
    }
  }

  const handleProfileUpdate = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!userId) return

    setUpdateLoading(true)
    try {
      const requestBody: any = {}
      if (editData.city.trim()) requestBody.city = editData.city.trim()
      if (editData.bio.trim()) requestBody.bio = editData.bio.trim()
      if (editData.age) requestBody.age = parseInt(editData.age)
      if (editData.gender) requestBody.gender = editData.gender

      console.log('Admin profile update request body:', requestBody)

      const response = await fetch(`/api/admin/users/${userId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody),
      })

      const responseData = await response.json()
      console.log('Admin profile update response:', response.status, responseData)

      if (!response.ok) {
        throw new Error(responseData.error || 'Failed to update profile')
      }

      // Refresh user data
      const userResponse = await fetch(`/api/admin/users/${userId}`)
      if (userResponse.ok) {
        const userData = await userResponse.json()
        setUser(userData)
        if (userData.profile) {
          setEditData({
            city: userData.profile.city || '',
            bio: userData.profile.bio || '',
            age: userData.profile.age?.toString() || '',
            gender: userData.profile.gender || '',
          })
        }
      }

      setEditMode(false)
      alert('Profile updated successfully')
    } catch (err) {
      console.error('Admin profile update error:', err)
      alert(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setUpdateLoading(false)
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
                <p className="text-gray-500">User Type</p>
                <p className="font-medium text-gray-900">
                  {user.isSeed ? 'Seed User' : 'Real User'}
                </p>
              </div>
              <div>
                <p className="text-gray-500">Telegram ID</p>
                <p className="font-medium text-gray-900">{user.telegramId}</p>
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
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-gray-900">Profile Information</h3>
                  <button
                    onClick={() => setEditMode(!editMode)}
                    className="text-sm text-blue-600 hover:text-blue-900"
                  >
                    {editMode ? 'Cancel' : 'Edit'}
                  </button>
                </div>

                {editMode ? (
                  <form onSubmit={handleProfileUpdate} className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">City</label>
                        <input
                          type="text"
                          value={editData.city}
                          onChange={(e) => setEditData({ ...editData, city: e.target.value })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Age</label>
                        <input
                          type="number"
                          value={editData.age}
                          onChange={(e) => setEditData({ ...editData, age: e.target.value })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Gender</label>
                        <select
                          value={editData.gender}
                          onChange={(e) => setEditData({ ...editData, gender: e.target.value })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                        >
                          <option value="MALE">Male</option>
                          <option value="FEMALE">Female</option>
                          <option value="OTHER">Other</option>
                        </select>
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Bio</label>
                      <textarea
                        value={editData.bio}
                        onChange={(e) => setEditData({ ...editData, bio: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                        rows={3}
                      />
                    </div>
                    <div className="flex gap-2">
                      <button
                        type="submit"
                        disabled={updateLoading}
                        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                      >
                        {updateLoading ? 'Saving...' : 'Save Changes'}
                      </button>
                      <button
                        type="button"
                        onClick={() => setEditMode(false)}
                        className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
                      >
                        Cancel
                      </button>
                    </div>
                  </form>
                ) : (
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
                )}

                {!editMode && user.profile.bio && (
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

          {/* Activity Statistics */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Activity Statistics</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              <div>
                <p className="text-gray-500">Likes Sent</p>
                <p className="font-medium text-gray-900">{user._count.sentLikes}</p>
              </div>
              <div>
                <p className="text-gray-500">Likes Received</p>
                <p className="font-medium text-gray-900">{user._count.receivedLikes}</p>
              </div>
              <div>
                <p className="text-gray-500">Passes Sent</p>
                <p className="font-medium text-gray-900">{user._count.sentPasses}</p>
              </div>
              <div>
                <p className="text-gray-500">Passes Received</p>
                <p className="font-medium text-gray-900">{user._count.receivedPasses}</p>
              </div>
              <div>
                <p className="text-gray-500">Matches</p>
                <p className="font-medium text-gray-900">{user._count.matches1 + user._count.matches2}</p>
              </div>
              <div>
                <p className="text-gray-500">Messages Sent</p>
                <p className="font-medium text-gray-900">{user._count.sentMessages}</p>
              </div>
              <div>
                <p className="text-gray-500">Messages Received</p>
                <p className="font-medium text-gray-900">{user._count.receivedMessages}</p>
              </div>
              <div>
                <p className="text-gray-500">Reports Filed</p>
                <p className="font-medium text-gray-900">{user._count.sentReports}</p>
              </div>
              <div>
                <p className="text-gray-500">Reports Against</p>
                <p className="font-medium text-gray-900">{user._count.receivedReports}</p>
              </div>
              <div>
                <p className="text-gray-500">Users Blocked</p>
                <p className="font-medium text-gray-900">{user._count.blockedUsers}</p>
              </div>
              <div>
                <p className="text-gray-500">Blocked By</p>
                <p className="font-medium text-gray-900">{user._count.blockedBy}</p>
              </div>
            </div>
          </div>
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
