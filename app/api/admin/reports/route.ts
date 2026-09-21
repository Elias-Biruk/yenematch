import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/auth/admin-middleware'
import { handleError } from '@/lib/utils/errors'
import { prisma } from '@/lib/db/prisma'
import { z } from 'zod'

const reportsQuerySchema = z.object({
  status: z.enum(['PENDING', 'REVIEWING', 'REVIEWED', 'RESOLVED', 'DISMISSED', 'ALL']).optional(),
  page: z.string().optional(),
  limit: z.string().optional(),
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
    
    const [reports, total] = await Promise.all([
      prisma.report.findMany({
        where: whereClause,
        include: {
          reporter: {
            select: {
              id: true,
              firstName: true,
            },
          },
          reported: {
            select: {
              id: true,
              firstName: true,
              profile: {
                select: {
                  id: true,
                  moderationStatus: true,
                },
              },
            },
          },
        },
        orderBy: { createdAt: 'desc' },
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
