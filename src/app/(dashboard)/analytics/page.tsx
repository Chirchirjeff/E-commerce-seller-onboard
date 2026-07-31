/*
 * Analytics Page - Shop Performance
 * Visualize shop analytics and performance metrics
 */

'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { PerformanceChart } from '@/components/charts/performance-chart'
import { useShopAnalytics } from '@/hooks/use-analytics'
import { TrendingUp, Users, ShoppingBag, DollarSign, Package, Loader2 } from 'lucide-react'

export default function AnalyticsPage() {
  const { data: analytics, isLoading, error } = useShopAnalytics()

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </div>
    )
  }

  // No shop set up yet
  if (!analytics) {
    return (
      <>
        <div className="mb-6">
          <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">Analytics</h1>
          <p className="text-sm text-muted-foreground">Track your shop's performance</p>
        </div>
        <div className="flex flex-col items-center justify-center h-64 text-center text-muted-foreground">
          <TrendingUp className="h-12 w-12 mb-4 opacity-30" />
          <p className="text-base font-medium">No data yet</p>
          <p className="text-sm mt-1">Analytics will appear here once your shop is active and receiving orders.</p>
        </div>
      </>
    )
  }

  return (
    <>
      <div className="mb-6">
        <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">Analytics</h1>
        <p className="text-sm text-muted-foreground">Track your shop's performance</p>
      </div>

      {/* KPI cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-4">
              <div className="rounded-lg bg-blue-500/10 p-3 text-blue-500">
                <DollarSign className="h-5 w-5" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total Revenue</p>
                <p className="text-xl font-bold">${analytics.totalRevenue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-4">
              <div className="rounded-lg bg-green-500/10 p-3 text-green-500">
                <ShoppingBag className="h-5 w-5" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total Orders</p>
                <p className="text-xl font-bold">{analytics.totalOrders.toLocaleString()}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-4">
              <div className="rounded-lg bg-purple-500/10 p-3 text-purple-500">
                <Users className="h-5 w-5" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Unique Customers</p>
                <p className="text-xl font-bold">{analytics.totalCustomers.toLocaleString()}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-4">
              <div className="rounded-lg bg-yellow-500/10 p-3 text-yellow-500">
                <Package className="h-5 w-5" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total Products</p>
                <p className="text-xl font-bold">{analytics.totalProducts.toLocaleString()}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="mt-6">
        {/* Order status breakdown — real data from the backend */}
        <PerformanceChart
          data={analytics.performanceData}
          title="Orders by Status"
          description="Breakdown of your orders by their current status"
          isLoading={false}
        />
      </div>
    </>
  )
}
