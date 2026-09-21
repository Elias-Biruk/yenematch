import createMiddleware from 'next-intl/middleware'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { getSession } from '@/lib/auth/session'

const i18nMiddleware = createMiddleware({
  locales: ['en', 'am', 'om', 'ti'],
  defaultLocale: 'en',
  localePrefix: 'as-needed'
})

export async function middleware(request: NextRequest) {
  // Apply i18n middleware
  const response = i18nMiddleware(request)
  
  const path = request.nextUrl.pathname

  // Public routes that don't require authentication
  const publicRoutes = ['/login', '/api/auth', '/api/auth/dev-login', '/api/auth/validate', '/onboarding']
  const isPublicRoute = publicRoutes.some(route => path.startsWith(route))

  // Skip auth check for public routes
  if (isPublicRoute) {
    return response
  }

  // Check for session
  const session = await getSession()

  if (!session) {
    // Redirect to login if not authenticated
    return NextResponse.redirect(new URL('/login', request.url))
  }

  return response
}

export const config = {
  matcher: ['/', '/(en|am|om|ti)/:path*', '/((?!api|_next/static|_next/image|favicon.ico).*)']
}