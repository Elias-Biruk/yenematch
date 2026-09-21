import crypto from 'crypto'
import type { TelegramUser } from './types'

export function validateTelegramInitData(
  initData: string,
  botToken: string
): TelegramUser {
  const urlParams = new URLSearchParams(initData)
  const hash = urlParams.get('hash')
  
  if (!hash) {
    throw new Error('Invalid init data: missing hash')
  }

  urlParams.delete('hash')
  
  const dataCheckString = Array.from(urlParams.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([key, value]) => `${key}=${value}`)
    .join('\n')

  const secretKey = crypto
    .createHmac('sha256', 'WebAppData')
    .update(botToken)
    .digest()

  const calculatedHash = crypto
    .createHmac('sha256', secretKey)
    .update(dataCheckString)
    .digest('hex')

  if (calculatedHash !== hash) {
    throw new Error('Invalid init data: hash verification failed')
  }

  // Check auth_date freshness (must be within last 24 hours)
  const authDate = urlParams.get('auth_date')
  if (!authDate) {
    throw new Error('Invalid init data: missing auth_date')
  }

  const authTimestamp = parseInt(authDate, 10)
  const now = Math.floor(Date.now() / 1000)
  const maxAge = 24 * 60 * 60 // 24 hours in seconds

  if (now - authTimestamp > maxAge) {
    throw new Error('Invalid init data: expired auth_date')
  }

  const userStr = urlParams.get('user')
  if (!userStr) {
    throw new Error('Invalid init data: missing user')
  }

  const user: TelegramUser = JSON.parse(userStr)
  
  if (!user.id || !user.first_name) {
    throw new Error('Invalid init data: invalid user data')
  }

  return user
}
