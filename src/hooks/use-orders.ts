import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { apiClient } from '@/lib/api-client'

export type OrderFilters = Record<string, string | number | undefined>

function params(filters: OrderFilters) {
  return Object.fromEntries(Object.entries(filters).filter(([, value]) => value !== '' && value !== undefined))
}

export function useSellerOrders(filters: OrderFilters) {
  return useQuery({
    queryKey: ['seller-orders', filters],
    queryFn: async () => (await apiClient.get('/orders/seller/list', { params: params(filters) })).data,
    placeholderData: (previous) => previous,
  })
}

export function useOrderSummary(filters: OrderFilters) {
  return useQuery({ queryKey: ['seller-order-summary', filters], queryFn: async () => (await apiClient.get('/orders/seller/summary', { params: params(filters) })).data })
}

export function useSellerOrder(id: string) {
  return useQuery({ queryKey: ['seller-order', id], queryFn: async () => (await apiClient.get(`/orders/seller/${id}`)).data, enabled: Boolean(id) })
}

export function useOrderAction() {
  const client = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, action, data }: { id: string; action: 'fulfillment' | 'dispatch'; data: Record<string, string> }) => (await apiClient.put(`/orders/seller/${id}/${action}`, data)).data,
    onSuccess: (_, variables) => { client.invalidateQueries({ queryKey: ['seller-orders'] }); client.invalidateQueries({ queryKey: ['seller-order-summary'] }); client.invalidateQueries({ queryKey: ['seller-order', variables.id] }) },
  })
}
