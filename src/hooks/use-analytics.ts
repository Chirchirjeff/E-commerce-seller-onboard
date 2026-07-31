import { useQuery } from '@tanstack/react-query'
import { apiClient } from '@/lib/api-client'

export function useShopAnalytics() {
  return useQuery({
    queryKey: ['analytics', 'shop'],
    queryFn: async () => {
      // First get the seller's shop
      const { data: shops } = await apiClient.get('/shops/me')
      const shopArray = Array.isArray(shops) ? shops : (shops ? [shops] : [])
      const shop = shopArray[0]
      
      if (!shop?.id) return null

      // Then get the stats for that shop
      const { data: stats } = await apiClient.get(`/shops/${shop.id}/stats`)
      
      // Map backend response to what the analytics page expects
      return {
        totalRevenue: stats.totalRevenue || 0,
        totalOrders: stats.totalOrders || 0,
        totalProducts: stats.totalProducts || 0,
        totalCustomers: stats.totalCustomers || 0,
        conversionRate: 0, // Could be calculated as (totalOrders / totalCustomers * 100) if needed
        revenueData: [], // Revenue time series - not yet implemented
        performanceData: stats.orderStatusDistribution || [], // Order status breakdown
      }
    },
  })
}

export function useRevenueAnalytics(range: string = '30d') {
  return useQuery({
    queryKey: ['analytics', 'revenue', range],
    queryFn: async () => {
      // This endpoint doesn't exist for sellers - would need to be implemented
      // For now return empty data
      return []
    },
  })
}