/*
 * Products Page - Manage Products
 * List, add, edit, and delete products
 */

'use client'

import * as React from 'react'
import Link from 'next/link'
// MainLayout is provided by (dashboard)/layout.tsx — do not wrap here
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { DataTable } from '@/components/shared/data-table'
import { useProducts } from '@/hooks/use-products'
import { Package, Plus, Filter, Download, Eye, Pencil, Trash2 } from 'lucide-react'

// Low stock threshold — items at or below this are flagged as low stock
const LOW_STOCK_THRESHOLD = 5

export default function ProductsPage() {
  const { data: products, isLoading } = useProducts()

  // Derive stock stats from the real product list
  const inStock = products?.filter((p: any) => p.stockQuantity > LOW_STOCK_THRESHOLD).length ?? 0
  const lowStock = products?.filter((p: any) => p.stockQuantity > 0 && p.stockQuantity <= LOW_STOCK_THRESHOLD).length ?? 0
  const outOfStock = products?.filter((p: any) => p.stockQuantity === 0).length ?? 0

  return (
    <>
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">Products</h1>
          <p className="text-sm text-muted-foreground">Manage your product catalog</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button variant="outline" size="sm"><Filter className="mr-2 h-4 w-4" />Filter</Button>
          <Button variant="outline" size="sm"><Download className="mr-2 h-4 w-4" />Export</Button>
          <Link href="/products/new">
            <Button><Plus className="mr-2 h-4 w-4" />Add Product</Button>
          </Link>
        </div>
      </div>

      <div className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Products</p>
                <p className="text-2xl font-bold">{isLoading ? '—' : (products?.length ?? 0)}</p>
              </div>
              <div className="rounded-lg bg-purple-500/10 p-3 text-purple-500">
                <Package className="h-5 w-5" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div>
              <p className="text-sm text-muted-foreground">In Stock</p>
              <p className="text-2xl font-bold text-green-500">{isLoading ? '—' : inStock}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div>
              <p className="text-sm text-muted-foreground">Low Stock</p>
              <p className="text-2xl font-bold text-yellow-500">{isLoading ? '—' : lowStock}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div>
              <p className="text-sm text-muted-foreground">Out of Stock</p>
              <p className="text-2xl font-bold text-red-500">{isLoading ? '—' : outOfStock}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <DataTable
        title="Product Catalog"
        description="Complete list of your products"
        data={products || []}
        isLoading={isLoading}
        columns={[
          { key: 'name', label: 'Product Name' },
          { key: 'category', label: 'Category', render: (value) => value?.name || 'Uncategorized' },
          { key: 'price', label: 'Price', render: (value) => `$${Number(value).toFixed(2)}` },
          { key: 'stockQuantity', label: 'Stock' },
          {
            key: 'stockQuantity',
            label: 'Status',
            render: (value) => {
              const qty = Number(value)
              const status = qty === 0 ? 'out_of_stock' : qty <= LOW_STOCK_THRESHOLD ? 'low_stock' : 'active'
              const colors: Record<string, any> = {
                active: 'success',
                low_stock: 'warning',
                out_of_stock: 'destructive',
              }
              const labels: Record<string, string> = {
                active: 'In Stock',
                low_stock: 'Low Stock',
                out_of_stock: 'Out of Stock',
              }
              return <Badge variant={colors[status]}>{labels[status]}</Badge>
            },
          },
        ]}
      />
    </>
  )
}