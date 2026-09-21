import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth/middleware'
import { handleError } from '@/lib/utils/errors'
import { z } from 'zod'
import { MatchStatus } from '@prisma/client'

const blockSchema = z.object({
  targetUserId: z.string(),
})

export async function GET(request: NextRequest) {
  try {
    const session = await requireAuth(request)

    const { prisma } = await import('@/lib/db/prisma')

    const blocks = await prisma.block.findMany({
      where: { blockerId: session.userId },
      include: {
        blocked: {
          select: {
            id: true,
            firstName: true,
            profile: {
              select: {
                age: true,
                city: true,
                photos: {
                  where: { isPrimary: true },
                  take: 1,
                },
              },
            },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    })

    return NextResponse.json(blocks)
  } catch (error) {
    const { message, statusCode } = handleError(error)
    return NextResponse.json(
      { error: message },
      { status: statusCode }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await requireAuth(request)
    const body = await request.json()
    const { targetUserId } = blockSchema.parse(body)

    // Prevent self-block
    if (targetUserId === session.userId) {
      return NextResponse.json(
        { error: 'You cannot block yourself' },
        { status: 400 }
      )
    }

    const { prisma } = await import('@/lib/db/prisma')

    // Check if they have a match
    const match = await prisma.match.findFirst({
      where: {
        OR: [
          { user1Id: session.userId, user2Id: targetUserId },
          { user1Id: targetUserId, user2Id: session.userId },
        ],
      },
    })

    // If they have a match, set it to BLOCKED status
    if (match) {
      await prisma.match.update({
        where: { id: match.id },
        data: { status: MatchStatus.BLOCKED },
      })
    }

    // Create the block record
    await prisma.block.create({
      data: {
        blockerId: session.userId,
        blockedId: targetUserId,
      },
    })

    return NextResponse.json({ success: true }, { status: 201 })
  } catch (error) {
    const { message, statusCode } = handleError(error)
    return NextResponse.json(
      { error: message },
      { status: statusCode }
    )
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const session = await requireAuth(request)
    const { searchParams } = new URL(request.url)
    const targetUserId = searchParams.get('targetUserId')

    if (!targetUserId) {
      return NextResponse.json(
        { error: 'targetUserId is required' },
        { status: 400 }
      )
    }

    const { prisma } = await import('@/lib/db/prisma')

    // Delete the block record
    await prisma.block.deleteMany({
      where: {
        blockerId: session.userId,
        blockedId: targetUserId,
      },
    })

    // Check if they have a match and set it back to ACTIVE
    const match = await prisma.match.findFirst({
      where: {
        OR: [
          { user1Id: session.userId, user2Id: targetUserId },
          { user1Id: targetUserId, user2Id: session.userId },
        ],
      },
    })

    if (match && match.status === MatchStatus.BLOCKED) {
      await prisma.match.update({
        where: { id: match.id },
        data: { status: MatchStatus.ACTIVE },
      })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    const { message, statusCode } = handleError(error)
    return NextResponse.json(
      { error: message },
      { status: statusCode }
    )
  }
}
