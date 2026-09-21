import { prisma } from '@/lib/db/prisma'
import { ValidationError, NotFoundError, AuthorizationError } from '@/lib/utils/errors'
import { MAX_MESSAGE_LENGTH } from '@/lib/constants'
import { MatchStatus, ModerationStatus } from '@prisma/client'

export async function createMessage(
  matchId: string,
  senderId: string,
  receiverId: string,
  content: string
) {
  const trimmedContent = content.trim()

  if (!trimmedContent || trimmedContent.length === 0) {
    throw new ValidationError('Message content is required')
  }

  if (trimmedContent.length > MAX_MESSAGE_LENGTH) {
    throw new ValidationError(`Message must be less than ${MAX_MESSAGE_LENGTH} characters`)
  }

  // Check if sender is suspended or banned
  const senderProfile = await prisma.profile.findUnique({
    where: { userId: senderId },
    select: { moderationStatus: true },
  })

  if (!senderProfile) {
    throw new NotFoundError('Profile')
  }

  if (senderProfile.moderationStatus === ModerationStatus.SUSPENDED) {
    throw new AuthorizationError('Your account is suspended')
  }

  if (senderProfile.moderationStatus === ModerationStatus.BANNED) {
    throw new AuthorizationError('Your account is banned')
  }

  // Verify the match exists and both users are part of it
  const match = await prisma.match.findUnique({
    where: { id: matchId },
  })

  if (!match) {
    throw new NotFoundError('Match')
  }

  if (match.status !== MatchStatus.ACTIVE) {
    throw new AuthorizationError('This conversation is no longer available')
  }

  if (match.user1Id !== senderId && match.user2Id !== senderId) {
    throw new AuthorizationError('You are not part of this match')
  }

  if (match.user1Id !== receiverId && match.user2Id !== receiverId) {
    throw new AuthorizationError('Receiver is not part of this match')
  }

  // Check if receiver is suspended or banned
  const receiverProfile = await prisma.profile.findUnique({
    where: { userId: receiverId },
    select: { moderationStatus: true },
  })

  if (!receiverProfile) {
    throw new NotFoundError('Receiver profile not found')
  }

  if (receiverProfile.moderationStatus === ModerationStatus.SUSPENDED) {
    throw new AuthorizationError('This user is suspended')
  }

  if (receiverProfile.moderationStatus === ModerationStatus.BANNED) {
    throw new AuthorizationError('This user is banned')
  }

  // Check if sender is blocked by receiver
  const block = await prisma.block.findUnique({
    where: {
      blockerId_blockedId: {
        blockerId: receiverId,
        blockedId: senderId,
      },
    },
  })

  if (block) {
    throw new AuthorizationError('You cannot message this user')
  }

  const message = await prisma.message.create({
    data: {
      matchId,
      senderId,
      receiverId,
      content: trimmedContent,
    },
    include: {
      sender: {
        select: {
          id: true,
          firstName: true,
        },
      },
    },
  })

  return message
}

export async function getMatchMessages(matchId: string, userId: string) {
  // Verify user is part of the match
  const match = await prisma.match.findUnique({
    where: { id: matchId },
  })

  if (!match) {
    throw new NotFoundError('Match')
  }

  if (match.status !== MatchStatus.ACTIVE) {
    throw new AuthorizationError('This conversation is no longer available')
  }

  if (match.user1Id !== userId && match.user2Id !== userId) {
    throw new AuthorizationError('You are not part of this match')
  }

  // Check if either user has blocked the other
  const otherUserId = match.user1Id === userId ? match.user2Id : match.user1Id
  const block = await prisma.block.findFirst({
    where: {
      OR: [
        { blockerId: userId, blockedId: otherUserId },
        { blockerId: otherUserId, blockedId: userId },
      ],
    },
  })

  if (block) {
    throw new AuthorizationError('This conversation is no longer available')
  }

  // Mark unread messages as read (only messages where current user is receiver)
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

  const messages = await prisma.message.findMany({
    where: { matchId },
    include: {
      sender: {
        select: {
          id: true,
          firstName: true,
        },
      },
    },
    orderBy: {
      createdAt: 'asc',
    },
  })

  return messages
}

export async function getUserMatchesWithMessages(userId: string) {
  const matches = await prisma.match.findMany({
    where: {
      OR: [
        { user1Id: userId },
        { user2Id: userId },
      ],
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

  return matches.map((match: any) => ({
    ...match,
    otherUser: match.user1Id === userId ? match.user2 : match.user1,
  }))
}
