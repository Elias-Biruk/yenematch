import { NextRequest, NextResponse } from 'next/server'
import { deleteLike } from '@/lib/services/matching.service'
import { requireAuth } from '@/lib/auth/middleware'
import { handleError } from '@/lib/utils/errors'

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await requireAuth(request)
    const { id } = await params
    
    const result = await deleteLike(session.userId, id)
    
    return NextResponse.json(result)
  } catch (error) {
    const { message, statusCode } = handleError(error)
    return NextResponse.json(
      { error: message },
      { status: statusCode }
    )
  }
}
