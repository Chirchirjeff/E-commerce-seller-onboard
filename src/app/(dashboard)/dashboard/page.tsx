/*
 * Dashboard Home - Seller Overview
 * Shows key metrics, recent orders, and shop performance
 */

'use client'

import { KPICard } from '@/components/shared/kpi-card'
// Client-only, code-split recharts trend chart; the rest is light HTML
import { LazyTrendChart } from '@/components/charts/lazy'
import { ChartCard, StatusBreakdown, formatCount, formatKsh, percentChange } from '@/components/charts/chart-kit'
import { Skeleton, SkeletonGroup } from '@/components/ui/skeleton'
import { useSellerAnalytics } from '@/hooks/use-analytics'
import { DataTable } from '@/components/shared/data-table'
import { useShopStats, useRecentOrders, type RecentOrderRow } from '@/hooks/use-shop'
import { UserIdentity } from '@/components/shared/user-identity'
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
  const { data: analytics, isLoading: analyticsLoading } = useSellerAnalytics(30)

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

      {/* Charts — min-w-0 lets each grid cell shrink so charts fit any screen */}
      <div className="mt-6 grid min-w-0 gap-6 xl:grid-cols-3">
        <ChartCard
          title="Sales, last 30 days"
          subtitle="Cancelled orders excluded"
          className="xl:col-span-2"
          actions={<Link href="/analytics" className="text-sm font-medium text-primary hover:underline">Full analytics</Link>}
        >
          {analyticsLoading ? (
            <SkeletonGroup label="Loading sales chart…" className="space-y-4">
              <Skeleton className="h-9 w-40" />
              <Skeleton className="h-[220px] w-full sm:h-[280px]" />
            </SkeletonGroup>
          ) : (
            <LazyTrendChart
              data={analytics?.series ?? []}
              metrics={[
                { key: 'revenue', label: 'Revenue', money: true, format: (v) => formatKsh(v) },
                { key: 'orders', label: 'Orders', format: (v) => formatCount(v) },
              ]}
              summary={analytics ? {
                revenue: { value: analytics.current.revenue, change: percentChange(analytics.current.revenue, analytics.previous.revenue) },
                orders: { value: analytics.current.orders, change: percentChange(analytics.current.orders, analytics.previous.orders) },
              } : undefined}
            />
          )}
        </ChartCard>
        <ChartCard title="Order status" subtitle="Orders placed in the last 30 days">
          {analyticsLoading ? (
            <SkeletonGroup label="Loading order status…" className="space-y-4">
              <Skeleton className="h-9 w-20" />
              <Skeleton className="h-3 w-full rounded-full" />
              <Skeleton className="h-20 w-full" />
            </SkeletonGroup>
          ) : (
            <StatusBreakdown data={analytics?.statusDistribution ?? []} />
          )}
        </ChartCard>
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
            {
              key: 'customer',
              label: 'Customer',
              render: (value: string, row: RecentOrderRow) => (
                <UserIdentity name={value} username={row.customerUsername} avatarUrl={row.customerAvatarUrl} />
              ),
            },
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
