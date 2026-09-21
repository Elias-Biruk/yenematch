import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { getSession } from './session'
import { AuthenticationError } from '@/lib/utils/errors'

export async function requireAuth(_request: NextRequest) {
  const session = await getSession()
  
  if (!session) {
    throw new AuthenticationError('Authentication required')
  }
  
  return session
}

export function withAuth(handler: (request: NextRequest, session: any) => Promise<NextResponse>) {
  return async (request: NextRequest) => {
    try {
      const session = await requireAuth(request)
      return handler(request, session)
    } catch (error) {
      if (error instanceof AuthenticationError) {
        return NextResponse.json(
          { error: error.message },
          { status: error.statusCode }
        )
      }
      throw error
    }
  }
}
