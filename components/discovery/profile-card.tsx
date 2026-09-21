'use client'

import { useState } from 'react'
import { Avatar } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Heart, X, ChevronLeft, ChevronRight, Flag, MapPin, Eye, Sparkles } from 'lucide-react'
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
  onViewProfile?: (userId: string) => void
  onReport?: (userId: string, userName: string) => void
  loading?: boolean
}

export function ProfileCard({ profile, onLike, onPass, onViewProfile, onReport, loading }: ProfileCardProps) {
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
    <Card className="overflow-hidden shadow-premium-lg border-0 animate-scale-in">
      <CardContent className="p-0">
        {/* Photo Section */}
        <div className="relative aspect-[3/4] bg-cream-200">
          {currentPhoto ? (
            <img
              src={currentPhoto.url}
              alt={`${profile.user.firstName} photo ${currentPhotoIndex + 1}`}
              className="w-full h-full object-cover"
              loading="eager"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-emerald-100 to-cream-200">
              <Avatar
                fallback={profile.user.firstName[0]}
                className="h-32 w-32 text-4xl bg-emerald-500 text-white"
              />
            </div>
          )}

          {/* Photo Navigation */}
          {photos.length > 1 && (
            <>
              <button
                onClick={handlePreviousPhoto}
                className="absolute left-3 top-1/2 -translate-y-1/2 bg-black/40 hover:bg-black/60 backdrop-blur-sm text-white rounded-full p-3 transition-all duration-200 active:scale-95"
                disabled={loading}
                aria-label="Previous photo"
              >
                <ChevronLeft className="h-6 w-6" />
              </button>
              <button
                onClick={handleNextPhoto}
                className="absolute right-3 top-1/2 -translate-y-1/2 bg-black/40 hover:bg-black/60 backdrop-blur-sm text-white rounded-full p-3 transition-all duration-200 active:scale-95"
                disabled={loading}
                aria-label="Next photo"
              >
                <ChevronRight className="h-6 w-6" />
              </button>
              
              {/* Photo Indicators */}
              <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2">
                {photos.map((_, index) => (
                  <div
                    key={index}
                    className={`h-1.5 rounded-full transition-all duration-300 ${
                      index === currentPhotoIndex ? 'w-6 bg-white' : 'w-1.5 bg-white/50'
                    }`}
                  />
                ))}
              </div>
            </>
          )}
        </div>

        {/* Profile Info Section */}
        <div className="p-5 bg-white space-y-4">
          {/* Name and Location */}
          <div>
            <h2 className="text-display-sm text-ink-900 font-bold">
              {profile.user.firstName}, {profile.age}
            </h2>
            <p className="text-body text-ink-600 flex items-center mt-1">
              <MapPin className="w-4 h-4 mr-1.5" />
              {profile.city}
            </p>
          </div>

          {/* Bio */}
          {profile.bio && (
            <div>
              <p className="text-body text-ink-700 leading-relaxed line-clamp-3">{profile.bio}</p>
            </div>
          )}

          {/* Interests */}
          {profile.interests.length > 0 && (
            <div>
              <div className="flex flex-wrap gap-2">
                {profile.interests.slice(0, 6).map((interest) => (
                  <span
                    key={interest.id}
                    className="inline-flex items-center px-3 py-1.5 rounded-full bg-emerald-50 text-emerald-700 text-sm font-medium border border-emerald-200"
                  >
                    <Sparkles className="w-3.5 h-3.5 mr-1.5" />
                    {interest.name}
                  </span>
                ))}
                {profile.interests.length > 6 && (
                  <span className="text-sm text-ink-500 font-medium">
                    +{profile.interests.length - 6}
                  </span>
                )}
              </div>
            </div>
          )}

          {/* View Profile Button */}
          {onViewProfile && (
            <Button
              variant="outline"
              className="w-full h-12 text-base border-emerald-300 text-emerald-700 hover:bg-emerald-50"
              onClick={() => onViewProfile(profile.userId)}
              disabled={loading}
            >
              <Eye className="w-5 h-5 mr-2" />
              {t('viewProfile')}
            </Button>
          )}

          {/* Like/Pass Actions */}
          <div className="flex items-center justify-center space-x-4 pt-2">
            <Button
              variant="outline"
              className="flex-1 h-16 border-2 border-ink-200 hover:border-ink-300 hover:bg-ink-50 text-ink-700 rounded-full shadow-sm"
              onClick={() => onPass(profile.userId)}
              disabled={loading}
              aria-label="Pass"
            >
              <X className="h-8 w-8" />
            </Button>
            <Button
              className="flex-1 h-16 bg-burgundy-600 hover:bg-burgundy-700 text-white rounded-full shadow-md hover:shadow-lg transition-shadow"
              onClick={() => onLike(profile.userId)}
              disabled={loading}
              aria-label="Like"
            >
              <Heart className="h-8 w-8" />
            </Button>
          </div>

          {/* Report */}
          {onReport && (
            <button
              onClick={() => setShowReportModal(true)}
              className="w-full text-sm text-ink-500 hover:text-burgundy-600 flex items-center justify-center gap-1.5 transition-colors py-2"
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
