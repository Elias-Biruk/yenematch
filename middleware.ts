import createMiddleware from 'next-intl/middleware'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { getSession } from '@/lib/auth/session'
import { AuthenticationError } from '@/lib/utils/errors'

const i18nMiddleware = createMiddleware({
  locales: ['en', 'am', 'om', 'ti'],
  defaultLocale: 'en',
  localePrefix: 'never'  // Changed from 'as-needed' since we don't use [locale] folder structure
})

export async function middleware(request: NextRequest) {
  // Apply i18n middleware first
  const response = i18nMiddleware(request)
  
  // Skip auth middleware for certain paths
  const { pathname } = request.nextUrl
  const publicPaths = ['/login', '/api/auth', '/onboarding']
  
  const isPublicPath = publicPaths.some(path => pathname.startsWith(path))
  
  if (isPublicPath) {
    return response
  }
  
  // Check authentication for protected routes
  try {
    const session = await getSession()
    if (!session) {
      return NextResponse.redirect(new URL('/login', request.url))
    }
  } catch (error) {
    console.error('Auth middleware error:', error)
    return NextResponse.redirect(new URL('/login', request.url))
  }
  
  return response
}

export const config = {
  matcher: ['/', '/((?!api|_next/static|_next/image|favicon.ico).*)']
}