'use client'

import * as React from 'react'
import { useRouter } from 'next/navigation'
import { Skeleton, SkeletonGroup } from '@/components/ui/skeleton'
import { PageHeaderSkeleton, StatCardSkeleton } from '@/components/shared/skeletons'
import { apiClient } from '@/lib/api-client'
import { MainLayout } from '@/components/layout/main-layout'
import { NotificationProvider } from '@/context/notifications'

// How long the cached KYC status is trusted before we re-validate with the API.
// 5 minutes is generous — status changes are driven by admin review, not
// by the seller themselves, so a brief cache window is safe.
const KYC_CACHE_TTL_MS = 5 * 60 * 1000

function getCachedKycStatus(): string | null {
  try {
    const status = sessionStorage.getItem('kyc_status')
    const ts = sessionStorage.getItem('kyc_status_timestamp')
    if (!status || !ts) return null
    if (Date.now() - Number(ts) > KYC_CACHE_TTL_MS) return null
    return status
  } catch {
    return null
  }
}

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const router = useRouter()
  // Start as 'checking' — never render children until we know the outcome.
  // 'allowed' | 'denied' | 'checking'
  const [state, setState] = React.useState<'checking' | 'allowed' | 'denied'>('checking')

  React.useEffect(() => {
    let cancelled = false

    const guard = async () => {
      const token = sessionStorage.getItem('access_token')
      if (!token) {
        if (!cancelled) setState('denied')
        router.replace('/login')
        return
      }

      // Fast path: /verify already fetched KYC status and cached it.
      // Skip the API call entirely if the cache is fresh.
      const cached = getCachedKycStatus()
      if (cached) {
        if (!cancelled) {
          if (cached === 'VERIFIED') {
            setState('allowed')
          } else {
            setState('denied')
            router.replace('/verify')
          }
        }
        return
      }

      // Slow path: cache is missing or stale — validate with the API.
      try {
        const res = await apiClient.get('/seller/kyc-status')
        if (cancelled) return

        const status: string = res.data?.status ?? 'NOT_SUBMITTED'

        // Refresh the cache so the next navigation is fast again
        sessionStorage.setItem('kyc_status', status)
        sessionStorage.setItem('kyc_status_timestamp', Date.now().toString())

        if (status === 'VERIFIED') {
          setState('allowed')
        } else {
          setState('denied')
          router.replace('/verify')
        }
      } catch (err) {
        console.error('Dashboard guard failed:', err)
        if (!cancelled) {
          setState('denied')
          // Only redirect to login on a genuine 401, not network errors
          const status = (err as any)?.response?.status
          router.replace(status === 401 ? '/login' : '/verify')
        }
      }
    }

    guard()
    return () => { cancelled = true }
  }, [router])

  // Show a shell skeleton while checking — never flash the real dashboard
  if (state === 'checking') {
    return (
      <SkeletonGroup label="Loading your dashboard…" className="flex min-h-screen bg-background">
        {/* Sidebar placeholder (desktop only, mirrors MainLayout) */}
        <div className="hidden w-64 shrink-0 flex-col gap-2 border-r bg-card p-4 lg:flex" aria-hidden="true">
          <Skeleton className="mb-6 h-8 w-32" />
          {Array.from({ length: 8 }).map((_, i) => (
            <Skeleton key={i} className="h-9 w-full" />
          ))}
        </div>
        <div className="flex flex-1 flex-col" aria-hidden="true">
          <div className="flex h-16 items-center justify-between border-b px-4 md:px-6">
            <Skeleton className="h-8 w-48" />
            <Skeleton className="h-8 w-8 rounded-full" />
          </div>
          {/* Route-agnostic content placeholder */}
          <div className="flex-1 space-y-6 p-4 md:p-6">
            <PageHeaderSkeleton action />
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {Array.from({ length: 4 }).map((_, i) => (
                <StatCardSkeleton key={i} />
              ))}
            </div>
            <Skeleton className="h-80 w-full rounded-lg" />
          </div>
        </div>
      </SkeletonGroup>
    )
  }

  // Render nothing while the redirect is in flight
  if (state === 'denied') return null

  return (
    <NotificationProvider>
      <MainLayout>{children}</MainLayout>
    </NotificationProvider>
  )
}
