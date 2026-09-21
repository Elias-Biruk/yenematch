import { NextRequest, NextResponse } from 'next/server'
import { getUserMatchesWithMessages } from '@/lib/services/messaging.service'
import { requireAuth } from '@/lib/auth/middleware'
import { handleError } from '@/lib/utils/errors'

export async function GET(request: NextRequest) {
  try {
    const session = await requireAuth(request)
    
    const matches = await getUserMatchesWithMessages(session.userId)
    
    return NextResponse.json(matches)
  } catch (error) {
    const { message, statusCode } = handleError(error)
    return NextResponse.json(
      { error: message },
      { status: statusCode }
    )
  }
}
