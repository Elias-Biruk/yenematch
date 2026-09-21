import { NextRequest, NextResponse } from 'next/server'
import { createLike } from '@/lib/services/matching.service'
import { requireAuth } from '@/lib/auth/middleware'
import { handleError } from '@/lib/utils/errors'
import { rateLimit } from '@/lib/utils/rate-limiter'
import { likeSchema } from '@/lib/validators/discovery.schema'

export async function POST(request: NextRequest) {
  try {
    const session = await requireAuth(request)
    
    // Rate limit: 20 likes per minute
    rateLimit(`likes:${session.userId}`, 20, 60000)
    
    const body = await request.json()
    const validatedData = likeSchema.parse(body)
    
    const result = await createLike(session.userId, validatedData.likedId)
    
    return NextResponse.json(result)
  } catch (error) {
    const { message, statusCode } = handleError(error)
    return NextResponse.json(
      { error: message },
      { status: statusCode }
    )
  }
}
