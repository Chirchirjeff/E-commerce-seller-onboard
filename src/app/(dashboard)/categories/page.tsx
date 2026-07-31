/*
 * Categories Page - Manage Product Categories
 * Create and delete categories for your shop
 */

'use client'

import * as React from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { useCategories, useCreateCategory, useDeleteCategory } from '@/hooks/use-shop'
import { Loader2, Plus, Trash2, Tag } from 'lucide-react'

export default function CategoriesPage() {
  const { data: categories, isLoading } = useCategories()
  const createCategory = useCreateCategory()
  const deleteCategory = useDeleteCategory()

  const [name, setName] = React.useState('')
  const [error, setError] = React.useState<string | null>(null)
  const [deletingId, setDeletingId] = React.useState<string | null>(null)

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    const trimmed = name.trim()
    if (!trimmed) return

    setError(null)
    try {
      await createCategory.mutateAsync(trimmed)
      setName('')
    } catch (err: any) {
      const msg = err?.response?.data?.message
      setError(Array.isArray(msg) ? msg.join(', ') : (msg ?? 'Failed to create category. Please try again.'))
    }
  }

  const handleDelete = async (id: string) => {
    setDeletingId(id)
    try {
      await deleteCategory.mutateAsync(id)
    } catch {
      // silently ignore — table will stay in sync via query invalidation
    } finally {
      setDeletingId(null)
    }
  }

  return (
    <>
      <div className="mb-6">
        <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">Categories</h1>
        <p className="text-sm text-muted-foreground">Organise your products into categories</p>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">

        {/* ── Add category form ── */}
        <div>
          <Card>
            <CardHeader>
              <CardTitle>New Category</CardTitle>
              <CardDescription>Add a category to your shop</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleCreate} className="space-y-3">
                <Input
                  placeholder="e.g. Electronics"
                  value={name}
                  onChange={(e) => {
                    setName(e.target.value)
                    setError(null)
                  }}
                  disabled={createCategory.isPending}
                  autoFocus
                />
                {error && (
                  <p className="text-xs text-destructive">{error}</p>
                )}
                <Button
                  type="submit"
                  className="w-full"
                  disabled={!name.trim() || createCategory.isPending}
                >
                  {createCategory.isPending ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Adding…
                    </>
                  ) : (
                    <>
                      <Plus className="mr-2 h-4 w-4" />
                      Add Category
                    </>
                  )}
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>

        {/* ── Category list ── */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>Your Categories</span>
                {!isLoading && (
                  <Badge variant="secondary">{categories?.length ?? 0}</Badge>
                )}
              </CardTitle>
              <CardDescription>Categories are scoped to your shop and used when adding products</CardDescription>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                </div>
              ) : !categories?.length ? (
                <div className="flex flex-col items-center justify-center gap-2 py-12 text-center">
                  <div className="rounded-full bg-muted p-4">
                    <Tag className="h-6 w-6 text-muted-foreground" />
                  </div>
                  <p className="text-sm font-medium">No categories yet</p>
                  <p className="text-xs text-muted-foreground">Add your first category using the form on the left</p>
                </div>
              ) : (
                <ul className="divide-y">
                  {categories.map((cat: any) => (
                    <li key={cat.id} className="flex items-center justify-between py-3">
                      <div className="flex items-center gap-3">
                        <div className="flex h-8 w-8 items-center justify-center rounded-md bg-primary/10">
                          <Tag className="h-4 w-4 text-primary" />
                        </div>
                        <span className="text-sm font-medium">{cat.name}</span>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                        disabled={deletingId === cat.id}
                        onClick={() => handleDelete(cat.id)}
                      >
                        {deletingId === cat.id ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <Trash2 className="h-4 w-4" />
                        )}
                      </Button>
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>
        </div>

      </div>
    </>
  )
}
