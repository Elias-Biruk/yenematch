import { prisma } from '@/lib/db/prisma'
import { ValidationError, NotFoundError, AuthorizationError } from '@/lib/utils/errors'
import { ModerationStatus } from '@prisma/client'

export async function createPass(passerId: string, passedId: string) {
  if (passerId === passedId) {
    throw new ValidationError('You cannot pass yourself')
  }

  // Check if passer is suspended or banned
  const passerProfile = await prisma.profile.findUnique({
    where: { userId: passerId },
    select: { moderationStatus: true },
  })

  if (!passerProfile) {
    throw new NotFoundError('Profile')
  }

  if (passerProfile.moderationStatus === ModerationStatus.SUSPENDED) {
    throw new AuthorizationError('Your account is suspended')
  }

  if (passerProfile.moderationStatus === ModerationStatus.BANNED) {
    throw new AuthorizationError('Your account is banned')
  }

  const existingPass = await prisma.pass.findUnique({
    where: {
      passerId_passedId: {
        passerId,
        passedId,
      },
    },
  })

  if (existingPass) {
    throw new ValidationError('You have already passed this user')
  }

  const passedUser = await prisma.user.findUnique({
    where: { id: passedId },
  })

  if (!passedUser) {
    throw new NotFoundError('User')
  }

  const pass = await prisma.pass.create({
    data: {
      passerId,
      passedId,
    },
  })

  return { pass }
}

export async function createLike(likerId: string, likedId: string) {
  if (likerId === likedId) {
    throw new ValidationError('You cannot like yourself')
  }

  // Check if liker is suspended or banned
  const likerProfile = await prisma.profile.findUnique({
    where: { userId: likerId },
    select: { moderationStatus: true },
  })

  if (!likerProfile) {
    throw new NotFoundError('Profile')
  }

  if (likerProfile.moderationStatus === ModerationStatus.SUSPENDED) {
    throw new AuthorizationError('Your account is suspended')
  }

  if (likerProfile.moderationStatus === ModerationStatus.BANNED) {
    throw new AuthorizationError('Your account is banned')
  }

  const existingLike = await prisma.like.findUnique({
    where: {
      likerId_likedId: {
        likerId,
        likedId,
      },
    },
  })

  if (existingLike) {
    throw new ValidationError('You have already liked this user')
  }

  const likedUser = await prisma.user.findUnique({
    where: { id: likedId },
  })

  if (!likedUser) {
    throw new NotFoundError('User')
  }

  const like = await prisma.like.create({
    data: {
      likerId,
      likedId,
    },
  })

  // Check for mutual like (match)
  const mutualLike = await prisma.like.findUnique({
    where: {
      likerId_likedId: {
        likerId: likedId,
        likedId: likerId,
      },
    },
  })

  if (mutualLike) {
    // Create match
    const existingMatch = await prisma.match.findFirst({
      where: {
        OR: [
          { user1Id: likerId, user2Id: likedId },
          { user1Id: likedId, user2Id: likerId },
        ],
      },
    })

    let match
    if (!existingMatch) {
      match = await prisma.match.create({
        data: {
          user1Id: likerId,
          user2Id: likedId,
        },
      })
    } else {
      match = existingMatch
    }

    // Fetch both users' profiles for the match response
    const [likerProfile, likedProfile] = await Promise.all([
      prisma.user.findUnique({
        where: { id: likerId },
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
      }),
      prisma.user.findUnique({
        where: { id: likedId },
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
      }),
    ])

    return { 
      like, 
      isMatch: true, 
      match,
      users: {
        liker: likerProfile,
        liked: likedProfile,
      }
    }
  }

  return { like, isMatch: false }
}

export async function getLikes(userId: string) {
  // Check if user is suspended or banned
  const user = await prisma.profile.findUnique({
    where: { userId },
    select: { moderationStatus: true },
  })

  if (!user) {
    throw new NotFoundError('Profile')
  }

  if (user.moderationStatus === ModerationStatus.SUSPENDED) {
    throw new AuthorizationError('Your account is suspended')
  }

  if (user.moderationStatus === ModerationStatus.BANNED) {
    throw new AuthorizationError('Your account is banned')
  }

  const likes = await prisma.like.findMany({
    where: { likerId: userId },
    include: {
      liked: {
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
    },
    orderBy: {
      createdAt: 'desc',
    },
  })

  return likes
}

export async function getReceivedLikes(userId: string) {
  // Check if user is suspended or banned
  const user = await prisma.profile.findUnique({
    where: { userId },
    select: { moderationStatus: true },
  })

  if (!user) {
    throw new NotFoundError('Profile')
  }

  if (user.moderationStatus === ModerationStatus.SUSPENDED) {
    throw new AuthorizationError('Your account is suspended')
  }

  if (user.moderationStatus === ModerationStatus.BANNED) {
    throw new AuthorizationError('Your account is banned')
  }

  const likes = await prisma.like.findMany({
    where: { likedId: userId },
    include: {
      liker: {
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
    },
    orderBy: {
      createdAt: 'desc',
    },
  })

  return likes
}
