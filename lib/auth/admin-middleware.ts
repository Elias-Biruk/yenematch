import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { getSession } from './session'
import { prisma } from '@/lib/db/prisma'
import { AuthorizationError } from '@/lib/utils/errors'
import { UserRole } from '@prisma/client'

export async function requireAdmin(request: NextRequest) {
  const session = await getSession()
  
  if (!session) {
    throw new AuthorizationError('Authentication required')
  }
  
  // Get user with role from database
  const user = await prisma.user.findUnique({
    where: { id: session.userId },
    select: { role: true },
  })
  
  if (!user) {
    throw new AuthorizationError('User not found')
  }
  
  // Check if user has admin role
  if (user.role !== UserRole.ADMIN && user.role !== UserRole.SUPER_ADMIN) {
    throw new AuthorizationError('Admin access required')
  }
  
  return session
}

export function withAdminAuth(handler: (request: NextRequest, session: any) => Promise<NextResponse>) {
  return async (request: NextRequest) => {
    try {
      const session = await requireAdmin(request)
      return handler(request, session)
    } catch (error) {
      if (error instanceof AuthorizationError) {
        return NextResponse.json(
          { error: error.message },
          { status: error.statusCode }
        )
      }
      throw error
    }
  }
}

export async function requireSuperAdmin(request: NextRequest) {
  const session = await getSession()
  
  if (!session) {
    throw new AuthorizationError('Authentication required')
  }
  
  // Get user with role from database
  const user = await prisma.user.findUnique({
    where: { id: session.userId },
    select: { role: true },
  })
  
  if (!user) {
    throw new AuthorizationError('User not found')
  }
  
  // Check if user has super admin role
  if (user.role !== UserRole.SUPER_ADMIN) {
    throw new AuthorizationError('Super admin access required')
  }
  
  return session
}
