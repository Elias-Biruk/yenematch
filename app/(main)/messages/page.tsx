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
import { MessageCircle, Heart } from 'lucide-react'

interface Conversation {
  id: string
  createdAt: string
  otherUser: {
    id: string
    firstName: string
    profile: {
      age: number
      city: string
      photos: Array<{ id: string; url: string; isPrimary: boolean }>
    }
  }
  messages: Array<{
    id: string
    content: string
    createdAt: string
    senderId: string
  }>
}

export default function MessagesPage() {
  const t = useTranslations('messages')
  const tCommon = useTranslations('common')
  const router = useRouter()
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchConversations = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/messages')
      if (!response.ok) {
        if (response.status === 401) {
          router.push('/login')
          return
        }
        throw new Error(t('failedToFetchConversations'))
      }
      const data = await response.json()
      setConversations(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : tCommon('somethingWentWrong'))
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchConversations()
  }, [])

  const handleMessage = (matchId: string) => {
    router.push(`/messages/${matchId}`)
  }

  const formatMessageTime = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffMins = Math.floor(diffMs / 60000)
    const diffHours = Math.floor(diffMs / 3600000)
    const diffDays = Math.floor(diffMs / 86400000)

    if (diffMins < 1) return 'now'
    if (diffMins < 60) return `${diffMins}m`
    if (diffHours < 24) return `${diffHours}h`
    if (diffDays < 7) return `${diffDays}d`
    return date.toLocaleDateString()
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-cream-300 flex flex-col items-center justify-center p-4 safe-top safe-bottom">
        <LoadingState message={t('loadingConversations')} />
      </div>
    )
  }

  if (error && conversations.length === 0) {
    return (
      <div className="min-h-screen bg-cream-300 flex flex-col items-center justify-center p-4 safe-top safe-bottom">
        <ErrorState
          message={error}
          onRetry={fetchConversations}
        />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-cream-300 pb-20">
      <div className="max-w-md mx-auto">
        {/* Header */}
        <div className="bg-white px-4 py-4 border-b border-cream-400 safe-top">
          <h1 className="text-h2 text-ink-900">{t('messages')}</h1>
        </div>

        {/* Conversations List */}
        <div className="p-4 space-y-3">
          {conversations.length === 0 ? (
            <EmptyState
              icon={<MessageCircle className="w-16 h-16 text-ink-400 mx-auto" />}
              title={t('noMessages')}
              description={t('sayHello')}
              action={
                <Button onClick={() => router.push('/discover')}>
                  {t('startDiscovering')}
                </Button>
              }
            />
          ) : (
            conversations.map((conversation) => {
              const primaryPhoto = conversation.otherUser.profile.photos.find(p => p.isPrimary) || conversation.otherUser.profile.photos[0]
              const lastMessage = conversation.messages[0]
              const messagePreview = lastMessage 
                ? (lastMessage.content.length > 50 ? lastMessage.content.substring(0, 50) + '...' : lastMessage.content)
                : t('noMessagesYet')

              return (
                <Card 
                  key={conversation.id}
                  className="cursor-pointer hover:shadow-md transition-all duration-200 active:scale-[0.98]"
                  onClick={() => handleMessage(conversation.id)}
                >
                  <CardContent className="p-4">
                    <div className="flex items-center space-x-4">
                      <div className="relative">
                        {primaryPhoto ? (
                          <Avatar
                            src={primaryPhoto.url}
                            alt={conversation.otherUser.firstName}
                            fallback={conversation.otherUser.firstName[0]}
                            className="h-16 w-16"
                          />
                        ) : (
                          <Avatar
                            fallback={conversation.otherUser.firstName[0]}
                            className="h-16 w-16"
                          />
                        )}
                        <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-emerald-500 rounded-full border-2 border-white flex items-center justify-center">
                          <Heart className="w-3 h-3 text-white fill-white" />
                        </div>
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-1">
                          <h3 className="text-h3 text-ink-900">
                            {conversation.otherUser.firstName}, {conversation.otherUser.profile.age}
                          </h3>
                          {lastMessage && (
                            <span className="text-caption text-ink-500 font-medium">
                              {formatMessageTime(lastMessage.createdAt)}
                            </span>
                          )}
                        </div>
                        <p className="text-body-sm text-ink-600 mb-1">{conversation.otherUser.profile.city}</p>
                        <p className="text-body-sm text-ink-500 truncate">
                          {messagePreview}
                        </p>
                      </div>

                      <MessageCircle className="h-5 w-5 text-emerald-500 flex-shrink-0" />
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
