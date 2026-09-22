import { prisma } from '@/lib/db/prisma'
import { validateTelegramInitData } from '@/lib/telegram/validation'
import type { TelegramUser } from '@/lib/telegram/types'
import { AuthenticationError, ValidationError } from '@/lib/utils/errors'
import { UserRole } from '@prisma/client'

export interface AuthResult {
  user: {
    id: string
    telegramId: string
    firstName: string
    lastName: string | null
    username: string | null
    sessionVersion: number
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
  } catch {
    throw new ValidationError('Invalid Telegram init data')
  }

  const telegramId = telegramUser.id.toString()
  const superAdminTelegramId = process.env.TELEGRAM_SUPERADMIN_USER_ID

  let user = await prisma.user.findUnique({
    where: {
      telegramId,
    },
  })

  if (!user) {
    const role =
      superAdminTelegramId && telegramId === superAdminTelegramId
        ? UserRole.SUPER_ADMIN
        : UserRole.USER

    user = await prisma.user.create({
      data: {
        telegramId,
        firstName: telegramUser.first_name,
        lastName: telegramUser.last_name || null,
        username: telegramUser.username || null,
        role,
      },
    })

    return {
      user: {
        id: user.id,
        telegramId: user.telegramId,
        firstName: user.firstName,
        lastName: user.lastName,
        username: user.username,
        sessionVersion: user.sessionVersion,
      },
      isNewUser: true,
    }
  }

  const shouldBeSuperAdmin =
    superAdminTelegramId && telegramId === superAdminTelegramId

  const updatedUser = await prisma.user.update({
    where: {
      id: user.id,
    },
    data: {
      firstName: telegramUser.first_name,
      lastName: telegramUser.last_name || null,
      username: telegramUser.username || null,
      ...(shouldBeSuperAdmin && user.role !== UserRole.SUPER_ADMIN
        ? { role: UserRole.SUPER_ADMIN }
        : {}),
      updatedAt: new Date(),
    },
  })

  return {
    user: {
      id: updatedUser.id,
      telegramId: updatedUser.telegramId,
      firstName: updatedUser.firstName,
      lastName: updatedUser.lastName,
      username: updatedUser.username,
      sessionVersion: updatedUser.sessionVersion,
    },
    isNewUser: false,
  }
}

export async function getUserById(userId: string) {
  const user = await prisma.user.findUnique({
    where: {
      id: userId,
    },
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
    where: {
      telegramId,
    },
    include: {
      profile: {
        include: {
          preferences: true,
        },
      },
    },
  })
}