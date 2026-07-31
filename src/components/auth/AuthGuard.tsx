// src/components/auth/AuthGuard.tsx
//
// AuthGuard is intentionally a pass-through.
//
// All authentication and KYC verification is handled by the dashboard route
// layout (src/app/(dashboard)/layout.tsx). Having a second guard here caused
// a parallel /auth/me request whose 401 error triggered the api-client
// interceptor to hard-navigate to /login, creating a flash-then-redirect loop.
//
// This stub is kept so existing imports don't break.

'use client'

interface AuthGuardProps {
  children: React.ReactNode
}

export function AuthGuard({ children }: AuthGuardProps) {
  return <>{children}</>
}
