import { NextRequest, NextResponse } from 'next/server'
import { authenticateWithTelegram } from '@/lib/services/auth.service'
import { createSession } from '@/lib/auth/session'
import { telegramAuthSchema } from '@/lib/validators/auth.schema'
import { ValidationError, handleError } from '@/lib/utils/errors'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    const validatedData = telegramAuthSchema.parse(body)
    
    console.log('Received auth request')
    console.log('initData present:', !!validatedData.initData)
    console.log('initData length:', validatedData.initData?.length || 0)
    
    const botToken = process.env.TELEGRAM_BOT_TOKEN
    console.log('TELEGRAM_BOT_TOKEN configured:', !!botToken)
    
    if (!botToken) {
      console.error('TELEGRAM_BOT_TOKEN not configured')
      throw new ValidationError('Telegram bot token not configured')
    }

    console.log('Starting Telegram validation...')

    const authResult = await authenticateWithTelegram(
      validatedData.initData,
      botToken
    )

    console.log('Validation successful for telegramId:', authResult.user.telegramId)

    await createSession({
      userId: authResult.user.id,
      telegramId: authResult.user.telegramId,
      sessionVersion: authResult.user.sessionVersion || 0,
      expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
    })

    console.log('Session created successfully')

    return NextResponse.json({
      user: authResult.user,
      isNewUser: authResult.isNewUser,
    })
  } catch (error) {
    console.error('Telegram authentication error:', error)
    const { message, statusCode } = handleError(error)
    return NextResponse.json(
      { error: message },
      { status: statusCode }
    )
  }
}
