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
  gender: z.enum(['MALE', 'FEMALE', 'OTHER', 'ALL']).optional(),
  userType: z.enum(['REAL', 'SEED', 'ALL']).optional(),
  role: z.enum(['USER', 'ADMIN', 'SUPER_ADMIN', 'ALL']).optional(),
  page: z.string().optional(),
  limit: z.string().optional(),
  sortBy: z.enum(['createdAt', 'firstName', 'age', 'city']).optional(),
  sortOrder: z.enum(['asc', 'desc']).optional(),
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
    
    const SEED_USERNAME_PREFIX = 'seed_user_'
    const TELEGRAM_ID_OFFSET = 900000000
    const TELEGRAM_ID_OFFSET_STR = String(TELEGRAM_ID_OFFSET)
    
    const whereClause: any = {}
    
    // Search filter
    if (validatedQuery.search) {
      whereClause.OR = [
        { firstName: { contains: validatedQuery.search, mode: 'insensitive' } },
        { lastName: { contains: validatedQuery.search, mode: 'insensitive' } },
        { username: { contains: validatedQuery.search, mode: 'insensitive' } },
      ]
    }
    
    // Status filter
    if (validatedQuery.status && validatedQuery.status !== 'ALL') {
      if (!whereClause.profile) {
        whereClause.profile = {}
      }
      whereClause.profile.moderationStatus = validatedQuery.status
    }
    
    // Onboarding filter
    if (validatedQuery.onboarding && validatedQuery.onboarding !== 'ALL') {
      if (!whereClause.profile) {
        whereClause.profile = {}
      }
      whereClause.profile.completedOnboarding = validatedQuery.onboarding === 'COMPLETED'
    }
    
    // City filter
    if (validatedQuery.city) {
      if (!whereClause.profile) {
        whereClause.profile = {}
      }
      whereClause.profile.city = { contains: validatedQuery.city, mode: 'insensitive' }
    }
    
    // Gender filter
    if (validatedQuery.gender && validatedQuery.gender !== 'ALL') {
      if (!whereClause.profile) {
        whereClause.profile = {}
      }
      whereClause.profile.gender = validatedQuery.gender
    }
    
    // User type filter (seed vs real)
    if (validatedQuery.userType && validatedQuery.userType !== 'ALL') {
      if (validatedQuery.userType === 'SEED') {
        whereClause.OR = [
          { username: { startsWith: SEED_USERNAME_PREFIX } },
          { telegramId: { gte: TELEGRAM_ID_OFFSET_STR } },
        ]
      } else if (validatedQuery.userType === 'REAL') {
        whereClause.AND = [
          { username: { not: { startsWith: SEED_USERNAME_PREFIX } } },
          { telegramId: { lt: TELEGRAM_ID_OFFSET_STR } },
        ]
      }
    }
    
    // Role filter
    if (validatedQuery.role && validatedQuery.role !== 'ALL') {
      whereClause.role = validatedQuery.role
    }
    
    // Sorting
    const orderBy: any = {}
    const sortBy = validatedQuery.sortBy || 'createdAt'
    const sortOrder = validatedQuery.sortOrder || 'desc'
    
    if (sortBy === 'age') {
      orderBy.profile = { age: sortOrder }
    } else if (sortBy === 'city') {
      orderBy.profile = { city: sortOrder }
    } else {
      orderBy[sortBy] = sortOrder
    }
    
    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where: whereClause,
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
              moderationStatus: true,
              completedOnboarding: true,
              createdAt: true,
            },
          },
        },
        orderBy,
        skip,
        take: limit,
      }),
      prisma.user.count({ where: whereClause }),
    ])
    
    // Add seed detection flag to each user
    const usersWithSeedFlag = users.map(user => ({
      ...user,
      isSeed: user.username?.startsWith(SEED_USERNAME_PREFIX) || 
              parseInt(user.telegramId) >= TELEGRAM_ID_OFFSET
    }))
    
    return NextResponse.json({
      users: usersWithSeedFlag,
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
