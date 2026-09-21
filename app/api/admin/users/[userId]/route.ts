import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/auth/admin-middleware'
import { handleError } from '@/lib/utils/errors'
import { prisma } from '@/lib/db/prisma'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  try {
    const session = await requireAdmin(request)
    const { userId } = await params
    
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        username: true,
        role: true,
        createdAt: true,
        updatedAt: true,
        profile: {
          select: {
            id: true,
            age: true,
            gender: true,
            city: true,
            bio: true,
            moderationStatus: true,
            completedOnboarding: true,
            createdAt: true,
            updatedAt: true,
            photos: {
              select: {
                id: true,
                url: true,
                order: true,
                isPrimary: true,
              },
              orderBy: { order: 'asc' },
            },
            interests: {
              select: {
                id: true,
                name: true,
              },
            },
            preferences: {
              select: {
                id: true,
                preferredGender: true,
                minAge: true,
                maxAge: true,
                preferredCity: true,
                relationshipIntention: true,
                openToLongDistance: true,
                smoking: true,
                drinking: true,
                childrenPreference: true,
                languages: true,
              },
            },
          },
        },
      },
    })
    
    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }
    
    return NextResponse.json(user)
  } catch (error) {
    const { message, statusCode } = handleError(error)
    return NextResponse.json(
      { error: message },
      { status: statusCode }
    )
  }
}
