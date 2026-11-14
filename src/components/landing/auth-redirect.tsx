'use client'

import * as React from 'react'
import { useRouter } from 'next/navigation'

/**
 * Sends a seller who is already signed in through /verify, which re-checks
 * KYC status and routes them to the dashboard or the right KYC page.
 * Renders nothing.
 */
export function AuthRedirect() {
  const router = useRouter()

  React.useEffect(() => {
    if (sessionStorage.getItem('access_token')) {
      router.replace('/verify')
    }
  }, [router])

  return null
}
