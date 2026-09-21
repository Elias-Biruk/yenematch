import { NextRequest, NextResponse } from 'next/server'
import { createReport } from '@/lib/services/report.service'
import { requireAuth } from '@/lib/auth/middleware'
import { handleError } from '@/lib/utils/errors'
import { createReportSchema } from '@/lib/validators/report.schema'
import { enforcePayloadLimit } from '@/lib/utils/payload-limit'

export async function POST(request: NextRequest) {
  try {
    const session = await requireAuth(request)

    // Enforce payload limit (1MB)
    enforcePayloadLimit(request)

    const body = await request.json()
    const { reportedUserId, reason, description } = createReportSchema.parse(body)
    
    const report = await createReport(
      session.userId,
      reportedUserId,
      reason,
      description
    )
    
    return NextResponse.json({ 
      success: true,
      reportId: report.id 
    }, { status: 201 })
  } catch (error) {
    const { message, statusCode } = handleError(error)
    return NextResponse.json(
      { error: message },
      { status: statusCode }
    )
  }
}
