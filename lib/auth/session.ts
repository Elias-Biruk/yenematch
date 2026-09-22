import { cookies } from 'next/headers'
import { SignJWT, jwtVerify } from 'jose'
import { prisma } from '@/lib/db/prisma'

const SESSION_COOKIE_NAME = 'yene_session'

const getSessionSecret = () => {
  const secret = process.env.NEXTAUTH_SECRET || 'dev-secret-do-not-use-in-production'

  if (process.env.NODE_ENV === 'production' && !process.env.NEXTAUTH_SECRET) {
    throw new Error('NEXTAUTH_SECRET environment variable is required in production')
  }

  if (!process.env.NEXTAUTH_SECRET) {
    console.warn(
      'WARNING: NEXTAUTH_SECRET not set. Using development-only secret. Do not use in production.'
    )
  }

  return secret
}

const SESSION_SECRET = new TextEncoder().encode(getSessionSecret())
const SESSION_DURATION = 30 * 24 * 60 * 60 * 1000

export interface SessionPayload {
  userId: string
  telegramId: string
  sessionVersion: number
  expiresAt: Date
}

export async function createSession(payload: SessionPayload) {
  const token = await new SignJWT({
    userId: payload.userId,
    telegramId: payload.telegramId,
    sessionVersion: payload.sessionVersion,
    expiresAt: payload.expiresAt.toISOString(),
  })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
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

    if (
      typeof payload.userId !== 'string' ||
      typeof payload.telegramId !== 'string' ||
      typeof payload.sessionVersion !== 'number' ||
      typeof payload.expiresAt !== 'string'
    ) {
      return null
    }

    const expiresAt = new Date(payload.expiresAt)

    if (Number.isNaN(expiresAt.getTime())) {
      return null
    }

    return {
      userId: payload.userId,
      telegramId: payload.telegramId,
      sessionVersion: payload.sessionVersion,
      expiresAt,
    }
  } catch {
    return null
  }
}

export async function deleteSession() {
  const cookieStore = await cookies()

  cookieStore.set(SESSION_COOKIE_NAME, '', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    expires: new Date(0),
    path: '/',
  })
}

export async function getSession(): Promise<SessionPayload | null> {
  const session = await verifySession()

  if (!session) {
    return null
  }

  if (session.expiresAt.getTime() < Date.now()) {
    await deleteSession()
    return null
  }

  return session
}

export async function validateSessionVersion(
  session: SessionPayload
): Promise<boolean> {
  try {
    const user = await prisma.user.findUnique({
      where: {
        id: session.userId,
      },
      select: {
        sessionVersion: true,
      },
    })

    if (!user) {
      return false
    }

    return user.sessionVersion === session.sessionVersion
  } catch (error) {
    console.error('Error validating session version:', error)
    return false
  }
}