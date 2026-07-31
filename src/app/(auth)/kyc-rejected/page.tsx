/*
 * KYC Rejected Page - Shown when KYC is rejected
 */

'use client'

import { useRouter } from 'next/navigation'
import { AlertCircle, RefreshCw } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { KYCGuard } from '@/components/auth/KYCGuard'

function KYCRejectedContent() {
  const router = useRouter()

  return (
    <Card className="shadow-2xl border-destructive/20">
      <CardHeader className="space-y-1 text-center">
        <div className="flex justify-center mb-4">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-destructive/10 text-destructive ring-1 ring-destructive/20">
            <AlertCircle className="h-8 w-8" />
          </div>
        </div>
        <CardTitle className="text-2xl font-bold tracking-tight text-destructive">
          Verification Rejected
        </CardTitle>
        <CardDescription>
          Your KYC verification was not approved
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-4">
        <div className="p-4 bg-destructive/10 rounded-lg">
          <p className="text-sm text-destructive">
            Please check your email for the reason and resubmit with the correct documents.
          </p>
        </div>

        <Button
          className="w-full"
          onClick={() => router.push('/kyc-verification')}
        >
          <RefreshCw className="mr-2 h-4 w-4" />
          Resubmit KYC
        </Button>

        <p className="text-center text-sm text-muted-foreground">
          Need help? Contact our support team.
        </p>
      </CardContent>
    </Card>
  )
}

export default function KYCRejectedPage() {
  return (
    <KYCGuard expectedStatus="REJECTED">
      <KYCRejectedContent />
    </KYCGuard>
  )
}