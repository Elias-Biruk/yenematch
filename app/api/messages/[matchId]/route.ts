import { NextRequest, NextResponse } from 'next/server'
import { getMatchMessages, createMessage } from '@/lib/services/messaging.service'
import { requireAuth } from '@/lib/auth/middleware'
import { handleError } from '@/lib/utils/errors'
import { rateLimit } from '@/lib/utils/rate-limiter'
import { enforcePayloadLimit } from '@/lib/utils/payload-limit'
import { z } from 'zod'

const createMessageSchema = z.object({
  content: z.string().min(1).max(1000).trim(),
})

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ matchId: string }> }
) {
  try {
    const session = await requireAuth(request)
    const { matchId } = await params

    const messages = await getMatchMessages(matchId, session.userId)

    return NextResponse.json(messages)
  } catch (error) {
    const { message, statusCode } = handleError(error)
    return NextResponse.json(
      { error: message },
      { status: statusCode }
    )
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ matchId: string }> }
) {
  try {
    const session = await requireAuth(request)
    const { matchId } = await params

    // Enforce payload limit (1MB)
    enforcePayloadLimit(request)

    // Rate limit: 10 messages per minute
    rateLimit(`messages:${session.userId}`, 10, 60000)

    const body = await request.json()
    const { content } = createMessageSchema.parse(body)

    // Get the match to determine the receiver
    const { prisma } = await import('@/lib/db/prisma')
    const match = await prisma.match.findUnique({
      where: { id: matchId },
    })

    if (!match) {
      throw new Error('Match not found')
    }

    const receiverId = match.user1Id === session.userId ? match.user2Id : match.user1Id

    const message = await createMessage(
      matchId,
      session.userId,
      receiverId,
      content
    )

    return NextResponse.json(message, { status: 201 })
  } catch (error) {
    const { message, statusCode } = handleError(error)
    return NextResponse.json(
      { error: message },
      { status: statusCode }
    )
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ matchId: string }> }
) {
  try {
    const session = await requireAuth(request)
    const { matchId } = await params

    const { markMessagesAsRead } = await import('@/lib/services/matches.service')
    await markMessagesAsRead(matchId, session.userId)

    return NextResponse.json({ success: true })
  } catch (error) {
    const { message, statusCode } = handleError(error)
    return NextResponse.json(
      { error: message },
      { status: statusCode }
    )
  }
}
