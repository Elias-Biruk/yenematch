import { NextRequest, NextResponse } from 'next/server'
import { getDiscoveryProfiles } from '@/lib/services/discovery.service'
import { requireAuth } from '@/lib/auth/middleware'
import { handleError } from '@/lib/utils/errors'
import { prisma } from '@/lib/db/prisma'
import { ValidationError } from '@/lib/utils/errors'
import { discoveryQuerySchema } from '@/lib/validators/discovery.schema'

export async function GET(request: NextRequest) {
  try {
    const session = await requireAuth(request)
    
    // Check if user has completed onboarding
    const user = await prisma.user.findUnique({
      where: { id: session.userId },
      include: { profile: true },
    })

    if (!user?.profile || !user.profile.completedOnboarding) {
      throw new ValidationError('Please complete onboarding first')
    }
    
    // Parse and validate query parameters
    const { searchParams } = new URL(request.url)
    const query = Object.fromEntries(searchParams.entries())
    const validatedQuery = discoveryQuerySchema.parse(query)
    
    const profiles = await getDiscoveryProfiles(
      session.userId, 
      validatedQuery.limit || 10
    )
    
    return NextResponse.json({ profiles })
  } catch (error) {
    const { message, statusCode } = handleError(error)
    return NextResponse.json(
      { error: message },
      { status: statusCode }
    )
  }
}
