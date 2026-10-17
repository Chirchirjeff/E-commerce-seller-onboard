'use client'

/*
 * Collection Detail Page — /collections/[id]
 *
 * Three tabs:
 *   1. Products in collection  — view and remove assigned products
 *   2. Add products manually   — browse all seller products, add individually or in bulk
 *   3. Smart Add               — system-suggested New Arrivals / Best Sellers with
 *                                opt-in toggles; seller reviews and confirms before anything is added
 */

import * as React from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import {
  ArrowLeft,
  Layers,
  Loader2,
  Package,
  Plus,
  Trash2,
  TrendingUp,
  Clock,
  Tag,
  Star,
  AlertTriangle,
  ArrowDownCircle,
  CheckSquare,
  Square,
  Info,
  ChevronDown,
  ChevronUp,
  Search,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import {
  useCollection,
  useCollectionProducts,
  useRemoveProductFromCollection,
  useAddProductToCollection,
  useBulkAddProducts,
  useSmartSuggest,
  type CollectionProduct,
  type SuggestedProduct,
  type SuggestStrategy,
  type SuggestParams,
} from '@/hooks/use-collections'
import { useProducts } from '@/hooks/use-products'
import { getFriendlyError } from '@/lib/api-client'

const money = new Intl.NumberFormat('en-KE', {
  style: 'currency',
  currency: 'KES',
  maximumFractionDigits: 0,
})

// ---------------------------------------------------------------------------
// Tab type
// ---------------------------------------------------------------------------
type Tab = 'assigned' | 'add-manual' | 'smart-add'

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------
export default function CollectionDetailPage() {
  const params = useParams<{ id: string }>()
  const router = useRouter()
  const collectionId = params.id

  const [tab, setTab] = React.useState<Tab>('assigned')
  const [actionError, setActionError] = React.useState<string | null>(null)
  const [actionSuccess, setActionSuccess] = React.useState<string | null>(null)

  // Data
  const { data: collection, isLoading: loadingCollection, isError: collectionError } =
    useCollection(collectionId)
  const { data: assigned, isLoading: loadingAssigned } =
    useCollectionProducts(collectionId)

  // Mutations
  const removeProduct = useRemoveProductFromCollection()
  const addProduct = useAddProductToCollection()
  const bulkAdd = useBulkAddProducts()

  // Derive a set of already-assigned product IDs for fast lookup
  const assignedIds = React.useMemo(
    () => new Set((assigned ?? []).map((cp) => cp.product.id)),
    [assigned],
  )

  function flash(msg: string, kind: 'success' | 'error') {
    setActionError(null)
    setActionSuccess(null)
    if (kind === 'success') setActionSuccess(msg)
    else setActionError(msg)
    setTimeout(() => { setActionError(null); setActionSuccess(null) }, 4000)
  }

  async function handleRemove(productId: string) {
    try {
      await removeProduct.mutateAsync({ collectionId, productId })
      flash('Product removed from collection.', 'success')
    } catch (err) {
      flash(getFriendlyError(err, 'Could not remove product.'), 'error')
    }
  }

  // ---------------------------------------------------------------------------
  // Loading / error states
  // ---------------------------------------------------------------------------
  if (loadingCollection) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center gap-2 text-muted-foreground">
        <Loader2 className="h-5 w-5 animate-spin" />
        Loading collection…
      </div>
    )
  }

  if (collectionError || !collection) {
    return (
      <div className="space-y-4">
        <Button variant="ghost" onClick={() => router.back()}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back
        </Button>
        <p className="text-destructive">Collection could not be loaded.</p>
      </div>
    )
  }

  // ---------------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------------
  return (
    <div className="space-y-6">
      {/* Back nav */}
      <div className="flex items-center gap-3">
        <Link href="/collections">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Collections
          </Button>
        </Link>
      </div>

      {/* Collection header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
            <Layers className="h-5 w-5" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">{collection.name}</h1>
            <p className="text-sm text-muted-foreground">
              /{collection.slug} · {collection._count?.products ?? 0} products
            </p>
            {collection.description && (
              <p className="mt-0.5 text-sm text-muted-foreground">{collection.description}</p>
            )}
          </div>
        </div>
        <Badge variant={collection.isActive ? 'success' : 'secondary'} className="self-start">
          {collection.isActive ? 'Active' : 'Inactive'}
        </Badge>
      </div>

      {/* Flash messages */}
      {actionSuccess && (
        <div className="rounded-md bg-green-500/10 px-4 py-2.5 text-sm text-green-600">
          {actionSuccess}
        </div>
      )}
      {actionError && (
        <div className="rounded-md bg-destructive/10 px-4 py-2.5 text-sm text-destructive">
          {actionError}
        </div>
      )}

      {/* Tab bar */}
      <div className="flex gap-1 rounded-lg border bg-muted/40 p-1 w-fit">
        {(
          [
            { key: 'assigned', label: 'In collection' },
            { key: 'add-manual', label: 'Add products' },
            { key: 'smart-add', label: 'Smart Add' },
          ] as { key: Tab; label: string }[]
        ).map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`rounded-md px-4 py-2 text-sm font-medium transition-colors ${
              tab === t.key
                ? 'bg-background text-foreground shadow-sm'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Tab panels */}
      {tab === 'assigned' && (
        <AssignedTab
          assigned={assigned ?? []}
          isLoading={loadingAssigned}
          onRemove={handleRemove}
          isRemoving={removeProduct.isPending}
        />
      )}
      {tab === 'add-manual' && (
        <AddManualTab
          collectionId={collectionId}
          assignedIds={assignedIds}
          onFlash={flash}
          addProduct={addProduct}
          bulkAdd={bulkAdd}
        />
      )}
      {tab === 'smart-add' && (
        <SmartAddTab
          collectionId={collectionId}
          collectionName={collection.name}
          assignedIds={assignedIds}
          bulkAdd={bulkAdd}
          onFlash={flash}
        />
      )}
    </div>
  )
}

// ---------------------------------------------------------------------------
// Tab 1 — Assigned products
// ---------------------------------------------------------------------------
function AssignedTab({
  assigned,
  isLoading,
  onRemove,
  isRemoving,
}: {
  assigned: CollectionProduct[]
  isLoading: boolean
  onRemove: (productId: string) => void
  isRemoving: boolean
}) {
  if (isLoading) {
    return (
      <div className="space-y-3">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-16 animate-pulse rounded-lg bg-muted" />
        ))}
      </div>
    )
  }

  if (!assigned.length) {
    return (
      <div className="flex flex-col items-center justify-center rounded-lg border border-dashed py-16 text-center">
        <Package className="mb-3 h-9 w-9 text-muted-foreground" />
        <p className="font-medium">No products yet</p>
        <p className="mt-1 text-sm text-muted-foreground">
          Use the Add products or Smart Add tabs to fill this collection.
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-2">
      {assigned.map((cp) => (
        <div
          key={cp.productId}
          className="flex items-center gap-3 rounded-lg border bg-card p-3"
        >
          {/* Thumbnail */}
          <div className="h-12 w-12 shrink-0 overflow-hidden rounded-md bg-muted">
            {cp.product.thumbnailUrl ? (
              <img
                src={cp.product.thumbnailUrl}
                alt={cp.product.name}
                className="h-full w-full object-cover"
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center">
                <Package className="h-5 w-5 text-muted-foreground" />
              </div>
            )}
          </div>
          {/* Info */}
          <div className="min-w-0 flex-1">
            <p className="truncate font-medium">{cp.product.name}</p>
            <p className="text-sm text-muted-foreground">
              {money.format(cp.product.price)}
              {cp.product.marketplaceCategory && (
                <> · {cp.product.marketplaceCategory.name}</>
              )}
            </p>
          </div>
          {/* Remove */}
          <Button
            variant="ghost"
            size="icon"
            className="shrink-0 text-destructive hover:text-destructive"
            onClick={() => onRemove(cp.product.id)}
            disabled={isRemoving}
            title="Remove from collection"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      ))}
    </div>
  )
}

// ---------------------------------------------------------------------------
// Tab 2 — Add products manually
// ---------------------------------------------------------------------------
function AddManualTab({
  collectionId,
  assignedIds,
  onFlash,
  addProduct,
  bulkAdd,
}: {
  collectionId: string
  assignedIds: Set<string>
  onFlash: (msg: string, kind: 'success' | 'error') => void
  addProduct: ReturnType<typeof useAddProductToCollection>
  bulkAdd: ReturnType<typeof useBulkAddProducts>
}) {
  const { data: products, isLoading } = useProducts()
  const [search, setSearch] = React.useState('')
  const [selected, setSelected] = React.useState<Set<string>>(new Set())

  const filtered = React.useMemo(() => {
    const q = search.toLowerCase()
    return (products ?? []).filter(
      (p: any) =>
        !assignedIds.has(p.id) &&
        (q === '' || p.name.toLowerCase().includes(q)),
    )
  }, [products, assignedIds, search])

  function toggleSelect(id: string) {
    setSelected((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  function toggleAll() {
    if (selected.size === filtered.length) {
      setSelected(new Set())
    } else {
      setSelected(new Set(filtered.map((p: any) => p.id)))
    }
  }

  async function handleAddOne(productId: string) {
    try {
      await addProduct.mutateAsync({ collectionId, productId })
      onFlash('Product added to collection.', 'success')
    } catch (err) {
      onFlash(getFriendlyError(err, 'Could not add product.'), 'error')
    }
  }

  async function handleBulkAdd() {
    if (!selected.size) return
    try {
      const result = await bulkAdd.mutateAsync({
        collectionId,
        productIds: Array.from(selected),
      })
      setSelected(new Set())
      onFlash(`Added ${result.added} product${result.added !== 1 ? 's' : ''}${result.skipped ? ` (${result.skipped} already in collection)` : ''}.`, 'success')
    } catch (err) {
      onFlash(getFriendlyError(err, 'Bulk add failed.'), 'error')
    }
  }

  if (isLoading) {
    return (
      <div className="space-y-3">
        {[1, 2, 3].map((i) => <div key={i} className="h-16 animate-pulse rounded-lg bg-muted" />)}
      </div>
    )
  }

  const allAvailable = (products ?? []).filter((p: any) => !assignedIds.has(p.id))

  if (!allAvailable.length) {
    return (
      <div className="flex flex-col items-center justify-center rounded-lg border border-dashed py-16 text-center">
        <Package className="mb-3 h-9 w-9 text-muted-foreground" />
        <p className="font-medium">All your products are already in this collection</p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <Input
          placeholder="Search products…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="sm:max-w-xs"
        />
        <div className="flex items-center gap-2">
          {filtered.length > 0 && (
            <Button variant="outline" size="sm" onClick={toggleAll}>
              {selected.size === filtered.length ? (
                <CheckSquare className="mr-2 h-4 w-4" />
              ) : (
                <Square className="mr-2 h-4 w-4" />
              )}
              {selected.size === filtered.length ? 'Deselect all' : 'Select all'}
            </Button>
          )}
          {selected.size > 0 && (
            <Button size="sm" onClick={handleBulkAdd} disabled={bulkAdd.isPending}>
              {bulkAdd.isPending ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Plus className="mr-2 h-4 w-4" />
              )}
              Add {selected.size} selected
            </Button>
          )}
        </div>
      </div>

      {/* Product list */}
      {!filtered.length ? (
        <p className="py-8 text-center text-sm text-muted-foreground">
          No products match &ldquo;{search}&rdquo;
        </p>
      ) : (
        <div className="space-y-2">
          {filtered.map((p: any) => (
            <div
              key={p.id}
              className={`flex items-center gap-3 rounded-lg border bg-card p-3 transition-colors cursor-pointer ${
                selected.has(p.id) ? 'border-primary/60 bg-primary/5' : 'hover:bg-accent/40'
              }`}
              onClick={() => toggleSelect(p.id)}
            >
              {/* Checkbox indicator */}
              <div className="shrink-0">
                {selected.has(p.id) ? (
                  <CheckSquare className="h-5 w-5 text-primary" />
                ) : (
                  <Square className="h-5 w-5 text-muted-foreground" />
                )}
              </div>
              {/* Thumbnail */}
              <div className="h-12 w-12 shrink-0 overflow-hidden rounded-md bg-muted">
                {p.thumbnailUrl ? (
                  <img src={p.thumbnailUrl} alt={p.name} className="h-full w-full object-cover" />
                ) : (
                  <div className="flex h-full w-full items-center justify-center">
                    <Package className="h-5 w-5 text-muted-foreground" />
                  </div>
                )}
              </div>
              {/* Info */}
              <div className="min-w-0 flex-1">
                <p className="truncate font-medium">{p.name}</p>
                <p className="text-sm text-muted-foreground">
                  {money.format(p.price)}
                  {p.marketplaceCategory && <> · {p.marketplaceCategory.name}</>}
                </p>
              </div>
              {/* Quick add (stops propagation so click doesn't also toggle checkbox) */}
              <Button
                size="sm"
                variant="outline"
                className="shrink-0"
                onClick={(e) => { e.stopPropagation(); handleAddOne(p.id) }}
                disabled={addProduct.isPending}
              >
                <Plus className="mr-1 h-3.5 w-3.5" />
                Add
              </Button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

// ---------------------------------------------------------------------------
// Strategy catalogue — defines every strategy's display + configurable fields
// ---------------------------------------------------------------------------

interface FieldDef {
  key: keyof SuggestParams
  label: string
  description: string
  type: 'number' | 'decimal'
  min?: number
  max?: number
  step?: number
  unit?: string
  defaultValue: number
}

interface StrategyDef {
  id: SuggestStrategy
  label: string
  description: string
  icon: React.ReactNode
  iconBg: string
  iconColor: string
  fields: FieldDef[]
  /** Which SuggestedProduct fields to show as metadata badges */
  resultBadge: (p: SuggestedProduct) => string | undefined
  resultRank?: boolean
}

const STRATEGIES: StrategyDef[] = [
  {
    id: 'new_arrivals',
    label: 'New Arrivals',
    description: 'Products you listed recently — great for keeping buyers updated on fresh stock.',
    icon: <Clock className="h-4 w-4" />,
    iconBg: 'bg-purple-500/10',
    iconColor: 'text-purple-500',
    fields: [
      {
        key: 'windowDays',
        label: 'Listed within (days)',
        description: 'Only include products added within this many days.',
        type: 'number',
        min: 1,
        max: 90,
        defaultValue: 7,
        unit: 'days',
      },
      {
        key: 'limit',
        label: 'Max results',
        description: 'Maximum number of products to suggest.',
        type: 'number',
        min: 1,
        max: 100,
        defaultValue: 30,
        unit: 'products',
      },
    ],
    resultBadge: (p) => (p.createdAt ? `Added ${daysAgo(p.createdAt)}` : undefined),
  },
  {
    id: 'best_sellers',
    label: 'Best Sellers',
    description: 'Your top-selling products ranked by units sold — ideal for showcasing what buyers love.',
    icon: <TrendingUp className="h-4 w-4" />,
    iconBg: 'bg-orange-500/10',
    iconColor: 'text-orange-500',
    fields: [
      {
        key: 'windowDays',
        label: 'Sales window (days)',
        description: 'Count orders placed within this many days.',
        type: 'number',
        min: 7,
        max: 365,
        defaultValue: 90,
        unit: 'days',
      },
      {
        key: 'limit',
        label: 'Top N products',
        description: 'Return only the top N best sellers.',
        type: 'number',
        min: 1,
        max: 100,
        defaultValue: 20,
        unit: 'products',
      },
    ],
    resultBadge: (p) => (p.totalSold !== undefined ? `${p.totalSold} sold` : undefined),
    resultRank: true,
  },
  {
    id: 'clearance',
    label: 'Clearance',
    description: 'Old stock that has been sitting around — move it with a dedicated clearance collection.',
    icon: <Tag className="h-4 w-4" />,
    iconBg: 'bg-red-500/10',
    iconColor: 'text-red-500',
    fields: [
      {
        key: 'minDaysSinceListed',
        label: 'Listed at least (days ago)',
        description: 'Products must have been listed this many days ago or earlier.',
        type: 'number',
        min: 7,
        max: 730,
        defaultValue: 30,
        unit: 'days',
      },
      {
        key: 'maxStock',
        label: 'Max stock remaining',
        description: 'Only include products with this many units or fewer still in stock.',
        type: 'number',
        min: 1,
        max: 500,
        defaultValue: 20,
        unit: 'units',
      },
      {
        key: 'limit',
        label: 'Max results',
        description: 'Maximum number of products to suggest.',
        type: 'number',
        min: 1,
        max: 100,
        defaultValue: 30,
        unit: 'products',
      },
    ],
    resultBadge: (p) =>
      p.stockQuantity !== undefined ? `${p.stockQuantity} left in stock` : undefined,
  },
  {
    id: 'high_rated',
    label: 'Highly Rated',
    description: 'Products your customers love most — great for social proof collections.',
    icon: <Star className="h-4 w-4" />,
    iconBg: 'bg-yellow-500/10',
    iconColor: 'text-yellow-500',
    fields: [
      {
        key: 'minRating',
        label: 'Minimum star rating',
        description: 'Only suggest products with an average rating at or above this value.',
        type: 'decimal',
        min: 1,
        max: 5,
        step: 0.1,
        defaultValue: 4.0,
        unit: '/ 5',
      },
      {
        key: 'minReviews',
        label: 'Minimum review count',
        description: 'Products must have at least this many reviews to qualify.',
        type: 'number',
        min: 1,
        max: 200,
        defaultValue: 3,
        unit: 'reviews',
      },
      {
        key: 'limit',
        label: 'Max results',
        description: 'Maximum number of products to suggest.',
        type: 'number',
        min: 1,
        max: 100,
        defaultValue: 30,
        unit: 'products',
      },
    ],
    resultBadge: (p) =>
      p.avgRating !== undefined
        ? `${p.avgRating}★ (${p.reviewCount} reviews)`
        : undefined,
  },
  {
    id: 'low_stock',
    label: 'Low Stock',
    description: 'Products nearly out of stock — create urgency with a limited-availability collection.',
    icon: <AlertTriangle className="h-4 w-4" />,
    iconBg: 'bg-amber-500/10',
    iconColor: 'text-amber-500',
    fields: [
      {
        key: 'maxStock',
        label: 'Stock threshold (max)',
        description: 'Products with this many units or fewer qualify.',
        type: 'number',
        min: 1,
        max: 200,
        defaultValue: 10,
        unit: 'units',
      },
      {
        key: 'minStock',
        label: 'Stock threshold (min)',
        description: 'Exclude products with fewer than this many units (avoids showing out-of-stock items).',
        type: 'number',
        min: 1,
        max: 200,
        defaultValue: 1,
        unit: 'units',
      },
      {
        key: 'limit',
        label: 'Max results',
        description: 'Maximum number of products to suggest.',
        type: 'number',
        min: 1,
        max: 100,
        defaultValue: 30,
        unit: 'products',
      },
    ],
    resultBadge: (p) =>
      p.stockQuantity !== undefined ? `${p.stockQuantity} left` : undefined,
  },
  {
    id: 'price_drop',
    label: 'Price Drop Candidates',
    description: 'Established products you recently updated — likely price changes. Feature them to attract deal-seekers.',
    icon: <ArrowDownCircle className="h-4 w-4" />,
    iconBg: 'bg-blue-500/10',
    iconColor: 'text-blue-500',
    fields: [
      {
        key: 'minDaysSinceListed',
        label: 'Listed at least (days ago)',
        description: 'Products must have been in your shop for at least this long.',
        type: 'number',
        min: 7,
        max: 730,
        defaultValue: 30,
        unit: 'days',
      },
      {
        key: 'limit',
        label: 'Max results',
        description: 'Maximum number of products to suggest.',
        type: 'number',
        min: 1,
        max: 100,
        defaultValue: 30,
        unit: 'products',
      },
    ],
    resultBadge: (p) =>
      p.updatedAt ? `Last updated ${daysAgo(p.updatedAt)}` : undefined,
  },
]

// Shared price-range fields appended to every strategy's criteria panel
const PRICE_FIELDS: FieldDef[] = [
  {
    key: 'minPrice',
    label: 'Min price (KES)',
    description: 'Only include products priced at or above this amount.',
    type: 'number',
    min: 0,
    defaultValue: 0,
    unit: 'KES',
  },
  {
    key: 'maxPrice',
    label: 'Max price (KES)',
    description: 'Only include products priced at or below this amount.',
    type: 'number',
    min: 0,
    defaultValue: 0,
    unit: 'KES',
  },
]

// ---------------------------------------------------------------------------
// Tab 3 — Smart Add (rewritten)
// ---------------------------------------------------------------------------
function SmartAddTab({
  collectionId,
  collectionName,
  assignedIds,
  bulkAdd,
  onFlash,
}: {
  collectionId: string
  collectionName: string
  assignedIds: Set<string>
  bulkAdd: ReturnType<typeof useBulkAddProducts>
  onFlash: (msg: string, kind: 'success' | 'error') => void
}) {
  // Which strategy card is expanded / enabled
  const [activeStrategy, setActiveStrategy] = React.useState<SuggestStrategy | null>(null)

  // Per-strategy criteria state: strategy id → field values
  const [criteria, setCriteria] = React.useState<
    Record<string, Record<string, number>>
  >(() =>
    Object.fromEntries(
      STRATEGIES.map((s) => [
        s.id,
        Object.fromEntries(
          [...s.fields, ...PRICE_FIELDS]
            .filter((f) => f.defaultValue !== 0) // only seed non-zero defaults
            .map((f) => [f.key, f.defaultValue]),
        ),
      ]),
    ),
  )

  // Committed params — only set when seller clicks "Find products"
  const [committedParams, setCommittedParams] = React.useState<SuggestParams | null>(null)
  const [fetchEnabled, setFetchEnabled] = React.useState(false)

  // Results selection
  const [selected, setSelected] = React.useState<Set<string>>(new Set())

  const { data: results, isLoading, isFetching } = useSmartSuggest(
    collectionId,
    committedParams,
    fetchEnabled,
  )

  function updateField(strategyId: string, key: string, value: number) {
    setCriteria((prev) => ({
      ...prev,
      [strategyId]: { ...prev[strategyId], [key]: value },
    }))
    // If we're editing the active strategy's criteria, clear stale results
    if (strategyId === activeStrategy) {
      setFetchEnabled(false)
      setSelected(new Set())
    }
  }

  function handleStrategyToggle(strategyId: SuggestStrategy) {
    if (activeStrategy === strategyId) {
      // Collapsing the current card
      setActiveStrategy(null)
      setFetchEnabled(false)
      setCommittedParams(null)
      setSelected(new Set())
    } else {
      setActiveStrategy(strategyId)
      setFetchEnabled(false)
      setCommittedParams(null)
      setSelected(new Set())
    }
  }

  function handleFindProducts() {
    if (!activeStrategy) return
    const fieldValues = criteria[activeStrategy] ?? {}
    const params: SuggestParams = { strategy: activeStrategy }
    // Only pass non-zero values (0 means "not set" for price fields)
    for (const [k, v] of Object.entries(fieldValues)) {
      if (v !== 0 && v !== undefined) {
        ;(params as any)[k] = v
      }
    }
    setCommittedParams(params)
    setFetchEnabled(true)
    setSelected(new Set())
  }

  function toggleSelect(id: string) {
    setSelected((prev) => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }

  function selectAll() {
    if (!results?.length) return
    setSelected(
      selected.size === results.length
        ? new Set()
        : new Set(results.map((p) => p.id)),
    )
  }

  async function handleAddSelected() {
    if (!selected.size) return
    try {
      const result = await bulkAdd.mutateAsync({
        collectionId,
        productIds: Array.from(selected),
      })
      setSelected(new Set())
      setFetchEnabled(false)
      setCommittedParams(null)
      onFlash(
        `Added ${result.added} product${result.added !== 1 ? 's' : ''}${result.skipped ? ` (${result.skipped} already in collection)` : ''}.`,
        'success',
      )
    } catch (err) {
      onFlash(getFriendlyError(err, 'Could not add products.'), 'error')
    }
  }

  const activeStrategyDef = STRATEGIES.find((s) => s.id === activeStrategy) ?? null

  return (
    <div className="space-y-4">
      {/* Explainer */}
      <div className="flex gap-3 rounded-lg border border-blue-200 bg-blue-50/60 p-4 text-sm dark:border-blue-800 dark:bg-blue-950/30">
        <Info className="mt-0.5 h-4 w-4 shrink-0 text-blue-500" />
        <p className="text-blue-700 dark:text-blue-300">
          Choose a strategy, tune the criteria to match your intent, then click{' '}
          <strong>Find products</strong>. The system surfaces candidates — you review, select, and confirm before anything is added to <strong>{collectionName}</strong>.
        </p>
      </div>

      {/* Strategy cards */}
      <div className="space-y-3">
        {STRATEGIES.map((strategy) => {
          const isOpen = activeStrategy === strategy.id
          const currentCriteria = criteria[strategy.id] ?? {}

          return (
            <div
              key={strategy.id}
              className={`rounded-lg border bg-card transition-shadow ${isOpen ? 'shadow-sm ring-1 ring-primary/20' : ''}`}
            >
              {/* Card header — always visible */}
              <button
                type="button"
                className="flex w-full items-center gap-3 p-4 text-left"
                onClick={() => handleStrategyToggle(strategy.id)}
              >
                <div
                  className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${strategy.iconBg} ${strategy.iconColor}`}
                >
                  {strategy.icon}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="font-semibold leading-tight">{strategy.label}</p>
                  <p className="mt-0.5 text-sm text-muted-foreground line-clamp-2">
                    {strategy.description}
                  </p>
                </div>
                <div className="shrink-0 text-muted-foreground">
                  {isOpen ? (
                    <ChevronUp className="h-4 w-4" />
                  ) : (
                    <ChevronDown className="h-4 w-4" />
                  )}
                </div>
              </button>

              {/* Expanded: criteria form */}
              {isOpen && (
                <div className="border-t px-4 pb-4 pt-3 space-y-5">
                  {/* Strategy-specific fields */}
                  <div>
                    <p className="mb-3 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                      Strategy criteria
                    </p>
                    <div className="grid gap-4 sm:grid-cols-2">
                      {strategy.fields.map((field) => (
                        <CriteriaField
                          key={String(field.key)}
                          field={field}
                          value={currentCriteria[field.key as string] ?? field.defaultValue}
                          onChange={(v) => updateField(strategy.id, field.key as string, v)}
                        />
                      ))}
                    </div>
                  </div>

                  {/* Price range — shared across all strategies */}
                  <div>
                    <p className="mb-3 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                      Price range filter <span className="normal-case font-normal">(optional — leave 0 to skip)</span>
                    </p>
                    <div className="grid gap-4 sm:grid-cols-2">
                      {PRICE_FIELDS.map((field) => (
                        <CriteriaField
                          key={String(field.key)}
                          field={field}
                          value={currentCriteria[field.key as string] ?? 0}
                          onChange={(v) => updateField(strategy.id, field.key as string, v)}
                        />
                      ))}
                    </div>
                  </div>

                  {/* Find button */}
                  <Button onClick={handleFindProducts} className="w-full sm:w-auto" disabled={isLoading || isFetching}>
                    {isLoading || isFetching ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                      <Search className="mr-2 h-4 w-4" />
                    )}
                    Find products
                  </Button>

                  {/* Results */}
                  {fetchEnabled && !isLoading && !isFetching && results !== undefined && (
                    <div className="space-y-3 pt-1">
                      <div className="flex items-center justify-between">
                        <p className="text-sm font-medium">
                          {results.length === 0
                            ? 'No products matched your criteria.'
                            : `${results.length} product${results.length !== 1 ? 's' : ''} found`}
                        </p>
                        {results.length > 0 && (
                          <div className="flex items-center gap-2">
                            <Button variant="outline" size="sm" onClick={selectAll}>
                              {selected.size === results.length ? (
                                <CheckSquare className="mr-2 h-4 w-4" />
                              ) : (
                                <Square className="mr-2 h-4 w-4" />
                              )}
                              {selected.size === results.length ? 'Deselect all' : 'Select all'}
                            </Button>
                            {selected.size > 0 && (
                              <Button
                                size="sm"
                                onClick={handleAddSelected}
                                disabled={bulkAdd.isPending}
                              >
                                {bulkAdd.isPending ? (
                                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                ) : (
                                  <Plus className="mr-2 h-4 w-4" />
                                )}
                                Add {selected.size} to collection
                              </Button>
                            )}
                          </div>
                        )}
                      </div>

                      {results.length > 0 && (
                        <SuggestedProductList
                          products={results}
                          selected={selected}
                          onToggle={toggleSelect}
                          badge={activeStrategyDef?.resultBadge}
                          rankBadge={activeStrategyDef?.resultRank}
                        />
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// CriteriaField — a single labelled number input with description
// ---------------------------------------------------------------------------
function CriteriaField({
  field,
  value,
  onChange,
}: {
  field: FieldDef
  value: number
  onChange: (v: number) => void
}) {
  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between">
        <Label className="text-sm font-medium">{field.label}</Label>
        {field.unit && (
          <span className="text-xs text-muted-foreground">{field.unit}</span>
        )}
      </div>
      <Input
        type="number"
        min={field.min}
        max={field.max}
        step={field.step ?? 1}
        value={value === 0 && field.defaultValue === 0 ? '' : value}
        placeholder={String(field.defaultValue)}
        onChange={(e) => {
          const n = field.type === 'decimal'
            ? parseFloat(e.target.value)
            : parseInt(e.target.value, 10)
          if (!isNaN(n)) onChange(n)
        }}
      />
      <p className="text-xs text-muted-foreground">{field.description}</p>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Shared: SuggestedProductList
// ---------------------------------------------------------------------------
function SuggestedProductList({
  products,
  selected,
  onToggle,
  badge,
  rankBadge = false,
}: {
  products: SuggestedProduct[]
  selected: Set<string>
  onToggle: (id: string) => void
  badge?: (p: SuggestedProduct) => string | undefined
  rankBadge?: boolean
}) {
  return (
    <div className="space-y-2">
      {products.map((p, idx) => (
        <div
          key={p.id}
          onClick={() => onToggle(p.id)}
          className={`flex cursor-pointer items-center gap-3 rounded-lg border bg-card p-3 transition-colors ${
            selected.has(p.id)
              ? 'border-primary/60 bg-primary/5'
              : 'hover:bg-accent/40'
          }`}
        >
          {/* Checkbox */}
          <div className="shrink-0">
            {selected.has(p.id) ? (
              <CheckSquare className="h-5 w-5 text-primary" />
            ) : (
              <Square className="h-5 w-5 text-muted-foreground" />
            )}
          </div>

          {/* Rank badge */}
          {rankBadge && (
            <span className="shrink-0 w-6 text-center text-xs font-semibold text-muted-foreground">
              #{idx + 1}
            </span>
          )}

          {/* Thumbnail */}
          <div className="h-12 w-12 shrink-0 overflow-hidden rounded-md bg-muted">
            {p.thumbnailUrl ? (
              <img src={p.thumbnailUrl} alt={p.name} className="h-full w-full object-cover" />
            ) : (
              <div className="flex h-full w-full items-center justify-center">
                <Package className="h-5 w-5 text-muted-foreground" />
              </div>
            )}
          </div>

          {/* Info */}
          <div className="min-w-0 flex-1">
            <p className="truncate font-medium">{p.name}</p>
            <p className="text-sm text-muted-foreground">
              {money.format(p.price)}
              {p.marketplaceCategory && <> · {p.marketplaceCategory.name}</>}
            </p>
          </div>

          {/* Optional metadata badge */}
          {badge && badge(p) && (
            <Badge variant="secondary" className="shrink-0 text-xs">
              {badge(p)}
            </Badge>
          )}
        </div>
      ))}
    </div>
  )
}

// ---------------------------------------------------------------------------
// Utility
// ---------------------------------------------------------------------------
function daysAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime()
  const days = Math.floor(diff / (1000 * 60 * 60 * 24))
  if (days === 0) return 'today'
  if (days === 1) return '1 day ago'
  return `${days} days ago`
}
