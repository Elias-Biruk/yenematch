import createMiddleware from 'next-intl/middleware'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { getSession } from '@/lib/auth/session'
import { AuthenticationError } from '@/lib/utils/errors'

const i18nMiddleware = createMiddleware({
  locales: ['en', 'am', 'om', 'ti'],
  defaultLocale: 'en',
  localePrefix: 'as-needed'
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
      // Redirect to login if not authenticated
      const loginUrl = new URL('/login', request.url)
      return NextResponse.redirect(loginUrl)
    }
  } catch (error) {
    console.error('Auth middleware error:', error)
    const loginUrl = new URL('/login', request.url)
    return NextResponse.redirect(loginUrl)
  }
  
  return response
}

export const config = {
  matcher: ['/', '/(en|am|om|ti)/:path*', '/((?!api|_next/static|_next/image|favicon.ico).*)']
}