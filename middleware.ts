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
  // Skip auth middleware for certain paths
  const { pathname } = request.nextUrl
  const publicPaths = ['/login', '/api/auth', '/onboarding']
  
  // Check if pathname matches public paths (with or without locale prefix)
  const isPublicPath = publicPaths.some(path => {
    return pathname === path || 
           pathname.startsWith(path + '/') ||
           pathname.match(/^\/[a-z]{2}\/login/) ||
           pathname.match(/^\/[a-z]{2}\/api\/auth/) ||
           pathname.match(/^\/[a-z]{2}\/onboarding/)
  })
  
  if (isPublicPath) {
    return i18nMiddleware(request)
  }
  
  // Check authentication for protected routes
  try {
    const session = await getSession()
    if (!session) {
      // Redirect to login if not authenticated
      // Don't apply i18n middleware to redirect - let next request handle it
      return NextResponse.redirect(new URL('/login', request.url))
    }
  } catch (error) {
    console.error('Auth middleware error:', error)
    return NextResponse.redirect(new URL('/login', request.url))
  }
  
  // Apply i18n middleware for authenticated users
  return i18nMiddleware(request)
}

export const config = {
  matcher: ['/', '/(en|am|om|ti)/:path*', '/((?!api|_next/static|_next/image|favicon.ico).*)']
}