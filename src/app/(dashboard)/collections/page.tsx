'use client'

/*
 * Collections list page — /collections
 * Shows all collections for the authenticated seller with stats, active toggle,
 * edit, delete, and a quick-create button.
 */

import * as React from 'react'
import Link from 'next/link'
import { Plus, Layers, Pencil, Trash2, ToggleLeft, ToggleRight, ChevronRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { CollectionFormDialog } from '@/components/collections/CollectionFormDialog'
import {
  useCollections,
  useDeleteCollection,
  useToggleCollectionActive,
  type Collection,
} from '@/hooks/use-collections'
import { getFriendlyError } from '@/lib/api-client'

export default function CollectionsPage() {
  const { data: collections, isLoading } = useCollections()
  const deleteCollection = useDeleteCollection()
  const toggleActive = useToggleCollectionActive()

  const [isCreateOpen, setIsCreateOpen] = React.useState(false)
  const [editingCollection, setEditingCollection] = React.useState<Collection | null>(null)
  const [deletingId, setDeletingId] = React.useState<string | null>(null)
  const [actionError, setActionError] = React.useState<string | null>(null)

  const activeCount = collections?.filter((c) => c.isActive).length ?? 0
  const totalProducts = collections?.reduce((sum, c) => sum + (c._count?.products ?? 0), 0) ?? 0

  async function confirmDelete(id: string) {
    setActionError(null)
    try {
      await deleteCollection.mutateAsync(id)
    } catch (err) {
      setActionError(getFriendlyError(err, 'Could not delete collection.'))
    } finally {
      setDeletingId(null)
    }
  }

  async function handleToggle(collection: Collection) {
    setActionError(null)
    try {
      await toggleActive.mutateAsync({ id: collection.id, isActive: collection.isActive })
    } catch (err) {
      setActionError(getFriendlyError(err, 'Could not update collection status.'))
    }
  }

  return (
    <>
      {/* Header */}
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">Collections</h1>
          <p className="text-sm text-muted-foreground">
            Group your products into curated collections for buyers to discover.
          </p>
        </div>
        <Button onClick={() => setIsCreateOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          New collection
        </Button>
      </div>

      {/* KPI strip */}
      <div className="mb-6 grid gap-4 sm:grid-cols-3">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total collections</p>
                <p className="text-2xl font-bold">{isLoading ? '—' : (collections?.length ?? 0)}</p>
              </div>
              <div className="rounded-lg bg-primary/10 p-3 text-primary">
                <Layers className="h-5 w-5" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-muted-foreground">Active</p>
            <p className="text-2xl font-bold text-green-500">{isLoading ? '—' : activeCount}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-muted-foreground">Total products assigned</p>
            <p className="text-2xl font-bold">{isLoading ? '—' : totalProducts}</p>
          </CardContent>
        </Card>
      </div>

      {/* Global action error */}
      {actionError && (
        <div className="mb-4 rounded-md bg-destructive/10 px-4 py-3 text-sm text-destructive">
          {actionError}
        </div>
      )}

      {/* Collections list */}
      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-20 animate-pulse rounded-lg bg-muted" />
          ))}
        </div>
      ) : !collections?.length ? (
        <div className="flex flex-col items-center justify-center rounded-lg border border-dashed py-16 text-center">
          <Layers className="mb-4 h-10 w-10 text-muted-foreground" />
          <h2 className="text-lg font-semibold">No collections yet</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Create your first collection — like Hot Deals or New Arrivals — to showcase products to buyers.
          </p>
          <Button className="mt-6" onClick={() => setIsCreateOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Create collection
          </Button>
        </div>
      ) : (
        <div className="space-y-3">
          {collections.map((col) => (
            <div
              key={col.id}
              className="flex items-center gap-4 rounded-lg border bg-card p-4 transition-shadow hover:shadow-sm"
            >
              {/* Icon */}
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <Layers className="h-5 w-5" />
              </div>

              {/* Info */}
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-semibold truncate">{col.name}</span>
                  <Badge variant={col.isActive ? 'success' : 'secondary'}>
                    {col.isActive ? 'Active' : 'Inactive'}
                  </Badge>
                </div>
                <p className="mt-0.5 text-sm text-muted-foreground">
                  {col._count?.products ?? 0} product{(col._count?.products ?? 0) !== 1 ? 's' : ''} · /{col.slug}
                </p>
                {col.description && (
                  <p className="mt-0.5 truncate text-xs text-muted-foreground">{col.description}</p>
                )}
              </div>

              {/* Actions */}
              <div className="flex shrink-0 items-center gap-1">
                {/* Toggle active */}
                <Button
                  variant="ghost"
                  size="icon"
                  title={col.isActive ? 'Deactivate' : 'Activate'}
                  onClick={() => handleToggle(col)}
                  disabled={toggleActive.isPending}
                >
                  {col.isActive ? (
                    <ToggleRight className="h-4 w-4 text-green-500" />
                  ) : (
                    <ToggleLeft className="h-4 w-4 text-muted-foreground" />
                  )}
                </Button>

                {/* Edit */}
                <Button
                  variant="ghost"
                  size="icon"
                  title="Edit"
                  onClick={() => setEditingCollection(col)}
                >
                  <Pencil className="h-4 w-4" />
                </Button>

                {/* Delete */}
                <Button
                  variant="ghost"
                  size="icon"
                  title="Delete"
                  onClick={() => setDeletingId(col.id)}
                  className="text-destructive hover:text-destructive"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>

                {/* Manage products → detail page */}
                <Link href={`/collections/${col.id}`}>
                  <Button variant="ghost" size="icon" title="Manage products">
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create dialog */}
      <CollectionFormDialog
        open={isCreateOpen}
        onOpenChange={setIsCreateOpen}
      />

      {/* Edit dialog */}
      <CollectionFormDialog
        open={Boolean(editingCollection)}
        onOpenChange={(open) => { if (!open) setEditingCollection(null) }}
        collection={editingCollection}
      />

      {/* Delete confirmation */}
      {deletingId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="mx-4 w-full max-w-sm rounded-lg bg-background p-6 shadow-lg">
            <h2 className="text-lg font-semibold">Delete collection?</h2>
            <p className="mt-2 text-sm text-muted-foreground">
              This will permanently remove the collection and unassign all its products. Products themselves are not deleted.
            </p>
            <div className="mt-6 flex justify-end gap-3">
              <Button variant="outline" onClick={() => setDeletingId(null)} disabled={deleteCollection.isPending}>
                Cancel
              </Button>
              <Button
                variant="destructive"
                onClick={() => confirmDelete(deletingId)}
                disabled={deleteCollection.isPending}
              >
                {deleteCollection.isPending ? 'Deleting…' : 'Delete'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
