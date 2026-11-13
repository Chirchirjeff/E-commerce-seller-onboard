import { useQuery, keepPreviousData } from '@tanstack/react-query'
import { apiClient } from '@/lib/api-client'

export type AnalyticsRange = 7 | 30 | 90 | 365

export interface PeriodTotals {
  revenue: number
  orders: number
  customers: number
  averageOrderValue: number
}

export interface SellerAnalytics {
  shop: { id: string; name: string }
  range: { days: number; start: string; end: string }
  current: PeriodTotals
  previous: PeriodTotals
  series: Array<{ date: string; revenue: number; orders: number }>
  statusDistribution: Array<{ name: string; value: number }>
  topProducts: Array<{ productId: string; name: string; thumbnailUrl: string | null; revenue: number; quantity: number }>
  totalProducts: number
  averageRating: number
  reviewCount: number
}

/**
 * The signed-in seller's analytics for the last `days` days, compared with
 * the period before. Resolves to null when the seller has no shop yet.
 * Keeps the previous range on screen while a new range loads (no flash).
 */
export function useSellerAnalytics(days: AnalyticsRange = 30) {
  return useQuery({
    queryKey: ['analytics', 'seller', days],
    queryFn: async () => {
      const { data } = await apiClient.get<SellerAnalytics | null>('/analytics/seller', { params: { days } })
      return data || null
    },
    placeholderData: keepPreviousData,
  })
}
