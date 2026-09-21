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
    console.log('[API PATCH /api/profile/me] Request body:', body)
    
    const validatedData = updateProfileSchema.parse(body)
    console.log('[API PATCH /api/profile/me] Validated data:', validatedData)
    
    // Update basic profile fields (including firstName/lastName via service)
    const updatedProfile = await updateProfile(session.userId, validatedData)
    console.log('[API PATCH /api/profile/me] Updated profile city:', updatedProfile.city)
    
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
    const finalProfile = await getProfile(session.userId)
    console.log('[API PATCH /api/profile/me] Final profile city:', finalProfile.city)
    
    return NextResponse.json(finalProfile)
  } catch (error) {
    console.error('[API PATCH /api/profile/me] Error:', error)
    const { message, statusCode } = handleError(error)
    return NextResponse.json(
      { error: message },
      { status: statusCode }
    )
  }
}
