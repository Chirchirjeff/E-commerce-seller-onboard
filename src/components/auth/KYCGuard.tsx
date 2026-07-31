// src/components/auth/KYCGuard.tsx
/*
 * KYCGuard — used inside KYC flow pages (pending, rejected, verification).
 * Confirms the seller is authenticated and re-routes if their status has
 * changed since they last loaded the page (e.g. they were approved while
 * sitting on the pending screen).
 *
 * Status routing (uppercase — matches backend KYCStatus enum):
 *   NOT_SUBMITTED  →  /kyc-verification
 *   PENDING        →  /kyc-pending
 *   REJECTED       →  /kyc-rejected
 *   VERIFIED       →  /dashboard
 */

'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Loader2 } from 'lucide-react'
import { apiClient } from '@/lib/api-client'

interface KYCGuardProps {
  children: React.ReactNode
  /** The KYC status this page is meant to display. Guard redirects if it no longer matches. */
  expectedStatus: 'NOT_SUBMITTED' | 'PENDING' | 'REJECTED'
}

export function KYCGuard({ children, expectedStatus }: KYCGuardProps) {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(true)
  const [isMatch, setIsMatch] = useState(false)

  useEffect(() => {
    const check = async () => {
      const token = sessionStorage.getItem('access_token')
      if (!token) {
        router.replace('/login')
        return
      }

      try {
        const res = await apiClient.get('/seller/kyc-status')
        const status: string = res.data?.status ?? 'NOT_SUBMITTED'

        if (status === expectedStatus) {
          // Status matches this page — render it
          setIsMatch(true)
        } else {
          // Status has changed — re-route via the gate
          switch (status) {
            case 'VERIFIED':
              router.replace('/dashboard')
              break
            case 'PENDING':
              router.replace('/kyc-pending')
              break
            case 'REJECTED':
              router.replace('/kyc-rejected')
              break
            case 'NOT_SUBMITTED':
            default:
              router.replace('/kyc-verification')
              break
          }
        }
      } catch (err) {
        console.error('KYCGuard status check failed:', err)
        // Can't determine status — let verify page decide
        router.replace('/verify')
      } finally {
        setIsLoading(false)
      }
    }

    check()
  }, [router, expectedStatus])

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center gap-3 text-muted-foreground">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <span className="text-sm">Verifying your account…</span>
      </div>
    )
  }

  return isMatch ? <>{children}</> : null
}
