import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin, requireSuperAdmin } from '@/lib/auth/admin-middleware'
import { handleError, ValidationError } from '@/lib/utils/errors'
import { prisma } from '@/lib/db/prisma'
import { UserRole, ModerationAction } from '@prisma/client'
import { z } from 'zod'

const roleUpdateSchema = z.object({
  role: z.enum([UserRole.USER, UserRole.ADMIN, UserRole.SUPER_ADMIN]),
  reason: z.string().min(1).max(500),
})

const profileUpdateSchema = z.object({
  city: z.string().min(1).max(100).trim().optional(),
  bio: z.string().max(500).trim().optional(),
  age: z.number().int().min(18).max(100).optional(),
  gender: z.enum(['MALE', 'FEMALE', 'OTHER']).optional(),
})

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
        telegramId: true,
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
        _count: {
          select: {
            sentLikes: true,
            receivedLikes: true,
            sentPasses: true,
            receivedPasses: true,
            matches1: true,
            matches2: true,
            sentMessages: true,
            receivedMessages: true,
            sentReports: true,
            receivedReports: true,
            blockedUsers: true,
            blockedBy: true,
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
    
    // Add seed detection
    const SEED_USERNAME_PREFIX = 'seed_user_'
    const TELEGRAM_ID_OFFSET = 900000000
    const isSeed = user.username?.startsWith(SEED_USERNAME_PREFIX) || 
                   parseInt(user.telegramId) >= TELEGRAM_ID_OFFSET
    
    return NextResponse.json({ ...user, isSeed })
  } catch (error) {
    const { message, statusCode } = handleError(error)
    return NextResponse.json(
      { error: message },
      { status: statusCode }
    )
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  try {
    const session = await requireSuperAdmin(request)
    const { userId } = await params
    
    // Prevent self-role modification
    if (session.userId === userId) {
      return NextResponse.json(
        { error: 'Cannot modify your own role' },
        { status: 400 }
      )
    }
    
    const body = await request.json()
    const { role, reason } = roleUpdateSchema.parse(body)
    
    const targetUser = await prisma.user.findUnique({
      where: { id: userId },
      select: { role: true },
    })
    
    if (!targetUser) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }
    
    // Update user role
    await prisma.user.update({
      where: { id: userId },
      data: { role },
    })
    
    // Create audit log
    const auditAction = role === UserRole.ADMIN ? ModerationAction.ADMIN_ROLE_GRANTED : 
                        role === UserRole.USER ? ModerationAction.ADMIN_ROLE_REVOKED : 
                        ModerationAction.ADMIN_ROLE_GRANTED
    
    await prisma.auditLog.create({
      data: {
        adminId: session.userId,
        targetId: userId,
        action: auditAction,
        reason,
        metadata: JSON.stringify({
          oldRole: targetUser.role,
          newRole: role,
        }),
      },
    })
    
    return NextResponse.json({ success: true, role })
  } catch (error) {
    const { message, statusCode } = handleError(error)
    return NextResponse.json(
      { error: message },
      { status: statusCode }
    )
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  try {
    const session = await requireAdmin(request)
    const { userId } = await params
    
    const body = await request.json()
    const validatedData = profileUpdateSchema.parse(body)
    
    console.log('[Admin PUT /api/admin/users/[userId]] Update profile data:', validatedData)
    
    // Check if user has a profile
    const targetUser = await prisma.user.findUnique({
      where: { id: userId },
      select: { profile: true },
    })
    
    if (!targetUser) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }
    
    if (!targetUser.profile) {
      return NextResponse.json(
        { error: 'User has no profile' },
        { status: 400 }
      )
    }
    
    // Update profile fields
    const updateData: any = {}
    if (validatedData.city !== undefined) updateData.city = validatedData.city
    if (validatedData.bio !== undefined) updateData.bio = validatedData.bio
    if (validatedData.age !== undefined) updateData.age = validatedData.age
    if (validatedData.gender !== undefined) updateData.gender = validatedData.gender
    
    console.log('[Admin PUT /api/admin/users/[userId]] Prisma update data:', updateData)
    
    const updatedProfile = await prisma.profile.update({
      where: { userId },
      data: updateData,
      select: {
        id: true,
        city: true,
        bio: true,
        age: true,
        gender: true,
      },
    })
    
    console.log('[Admin PUT /api/admin/users/[userId]] Updated profile from DB:', updatedProfile)
    
    return NextResponse.json({ success: true, profile: updatedProfile })
  } catch (error) {
    console.error('[Admin PUT /api/admin/users/[userId]] Error:', error)
    const { message, statusCode } = handleError(error)
    return NextResponse.json(
      { error: message },
      { status: statusCode }
    )
  }
}
