import { NextRequest, NextResponse } from 'next/server'
import { createPass } from '@/lib/services/matching.service'
import { requireAuth } from '@/lib/auth/middleware'
import { handleError } from '@/lib/utils/errors'
import { rateLimit } from '@/lib/utils/rate-limiter'
import { passSchema } from '@/lib/validators/discovery.schema'

export async function POST(request: NextRequest) {
  try {
    const session = await requireAuth(request)
    
    // Rate limit: 30 passes per minute
    rateLimit(`passes:${session.userId}`, 30, 60000)
    
    const body = await request.json()
    const validatedData = passSchema.parse(body)
    
    const result = await createPass(session.userId, validatedData.passedId)
    
    return NextResponse.json(result)
  } catch (error) {
    const { message, statusCode } = handleError(error)
    return NextResponse.json(
      { error: message },
      { status: statusCode }
    )
  }
}
