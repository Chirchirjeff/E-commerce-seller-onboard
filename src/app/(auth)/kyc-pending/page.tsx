/*
 * KYC Pending Page - Shown while KYC is under review
 */

'use client'

import { Clock, Mail } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { KYCGuard } from '@/components/auth/KYCGuard'

function KYCPendingContent() {
  return (
    <Card className="shadow-2xl border-primary/10">
      <CardHeader className="space-y-1 text-center">
        <div className="flex justify-center mb-4">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-yellow-500/10 text-yellow-500 ring-1 ring-yellow-500/20">
            <Clock className="h-8 w-8 animate-pulse" />
          </div>
        </div>
        <CardTitle className="text-2xl font-bold tracking-tight">Verification Pending</CardTitle>
        <CardDescription>
          Your KYC documents are being reviewed by our team
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-4">
        <div className="p-4 bg-muted rounded-lg">
          <p className="text-sm font-medium">What happens next?</p>
          <ul className="text-sm text-muted-foreground mt-2 space-y-2">
            <li className="flex items-start gap-2">
              <span className="text-green-500 mt-0.5">✓</span>
              <span>Our team reviews your documents (1–2 business days)</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-green-500 mt-0.5">✓</span>
              <span>You'll receive an email confirmation once reviewed</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-green-500 mt-0.5">✓</span>
              <span>Your shop will be automatically created on approval</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-green-500 mt-0.5">✓</span>
              <span>You'll get full access to your seller dashboard</span>
            </li>
          </ul>
        </div>

        <div className="flex items-center gap-2 p-3 bg-primary/10 rounded-lg">
          <Mail className="h-4 w-4 text-primary flex-shrink-0" />
          <p className="text-sm">
            We'll notify you at your registered email address once approved.
          </p>
        </div>

        <p className="text-center text-sm text-muted-foreground">
          Need help? Contact our support team.
        </p>
      </CardContent>
    </Card>
  )
}

export default function KYCPendingPage() {
  return (
    <KYCGuard expectedStatus="PENDING">
      <KYCPendingContent />
    </KYCGuard>
  )
}