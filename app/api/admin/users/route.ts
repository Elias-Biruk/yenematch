import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/auth/admin-middleware'
import { handleError } from '@/lib/utils/errors'
import { prisma } from '@/lib/db/prisma'
import { z } from 'zod'

const usersQuerySchema = z.object({
  search: z.string().optional(),
  status: z.enum(['ACTIVE', 'SUSPENDED', 'BANNED', 'ALL']).optional(),
  onboarding: z.enum(['COMPLETED', 'NOT_COMPLETED', 'ALL']).optional(),
  city: z.string().optional(),
  page: z.string().optional(),
  limit: z.string().optional(),
})

export async function GET(request: NextRequest) {
  try {
    const session = await requireAdmin(request)
    
    const { searchParams } = new URL(request.url)
    const query = Object.fromEntries(searchParams.entries())
    const validatedQuery = usersQuerySchema.parse(query)
    
    const page = parseInt(validatedQuery.page || '1')
    const limit = parseInt(validatedQuery.limit || '20')
    const skip = (page - 1) * limit
    
    const whereClause: any = {}
    
    if (validatedQuery.search) {
      whereClause.OR = [
        { firstName: { contains: validatedQuery.search, mode: 'insensitive' } },
        { lastName: { contains: validatedQuery.search, mode: 'insensitive' } },
        { username: { contains: validatedQuery.search, mode: 'insensitive' } },
      ]
    }
    
    if (validatedQuery.status && validatedQuery.status !== 'ALL') {
      whereClause.profile = {
        moderationStatus: validatedQuery.status,
      }
    }
    
    if (validatedQuery.onboarding && validatedQuery.onboarding !== 'ALL') {
      if (!whereClause.profile) {
        whereClause.profile = {}
      }
      whereClause.profile.completedOnboarding = validatedQuery.onboarding === 'COMPLETED'
    }
    
    if (validatedQuery.city) {
      if (!whereClause.profile) {
        whereClause.profile = {}
      }
      whereClause.profile.city = { contains: validatedQuery.city, mode: 'insensitive' }
    }
    
    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where: whereClause,
        select: {
          id: true,
          firstName: true,
          lastName: true,
          username: true,
          role: true,
          createdAt: true,
          profile: {
            select: {
              id: true,
              age: true,
              gender: true,
              city: true,
              moderationStatus: true,
              completedOnboarding: true,
              createdAt: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.user.count({ where: whereClause }),
    ])
    
    return NextResponse.json({
      users,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    })
  } catch (error) {
    const { message, statusCode } = handleError(error)
    return NextResponse.json(
      { error: message },
      { status: statusCode }
    )
  }
}
