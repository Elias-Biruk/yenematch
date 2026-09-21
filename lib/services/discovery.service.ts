import { prisma } from '@/lib/db/prisma'
import { NotFoundError } from '@/lib/utils/errors'

export interface DiscoveryProfile {
  id: string
  userId: string
  age: number
  gender: string
  city: string
  bio: string | null
  photos: Array<{ id: string; url: string; isPrimary: boolean }>
  interests: Array<{ id: string; name: string }>
  user: {
    id: string
    firstName: string
  }
}

export async function getDiscoveryProfiles(
  currentUserId: string,
  limit: number = 10
): Promise<DiscoveryProfile[]> {
  const currentUser = await prisma.user.findUnique({
    where: { id: currentUserId },
    include: {
      profile: {
        include: {
          preferences: true,
        },
      },
    },
  })

  if (!currentUser?.profile) {
    throw new NotFoundError('Profile')
  }

  const preferences = currentUser.profile.preferences

  // Get IDs of users the current user has already liked
  const likedUserIds = await prisma.like.findMany({
    where: { likerId: currentUserId },
    select: { likedId: true },
  })

  const likedIds = likedUserIds.map((like: { likedId: string }) => like.likedId)

  // Get IDs of users the current user has already passed
  const passedUserIds = await prisma.pass.findMany({
    where: { passerId: currentUserId },
    select: { passedId: true },
  })

  const passedIds = passedUserIds.map((pass: { passedId: string }) => pass.passedId)

  // Get IDs of users who have blocked the current user
  const blockedByUserIds = await prisma.block.findMany({
    where: { blockedId: currentUserId },
    select: { blockerId: true },
  })

  const blockedByIds = blockedByUserIds.map((block: any) => block.blockerId)

  // Get IDs of users the current user has blocked
  const blockedUserIds = await prisma.block.findMany({
    where: { blockerId: currentUserId },
    select: { blockedId: true },
  })

  const blockedIds = blockedUserIds.map((block: any) => block.blockedId)

  // Build the where clause based on preferences
  const whereClause: any = {
    userId: {
      not: currentUserId,
      notIn: [...likedIds, ...passedIds, ...blockedByIds, ...blockedIds],
    },
    moderationStatus: 'ACTIVE',
    completedOnboarding: true,
  }

  if (preferences?.preferredGender) {
    whereClause.gender = preferences.preferredGender
  }

  if (preferences?.minAge && preferences?.maxAge) {
    whereClause.age = {
      gte: preferences.minAge,
      lte: preferences.maxAge,
    }
  }

  // Handle city preference with long-distance consideration
  if (preferences?.preferredCity && !preferences.openToLongDistance) {
    whereClause.city = preferences.preferredCity
  }

  const profiles = await prisma.profile.findMany({
    where: whereClause,
    include: {
      photos: {
        orderBy: { order: 'asc' },
        take: 5,
      },
      interests: {
        take: 5,
      },
      preferences: true,
      user: {
        select: {
          id: true,
          firstName: true,
        },
      },
    },
    orderBy: {
      createdAt: 'desc',
    },
    take: limit,
  })

  // Filter candidates based on their preferences to avoid showing incompatible profiles
  const eligibleProfiles = profiles.filter((profile: any) => {
    if (!profile.user) return false
    
    // Get candidate's preferences
    const candidateProfile = profile as any
    if (!candidateProfile.preferences) return true // No preferences means open to all
    
    const candidatePrefs = candidateProfile.preferences
    
    // Check if current user matches candidate's gender preference
    if (candidatePrefs.preferredGender && currentUser.profile?.gender !== candidatePrefs.preferredGender) {
      return false
    }
    
    // Check if current user's age is within candidate's preferred range
    if (candidatePrefs.minAge && currentUser.profile?.age && currentUser.profile.age < candidatePrefs.minAge) {
      return false
    }
    
    if (candidatePrefs.maxAge && currentUser.profile?.age && currentUser.profile.age > candidatePrefs.maxAge) {
      return false
    }
    
    // Check city preference if candidate is not open to long distance
    if (candidatePrefs.preferredCity && !candidatePrefs.openToLongDistance) {
      if (currentUser.profile?.city !== candidatePrefs.preferredCity) {
        return false
      }
    }
    
    return true
  })

  return eligibleProfiles as DiscoveryProfile[]
}

export async function getNextDiscoveryProfile(
  currentUserId: string
): Promise<DiscoveryProfile | null> {
  const profiles = await getDiscoveryProfiles(currentUserId, 1)
  return profiles.length > 0 ? profiles[0] : null
}
