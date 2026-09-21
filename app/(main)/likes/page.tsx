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
import { X, Heart } from 'lucide-react'

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
  const t = useTranslations('likes')
  const tCommon = useTranslations('common')
  const router = useRouter()
  const [likes, setLikes] = useState<LikedProfile[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchLikes = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/likes')
      if (!response.ok) {
        if (response.status === 401) {
          router.push('/login')
          return
        }
        throw new Error(t('failedToFetchLikes'))
      }
      const data = await response.json()
      // Transform the data to match the expected interface
      const transformed = data.map((like: any) => ({
        id: like.id,
        userId: like.likedId,
        age: like.liked.profile?.age || 0,
        gender: like.liked.profile?.gender || '',
        city: like.liked.profile?.city || '',
        bio: like.liked.profile?.bio || null,
        photos: like.liked.profile?.photos || [],
        interests: like.liked.profile?.interests || [],
        user: {
          id: like.liked.id,
          firstName: like.liked.firstName,
        },
      }))
      setLikes(transformed)
    } catch (err) {
      setError(err instanceof Error ? err.message : tCommon('somethingWentWrong'))
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchLikes()
  }, [])

  const handleUnlike = async (likeId: string) => {
    if (!confirm(t('confirmUnlike'))) {
      return
    }

    try {
      const response = await fetch(`/api/likes/${likeId}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        throw new Error(t('failedToUnlike'))
      }

      setLikes(likes.filter(l => l.id !== likeId))
    } catch (err) {
      setError(err instanceof Error ? err.message : tCommon('somethingWentWrong'))
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-cream-300 flex flex-col items-center justify-center p-4 safe-top safe-bottom">
        <LoadingState message={t('loadingLikes')} />
      </div>
    )
  }

  if (error && likes.length === 0) {
    return (
      <div className="min-h-screen bg-cream-300 flex flex-col items-center justify-center p-4 safe-top safe-bottom">
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
        <div className="bg-white px-4 py-4 border-b border-cream-400 safe-top">
          <h1 className="text-h2 text-ink-900">{t('yourLikes')}</h1>
        </div>

        {/* Likes List */}
        <div className="p-4 space-y-3">
          {likes.length === 0 ? (
            <EmptyState
              icon={<Heart className="w-16 h-16 text-ink-400 mx-auto" />}
              title={t('noLikes')}
              description={t('startLiking')}
              action={
                <Button onClick={() => router.push('/discover')}>
                  {t('startDiscovering')}
                </Button>
              }
            />
          ) : (
            likes.map((like) => {
              const primaryPhoto = like.photos.find(p => p.isPrimary) || like.photos[0]

              return (
                <Card key={like.id} className="hover:shadow-md transition-all duration-200 active:scale-[0.98]">
                  <CardContent className="p-4">
                    <div className="flex items-center space-x-4">
                      <div className="relative">
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
                        <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-emerald-500 rounded-full border-2 border-white flex items-center justify-center">
                          <Heart className="w-3 h-3 text-white fill-white" />
                        </div>
                      </div>

                      <div className="flex-1">
                        <h3 className="text-h3 text-ink-900">
                          {like.user.firstName}, {like.age}
                        </h3>
                        <p className="text-body-sm text-ink-600">{like.city}</p>
                        {like.bio && (
                          <p className="text-caption text-ink-500 mt-1 line-clamp-2">
                            {like.bio}
                          </p>
                        )}
                      </div>

                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleUnlike(like.id)}
                        className="rounded-full text-ink-400 hover:text-burgundy-600"
                      >
                        <X className="h-5 w-5" />
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
