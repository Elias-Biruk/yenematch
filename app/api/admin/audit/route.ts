import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/auth/admin-middleware'
import { handleError } from '@/lib/utils/errors'
import { prisma } from '@/lib/db/prisma'
import { z } from 'zod'

const auditQuerySchema = z.object({
  action: z.string().optional(),
  targetId: z.string().optional(),
  page: z.string().optional(),
  limit: z.string().optional(),
})

export async function GET(request: NextRequest) {
  try {
    const session = await requireAdmin(request)
    
    const { searchParams } = new URL(request.url)
    const query = Object.fromEntries(searchParams.entries())
    const validatedQuery = auditQuerySchema.parse(query)
    
    const page = parseInt(validatedQuery.page || '1')
    const limit = parseInt(validatedQuery.limit || '50')
    const skip = (page - 1) * limit
    
    const whereClause: any = {}
    
    if (validatedQuery.action) {
      whereClause.action = validatedQuery.action
    }
    
    if (validatedQuery.targetId) {
      whereClause.targetId = validatedQuery.targetId
    }
    
    const [auditLogs, total] = await Promise.all([
      prisma.auditLog.findMany({
        where: whereClause,
        include: {
          admin: {
            select: {
              id: true,
              firstName: true,
            },
          },
          target: {
            select: {
              id: true,
              firstName: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.auditLog.count({ where: whereClause }),
    ])
    
    return NextResponse.json({
      auditLogs,
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
