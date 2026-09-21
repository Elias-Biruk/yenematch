import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/auth/admin-middleware'
import { handleError } from '@/lib/utils/errors'
import { prisma } from '@/lib/db/prisma'
import { z } from 'zod'

const matchesQuerySchema = z.object({
  status: z.enum(['ACTIVE', 'UNMATCHED', 'BLOCKED', 'ALL']).optional(),
  page: z.string().optional(),
  limit: z.string().optional(),
  sortBy: z.enum(['createdAt', 'status']).optional(),
  sortOrder: z.enum(['asc', 'desc']).optional(),
})

export async function GET(request: NextRequest) {
  try {
    const session = await requireAdmin(request)
    
    const { searchParams } = new URL(request.url)
    const query = Object.fromEntries(searchParams.entries())
    const validatedQuery = matchesQuerySchema.parse(query)
    
    const page = parseInt(validatedQuery.page || '1')
    const limit = parseInt(validatedQuery.limit || '20')
    const skip = (page - 1) * limit
    
    const whereClause: any = {}
    
    if (validatedQuery.status && validatedQuery.status !== 'ALL') {
      whereClause.status = validatedQuery.status
    }
    
    // Sorting
    const orderBy: any = {}
    const sortBy = validatedQuery.sortBy || 'createdAt'
    const sortOrder = validatedQuery.sortOrder || 'desc'
    orderBy[sortBy] = sortOrder
    
    const [matches, total] = await Promise.all([
      prisma.match.findMany({
        where: whereClause,
        include: {
          user1: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              username: true,
              role: true,
              profile: {
                select: {
                  id: true,
                  age: true,
                  gender: true,
                  city: true,
                  moderationStatus: true,
                },
              },
            },
          },
          user2: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              username: true,
              role: true,
              profile: {
                select: {
                  id: true,
                  age: true,
                  gender: true,
                  city: true,
                  moderationStatus: true,
                },
              },
            },
          },
          _count: {
            select: {
              messages: true,
            },
          },
        },
        orderBy,
        skip,
        take: limit,
      }),
      prisma.match.count({ where: whereClause }),
    ])
    
    return NextResponse.json({
      matches,
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
