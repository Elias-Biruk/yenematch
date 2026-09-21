import { NextRequest, NextResponse } from 'next/server'
import { deleteSession } from '@/lib/auth/session'

export async function POST(_request: NextRequest) {
  try {
    await deleteSession()
    
    return NextResponse.json({ success: true })
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to logout' },
      { status: 500 }
    )
  }
}
