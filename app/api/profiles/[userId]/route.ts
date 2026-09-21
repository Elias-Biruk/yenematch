import { NextRequest, NextResponse } from 'next/server'
import { getProfile } from '@/lib/services/profile.service'
import { updateProfile } from '@/lib/services/profile.service'
import { updateProfileSchema } from '@/lib/validators/profile.schema'
import { requireAuth } from '@/lib/auth/middleware'
import { handleError, AuthorizationError } from '@/lib/utils/errors'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  try {
    const session = await requireAuth(request)
    const { userId } = await params

    const profile = await getProfile(userId)

    // Return only public information
    const publicProfile = {
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
      // Include public preferences if they exist
      preferences: profile.preferences ? {
        preferredGender: profile.preferences.preferredGender,
        minAge: profile.preferences.minAge,
        maxAge: profile.preferences.maxAge,
        preferredCity: profile.preferences.preferredCity,
        openToLongDistance: profile.preferences.openToLongDistance,
      } : null,
    }

    return NextResponse.json(publicProfile)
  } catch (error) {
    const { message, statusCode } = handleError(error)
    return NextResponse.json(
      { error: message },
      { status: statusCode }
    )
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  try {
    const session = await requireAuth(request)
    const { userId } = await params

    if (session.userId !== userId) {
      throw new AuthorizationError('You can only update your own profile')
    }

    const body = await request.json()
    const validatedData = updateProfileSchema.parse(body)

    const profile = await updateProfile(session.userId, validatedData)

    return NextResponse.json(profile)
  } catch (error) {
    const { message, statusCode } = handleError(error)
    return NextResponse.json(
      { error: message },
      { status: statusCode }
    )
  }
}
