'use client'

import { useEffect, useState, useRef, useCallback } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { Avatar } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { LoadingState } from '@/components/ui/loading'
import { ErrorState } from '@/components/ui/error'
import { BottomNav } from '@/components/layout/bottom-nav'
import { ReportModal } from '@/components/report/report-modal'
import { ArrowLeft, Send, Flag, MoreVertical } from 'lucide-react'

interface Message {
  id: string
  content: string
  createdAt: string
  senderId: string
  readAt: string | null
  sender: {
    id: string
    firstName: string
  }
}

interface Match {
  id: string
  user1Id: string
  user2Id: string
  otherUser: {
    id: string
    firstName: string
    profile: {
      age: number
      city: string
      photos: Array<{ id: string; url: string; isPrimary: boolean }>
    }
  }
}

export default function MessagePage() {
  const router = useRouter()
  const params = useParams()
  const matchId = params.matchId as string
  
  const [messages, setMessages] = useState<Message[]>([])
  const [match, setMatch] = useState<Match | null>(null)
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [newMessage, setNewMessage] = useState('')
  const [isBlocked, setIsBlocked] = useState(false)
  const [reportModalUser, setReportModalUser] = useState<{ userId: string; userName: string } | null>(null)
  
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  const fetchMessages = useCallback(async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/messages/${matchId}`)
      if (!response.ok) {
        if (response.status === 401) {
          router.push('/onboarding')
          return
        }
        if (response.status === 403) {
          setIsBlocked(true)
          const matchesResponse = await fetch('/api/messages')
          if (matchesResponse.ok) {
            const matchesData = await matchesResponse.json()
            const currentMatch = matchesData.find((m: Match) => m.id === matchId)
            setMatch(currentMatch || null)
          }
          return
        }
        throw new Error('Failed to fetch messages')
      }
      const data = await response.json()
      setMessages(data)
      
      const matchesResponse = await fetch('/api/messages')
      if (matchesResponse.ok) {
        const matchesData = await matchesResponse.json()
        const currentMatch = matchesData.find((m: Match) => m.id === matchId)
        setMatch(currentMatch || null)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setLoading(false)
    }
  }, [matchId, router])

  useEffect(() => {
    fetchMessages()
  }, [fetchMessages])

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!newMessage.trim() || sending) {
      return
    }

    try {
      setSending(true)
      const response = await fetch(`/api/messages/${matchId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: newMessage.trim() }),
      })

      if (!response.ok) {
        const data = await response.json()
        if (response.status === 403) {
          setIsBlocked(true)
          throw new Error(data.error || 'Cannot send message')
        }
        throw new Error(data.error || 'Failed to send message')
      }

      const message = await response.json()
      setMessages([...messages, message])
      setNewMessage('')
      inputRef.current?.focus()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setSending(false)
    }
  }

  const formatMessageTime = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-cream-300 flex flex-col items-center justify-center p-4 safe-top safe-bottom">
        <LoadingState message="Loading messages..." />
      </div>
    )
  }

  if (error && messages.length === 0 && !match) {
    return (
      <div className="min-h-screen bg-cream-300 flex flex-col items-center justify-center p-4 safe-top safe-bottom">
        <ErrorState
          message={error}
          onRetry={fetchMessages}
        />
      </div>
    )
  }

  const primaryPhoto = match?.otherUser.profile.photos.find(p => p.isPrimary) || match?.otherUser.profile.photos[0]

  return (
    <div className="min-h-screen bg-cream-300 pb-20 flex flex-col">
      <div className="max-w-md mx-auto w-full flex flex-col h-screen">
        {/* Header */}
        <div className="bg-white px-4 py-4 border-b border-cream-400 flex items-center space-x-3 safe-top">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => router.push('/matches')}
            className="rounded-full"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div className="relative">
            {primaryPhoto ? (
              <Avatar
                src={primaryPhoto.url}
                alt={match?.otherUser.firstName}
                fallback={match?.otherUser.firstName[0] || '?'}
                className="h-12 w-12"
              />
            ) : (
              <Avatar
                fallback={match?.otherUser.firstName[0] || '?'}
                className="h-12 w-12"
              />
            )}
            <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-emerald-500 rounded-full border-2 border-white" />
          </div>
          <div className="flex-1">
            <h1 className="text-h3 text-ink-900">
              {match?.otherUser.firstName}, {match?.otherUser.profile.age}
            </h1>
            <p className="text-body-sm text-ink-600">{match?.otherUser.profile.city}</p>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => match && setReportModalUser({ userId: match.otherUser.id, userName: match.otherUser.firstName })}
            className="rounded-full"
          >
            <Flag className="h-5 w-5" />
          </Button>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4 scrollbar-custom">
          {isBlocked ? (
            <div className="flex items-center justify-center h-full">
              <div className="text-center space-y-2">
                <p className="text-body text-ink-600">This conversation is no longer available.</p>
              </div>
            </div>
          ) : messages.length === 0 ? (
            <div className="flex items-center justify-center h-full">
              <div className="text-center space-y-2">
                <p className="text-body text-ink-600">No messages yet.</p>
                <p className="text-body-sm text-ink-500">Say hello to start the conversation!</p>
              </div>
            </div>
          ) : (
            messages.map((message) => {
              const isFromOther = message.senderId === match?.otherUser.id
              return (
                <div
                  key={message.id}
                  className={`flex ${isFromOther ? 'justify-start' : 'justify-end'}`}
                >
                  <div className={`max-w-[80%] rounded-2xl ${
                    isFromOther 
                      ? 'bg-white border-2 border-cream-400 shadow-sm' 
                      : 'bg-emerald-500 shadow-md'
                  }`}>
                    <div className="p-4">
                      <p className={`text-body ${
                        isFromOther ? 'text-ink-900' : 'text-white'
                      }`}>
                        {message.content}
                      </p>
                      <p className={`text-caption mt-2 ${
                        isFromOther ? 'text-ink-500' : 'text-emerald-100'
                      }`}>
                        {formatMessageTime(message.createdAt)}
                      </p>
                    </div>
                  </div>
                </div>
              )
            })
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input */}
        {!isBlocked && (
          <div className="bg-white p-4 border-t border-cream-400 safe-bottom">
            <form onSubmit={handleSendMessage} className="flex items-center space-x-3">
              <input
                ref={inputRef}
                type="text"
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                placeholder="Type a message..."
                className="flex-1 h-12 px-5 border-2 border-cream-400 rounded-full bg-cream-50 focus:bg-white focus:border-emerald-500 focus:outline-none transition-all duration-200"
                maxLength={1000}
                disabled={sending}
              />
              <Button
                type="submit"
                disabled={!newMessage.trim() || sending}
                className="h-12 w-12 rounded-full bg-emerald-500 hover:bg-emerald-600 shadow-md flex-shrink-0"
                size="icon"
              >
                <Send className="h-5 w-5" />
              </Button>
            </form>
          </div>
        )}
      </div>
      <BottomNav />
      
      {reportModalUser && (
        <ReportModal
          isOpen={!!reportModalUser}
          onClose={() => setReportModalUser(null)}
          reportedUserId={reportModalUser.userId}
          reportedUserName={reportModalUser.userName}
          onSuccess={() => {
            setReportModalUser(null)
          }}
        />
      )}
    </div>
  )
}
