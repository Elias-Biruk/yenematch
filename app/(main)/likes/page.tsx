'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Avatar } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { LoadingState } from '@/components/ui/loading'
import { ErrorState } from '@/components/ui/error'
import { EmptyState } from '@/components/ui/empty'
import { BottomNav } from '@/components/layout/bottom-nav'
import { X } from 'lucide-react'

interface LikedProfile {
  id: string
  userId: string
  age: number
  gender: string
  city: string
  bio: string | null
  photos: Array<{ id: string; url: string; isPrimary: boolean }>
  interests: Array<{ id: string; name: string }>
  user: {
    id: string
    firstName: string
  }
}

export default function LikesPage() {
  const router = useRouter()
  const [likes, setLikes] = useState<LikedProfile[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchLikes()
  }, [])

  const fetchLikes = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/likes')
      if (!response.ok) {
        if (response.status === 401) {
          router.push('/login')
          return
        }
        throw new Error('Failed to fetch likes')
      }
      const data = await response.json()
      setLikes(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setLoading(false)
    }
  }

  const handleUnlike = async (profileId: string) => {
    if (!confirm('Are you sure you want to remove this like?')) {
      return
    }

    try {
      const response = await fetch(`/api/likes/${profileId}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        throw new Error('Failed to unlike')
      }

      setLikes(likes.filter(l => l.id !== profileId))
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <LoadingState message="Loading likes..." />
      </div>
    )
  }

  if (error && likes.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <ErrorState
          message={error}
          onRetry={fetchLikes}
        />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-cream-300 pb-20">
      <div className="max-w-md mx-auto">
        {/* Header */}
        <div className="bg-white p-4 border-b border-cream-400">
          <h1 className="text-xl font-semibold text-ink-900">Your Likes</h1>
        </div>

        {/* Likes List */}
        <div className="p-4 space-y-3">
          {likes.length === 0 ? (
            <EmptyState
              icon="❤️"
              title="No likes yet"
              description="Start discovering people to like"
              action={
                <Button onClick={() => router.push('/discover')}>
                  Start Discovering
                </Button>
              }
            />
          ) : (
            likes.map((like) => {
              const primaryPhoto = like.photos.find(p => p.isPrimary) || like.photos[0]

              return (
                <Card key={like.id}>
                  <CardContent className="p-4">
                    <div className="flex items-center space-x-4">
                      {primaryPhoto ? (
                        <Avatar
                          src={primaryPhoto.url}
                          alt={like.user.firstName}
                          fallback={like.user.firstName[0]}
                          className="h-16 w-16"
                        />
                      ) : (
                        <Avatar
                          fallback={like.user.firstName[0]}
                          className="h-16 w-16"
                        />
                      )}

                      <div className="flex-1">
                        <h3 className="font-semibold text-ink-900">
                          {like.user.firstName}, {like.age}
                        </h3>
                        <p className="text-sm text-ink-700">{like.city}</p>
                        {like.bio && (
                          <p className="text-xs text-ink-500 mt-1 line-clamp-2">
                            {like.bio}
                          </p>
                        )}
                      </div>

                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleUnlike(like.id)}
                      >
                        <X className="h-4 w-4" />
                      </Button>
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
