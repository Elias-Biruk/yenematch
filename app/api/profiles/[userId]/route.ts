import { NextRequest, NextResponse } from 'next/server'
import { updateProfile } from '@/lib/services/profile.service'
import { updateProfileSchema } from '@/lib/validators/profile.schema'
import { requireAuth } from '@/lib/auth/middleware'
import { handleError, AuthorizationError } from '@/lib/utils/errors'

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
