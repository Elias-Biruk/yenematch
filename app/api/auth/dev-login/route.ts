import { NextRequest, NextResponse } from 'next/server'
import { devLogin } from '@/lib/auth/dev-auth'
import { handleError } from '@/lib/utils/errors'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { telegramId } = body
    
    const result = await devLogin(telegramId)
    
    return NextResponse.json(result)
  } catch (error) {
    const { message, statusCode } = handleError(error)
    return NextResponse.json(
      { error: message },
      { status: statusCode }
    )
  }
}
