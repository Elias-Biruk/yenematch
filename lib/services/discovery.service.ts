import { prisma } from '@/lib/db/prisma'
import { NotFoundError } from '@/lib/utils/errors'

export interface DiscoveryProfile {
  id: string
  userId: string
  age: number
  gender: string
  city: string
  bio: string | null
  photos: Array<{
    id: string
    url: string
    isPrimary: boolean
  }>
  interests: Array<{
    id: string
    name: string
  }>
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
    where: {
      id: currentUserId,
    },
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

  const currentProfile = currentUser.profile
  const currentPreferences = currentProfile.preferences

  console.log('[Discovery] Current user preferences:', {
    preferredGender: currentPreferences?.preferredGender,
    minAge: currentPreferences?.minAge,
    maxAge: currentPreferences?.maxAge,
    preferredCity: currentPreferences?.preferredCity,
    openToLongDistance: currentPreferences?.openToLongDistance,
  })
  console.log('[Discovery] Current user profile:', {
    city: currentProfile.city,
    gender: currentProfile.gender,
    age: currentProfile.age,
  })

  /*
   * Users already interacted with should NEVER appear again.
   */
  const [likedUsers, passedUsers, blockedByUsers, blockedUsers] =
    await Promise.all([
      prisma.like.findMany({
        where: {
          likerId: currentUserId,
        },
        select: {
          likedId: true,
        },
      }),

      prisma.pass.findMany({
        where: {
          passerId: currentUserId,
        },
        select: {
          passedId: true,
        },
      }),

      prisma.block.findMany({
        where: {
          blockedId: currentUserId,
        },
        select: {
          blockerId: true,
        },
      }),

      prisma.block.findMany({
        where: {
          blockerId: currentUserId,
        },
        select: {
          blockedId: true,
        },
      }),
    ])

  const excludedUserIds = new Set<string>([
    currentUserId,

    ...likedUsers.map((item) => item.likedId),
    ...passedUsers.map((item) => item.passedId),
    ...blockedByUsers.map((item) => item.blockerId),
    ...blockedUsers.map((item) => item.blockedId),
  ])

  /*
   * First apply the CURRENT USER'S preferences at database level.
   *
   * Do not apply `take: limit` here.
   * We need to fetch enough candidates first and then perform
   * mutual-preference filtering.
   */
  const whereClause: any = {
    userId: {
      notIn: Array.from(excludedUserIds),
    },
    moderationStatus: 'ACTIVE',
    completedOnboarding: true,
  }

  if (currentPreferences?.preferredGender) {
    whereClause.gender = currentPreferences.preferredGender
  }

  if (
    currentPreferences?.minAge !== null &&
    currentPreferences?.minAge !== undefined
  ) {
    whereClause.age = {
      ...(whereClause.age || {}),
      gte: currentPreferences.minAge,
    }
  }

  if (
    currentPreferences?.maxAge !== null &&
    currentPreferences?.maxAge !== undefined
  ) {
    whereClause.age = {
      ...(whereClause.age || {}),
      lte: currentPreferences.maxAge,
    }
  }

  /*
   * City filtering:
   *
   * If the current user selected a preferred city and is NOT open
   * to long distance, only profiles from that city are candidates.
   *
   * If openToLongDistance is true, city is not used as a restriction.
   */
  if (
    currentPreferences?.preferredCity &&
    currentPreferences.openToLongDistance !== true
  ) {
    whereClause.city = {
      equals: currentPreferences.preferredCity.trim(),
      mode: 'insensitive',
    }
    console.log('[Discovery] Applied city filter:', currentPreferences.preferredCity.trim())
  } else {
    console.log('[Discovery] City filter NOT applied:', {
      hasPreferredCity: !!currentPreferences?.preferredCity,
      openToLongDistance: currentPreferences?.openToLongDistance,
    })
  }

  console.log('[Discovery] Where clause:', JSON.stringify(whereClause, null, 2))

  const profiles = await prisma.profile.findMany({
    where: whereClause,
    include: {
      photos: {
        orderBy: {
          order: 'asc',
        },
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

    /*
     * Fetch all matching candidates before mutual filtering.
     * The final limit is applied AFTER filtering.
     */
  })

  console.log('[Discovery] Fetched profiles before mutual filtering:', profiles.length)
  console.log('[Discovery] Sample profiles cities:', profiles.slice(0, 5).map(p => ({ city: p.city, userId: p.userId })))

  /*
   * Mutual preference filtering.
   *
   * A candidate must also be compatible with the CURRENT USER
   * according to the candidate's own preferences.
   */
  const eligibleProfiles = profiles.filter((candidate) => {
    if (!candidate.user) {
      return false
    }

    /*
     * Safety check: never return an interacted/blocked user,
     * even if the database query somehow included them.
     */
    if (excludedUserIds.has(candidate.userId)) {
      return false
    }

    const candidatePreferences = candidate.preferences

    /*
     * No preferences means the candidate has no restrictions.
     */
    if (!candidatePreferences) {
      return true
    }

    /*
     * Candidate's preferred gender must accept the current user's gender.
     */
    if (
      candidatePreferences.preferredGender &&
      currentProfile.gender !== candidatePreferences.preferredGender
    ) {
      return false
    }

    /*
     * Candidate's preferred minimum age.
     */
    if (
      candidatePreferences.minAge !== null &&
      candidatePreferences.minAge !== undefined &&
      currentProfile.age < candidatePreferences.minAge
    ) {
      return false
    }

    /*
     * Candidate's preferred maximum age.
     */
    if (
      candidatePreferences.maxAge !== null &&
      candidatePreferences.maxAge !== undefined &&
      currentProfile.age > candidatePreferences.maxAge
    ) {
      return false
    }

    /*
     * Candidate's city preference.
     *
     * If candidate is NOT open to long distance, the current user
     * must be from the candidate's preferred city.
     */
    if (
      candidatePreferences.preferredCity &&
      candidatePreferences.openToLongDistance !== true
    ) {
      const candidatePreferredCity =
        candidatePreferences.preferredCity.trim().toLowerCase()

      const currentUserCity =
        currentProfile.city.trim().toLowerCase()

      if (candidatePreferredCity !== currentUserCity) {
        return false
      }
    }

    return true
  })

  /*
   * Apply the requested limit ONLY AFTER all filtering.
   *
   * This fixes the "No more Yenes nearby" problem caused by
   * taking only 10 candidates before filtering.
   */
  return eligibleProfiles
    .slice(0, Math.max(1, limit))
    .map((profile) => ({
      id: profile.id,
      userId: profile.userId,
      age: profile.age,
      gender: profile.gender,
      city: profile.city,
      bio: profile.bio,
      photos: profile.photos,
      interests: profile.interests,
      user: {
        id: profile.user.id,
        firstName: profile.user.firstName,
      },
    }))
}

export async function getNextDiscoveryProfile(
  currentUserId: string
): Promise<DiscoveryProfile | null> {
  const profiles = await getDiscoveryProfiles(currentUserId, 1)

  return profiles.length > 0 ? profiles[0] : null
}