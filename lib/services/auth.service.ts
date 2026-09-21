import { prisma } from '@/lib/db/prisma'
import { validateTelegramInitData } from '@/lib/telegram/validation'
import type { TelegramUser } from '@/lib/telegram/types'
import { AuthenticationError, ValidationError } from '@/lib/utils/errors'

export interface AuthResult {
  user: {
    id: string
    telegramId: string
    firstName: string
    lastName: string | null
    username: string | null
  }
  isNewUser: boolean
}

export async function authenticateWithTelegram(
  initData: string,
  botToken: string
): Promise<AuthResult> {
  if (!botToken) {
    throw new AuthenticationError('Telegram bot token not configured')
  }

  let telegramUser: TelegramUser
  try {
    telegramUser = validateTelegramInitData(initData, botToken)
  } catch (error) {
    throw new ValidationError('Invalid Telegram init data')
  }

  const existingUser = await prisma.user.findUnique({
    where: { telegramId: telegramUser.id.toString() },
  })

  if (existingUser) {
    await prisma.user.update({
      where: { id: existingUser.id },
      data: {
        firstName: telegramUser.first_name,
        lastName: telegramUser.last_name || null,
        username: telegramUser.username || null,
        updatedAt: new Date(),
      },
    })

    return {
      user: {
        id: existingUser.id,
        telegramId: existingUser.telegramId,
        firstName: existingUser.firstName,
        lastName: existingUser.lastName,
        username: existingUser.username,
      },
      isNewUser: false,
    }
  }

  const newUser = await prisma.user.create({
    data: {
      telegramId: telegramUser.id.toString(),
      firstName: telegramUser.first_name,
      lastName: telegramUser.last_name || null,
      username: telegramUser.username || null,
    },
  })

  return {
    user: {
      id: newUser.id,
      telegramId: newUser.telegramId,
      firstName: newUser.firstName,
      lastName: newUser.lastName,
      username: newUser.username,
    },
    isNewUser: true,
  }
}

export async function getUserById(userId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: {
      profile: {
        include: {
          preferences: true,
        },
      },
    },
  })

  if (!user) {
    throw new AuthenticationError('User not found')
  }

  return user
}

export async function getUserByTelegramId(telegramId: string) {
  return prisma.user.findUnique({
    where: { telegramId },
    include: {
      profile: {
        include: {
          preferences: true,
        },
      },
    },
  })
}
