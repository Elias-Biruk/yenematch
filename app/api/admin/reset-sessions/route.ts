import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth/middleware'
import { requireSuperAdminRole } from '@/lib/services/admin.service'
import { handleError } from '@/lib/utils/errors'
import { prisma } from '@/lib/db/prisma'

export async function POST(request: NextRequest) {
  try {
    const session = await requireAuth(request)
    
    // Only super admin can reset all sessions
    await requireSuperAdminRole(session.userId)

    // Increment sessionVersion for all users, invalidating all existing sessions
    const result = await prisma.user.updateMany({
      data: {
        sessionVersion: {
          increment: 1,
        },
      },
    })

    return NextResponse.json({ 
      success: true,
      message: `Successfully reset ${result.count} user sessions. Users will need to re-authenticate on their next request.` 
    })
  } catch (error) {
    const { message, statusCode } = handleError(error)
    return NextResponse.json(
      { error: message },
      { status: statusCode }
    )
  }
}
