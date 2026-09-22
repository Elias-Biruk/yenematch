import { prisma } from '@/lib/db/prisma'
import { ValidationError, NotFoundError } from '@/lib/utils/errors'
import type { CreateProfileInput, UpdateProfileInput } from '@/lib/validators/profile.schema'

export async function createProfile(userId: string, data: CreateProfileInput) {
  // Verify user exists before updating
  const user = await prisma.user.findUnique({
    where: { id: userId },
  })

  if (!user) {
    throw new NotFoundError('User')
  }

  // Update user's name if provided
  if (data.firstName || data.lastName) {
    await prisma.user.update({
      where: { id: userId },
      data: {
        ...(data.firstName && { firstName: data.firstName }),
        ...(data.lastName && { lastName: data.lastName }),
      },
    })
  }

  // Check if profile already exists (may have been created by photo upload)
  const existingProfile = await prisma.profile.findUnique({
    where: { userId },
    include: {
      photos: true,
      interests: true,
      preferences: true,
    },
  })

  if (existingProfile) {
    // Update existing profile instead of creating new one
    const updatedProfile = await prisma.profile.update({
      where: { userId },
      data: {
        age: data.age,
        gender: data.gender,
        city: data.city,
        bio: data.bio,
        completedOnboarding: true,
      },
      include: {
        photos: true,
        interests: true,
        preferences: true,
      },
    })

    // Handle photos - only update if new photos are provided
    if (data.photos && data.photos.length > 0) {
      await prisma.photo.deleteMany({
        where: { profileId: existingProfile.id },
      })

      await prisma.photo.createMany({
        data: data.photos.map((photo) => ({
          profileId: existingProfile.id,
          url: photo.url,
          order: photo.order,
          isPrimary: photo.isPrimary,
        })),
      })
    }

    // Handle interests
    if (data.interests) {
      await prisma.interest.deleteMany({
        where: { profileId: existingProfile.id },
      })

      if (data.interests.length > 0) {
        await prisma.interest.createMany({
          data: data.interests.map((name) => ({
            profileId: existingProfile.id,
            name,
          })),
        })
      }
    }

    // Handle preferences
    if (data.preferredGender || data.minAge || data.maxAge || data.preferredCity ||
        data.relationshipIntention || data.openToLongDistance || data.smoking ||
        data.drinking || data.childrenPreference || data.languages) {
      if (existingProfile.preferences) {
        await prisma.preference.update({
          where: { profileId: existingProfile.id },
          data: {
            preferredGender: data.preferredGender,
            minAge: data.minAge || 18,
            maxAge: data.maxAge || 100,
            preferredCity: data.preferredCity,
            relationshipIntention: data.relationshipIntention,
            openToLongDistance: data.openToLongDistance,
            smoking: data.smoking,
            drinking: data.drinking,
            childrenPreference: data.childrenPreference,
            languages: data.languages,
          },
        })
      } else {
        await prisma.preference.create({
          data: {
            profileId: existingProfile.id,
            preferredGender: data.preferredGender,
            minAge: data.minAge || 18,
            maxAge: data.maxAge || 100,
            preferredCity: data.preferredCity,
            relationshipIntention: data.relationshipIntention,
            openToLongDistance: data.openToLongDistance,
            smoking: data.smoking,
            drinking: data.drinking,
            childrenPreference: data.childrenPreference,
            languages: data.languages,
          },
        })
      }
    }

    return getProfile(userId)
  }

  // Create new profile if it doesn't exist
  const profile = await prisma.profile.create({
    data: {
      userId,
      age: data.age,
      gender: data.gender,
      city: data.city,
      bio: data.bio,
      completedOnboarding: true,
      photos: data.photos
        ? {
            create: data.photos.map((photo) => ({
              url: photo.url,
              order: photo.order,
              isPrimary: photo.isPrimary,
            })),
          }
        : undefined,
      interests: data.interests
        ? {
            create: data.interests.map((name) => ({ name })),
          }
        : undefined,
      preferences: data.preferredGender || data.minAge || data.maxAge || data.preferredCity ||
                     data.relationshipIntention || data.openToLongDistance || data.smoking ||
                     data.drinking || data.childrenPreference || data.languages
        ? {
            create: {
              preferredGender: data.preferredGender,
              minAge: data.minAge || 18,
              maxAge: data.maxAge || 100,
              preferredCity: data.preferredCity,
              relationshipIntention: data.relationshipIntention,
              openToLongDistance: data.openToLongDistance,
              smoking: data.smoking,
              drinking: data.drinking,
              childrenPreference: data.childrenPreference,
              languages: data.languages,
            },
          }
        : undefined,
    },
    include: {
      photos: true,
      interests: true,
      preferences: true,
    },
  })

  return profile
}

export async function getProfile(userId: string) {
  const profile = await prisma.profile.findUnique({
    where: { userId },
    include: {
      photos: {
        orderBy: { order: 'asc' },
      },
      interests: true,
      preferences: true,
      user: {
        select: {
          id: true,
          firstName: true,
        },
      },
    },
  })

  if (!profile) {
    throw new NotFoundError('Profile')
  }

  return profile
}

