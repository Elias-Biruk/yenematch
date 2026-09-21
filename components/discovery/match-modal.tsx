'use client'

import { Button } from '@/components/ui/button'
import { Heart } from 'lucide-react'

interface MatchModalProps {
  match: {
    id: string
    users: {
      liker: {
        id: string
        firstName: string
        profile?: {
          photos: Array<{ url: string; isPrimary: boolean }>
        }
      }
      liked: {
        id: string
        firstName: string
        profile?: {
          photos: Array<{ url: string; isPrimary: boolean }>
        }
      }
    }
  }
  currentUserId: string
  onSendMessage: (matchId: string) => void
  onKeepDiscovering: () => void
}

export function MatchModal({ match, currentUserId, onSendMessage, onKeepDiscovering }: MatchModalProps) {
  const otherUser = match.users.liker.id === currentUserId ? match.users.liked : match.users.liker
  const currentUser = match.users.liker.id === currentUserId ? match.users.liker : match.users.liked
  
  const otherUserPhoto = otherUser.profile?.photos.find(p => p.isPrimary)?.url || otherUser.profile?.photos[0]?.url
  const currentUserPhoto = currentUser.profile?.photos.find(p => p.isPrimary)?.url || currentUser.profile?.photos[0]?.url

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl max-w-sm w-full p-6 text-center space-y-6">
        {/* Match Icon */}
        <div className="flex justify-center">
          <div className="bg-burgundy-600 rounded-full p-4">
            <Heart className="h-12 w-12 text-white fill-white" />
          </div>
        </div>

        {/* Match Text */}
        <div>
          <h2 className="text-3xl font-bold text-ink-900 mb-2">It&apos;s a Match!</h2>
          <p className="text-ink-700">
            You and {otherUser.firstName} liked each other
          </p>
        </div>

        {/* Photos */}
        <div className="flex justify-center items-center gap-4">
          <div className="relative">
            {currentUserPhoto ? (
              <img
                src={currentUserPhoto}
                alt={currentUser.firstName}
                className="w-24 h-24 rounded-full object-cover border-4 border-emerald-500"
              />
            ) : (
              <div className="w-24 h-24 rounded-full bg-cream-200 border-4 border-emerald-500 flex items-center justify-center text-3xl font-bold text-emerald-700">
                {currentUser.firstName[0]}
              </div>
            )}
          </div>
          
          <div className="relative">
            {otherUserPhoto ? (
              <img
                src={otherUserPhoto}
                alt={otherUser.firstName}
                className="w-24 h-24 rounded-full object-cover border-4 border-burgundy-600"
              />
            ) : (
              <div className="w-24 h-24 rounded-full bg-cream-200 border-4 border-burgundy-600 flex items-center justify-center text-3xl font-bold text-burgundy-700">
                {otherUser.firstName[0]}
              </div>
            )}
          </div>
        </div>

        {/* YeneMatch Message */}
        <p className="text-sm text-ink-600 italic">
          Start a conversation and get to know each other on YeneMatch
        </p>

        {/* Actions */}
        <div className="space-y-3">
          <Button
            className="w-full h-12 bg-emerald-600 hover:bg-emerald-700 text-white rounded-full font-medium"
            onClick={() => onSendMessage(match.id)}
          >
            Send a Message
          </Button>
          <Button
            variant="outline"
            className="w-full h-12 border-2 border-ink-200 hover:border-ink-300 hover:bg-ink-50 text-ink-700 rounded-full font-medium"
            onClick={onKeepDiscovering}
          >
            Keep Discovering
          </Button>
        </div>
      </div>
    </div>
  )
}
