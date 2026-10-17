/*
 * Collections hooks — TanStack Query wrappers for all /seller/collections API calls
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { apiClient } from '@/lib/api-client'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface Collection {
  id: string
  sellerId: string
  name: string
  slug: string
  description?: string | null
  isActive: boolean
  sortOrder: number
  createdAt: string
  updatedAt: string
  _count?: { products: number }
  products?: CollectionProduct[]
}

export interface CollectionProduct {
  productId: string
  collectionId: string
  createdAt: string
  product: {
    id: string
    name: string
    price: number
    thumbnailUrl?: string | null
    marketplaceCategory?: { id: string; name: string }
  }
}

// ── Smart-suggest strategies ────────────────────────────────────────────────
export type SuggestStrategy =
  | 'new_arrivals'
  | 'best_sellers'
  | 'clearance'
  | 'high_rated'
  | 'low_stock'
  | 'price_drop'

/** All tuneable knobs — each strategy only uses the subset relevant to it */
export interface SuggestParams {
  strategy: SuggestStrategy
  /** Rolling time window in days (new_arrivals, best_sellers, price_drop) */
  windowDays?: number
  /** Minimum days since the product was listed (clearance, price_drop) */
  minDaysSinceListed?: number
  /** Minimum average star rating (high_rated) */
  minRating?: number
  /** Minimum number of reviews required (high_rated) */
  minReviews?: number
  /** Upper stock threshold (clearance, low_stock) */
  maxStock?: number
  /** Lower stock threshold — products must have at least this many (low_stock) */
  minStock?: number
  /** Price range filter applied across all strategies */
  minPrice?: number
  maxPrice?: number
  /** Max results returned, capped at 100 server-side */
  limit?: number
}

export interface SuggestedProduct {
  id: string
  name: string
  price: number
  stockQuantity?: number
  thumbnailUrl?: string | null
  createdAt?: string
  updatedAt?: string
  totalSold?: number
  rank?: number
  avgRating?: number
  reviewCount?: number
  marketplaceCategory?: { id: string; name: string }
}

// ---------------------------------------------------------------------------
// Read hooks
// ---------------------------------------------------------------------------

/** All collections for the authenticated seller (active + inactive) */
export function useCollections() {
  return useQuery<Collection[]>({
    queryKey: ['collections'],
    queryFn: async () => {
      const { data } = await apiClient.get('/seller/collections', {
        params: { includeInactive: true },
      })
      return data
    },
  })
}

/** Single collection with its products */
export function useCollection(id: string | null) {
  return useQuery<Collection>({
    queryKey: ['collections', id],
    queryFn: async () => {
      const { data } = await apiClient.get(`/seller/collections/${id}`)
      return data
    },
    enabled: Boolean(id),
  })
}

/** Products currently in a collection */
export function useCollectionProducts(collectionId: string | null) {
  return useQuery<CollectionProduct[]>({
    queryKey: ['collections', collectionId, 'products'],
    queryFn: async () => {
      const { data } = await apiClient.get(
        `/seller/collections/${collectionId}/products`,
      )
      return data
    },
    enabled: Boolean(collectionId),
  })
}

/**
 * Parametric smart-suggest hook.
 * Pass `params` with a strategy + any tunable options.
 * Set `enabled` to false until the seller has configured and confirmed their criteria.
 */
export function useSmartSuggest(
  collectionId: string | null,
  params: SuggestParams | null,
  enabled: boolean,
) {
  return useQuery<SuggestedProduct[]>({
    queryKey: ['collections', collectionId, 'suggest', params],
    queryFn: async () => {
      // Strip undefined values so the URL stays clean
      const qs = Object.entries(params ?? {})
        .filter(([, v]) => v !== undefined)
        .map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(String(v))}`)
        .join('&')
      const { data } = await apiClient.get(
        `/seller/collections/${collectionId}/suggest?${qs}`,
      )
      return data
    },
    enabled: Boolean(collectionId) && Boolean(params) && enabled,
    staleTime: 2 * 60 * 1000,
  })
}

// ---------------------------------------------------------------------------
// Mutation hooks
// ---------------------------------------------------------------------------

export interface CreateCollectionInput {
  name: string
  slug: string
  description?: string
}

/** Create a new collection */
export function useCreateCollection() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (input: CreateCollectionInput) => {
      const { data } = await apiClient.post('/seller/collections', input)
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['collections'] })
    },
  })
}

/** Update a collection's metadata */
export function useUpdateCollection() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({
      id,
      ...input
    }: Partial<CreateCollectionInput> & { id: string }) => {
      const { data } = await apiClient.patch(`/seller/collections/${id}`, input)
      return data
    },
    onSuccess: (_data, vars) => {
      queryClient.invalidateQueries({ queryKey: ['collections'] })
      queryClient.invalidateQueries({ queryKey: ['collections', vars.id] })
    },
  })
}

/** Delete a collection permanently */
export function useDeleteCollection() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (id: string) => {
      await apiClient.delete(`/seller/collections/${id}`)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['collections'] })
    },
  })
}

/** Toggle a collection's active status */
export function useToggleCollectionActive() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, isActive }: { id: string; isActive: boolean }) => {
      const endpoint = isActive
        ? `/seller/collections/${id}/deactivate`
        : `/seller/collections/${id}/activate`
      const { data } = await apiClient.post(endpoint)
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['collections'] })
    },
  })
}

/** Add a single product to a collection */
export function useAddProductToCollection() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({
      collectionId,
      productId,
    }: {
      collectionId: string
      productId: string
    }) => {
      const { data } = await apiClient.post(
        `/seller/collections/${collectionId}/products/${productId}`,
      )
      return data
    },
    onSuccess: (_data, vars) => {
      queryClient.invalidateQueries({
        queryKey: ['collections', vars.collectionId, 'products'],
      })
      queryClient.invalidateQueries({ queryKey: ['collections', vars.collectionId] })
    },
  })
}

/** Remove a single product from a collection */
export function useRemoveProductFromCollection() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({
      collectionId,
      productId,
    }: {
      collectionId: string
      productId: string
    }) => {
      await apiClient.delete(
        `/seller/collections/${collectionId}/products/${productId}`,
      )
    },
    onSuccess: (_data, vars) => {
      queryClient.invalidateQueries({
        queryKey: ['collections', vars.collectionId, 'products'],
      })
      queryClient.invalidateQueries({ queryKey: ['collections', vars.collectionId] })
    },
  })
}

/** Bulk-add multiple products to a collection */
export function useBulkAddProducts() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({
      collectionId,
      productIds,
    }: {
      collectionId: string
      productIds: string[]
    }) => {
      const { data } = await apiClient.post(
        `/seller/collections/${collectionId}/products/bulk-add`,
        { productIds },
      )
      return data as { added: number; skipped: number }
    },
    onSuccess: (_data, vars) => {
      queryClient.invalidateQueries({
        queryKey: ['collections', vars.collectionId, 'products'],
      })
      queryClient.invalidateQueries({ queryKey: ['collections', vars.collectionId] })
      // Also invalidate suggestion caches so they refresh after bulk-add
      queryClient.invalidateQueries({
        queryKey: ['collections', vars.collectionId, 'suggest'],
      })
    },
  })
}
