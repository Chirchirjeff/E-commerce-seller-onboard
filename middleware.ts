/*
 * Next.js Middleware - Runs on every request
 * Handles authentication and route protection
 */

import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware(request: NextRequest) {
  // Must match the cookie name set in login/page.tsx and api-client.ts
  const token = request.cookies.get('access_token')?.value
  const { pathname } = request.nextUrl

  // Auth pages (no auth required)
  const authPages = ['/login', '/register', '/forgot-password']
  const kycPages = ['/kyc-verification', '/kyc-pending', '/kyc-rejected', '/verify']
  const isAuthPage = authPages.includes(pathname) || kycPages.includes(pathname)

  // Protected routes (require auth)
  const isProtectedRoute = pathname.startsWith('/dashboard') || 
                          pathname.startsWith('/analytics') ||
                          pathname.startsWith('/orders') ||
                          pathname.startsWith('/products') ||
                          pathname.startsWith('/shop')

  // If no token and trying to access protected route → redirect to login
  if (!token && isProtectedRoute) {
    const loginUrl = new URL('/login', request.url)
    loginUrl.searchParams.set('redirect', pathname)
    return NextResponse.redirect(loginUrl)
  }

  // If has token and trying to access login → redirect to dashboard
  if (token && pathname === '/login') {
    return NextResponse.redirect(new URL('/dashboard', request.url))
  }

  // If has token and trying to access register → redirect to dashboard
  if (token && pathname === '/register') {
    return NextResponse.redirect(new URL('/dashboard', request.url))
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     * - api routes (let API handle its own auth)
     */
    '/((?!api|_next/static|_next/image|favicon.ico|public).*)',
  ],
}