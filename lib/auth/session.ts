import { cookies } from 'next/headers'
import { SignJWT, jwtVerify } from 'jose'

const SESSION_COOKIE_NAME = 'yene_session'

// Get session secret with production safety check (runtime only)
const getSessionSecret = () => {
  const secret = process.env.NEXTAUTH_SECRET || 'dev-secret-do-not-use-in-production'

  if (process.env.NODE_ENV === 'production' && !process.env.NEXTAUTH_SECRET) {
    throw new Error('NEXTAUTH_SECRET environment variable is required in production')
  }

  if (!process.env.NEXTAUTH_SECRET) {
    console.warn('WARNING: NEXTAUTH_SECRET not set. Using development-only secret. Do not use in production.')
  }

  return secret
}

const SESSION_SECRET = new TextEncoder().encode(getSessionSecret())
const SESSION_DURATION = 30 * 24 * 60 * 60 * 1000 // 30 days

export interface SessionPayload {
  userId: string
  telegramId: string
  expiresAt: Date
}

export async function createSession(payload: SessionPayload) {
  const token = await new SignJWT({ ...payload })
    .setProtectedHeader({ alg: 'HS256' })
    .setExpirationTime('30d')
    .sign(SESSION_SECRET)

  const cookieStore = await cookies()
  cookieStore.set(SESSION_COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    expires: new Date(Date.now() + SESSION_DURATION),
    path: '/',
  })
}

export async function verifySession(): Promise<SessionPayload | null> {
  const cookieStore = await cookies()
  const token = cookieStore.get(SESSION_COOKIE_NAME)?.value

  if (!token) {
    return null
  }

  try {
    const { payload } = await jwtVerify(token, SESSION_SECRET)
    return payload as unknown as SessionPayload
  } catch (error) {
    return null
  }
}

export async function deleteSession() {
  const cookieStore = await cookies()
  cookieStore.delete(SESSION_COOKIE_NAME)
}

export async function getSession() {
  const session = await verifySession()
  if (!session) {
    return null
  }

  if (new Date(session.expiresAt) < new Date()) {
    await deleteSession()
    return null
  }

  return session
}