export async function updateProfile(userId: string, data: UpdateProfileInput) {
  console.log('[Service updateProfile] Input data:', data)
  console.log('[Service updateProfile] City value:', data.city, 'Type:', typeof data.city)

  // Update user name if provided
  if (data.firstName || data.lastName) {
    await prisma.user.update({
      where: { id: userId },
      data: {
        ...(data.firstName && { firstName: data.firstName }),
        ...(data.lastName !== undefined && { lastName: data.lastName }),
      },
    })
  }

  const updateData: any = {
    ...(data.age !== undefined && { age: data.age }),
    ...(data.gender !== undefined && { gender: data.gender }),
    ...(data.city !== undefined && { city: data.city }),
    ...(data.bio !== undefined && { bio: data.bio }),
  }
  
  console.log('[Service updateProfile] Prisma update data:', updateData)

  const profile = await prisma.profile.update({
    where: { userId },
    data: updateData,
    include: {
      photos: {
        orderBy: { order: 'asc' },
      },
      interests: true,
      preferences: true,
      user: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
        },
      },
    },
  })

  console.log('[Service updateProfile] Updated profile city from DB:', profile.city)

  return profile
}

export async function updateProfilePhotos(userId: string, photos: Array<{ url: string; order: number; isPrimary: boolean }>) {
  const profile = await prisma.profile.findUnique({ where: { userId } })
  if (!profile) {
    throw new NotFoundError('Profile')
  }

  await prisma.photo.deleteMany({
    where: { profile: { userId } },
  })

  await prisma.photo.createMany({
    data: photos.map((photo) => ({
      profileId: profile.id,
      url: photo.url,
      order: photo.order,
      isPrimary: photo.isPrimary,
    })),
  })

  return getProfile(userId)
}

export async function updateProfileInterests(userId: string, interests: string[]) {
  console.log('[Service updateProfileInterests] Input interests:', interests)
  
  const profile = await prisma.profile.findUnique({ where: { userId } })
  if (!profile) {
    throw new NotFoundError('Profile')
  }

  await prisma.interest.deleteMany({
    where: { profile: { userId } },
  })

  if (interests && interests.length > 0) {
    await prisma.interest.createMany({
      data: interests.map((name) => ({
        profileId: profile.id,
        name,
      })),
    })
  }

  console.log('[Service updateProfileInterests] Updated interests count:', interests?.length || 0)
  
  return getProfile(userId)
}

export async function updateProfilePreferences(userId: string, data: {
  preferredGender?: 'MALE' | 'FEMALE' | 'OTHER'
  minAge?: number
  maxAge?: number
  preferredCity?: string
  relationshipIntention?: string
  openToLongDistance?: boolean
  smoking?: string
  drinking?: string
  childrenPreference?: string
  languages?: string[]
}) {
  const profile = await prisma.profile.findUnique({
    where: { userId },
    include: { preferences: true },
  })

  if (!profile) {
    throw new NotFoundError('Profile')
  }

  if (profile.preferences) {
    await prisma.preference.update({
      where: { profileId: profile.id },
      data: {
        ...(data.preferredGender !== undefined && { preferredGender: data.preferredGender }),
        ...(data.minAge !== undefined && { minAge: data.minAge }),
        ...(data.maxAge !== undefined && { maxAge: data.maxAge }),
        ...(data.preferredCity !== undefined && { preferredCity: data.preferredCity }),
        ...(data.relationshipIntention !== undefined && { relationshipIntention: data.relationshipIntention as any }),
        ...(data.openToLongDistance !== undefined && { openToLongDistance: data.openToLongDistance }),
        ...(data.smoking !== undefined && { smoking: data.smoking as any }),
        ...(data.drinking !== undefined && { drinking: data.drinking as any }),
        ...(data.childrenPreference !== undefined && { childrenPreference: data.childrenPreference as any }),
        ...(data.languages !== undefined && { languages: data.languages }),
      },
    })
  } else {
    await prisma.preference.create({
      data: {
        profileId: profile.id,
        preferredGender: data.preferredGender,
        minAge: data.minAge || 18,
        maxAge: data.maxAge || 100,
        preferredCity: data.preferredCity,
        relationshipIntention: data.relationshipIntention as any,
        openToLongDistance: data.openToLongDistance || false,
        smoking: data.smoking as any,
        drinking: data.drinking as any,
        childrenPreference: data.childrenPreference as any,
        languages: data.languages || [],
      },
    })
  }

  return getProfile(userId)
}

export async function deleteProfile(userId: string) {
  await prisma.profile.delete({
    where: { userId },
  })
}

export async function hasCompletedOnboarding(userId: string): Promise<boolean> {
  const profile = await prisma.profile.findUnique({
    where: { userId },
    select: { completedOnboarding: true },
  })

  return profile?.completedOnboarding || false
}
