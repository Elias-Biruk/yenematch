'use client'

import { useState } from 'react'
import { Avatar } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Heart, X, ChevronLeft, ChevronRight, Flag } from 'lucide-react'
import { ReportModal } from '@/components/report/report-modal'
import { useTranslations } from 'next-intl'

interface ProfileCardProps {
  profile: {
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
  onLike: (userId: string) => void
  onPass: (userId: string) => void
  onReport?: (userId: string, userName: string) => void
  loading?: boolean
}

export function ProfileCard({ profile, onLike, onPass, onReport, loading }: ProfileCardProps) {
  const t = useTranslations('profileCard')
  const [currentPhotoIndex, setCurrentPhotoIndex] = useState(0)
  const [showReportModal, setShowReportModal] = useState(false)
  
  const photos = profile.photos.length > 0 ? profile.photos.sort((a, b) => a.order - b.order) : []
  const currentPhoto = photos[currentPhotoIndex] || null

  const handlePreviousPhoto = () => {
    if (photos.length > 1) {
      setCurrentPhotoIndex((prev) => (prev === 0 ? photos.length - 1 : prev - 1))
    }
  }

  const handleNextPhoto = () => {
    if (photos.length > 1) {
      setCurrentPhotoIndex((prev) => (prev === photos.length - 1 ? 0 : prev + 1))
    }
  }

  return (
    <Card className="overflow-hidden shadow-lg">
      <CardContent className="p-0">
        {/* Photo */}
        <div className="relative aspect-[3/4] bg-cream-200">
          {currentPhoto ? (
            <img
              src={currentPhoto.url}
              alt={`${profile.user.firstName} photo ${currentPhotoIndex + 1}`}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <Avatar
                fallback={profile.user.firstName[0]}
                className="h-32 w-32 text-4xl"
              />
            </div>
          )}

          {/* Photo Navigation */}
          {photos.length > 1 && (
            <>
              <button
                onClick={handlePreviousPhoto}
                className="absolute left-2 top-1/2 -translate-y-1/2 bg-black/30 hover:bg-black/50 text-white rounded-full p-2 transition-colors"
                disabled={loading}
              >
                <ChevronLeft className="h-6 w-6" />
              </button>
              <button
                onClick={handleNextPhoto}
                className="absolute right-2 top-1/2 -translate-y-1/2 bg-black/30 hover:bg-black/50 text-white rounded-full p-2 transition-colors"
                disabled={loading}
              >
                <ChevronRight className="h-6 w-6" />
              </button>
              
              {/* Photo Indicators */}
              <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-1.5">
                {photos.map((_, index) => (
                  <div
                    key={index}
                    className={`h-1.5 rounded-full transition-all ${
                      index === currentPhotoIndex ? 'w-4 bg-white' : 'w-1.5 bg-white/50'
                    }`}
                  />
                ))}
              </div>
            </>
          )}
        </div>

        {/* Info */}
        <div className="p-4 space-y-3 bg-white">
          <div>
            <h2 className="text-2xl font-bold text-ink-900">
              {profile.user.firstName}, {profile.age}
            </h2>
            <p className="text-ink-700 flex items-center text-sm">
              {profile.city}
            </p>
          </div>

          {profile.bio && (
            <p className="text-ink-700 text-sm line-clamp-3 leading-relaxed">{profile.bio}</p>
          )}

          {profile.interests.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {profile.interests.slice(0, 5).map((interest) => (
                <span
                  key={interest.id}
                  className="inline-flex items-center px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 text-xs font-medium border border-emerald-200"
                >
                  {interest.name}
                </span>
              ))}
              {profile.interests.length > 5 && (
                <span className="text-xs text-ink-500">
                  {t('moreInterests', { count: profile.interests.length - 5 })}
                </span>
              )}
            </div>
          )}

          {/* Actions */}
          <div className="flex space-x-3 pt-2">
            <Button
              variant="outline"
              className="flex-1 h-14 border-2 border-ink-200 hover:border-ink-300 hover:bg-ink-50 text-ink-700 rounded-full"
              onClick={() => onPass(profile.userId)}
              disabled={loading}
            >
              <X className="h-7 w-7" />
            </Button>
            <Button
              className="flex-1 h-14 bg-burgundy-600 hover:bg-burgundy-700 text-white rounded-full"
              onClick={() => onLike(profile.userId)}
              disabled={loading}
            >
              <Heart className="h-7 w-7" />
            </Button>
          </div>

          {/* Report */}
          {onReport && (
            <button
              onClick={() => setShowReportModal(true)}
              className="w-full mt-3 text-sm text-ink-500 hover:text-ink-700 flex items-center justify-center gap-1 transition-colors"
              disabled={loading}
            >
              <Flag className="h-4 w-4" />
              {t('reportUser', { name: profile.user.firstName })}
            </button>
          )}
        </div>
      </CardContent>
      
      <ReportModal
        isOpen={showReportModal}
        onClose={() => setShowReportModal(false)}
        reportedUserId={profile.userId}
        reportedUserName={profile.user.firstName}
        onSuccess={() => {
          setShowReportModal(false)
          if (onReport) {
            onReport(profile.userId, profile.user.firstName)
          }
        }}
      />
    </Card>
  )
}
