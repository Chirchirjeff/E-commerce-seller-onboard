/*
 * Dashboard Home - Seller Overview
 * Shows key metrics, recent orders, and shop performance
 */

'use client'

import { KPICard } from '@/components/shared/kpi-card'
import { RevenueChart } from '@/components/charts/revenue-chart'
import { OrderStatusChart } from '@/components/charts/order-status-chart'
import { DataTable } from '@/components/shared/data-table'
import { useShopStats, useRecentOrders } from '@/hooks/use-shop'
import {
  DollarSign,
  ShoppingBag,
  Package,
  Users,
  Clock,
} from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Plus } from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

export default function DashboardPage() {
  const router = useRouter()
  const { data: stats, isLoading: statsLoading } = useShopStats()
  const { data: recentOrders, isLoading: ordersLoading } = useRecentOrders(5)

  return (
    <>
      {/* Header */}
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">Dashboard</h1>
          <p className="text-sm text-muted-foreground">
            Welcome back! Here's what's happening with your shop.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="success" className="gap-1">
            <Clock className="h-3 w-3" />
            Live
          </Badge>
          <Link href="/products/new">
            <Button size="sm">
              <Plus className="mr-2 h-4 w-4" />
              Add Product
            </Button>
          </Link>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <KPICard
          title="Total Revenue"
          value={`Ksh ${stats?.totalRevenue?.toLocaleString() || '0'}`}
          icon={DollarSign}
          trend={stats?.revenueGrowth}
          trendLabel="vs last month"
          isLoading={statsLoading}
        />
        <KPICard
          title="Total Orders"
          value={stats?.totalOrders?.toLocaleString() || '0'}
          icon={ShoppingBag}
          trend={stats?.orderGrowth}
          trendLabel="vs last month"
          isLoading={statsLoading}
        />
        <KPICard
          title="Products"
          value={stats?.totalProducts?.toLocaleString() || '0'}
          icon={Package}
          trend={stats?.productGrowth}
          trendLabel="vs last month"
          isLoading={statsLoading}
        />
        <KPICard
          title="Customers"
          value={stats?.totalCustomers?.toLocaleString() || '0'}
          icon={Users}
          trend={stats?.customerGrowth}
          trendLabel="vs last month"
          isLoading={statsLoading}
        />
      </div>

      {/* Charts */}
      <div className="mt-6 grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <RevenueChart isLoading={statsLoading} />
        </div>
        <div className="lg:col-span-1">
          <OrderStatusChart isLoading={statsLoading} />
        </div>
      </div>

      {/* Recent Orders */}
      <div className="mt-6">
        <DataTable
          title="Recent Orders"
          description="Latest orders for your shop"
          data={recentOrders || []}
          isLoading={ordersLoading}
          columns={[
            { key: 'id', label: 'Order ID', className: 'font-mono text-sm' },
            { key: 'customer', label: 'Customer' },
            { key: 'amount', label: 'Amount', render: (value) => `Ksh ${Number(value ?? 0).toFixed(2)}` },
            { key: 'status', label: 'Status', render: (value) => {
              const colors: Record<string, any> = {
                pending: 'warning',
                processing: 'info',
                shipped: 'info',
                delivered: 'success',
                returned: 'destructive',
                cancelled: 'destructive',
              }
              return <Badge variant={colors[value] || 'secondary'}>{value}</Badge>
            }},
            { key: 'date', label: 'Date' },
          ]}
          onEdit={(row) => router.push(`/orders/${row.id}`)}
        />
      </div>
    </>
  )
}
