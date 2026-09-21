import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db/prisma'
import { createSession } from '@/lib/auth/session'
import { ValidationError } from '@/lib/utils/errors'

export async function POST(request: NextRequest) {
  if (process.env.NODE_ENV === 'production') {
    return NextResponse.json(
      { error: 'Development auth is not available in production' },
      { status: 403 }
    )
  }

  try {
    const body = await request.json()
    const { telegramId, firstName, lastName, username } = body

    if (!telegramId || !firstName) {
      throw new ValidationError('telegramId and firstName are required')
    }

    const existingUser = await prisma.user.findUnique({
      where: { telegramId: telegramId.toString() },
    })

    let user
    let isNewUser = false

    if (existingUser) {
      user = await prisma.user.update({
        where: { id: existingUser.id },
        data: {
          firstName,
          lastName: lastName || null,
          username: username || null,
          updatedAt: new Date(),
        },
      })
    } else {
      user = await prisma.user.create({
        data: {
          telegramId: telegramId.toString(),
          firstName,
          lastName: lastName || null,
          username: username || null,
        },
      })
      isNewUser = true
    }

    await createSession({
      userId: user.id,
      telegramId: user.telegramId,
      expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
    })

    return NextResponse.json({
      user: {
        id: user.id,
        telegramId: user.telegramId,
        firstName: user.firstName,
        lastName: user.lastName,
        username: user.username,
      },
      isNewUser,
    })
  } catch (error) {
    const { message, statusCode } = error instanceof Error 
      ? { message: error.message, statusCode: 500 }
      : { message: 'An error occurred', statusCode: 500 }
    
    return NextResponse.json({ error: message }, { status: statusCode })
  }
}
