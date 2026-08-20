/*
 * Categories Page - View Marketplace Categories
 * Display the platform-controlled product taxonomy
 */

'use client'

import * as React from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { useCategories } from '@/hooks/use-shop'
import { Loader2, Layers, ChevronRight } from 'lucide-react'
import { cn } from '@/lib/utils'

export default function CategoriesPage() {
  const { data: categories, isLoading } = useCategories()
  const [expandedIds, setExpandedIds] = React.useState<Set<string>>(new Set())

  const toggleExpand = (id: string) => {
    const newExpanded = new Set(expandedIds)
    if (newExpanded.has(id)) {
      newExpanded.delete(id)
    } else {
      newExpanded.add(id)
    }
    setExpandedIds(newExpanded)
  }

  const renderCategoryTree = (cats: any[] | undefined, depth = 0): React.ReactNode => {
    if (!cats || cats.length === 0) return null

    return (
      <div>
        {cats.map((cat: any) => {
          const hasChildren = cat.children && cat.children.length > 0
          const isExpanded = expandedIds.has(cat.id)

          return (
            <div key={cat.id}>
              <div
                className={cn(
                  'flex items-center gap-2 px-3 py-2 rounded-md hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors',
                  !cat.isActive && 'opacity-50'
                )}
                style={{ marginLeft: `${depth * 16}px` }}
              >
                {hasChildren ? (
                  <button
                    onClick={() => toggleExpand(cat.id)}
                    className="flex-shrink-0"
                  >
                    <ChevronRight
                      size={16}
                      className={cn(
                        'transition-transform',
                        isExpanded && 'rotate-90'
                      )}
                    />
                  </button>
                ) : (
                  <div className="w-4" />
                )}

                <div className="flex-1 min-w-0">
                  <div className="font-medium truncate">{cat.name}</div>
                  {cat.description && (
                    <div className="text-xs text-gray-500 truncate">{cat.description}</div>
                  )}
                </div>

                <div className="flex items-center gap-2 flex-shrink-0">
                  {cat._count?.products && (
                    <Badge variant="secondary" className="text-xs">
                      {cat._count.products} products
                    </Badge>
                  )}
                  {!cat.isActive && (
                    <Badge variant="destructive" className="text-xs">
                      Inactive
                    </Badge>
                  )}
                </div>
              </div>

              {isExpanded && renderCategoryTree(cat.children, depth + 1)}
            </div>
          )
        })}
      </div>
    )
  }

  return (
    <>
      <div className="mb-6">
        <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">Categories</h1>
        <p className="text-sm text-muted-foreground">
          Platform marketplace categories. Select these when creating products.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Layers size={20} />
            <span>Marketplace Categories</span>
          </CardTitle>
          <CardDescription>
            These are the platform-controlled product categories. Use them to organize your products.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : !categories || categories.length === 0 ? (
            <div className="flex flex-col items-center justify-center gap-2 py-12 text-center">
              <div className="rounded-full bg-muted p-4">
                <Layers className="h-6 w-6 text-muted-foreground" />
              </div>
              <p className="text-sm font-medium">No categories available</p>
              <p className="text-xs text-muted-foreground">
                Contact platform support if categories are not loading
              </p>
            </div>
          ) : (
            <div className="border rounded-lg p-4 max-h-96 overflow-y-auto">
              {renderCategoryTree(categories)}
            </div>
          )}
        </CardContent>
      </Card>
    </>
  )
}
