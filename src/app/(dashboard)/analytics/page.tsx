/*
 * Analytics Page — shop performance
 *
 * One range picker scopes the whole page. Every number is compared with the
 * period immediately before it. Data comes from GET /analytics/seller, which
 * only ever returns the signed-in seller's own shop.
 */

'use client'

import * as React from 'react'
import Link from 'next/link'
import { ShoppingBag, Star, TrendingUp, Users, Wallet, Package } from 'lucide-react'
import { LazyTrendChart } from '@/components/charts/lazy'
import {
  ChartCard, RankedBars, Segmented, StatTile, StatusBreakdown,
  formatCount, formatKsh, percentChange,
} from '@/components/charts/chart-kit'
import { AnalyticsSkeleton } from '@/components/shared/page-skeletons'
import { useSellerAnalytics, type AnalyticsRange } from '@/hooks/use-analytics'

const RANGES: { value: AnalyticsRange; label: string }[] = [
  { value: 7, label: '7D' },
  { value: 30, label: '30D' },
  { value: 90, label: '90D' },
  { value: 365, label: '1Y' },
]

const RANGE_TEXT: Record<AnalyticsRange, string> = { 7: '7 days', 30: '30 days', 90: '90 days', 365: '12 months' }

/** Weekly buckets keep long-range sparklines readable. */
function sparkValues(series: { revenue: number; orders: number }[], key: 'revenue' | 'orders', days: number) {
  const vals = series.map((d) => d[key] || 0)
  if (days <= 30) return vals
  const size = days > 90 ? 30 : 7
  const out: number[] = []
  for (let i = 0; i < vals.length; i += size) out.push(vals.slice(i, i + size).reduce((a, b) => a + b, 0))
  return out
}

export default function AnalyticsPage() {
  const [range, setRange] = React.useState<AnalyticsRange>(30)
  const { data, isLoading, isFetching, isPlaceholderData, error } = useSellerAnalytics(range)

  const header = (
    <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">Analytics</h1>
        <p className="text-sm text-muted-foreground">
          {data?.shop?.name ? `How ${data.shop.name} is doing` : "Track your shop's performance"}, compared with the previous period.
        </p>
      </div>
      {/* One filter row scopes every chart on the page */}
      <Segmented label="Date range" value={range} onChange={setRange} options={RANGES} />
    </div>
  )

  if (isLoading) return <AnalyticsSkeleton />

  if (error) {
    return (
      <>
        {header}
        <div className="rounded-xl border border-destructive/40 bg-destructive/5 px-4 py-6 text-center text-sm text-destructive">
          We couldn&apos;t load your analytics. Please refresh the page.
        </div>
      </>
    )
  }

  if (!data) {
    return (
      <>
        {header}
        <div className="flex h-64 flex-col items-center justify-center rounded-xl border border-dashed text-center text-muted-foreground">
          <TrendingUp className="mb-4 h-12 w-12 opacity-30" />
          <p className="text-base font-medium">No data yet</p>
          <p className="mt-1 text-sm">Analytics will appear here once your shop is active and receiving orders.</p>
        </div>
      </>
    )
  }

  const { current, previous, series } = data
  const vs = `vs previous ${RANGE_TEXT[range]}`
  // Hold the previous render at reduced opacity while a new range loads.
  const dim = isFetching && isPlaceholderData ? 'opacity-60' : ''

  return (
    <>
      {header}

      <div className={`grid min-w-0 gap-4 transition-opacity sm:grid-cols-2 xl:grid-cols-4 ${dim}`}>
        <StatTile label="Revenue" icon={Wallet} value={formatKsh(current.revenue, true)}
          change={percentChange(current.revenue, previous.revenue)} changeLabel={vs}
          trend={sparkValues(series, 'revenue', range)} />
        <StatTile label="Orders" icon={ShoppingBag} value={formatCount(current.orders)}
          change={percentChange(current.orders, previous.orders)} changeLabel={vs}
          trend={sparkValues(series, 'orders', range)} />
        <StatTile label="Customers" icon={Users} value={formatCount(current.customers)}
          change={percentChange(current.customers, previous.customers)} changeLabel={vs} />
        <StatTile label="Average order value" icon={TrendingUp} value={formatKsh(current.averageOrderValue, true)}
          change={percentChange(current.averageOrderValue, previous.averageOrderValue)} changeLabel={vs} />
      </div>

      {/* min-w-0 on the grid lets every chart shrink to fit any screen */}
      <div className={`mt-6 grid min-w-0 gap-6 transition-opacity xl:grid-cols-3 ${dim}`}>
        <ChartCard
          title="Sales over time"
          subtitle={`Daily, last ${RANGE_TEXT[range]} · cancelled orders excluded`}
          className="xl:col-span-2"
        >
          <LazyTrendChart
            data={series}
            metrics={[
              { key: 'revenue', label: 'Revenue', money: true, format: (v) => formatKsh(v) },
              { key: 'orders', label: 'Orders', format: (v) => formatCount(v) },
            ]}
            summary={{
              revenue: { value: current.revenue, change: percentChange(current.revenue, previous.revenue) },
              orders: { value: current.orders, change: percentChange(current.orders, previous.orders) },
            }}
          />
        </ChartCard>

        <ChartCard title="Order status" subtitle={`Orders placed in the last ${RANGE_TEXT[range]}`}>
          <StatusBreakdown data={data.statusDistribution} />
        </ChartCard>

        <ChartCard
          title="Top products"
          subtitle={`Best sellers by revenue, last ${RANGE_TEXT[range]}`}
          className="xl:col-span-2"
          actions={<Link href="/products" className="text-sm font-medium text-primary hover:underline">All products</Link>}
        >
          <RankedBars
            items={data.topProducts.map((p) => ({
              key: p.productId,
              label: p.name,
              value: p.revenue,
              detail: `${formatCount(p.quantity)} sold`,
              image: p.thumbnailUrl,
            }))}
            format={(v) => formatKsh(v, true)}
            emptyText="No sales in this period yet. Share your shop link to get your first orders."
          />
        </ChartCard>

        <ChartCard title="Shop at a glance" subtitle="All-time">
          <dl className="grid grid-cols-2 gap-4">
            <div className="rounded-lg bg-muted/50 p-4">
              <dt className="flex items-center gap-1.5 text-xs text-muted-foreground"><Package className="h-3.5 w-3.5" /> Products</dt>
              <dd className="mt-1 text-2xl font-semibold">{formatCount(data.totalProducts)}</dd>
            </div>
            <div className="rounded-lg bg-muted/50 p-4">
              <dt className="flex items-center gap-1.5 text-xs text-muted-foreground"><Star className="h-3.5 w-3.5" /> Rating</dt>
              <dd className="mt-1 text-2xl font-semibold">
                {data.averageRating ? data.averageRating.toFixed(1) : '—'}
                <span className="ml-1 text-sm font-normal text-muted-foreground">
                  {data.reviewCount ? `(${formatCount(data.reviewCount)} review${data.reviewCount === 1 ? '' : 's'})` : 'No reviews yet'}
                </span>
              </dd>
            </div>
          </dl>
        </ChartCard>
      </div>
    </>
  )
}
