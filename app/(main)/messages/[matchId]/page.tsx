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
import { ArrowLeft, Send, Flag } from 'lucide-react'

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
          // Still try to get match info
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
      
      // Also fetch match info
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

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <LoadingState message="Loading messages..." />
      </div>
    )
  }

  if (error && messages.length === 0 && !match) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
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
        <div className="bg-white p-4 border-b border-cream-400 flex items-center space-x-3">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.push('/matches')}
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          {primaryPhoto ? (
            <Avatar
              src={primaryPhoto.url}
              alt={match?.otherUser.firstName}
              fallback={match?.otherUser.firstName[0] || '?'}
              className="h-10 w-10"
            />
          ) : (
            <Avatar
              fallback={match?.otherUser.firstName[0] || '?'}
              className="h-10 w-10"
            />
          )}
          <div className="flex-1">
            <h1 className="font-semibold text-ink-900">
              {match?.otherUser.firstName}, {match?.otherUser.profile.age}
            </h1>
            <p className="text-sm text-ink-700">{match?.otherUser.profile.city}</p>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => match && setReportModalUser({ userId: match.otherUser.id, userName: match.otherUser.firstName })}
          >
            <Flag className="h-4 w-4" />
          </Button>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {isBlocked ? (
            <div className="flex items-center justify-center h-full">
              <p className="text-ink-500 text-center">
                This conversation is no longer available.
              </p>
            </div>
          ) : messages.length === 0 ? (
            <div className="flex items-center justify-center h-full">
              <p className="text-ink-500 text-center">
                No messages yet.<br />
                Say hello to start the conversation!
              </p>
            </div>
          ) : (
            messages.map((message) => {
              const isFromOther = message.senderId === match?.otherUser.id
              return (
                <div
                  key={message.id}
                  className={`flex ${isFromOther ? 'justify-start' : 'justify-end'}`}
                >
                  <Card className={`max-w-[80%] rounded-2xl ${
                    isFromOther 
                      ? 'bg-white border-cream-400' 
                      : 'bg-emerald-500 border-emerald-600'
                  }`}>
                    <CardContent className="p-3">
                      <p className={`text-sm ${
                        isFromOther ? 'text-ink-900' : 'text-white'
                      }`}>
                        {message.content}
                      </p>
                      <p className={`text-xs mt-1 ${
                        isFromOther ? 'text-ink-500' : 'text-emerald-100'
                      }`}>
                        {new Date(message.createdAt).toLocaleTimeString([], {
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </p>
                    </CardContent>
                  </Card>
                </div>
              )
            })
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input */}
        {!isBlocked && (
          <div className="bg-white p-4 border-t border-cream-400">
            <form onSubmit={handleSendMessage} className="flex space-x-2">
              <input
                ref={inputRef}
                type="text"
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                placeholder="Type a message..."
                className="flex-1 px-4 py-2 border border-cream-400 rounded-full focus:outline-none focus:ring-2 focus:ring-emerald-500"
                maxLength={1000}
                disabled={sending}
              />
              <Button
                type="submit"
                disabled={!newMessage.trim() || sending}
                className="bg-emerald-500 hover:bg-emerald-600 rounded-full"
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
