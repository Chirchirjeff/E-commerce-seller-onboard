/*
 * Verify Page - Post-login KYC gate
 *
 * This page runs immediately after login. It checks KYC status in the
 * background and silently routes the seller to the right place:
 *
 *   NOT_SUBMITTED  →  /kyc-verification   (submit documents)
 *   PENDING        →  /kyc-pending        (waiting for review)
 *   REJECTED       →  /kyc-rejected       (resubmit with corrections)
 *   VERIFIED       →  /dashboard          (all good, proceed)
 *
 * The seller never sees this page's content — it only ever shows a
 * loading spinner while the status check is in flight.
 */

'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Loader2, Store } from 'lucide-react'
import { apiClient } from '@/lib/api-client'

export default function VerifyPage() {
  const router = useRouter()

  useEffect(() => {
    const gate = async () => {
      // No token → back to login
      const token = sessionStorage.getItem('access_token')
      if (!token) {
        router.replace('/login')
        return
      }

      try {
        // Fetch KYC status and seller profile in parallel
        const [kycRes, profileRes] = await Promise.allSettled([
          apiClient.get('/seller/kyc-status'),
          apiClient.get('/auth/me'),
        ])

        // Persist seller profile so the header can display name / email
        // The endpoint returns { user: { id, name, email, ... } } — unwrap it
        if (profileRes.status === 'fulfilled') {
          const profile = profileRes.value.data
          const userObj = profile?.user ?? profile
          sessionStorage.setItem('user', JSON.stringify(userObj))
        }

        // Backend returns uppercase statuses: NOT_SUBMITTED, PENDING, VERIFIED, REJECTED
        const status: string =
          kycRes.status === 'fulfilled'
            ? (kycRes.value.data?.status ?? 'NOT_SUBMITTED')
            : 'NOT_SUBMITTED'

        // Cache the KYC status to avoid redundant API calls
        sessionStorage.setItem('kyc_status', status)
        sessionStorage.setItem('kyc_status_timestamp', Date.now().toString())

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
      } catch (err: any) {
        console.error('KYC status check failed:', err)
        // If we can't determine status, send them to submit — safest default
        router.replace('/kyc-verification')
      }
    }

    gate()
  }, [router])

  return (
    <div className="flex flex-col items-center justify-center gap-4">
      <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10 text-primary ring-1 ring-primary/20">
        <Store className="h-8 w-8" />
      </div>
      <div className="flex items-center gap-3 text-muted-foreground">
        <Loader2 className="h-5 w-5 animate-spin text-primary" />
        <span className="text-sm">Checking your account status…</span>
      </div>
    </div>
  )
}
