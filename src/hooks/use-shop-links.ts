'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { apiClient } from '@/lib/api-client'
import { CreateShopLinkDto } from '@/types/shop-links'

interface ShopLink {
  id: string
  shopId: string
  token: string
  title?: string
  description?: string
  source?: string
  clickCount: number
  lastClickedAt?: Date
  isActive: boolean
  createdAt: Date
  updatedAt: Date
}

export function useShopLinks(shopId: string) {
  const queryClient = useQueryClient()
  const queryKey = ['shop-links', shopId]

  const { data: links = [], isLoading, error } = useQuery({
    queryKey,
    queryFn: async () => {
      if (!shopId) return []
      const response = await apiClient.get<ShopLink[]>(
        `/shops/${shopId}/links`
      )
      return Array.isArray(response.data) ? response.data : []
    },
    enabled: !!shopId,
  })

  const createLink = useMutation({
    mutationFn: async (data: CreateShopLinkDto) => {
      const response = await apiClient.post<ShopLink>(
        `/shops/${shopId}/links`,
        data
      )
      return response.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey })
    },
  })

  const updateLink = useMutation({
    mutationFn: async ({
      linkId,
      data,
    }: {
      linkId: string
      data: Partial<CreateShopLinkDto>
    }) => {
      const response = await apiClient.patch<ShopLink>(
        `/shops/${shopId}/links/${linkId}`,
        data
      )
      return response.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey })
    },
  })

  const deleteLink = useMutation({
    mutationFn: async (linkId: string) => {
      await apiClient.delete(`/shops/${shopId}/links/${linkId}`)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey })
    },
  })

  const toggleLinkStatus = useMutation({
    mutationFn: async (linkId: string) => {
      const response = await apiClient.patch<ShopLink>(
        `/shops/${shopId}/links/${linkId}/toggle`
      )
      return response.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey })
    },
  })

  const getLinkAnalytics = async (linkId: string) => {
    const response = await apiClient.get(
      `/shops/${shopId}/links/${linkId}/analytics`
    )
    return response.data
  }

  return {
    links,
    isLoading,
    error,
    createLink,
    updateLink,
    deleteLink,
    toggleLinkStatus,
    getLinkAnalytics,
  }
}
