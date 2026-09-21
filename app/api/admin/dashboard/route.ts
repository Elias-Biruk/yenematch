import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/auth/admin-middleware'
import { handleError } from '@/lib/utils/errors'
import { getDashboardStats } from '@/lib/services/admin.service'

export async function GET(request: NextRequest) {
  try {
    const session = await requireAdmin(request)
    
    const { searchParams } = new URL(request.url)
    const timeRange = (searchParams.get('timeRange') as 'today' | 'week' | 'month' | 'all') || 'all'
    
    const stats = await getDashboardStats(timeRange)
    
    return NextResponse.json(stats)
  } catch (error) {
    const { message, statusCode } = handleError(error)
    return NextResponse.json(
      { error: message },
      { status: statusCode }
    )
  }
}
