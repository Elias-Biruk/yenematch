import crypto from 'crypto'
import type { TelegramUser } from './types'

export function validateTelegramInitData(
  initData: string,
  botToken: string
): TelegramUser {
  console.log('Starting Telegram initData validation')
  console.log('initData length:', initData.length)
  
  const urlParams = new URLSearchParams(initData)
  const hash = urlParams.get('hash')
  
  console.log('Hash present:', !!hash)
  
  if (!hash) {
    throw new Error('Invalid init data: missing hash')
  }

  urlParams.delete('hash')
  
  const dataCheckString = Array.from(urlParams.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([key, value]) => `${key}=${value}`)
    .join('\n')

  console.log('Data check string created, length:', dataCheckString.length)

  const secretKey = crypto
    .createHmac('sha256', 'WebAppData')
    .update(botToken)
    .digest()

  const calculatedHash = crypto
    .createHmac('sha256', secretKey)
    .update(dataCheckString)
    .digest('hex')

  console.log('Hash validation:', calculatedHash === hash ? 'passed' : 'failed')

  if (calculatedHash !== hash) {
    throw new Error('Invalid init data: hash verification failed')
  }

  // Check auth_date freshness (must be within last 24 hours)
  const authDate = urlParams.get('auth_date')
  console.log('auth_date present:', !!authDate)
  
  if (!authDate) {
    throw new Error('Invalid init data: missing auth_date')
  }

  const authTimestamp = parseInt(authDate, 10)
  const now = Math.floor(Date.now() / 1000)
  const maxAge = 24 * 60 * 60 // 24 hours in seconds
  const age = now - authTimestamp

  console.log('auth_date age:', age, 'seconds (max allowed:', maxAge + ')')

  if (age > maxAge) {
    throw new Error('Invalid init data: expired auth_date')
  }

  const userStr = urlParams.get('user')
  console.log('user present:', !!userStr)
  
  if (!userStr) {
    throw new Error('Invalid init data: missing user')
  }

  const user: TelegramUser = JSON.parse(userStr)
  
  console.log('user parsed, id:', user.id, 'first_name:', user.first_name)
  
  if (!user.id || !user.first_name) {
    throw new Error('Invalid init data: invalid user data')
  }

  console.log('Telegram validation successful')
  return user
}
