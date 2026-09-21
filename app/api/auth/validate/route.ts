import { NextRequest, NextResponse } from 'next/server'
import { authenticateWithTelegram } from '@/lib/services/auth.service'
import { createSession } from '@/lib/auth/session'
import { telegramAuthSchema } from '@/lib/validators/auth.schema'
import { ValidationError, handleError } from '@/lib/utils/errors'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    const validatedData = telegramAuthSchema.parse(body)
    
    const botToken = process.env.TELEGRAM_BOT_TOKEN
    if (!botToken) {
      throw new ValidationError('Telegram bot token not configured')
    }

    const authResult = await authenticateWithTelegram(
      validatedData.initData,
      botToken
    )

    await createSession({
      userId: authResult.user.id,
      telegramId: authResult.user.telegramId,
      expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
    })

    return NextResponse.json({
      user: authResult.user,
      isNewUser: authResult.isNewUser,
    })
  } catch (error) {
    const { message, statusCode } = handleError(error)
    return NextResponse.json(
      { error: message },
      { status: statusCode }
    )
  }
}
