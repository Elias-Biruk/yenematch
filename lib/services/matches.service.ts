import { prisma } from '@/lib/db/prisma'
import { NotFoundError, ValidationError } from '@/lib/utils/errors'
import { MatchStatus } from '@prisma/client'

export async function getMatches(userId: string) {
  const matches = await prisma.match.findMany({
    where: {
      OR: [
        { user1Id: userId },
        { user2Id: userId },
      ],
      status: MatchStatus.ACTIVE,
    },
    include: {
      user1: {
        include: {
          profile: {
            include: {
              photos: {
                where: { isPrimary: true },
                take: 1,
              },
            },
          },
        },
      },
      user2: {
        include: {
          profile: {
            include: {
              photos: {
                where: { isPrimary: true },
                take: 1,
              },
            },
          },
        },
      },
      messages: {
        orderBy: {
          createdAt: 'desc',
        },
        take: 1,
      },
    },
    orderBy: {
      createdAt: 'desc',
    },
  })

  // Get unread counts for each match
  const matchIds = matches.map((m: any) => m.id)
  const unreadCounts = await prisma.message.groupBy({
    by: ['matchId'],
    where: {
      matchId: { in: matchIds },
      receiverId: userId,
      readAt: null,
    },
    _count: {
      id: true,
    },
  })

  const unreadCountMap = new Map(
    unreadCounts.map((uc: any) => [uc.matchId, uc._count.id])
  )

  // Sort matches by latest message activity, then by match creation date
  const sortedMatches = matches.sort((a: any, b: any) => {
    const aLatest = a.messages[0]?.createdAt || a.createdAt
    const bLatest = b.messages[0]?.createdAt || b.createdAt
    return new Date(bLatest).getTime() - new Date(aLatest).getTime()
  })

  return sortedMatches.map((match: any) => {
    const otherUser = match.user1Id === userId ? match.user2 : match.user1
    const latestMessage = match.messages[0] || null
    
    const unreadCount = unreadCountMap.get(match.id) || 0

    return {
      ...match,
      otherUser,
      latestMessage: latestMessage ? {
        content: latestMessage.content,
        createdAt: latestMessage.createdAt,
        senderId: latestMessage.senderId,
      } : null,
      unreadCount,
    }
  })
}

export async function getMatch(matchId: string, userId: string) {
  const match = await prisma.match.findUnique({
    where: { id: matchId },
    include: {
      user1: {
        include: {
          profile: {
            include: {
              photos: true,
            },
          },
        },
      },
      user2: {
        include: {
          profile: {
            include: {
              photos: true,
            },
          },
        },
      },
    },
  })

  if (!match) {
    throw new NotFoundError('Match')
  }

  if (match.user1Id !== userId && match.user2Id !== userId) {
    throw new ValidationError('You are not part of this match')
  }

  return {
    ...match,
    otherUser: match.user1Id === userId ? match.user2 : match.user1,
  }
}

export async function unmatch(matchId: string, userId: string) {
  const match = await prisma.match.findUnique({
    where: { id: matchId },
  })

  if (!match) {
    throw new NotFoundError('Match')
  }

  if (match.user1Id !== userId && match.user2Id !== userId) {
    throw new ValidationError('You are not part of this match')
  }

  // Set status to UNMATCHED instead of deleting
  await prisma.match.update({
    where: { id: matchId },
    data: {
      status: MatchStatus.UNMATCHED,
    },
  })
}

export async function markMessagesAsRead(matchId: string, userId: string) {
  const match = await prisma.match.findUnique({
    where: { id: matchId },
  })

  if (!match) {
    throw new NotFoundError('Match')
  }

  if (match.user1Id !== userId && match.user2Id !== userId) {
    throw new ValidationError('You are not part of this match')
  }

  // Mark all unread messages from the other user as read
  await prisma.message.updateMany({
    where: {
      matchId,
      receiverId: userId,
      readAt: null,
    },
    data: {
      readAt: new Date(),
    },
  })
}

export async function blockMatch(matchId: string, blockerId: string) {
  const match = await prisma.match.findUnique({
    where: { id: matchId },
  })

  if (!match) {
    throw new NotFoundError('Match')
  }

  if (match.user1Id !== blockerId && match.user2Id !== blockerId) {
    throw new ValidationError('You are not part of this match')
  }

  // Set status to BLOCKED
  await prisma.match.update({
    where: { id: matchId },
    data: {
      status: MatchStatus.BLOCKED,
    },
  })
}
