import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/auth/admin-middleware'
import { handleError, ValidationError } from '@/lib/utils/errors'
import { suspendUser, unsuspendUser, banUser, unbanUser } from '@/lib/services/moderation.service'
import { z } from 'zod'

const moderationActionSchema = z.object({
  action: z.enum(['suspend', 'unsuspend', 'ban', 'unban']),
  reason: z.string().min(1).max(500),
})

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  try {
    const session = await requireAdmin(request)
    const { userId } = await params
    
    // Prevent self-moderation
    if (session.userId === userId) {
      return NextResponse.json(
        { error: 'Cannot moderate yourself' },
        { status: 400 }
      )
    }
    
    const body = await request.json()
    const { action, reason } = moderationActionSchema.parse(body)
    
    let result
    
    switch (action) {
      case 'suspend':
        result = await suspendUser(session.userId, userId, reason)
        break
      case 'unsuspend':
        result = await unsuspendUser(session.userId, userId, reason)
        break
      case 'ban':
        result = await banUser(session.userId, userId, reason)
        break
      case 'unban':
        result = await unbanUser(session.userId, userId, reason)
        break
      default:
        throw new ValidationError('Invalid action')
    }
    
    return NextResponse.json(result)
  } catch (error) {
    const { message, statusCode } = handleError(error)
    return NextResponse.json(
      { error: message },
      { status: statusCode }
    )
  }
}
