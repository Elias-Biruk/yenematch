import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/auth/admin-middleware'
import { handleError } from '@/lib/utils/errors'
import { prisma } from '@/lib/db/prisma'
import { z } from 'zod'

const reportsQuerySchema = z.object({
  status: z.enum(['PENDING', 'REVIEWING', 'REVIEWED', 'RESOLVED', 'DISMISSED', 'ALL']).optional(),
  reason: z.enum(['FAKE_PROFILE', 'HARASSMENT', 'SPAM_SCAM', 'SEXUAL_CONTENT', 'HATE_OR_DISCRIMINATION', 'UNDERAGE_CONCERN', 'OTHER', 'ALL']).optional(),
  page: z.string().optional(),
  limit: z.string().optional(),
  sortBy: z.enum(['createdAt', 'reason', 'status']).optional(),
  sortOrder: z.enum(['asc', 'desc']).optional(),
})

export async function GET(request: NextRequest) {
  try {
    const session = await requireAdmin(request)
    
    const { searchParams } = new URL(request.url)
    const query = Object.fromEntries(searchParams.entries())
    const validatedQuery = reportsQuerySchema.parse(query)
    
    const page = parseInt(validatedQuery.page || '1')
    const limit = parseInt(validatedQuery.limit || '20')
    const skip = (page - 1) * limit
    
    const whereClause: any = {}
    
    if (validatedQuery.status && validatedQuery.status !== 'ALL') {
      whereClause.status = validatedQuery.status
    }
    
    if (validatedQuery.reason && validatedQuery.reason !== 'ALL') {
      whereClause.reason = validatedQuery.reason
    }
    
    // Sorting
    const orderBy: any = {}
    const sortBy = validatedQuery.sortBy || 'createdAt'
    const sortOrder = validatedQuery.sortOrder || 'desc'
    orderBy[sortBy] = sortOrder
    
    const [reports, total] = await Promise.all([
      prisma.report.findMany({
        where: whereClause,
        include: {
          reporter: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              username: true,
              role: true,
              profile: {
                select: {
                  moderationStatus: true,
                },
              },
            },
          },
          reported: {
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
        },
        orderBy,
        skip,
        take: limit,
      }),
      prisma.report.count({ where: whereClause }),
    ])
    
    return NextResponse.json({
      reports,
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
