'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Upload, Loader2, AlertCircle, Store } from 'lucide-react'
import { apiClient, getFriendlyError } from '@/lib/api-client'
import { KYCGuard } from '@/components/auth/KYCGuard'

function KYCVerificationForm() {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const [formData, setFormData] = useState({
    businessName: '',
    businessAddress: '',
    taxId: '',
    phone: '',
    description: '',
    idFile: null as File | null,
    businessLicense: null as File | null,
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError('')

    const form = new FormData()
    form.append('businessName', formData.businessName)
    form.append('businessAddress', formData.businessAddress)
    form.append('taxId', formData.taxId)
    form.append('phone', formData.phone)
    form.append('description', formData.description || '')
    if (formData.idFile) form.append('idFile', formData.idFile)
    if (formData.businessLicense) form.append('businessLicense', formData.businessLicense)

    try {
      const response = await apiClient.post('/seller/kyc-submit', form, {
        headers: { 'Content-Type': 'multipart/form-data' }
      })

      if (response.data) {
        router.push('/kyc-pending')
      }
    } catch (err: any) {
      setError(getFriendlyError(err, 'Submission failed. Please try again.', 'kyc'))
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Card className="shadow-2xl border-primary/10">
      <CardHeader className="space-y-1 text-center">
        <div className="flex justify-center mb-4">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10 text-primary ring-1 ring-primary/20">
            <Store className="h-8 w-8" />
          </div>
        </div>
        <CardTitle className="text-2xl font-bold tracking-tight">Seller Verification</CardTitle>
        <CardDescription>
          Please verify your identity and business details before you can start selling.
          This process is required by law and helps maintain a safe marketplace.
        </CardDescription>
      </CardHeader>

      <CardContent>
        {error && (
          <div className="mb-4 p-3 bg-destructive/10 text-destructive rounded-lg flex items-center gap-2">
            <AlertCircle className="h-4 w-4 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="businessName">Business Name *</Label>
            <Input
              id="businessName"
              required
              placeholder="My Awesome Business"
              value={formData.businessName}
              onChange={(e) => setFormData({ ...formData, businessName: e.target.value })}
              disabled={isLoading}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="businessAddress">Business Address *</Label>
            <Input
              id="businessAddress"
              required
              placeholder="123 Main St, City, State, ZIP"
              value={formData.businessAddress}
              onChange={(e) => setFormData({ ...formData, businessAddress: e.target.value })}
              disabled={isLoading}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="phone">Phone Number *</Label>
            <Input
              id="phone"
              required
              type="tel"
              placeholder="+1 234 567 8900"
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              disabled={isLoading}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="taxId">Tax ID / EIN *</Label>
            <Input
              id="taxId"
              required
              placeholder="XX-XXXXXXX"
              value={formData.taxId}
              onChange={(e) => setFormData({ ...formData, taxId: e.target.value })}
              disabled={isLoading}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Business Description</Label>
            <Textarea
              id="description"
              placeholder="Tell us about your business..."
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              disabled={isLoading}
              rows={4}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="idFile">Government ID (Passport/Driver's License) *</Label>
            <Input
              id="idFile"
              type="file"
              required
              accept=".pdf,.jpg,.jpeg,.png"
              onChange={(e) => setFormData({ ...formData, idFile: e.target.files?.[0] || null })}
              disabled={isLoading}
              className="pt-1.5"
            />
            <p className="text-xs text-muted-foreground">Accepted formats: PDF, JPG, PNG (Max 5MB)</p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="businessLicense">Business License *</Label>
            <Input
              id="businessLicense"
              type="file"
              required
              accept=".pdf,.jpg,.jpeg,.png"
              onChange={(e) => setFormData({ ...formData, businessLicense: e.target.files?.[0] || null })}
              disabled={isLoading}
              className="pt-1.5"
            />
            <p className="text-xs text-muted-foreground">Accepted formats: PDF, JPG, PNG (Max 5MB)</p>
          </div>

          <div className="p-3 bg-muted rounded-lg">
            <p className="text-sm text-muted-foreground">
              <strong>Note:</strong> Your KYC verification will be reviewed within 1-2 business days.
              Your shop will be automatically created once approved.
            </p>
          </div>

          <Button type="submit" className="w-full" disabled={isLoading}>
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Submitting…
              </>
            ) : (
              <>
                <Upload className="mr-2 h-4 w-4" />
                Submit KYC Verification
              </>
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}

export default function KYCVerificationPage() {
  return (
    <KYCGuard expectedStatus="NOT_SUBMITTED">
      <KYCVerificationForm />
    </KYCGuard>
  )
}