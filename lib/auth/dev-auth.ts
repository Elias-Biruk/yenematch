import { createSession } from './session'
import { prisma } from '@/lib/db/prisma'
import { ValidationError } from '@/lib/utils/errors'

const DEV_AUTH_ENABLED = process.env.DEV_AUTH === 'true'

/**
 * Development authentication utility
 * ONLY works when DEV_AUTH environment variable is set to "true"
 * This is for local development testing only
 *
 * PRODUCTION SAFETY: This feature is explicitly disabled in production
 * via multiple checks (NODE_ENV and DEV_AUTH). Do not weaken these protections.
 */
export async function devLogin(telegramId?: string) {
  // Multiple production safety checks (fail-closed approach)
  if (process.env.NODE_ENV === 'production') {
    throw new ValidationError('Development authentication cannot be used in production')
  }

  if (!DEV_AUTH_ENABLED) {
    throw new ValidationError('Development authentication is not enabled')
  }

  // Additional safety: disallow if running on common production domains
  const domain = process.env.VERCEL_URL || process.env.HEROKU_URL || ''
  if (domain && !domain.includes('localhost') && !domain.includes('127.0.0.1')) {
    throw new ValidationError('Development authentication cannot be used on this domain')
  }

  // If telegramId provided, use it; otherwise create/get a dev user
  let user: any
  let devTelegramId: string

  if (telegramId) {
    // Find user by telegramId
    user = await prisma.user.findUnique({
      where: { telegramId },
    })
    
    if (!user) {
      throw new ValidationError('User not found')
    }
    
    devTelegramId = telegramId
  } else {
    // Try to find existing dev user
    user = await prisma.user.findFirst({
      where: { telegramId: 'dev_user_123' },
    })

    if (user) {
      devTelegramId = 'dev_user_123'
    } else {
      // Create a new dev user
      user = await prisma.user.create({
        data: {
          telegramId: 'dev_user_123',
          firstName: 'Dev',
        },
      })
      devTelegramId = 'dev_user_123'
    }
  }

  // Create session
  await createSession({
    userId: user.id,
    telegramId: devTelegramId,
    expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
  })

  return { userId: user.id }
}

export function isDevAuthEnabled() {
  return DEV_AUTH_ENABLED
}
