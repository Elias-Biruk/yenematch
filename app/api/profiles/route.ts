import { NextRequest, NextResponse } from 'next/server'
import {
  createProfile,
  getProfile,
} from '@/lib/services/profile.service'
import { createProfileSchema } from '@/lib/validators/profile.schema'
import { requireAuth } from '@/lib/auth/middleware'
import { handleError } from '@/lib/utils/errors'

export async function POST(request: NextRequest) {
  try {
    const session = await requireAuth(request)

    const body = await request.json()
    const validatedData = createProfileSchema.parse(body)

    const profile = await createProfile(
      session.userId,
      validatedData
    )

    return NextResponse.json(profile, { status: 201 })
  } catch (error) {
    console.error('[API POST /api/profiles] Error:', error)

    const { message, statusCode } = handleError(error)

    return NextResponse.json(
      { error: message },
      { status: statusCode }
    )
  }
}

export async function GET(request: NextRequest) {
  try {
    const session = await requireAuth(request)

    const profile = await getProfile(session.userId)

    return NextResponse.json(profile, { status: 200 })
  } catch (error) {
    console.error('[API GET /api/profiles] Error:', error)

    const { message, statusCode } = handleError(error)

    return NextResponse.json(
      { error: message },
      { status: statusCode }
    )
  }
}