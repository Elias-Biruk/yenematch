import { NextRequest, NextResponse } from 'next/server'
import { updateProfile, updateProfilePhotos, updateProfileInterests, updateProfilePreferences, getProfile } from '@/lib/services/profile.service'
import { updateProfileSchema } from '@/lib/validators/profile.schema'
import { requireAuth } from '@/lib/auth/middleware'
import { handleError } from '@/lib/utils/errors'
import { enforcePayloadLimit } from '@/lib/utils/payload-limit'

export async function GET(request: NextRequest) {
  try {
    const session = await requireAuth(request)

    // Use the existing getProfile function from profile.service
    const { getProfile } = await import('@/lib/services/profile.service')
    const profile = await getProfile(session.userId)

    return NextResponse.json(profile)
  } catch (error) {
    const { message, statusCode } = handleError(error)
    return NextResponse.json(
      { error: message },
      { status: statusCode }
    )
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const session = await requireAuth(request)

    // Enforce payload limit (1MB)
    enforcePayloadLimit(request)

    const body = await request.json()
    const validatedData = updateProfileSchema.parse(body)
    
    // Update user name if provided
    if (validatedData.firstName || validatedData.lastName) {
      const { prisma } = await import('@/lib/db/prisma')
      await prisma.user.update({
        where: { id: session.userId },
        data: {
          ...(validatedData.firstName && { firstName: validatedData.firstName }),
          ...(validatedData.lastName !== undefined && { lastName: validatedData.lastName }),
        },
      })
    }
    
    // Update basic profile fields
    await updateProfile(session.userId, validatedData)
    
    // Update photos if provided
    if (validatedData.photos) {
      await updateProfilePhotos(session.userId, validatedData.photos)
    }
    
    // Update interests if provided
    if (validatedData.interests) {
      await updateProfileInterests(session.userId, validatedData.interests)
    }

    // Update preferences if provided
    if (validatedData.preferredGender || validatedData.minAge || validatedData.maxAge ||
        validatedData.preferredCity || validatedData.relationshipIntention ||
        validatedData.openToLongDistance !== undefined || validatedData.smoking ||
        validatedData.drinking || validatedData.childrenPreference || validatedData.languages) {
      await updateProfilePreferences(session.userId, {
        preferredGender: validatedData.preferredGender,
        minAge: validatedData.minAge,
        maxAge: validatedData.maxAge,
        preferredCity: validatedData.preferredCity,
        relationshipIntention: validatedData.relationshipIntention,
        openToLongDistance: validatedData.openToLongDistance,
        smoking: validatedData.smoking,
        drinking: validatedData.drinking,
        childrenPreference: validatedData.childrenPreference,
        languages: validatedData.languages,
      })
    }
    
    // Return updated profile
    const updatedProfile = await getProfile(session.userId)
    
    return NextResponse.json(updatedProfile)
  } catch (error) {
    const { message, statusCode } = handleError(error)
    return NextResponse.json(
      { error: message },
      { status: statusCode }
    )
  }
}
