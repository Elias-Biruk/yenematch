import { NextRequest, NextResponse } from 'next/server'
import {
  updateProfile,
  updateProfilePhotos,
  updateProfileInterests,
  updateProfilePreferences,
  getProfile,
} from '@/lib/services/profile.service'
import { updateProfileSchema } from '@/lib/validators/profile.schema'
import { requireAuth } from '@/lib/auth/middleware'
import { handleError } from '@/lib/utils/errors'
import { enforcePayloadLimit } from '@/lib/utils/payload-limit'

export async function GET(request: NextRequest) {
  try {
    const session = await requireAuth(request)
    const profile = await getProfile(session.userId)

    return NextResponse.json(profile, { status: 200 })
  } catch (error) {
    console.error('[API GET /api/profile/me] Error:', error)

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

    enforcePayloadLimit(request)

    const body = await request.json()
    const validatedData = updateProfileSchema.parse(body)

    const updatedProfile = await updateProfile(
      session.userId,
      validatedData
    )

    if (validatedData.photos !== undefined) {
      await updateProfilePhotos(
        session.userId,
        validatedData.photos
      )
    }

    if (validatedData.interests !== undefined) {
      await updateProfileInterests(
        session.userId,
        validatedData.interests
      )
    }

    const hasPreferenceUpdates =
      validatedData.preferredGender !== undefined ||
      validatedData.minAge !== undefined ||
      validatedData.maxAge !== undefined ||
      validatedData.preferredCity !== undefined ||
      validatedData.relationshipIntention !== undefined ||
      validatedData.openToLongDistance !== undefined ||
      validatedData.smoking !== undefined ||
      validatedData.drinking !== undefined ||
      validatedData.childrenPreference !== undefined ||
      validatedData.languages !== undefined

    if (hasPreferenceUpdates) {
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

    const finalProfile = await getProfile(session.userId)

    return NextResponse.json(finalProfile, { status: 200 })
  } catch (error) {
    console.error('[API PATCH /api/profile/me] Error:', error)

    const { message, statusCode } = handleError(error)

    return NextResponse.json(
      { error: message },
      { status: statusCode }
    )
  }
}