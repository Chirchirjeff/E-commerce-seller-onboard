/*
 * useKYC Hook - Manages KYC state and operations
 */

'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { apiClient, getFriendlyError } from '@/lib/api-client'

export interface KYCData {
  id?: string
  businessName: string
  businessAddress: string
  taxId: string
  phone: string
  description?: string
  idFile?: File | string
  businessLicense?: File | string
  status?: 'not_submitted' | 'pending' | 'verified' | 'rejected'
  submittedAt?: string
  verifiedAt?: string
  message?: string
}

export function useKYC() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [kycStatus, setKycStatus] = useState<KYCData['status']>('not_submitted')
  const [kycData, setKycData] = useState<KYCData | null>(null)
  const [error, setError] = useState<string | null>(null)

  const checkKYC = async () => {
    try {
      setLoading(true)
      setError(null)
      
      const response = await apiClient.get('/seller/kyc-status')
      const data = response.data
      
      setKycStatus(data.status)
      setKycData(data)
      
      return data
    } catch (err: any) {
      setError(getFriendlyError(err, 'Unable to check verification status. Please try again.', 'kyc'))
      console.error('KYC status check failed:', err)
      return null
    } finally {
      setLoading(false)
    }
  }

  const submitKYC = async (formData: FormData) => {
    try {
      setLoading(true)
      setError(null)
      
      const response = await apiClient.post('/seller/kyc-submit', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      })
      
      if (response.data.success) {
        setKycStatus('pending')
        return { success: true, data: response.data }
      }
      
      return { success: false, error: 'Submission failed' }
    } catch (err: any) {
      const friendly = getFriendlyError(err, 'Unable to submit verification. Please try again.', 'kyc')
      setError(friendly)
      console.error('KYC submission failed:', err)
      return { success: false, error: friendly }
    } finally {
      setLoading(false)
    }
  }

  const redirectBasedOnStatus = (status: KYCData['status']) => {
    switch (status) {
      case 'not_submitted':
        router.push('/kyc-verification')
        break
      case 'pending':
        router.push('/kyc-pending')
        break
      case 'rejected':
        router.push('/kyc-rejected')
        break
      case 'verified':
        // Proceed to dashboard
        break
      default:
        router.push('/kyc-verification')
    }
  }

  const checkAndRedirect = async () => {
    const data = await checkKYC()
    if (data) {
      redirectBasedOnStatus(data.status)
    }
    return data
  }

  return {
    loading,
    kycStatus,
    kycData,
    error,
    checkKYC,
    submitKYC,
    redirectBasedOnStatus,
    checkAndRedirect,
  }
}