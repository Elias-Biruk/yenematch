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
import { MessageCircle } from 'lucide-react'

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

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <LoadingState message={t('loadingConversations')} />
      </div>
    )
  }

  if (error && conversations.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
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
        <div className="bg-white p-4 border-b border-cream-400">
          <h1 className="text-xl font-semibold text-ink-900">{t('messages')}</h1>
        </div>

        {/* Conversations List */}
        <div className="p-4 space-y-3">
          {conversations.length === 0 ? (
            <EmptyState
              icon="💬"
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
                  className="cursor-pointer hover:bg-cream-100 transition-colors"
                  onClick={() => handleMessage(conversation.id)}
                >
                  <CardContent className="p-4">
                    <div className="flex items-center space-x-4">
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

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <h3 className="font-semibold text-ink-900">
                            {conversation.otherUser.firstName}, {conversation.otherUser.profile.age}
                          </h3>
                          {lastMessage && (
                            <span className="text-xs text-ink-500">
                              {new Date(lastMessage.createdAt).toLocaleDateString()}
                            </span>
                          )}
                        </div>
                        <p className="text-sm text-ink-700">{conversation.otherUser.profile.city}</p>
                        <p className="text-sm text-ink-500 mt-1 truncate">
                          {messagePreview}
                        </p>
                      </div>

                      <MessageCircle className="h-5 w-5 text-emerald-500" />
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
