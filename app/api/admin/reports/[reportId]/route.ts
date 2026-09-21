import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/auth/admin-middleware'
import { handleError } from '@/lib/utils/errors'
import { prisma } from '@/lib/db/prisma'
import { z } from 'zod'
import { ModerationAction } from '@prisma/client'
import { createAuditLog } from '@/lib/services/admin.service'

const reportActionSchema = z.object({
  action: z.enum(['reviewing', 'reviewed', 'dismissed', 'resolved']),
  reason: z.string().optional(),
})

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ reportId: string }> }
) {
  try {
    const session = await requireAdmin(request)
    const { reportId } = await params
    
    const body = await request.json()
    const { action, reason } = reportActionSchema.parse(body)
    
    const report = await prisma.report.findUnique({
      where: { id: reportId },
    })
    
    if (!report) {
      return NextResponse.json(
        { error: 'Report not found' },
        { status: 404 }
      )
    }
    
    let newStatus
    let auditAction
    
    switch (action) {
      case 'reviewing':
        newStatus = 'REVIEWING'
        auditAction = ModerationAction.REPORT_REVIEWING
        break
      case 'reviewed':
        newStatus = 'REVIEWED'
        auditAction = ModerationAction.REPORT_REVIEWED
        break
      case 'dismissed':
        newStatus = 'DISMISSED'
        auditAction = ModerationAction.REPORT_DISMISSED
        break
      case 'resolved':
        newStatus = 'RESOLVED'
        auditAction = ModerationAction.REPORT_RESOLVED
        break
      default:
        throw new Error('Invalid action')
    }
    
    // Update report status
    const updatedReport = await prisma.report.update({
      where: { id: reportId },
      data: {
        status: newStatus as 'PENDING' | 'REVIEWING' | 'REVIEWED' | 'RESOLVED' | 'DISMISSED',
        reviewedBy: session.userId,
        reviewedAt: new Date(),
      },
    })
    
    // Create audit log
    await createAuditLog({
      adminId: session.userId,
      targetId: report.reportedId,
      action: auditAction,
      reason: reason || `Report ${action}`,
      reportId: reportId,
    })
    
    return NextResponse.json(updatedReport)
  } catch (error) {
    const { message, statusCode } = handleError(error)
    return NextResponse.json(
      { error: message },
      { status: statusCode }
    )
  }
}
