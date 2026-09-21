import { NextResponse } from 'next/server'
import { isDevAuthEnabled } from '@/lib/auth/dev-auth'

export async function GET() {
  return NextResponse.json({ enabled: isDevAuthEnabled() })
}
