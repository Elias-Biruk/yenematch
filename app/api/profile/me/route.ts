import { NextRequest, NextResponse } from 'next/server'
import { updateProfile, updateProfilePhotos, updateProfileInterests } from '@/lib/services/profile.service'
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
    
    // Return updated profile
    const { getProfile } = await import('@/lib/services/profile.service')
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
