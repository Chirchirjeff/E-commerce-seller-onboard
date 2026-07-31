import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { apiClient } from '@/lib/api-client'

// /shops/me returns an array of shops owned by the seller — we take the first one.
export function useShop() {
  return useQuery({
    queryKey: ['shop'],
    queryFn: async () => {
      const { data } = await apiClient.get('/shops/me')
      const shops = Array.isArray(data) ? data : (data ? [data] : [])
      return shops[0] ?? null
    },
  })
}

// useShopStats depends on the shop ID from useShop.
// By splitting the two queries, React Query's cache means /shops/me is only
// ever fetched once — useShopStats reads the shop ID from the ['shop'] cache
// entry and fires /shops/{id}/stats in parallel as soon as the ID is available,
// instead of re-fetching /shops/me itself (the old serial waterfall).
export function useShopStats() {
  const { data: shop } = useShop()
  return useQuery({
    queryKey: ['shop', 'stats', shop?.id],
    queryFn: async () => {
      const { data: stats } = await apiClient.get(`/shops/${shop!.id}/stats`)
      return stats
    },
    // Don't run until we have a shop ID
    enabled: !!shop?.id,
  })
}

export function useRecentOrders(limit: number = 5) {
  return useQuery({
    queryKey: ['shop', 'orders', 'recent', limit],
    queryFn: async () => {
      const { data } = await apiClient.get(`/orders/recent?limit=${limit}`)
      return data
    },
  })
}

export function useCategories() {
  return useQuery({
    queryKey: ['categories'],
    queryFn: async () => {
      const { data } = await apiClient.get('/categories')
      return data
    },
  })
}

export function useCreateCategory() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (name: string) => {
      const { data } = await apiClient.post('/categories', { name })
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['categories'] })
    },
  })
}

export function useDeleteCategory() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (id: string) => {
      await apiClient.delete(`/categories/${id}`)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['categories'] })
    },
  })
}

export function useUpdateShop() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (updateData: any) => {
      // Read shop ID from the React Query cache — no extra network request needed.
      // The ['shop'] query is always populated before the user can reach any
      // page that calls useUpdateShop (dashboard renders useShop first).
      const shop = queryClient.getQueryData<any>(['shop'])
      if (!shop?.id) throw new Error('No shop found')
      const { data: updated } = await apiClient.patch(`/shops/${shop.id}`, updateData)
      return updated
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['shop'] })
    },
  })
}
