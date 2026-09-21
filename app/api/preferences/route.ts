import { NextRequest, NextResponse } from 'next/server'
import { updateProfilePreferences } from '@/lib/services/profile.service'
import { preferencesSchema } from '@/lib/validators/profile.schema'
import { requireAuth } from '@/lib/auth/middleware'
import { handleError } from '@/lib/utils/errors'
import { enforcePayloadLimit } from '@/lib/utils/payload-limit'

export async function GET(request: NextRequest) {
  try {
    const session = await requireAuth(request)
    
    const { getProfile } = await import('@/lib/services/profile.service')
    const profile = await getProfile(session.userId)
    
    if (!profile.preferences) {
      return NextResponse.json({
        preferredGender: null,
        minAge: 18,
        maxAge: 100,
        preferredCity: null,
        relationshipIntention: null,
        openToLongDistance: false,
        smoking: null,
        drinking: null,
        childrenPreference: null,
        languages: [],
      })
    }
    
    return NextResponse.json(profile.preferences)
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
    const validatedData = preferencesSchema.parse(body)
    
    const preferences = await updateProfilePreferences(session.userId, validatedData)
    
    return NextResponse.json(preferences)
  } catch (error) {
    const { message, statusCode } = handleError(error)
    return NextResponse.json(
      { error: message },
      { status: statusCode }
    )
  }
}
