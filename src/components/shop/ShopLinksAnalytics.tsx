'use client'

import * as React from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { TrendingUp, Users, Globe, Smartphone, Link2, MousePointerClick } from 'lucide-react'
import { LazyTrendChart } from '@/components/charts/lazy'
import { ChartCard, PartBreakdown, RankedBars, StatTile, VIZ, formatCount } from '@/components/charts/chart-kit'
import { useShop } from '@/hooks/use-shop'
import { useQuery } from '@tanstack/react-query'
import { apiClient } from '@/lib/api-client'
import { ShopLinksAnalyticsSkeleton } from '@/components/shared/page-skeletons'

interface LinkAnalyticsData {
  id: string
  token: string
  title?: string
  clickCount: number
  lastClickedAt?: Date
  isActive: boolean
  analytics?: {
    totalClicks: number
    uniqueVisitors?: number
    topCountries?: Array<{ country: string; visits: number }>
    topDevices?: Array<{ device: string; visits: number }>
    topBrowsers?: Array<{ browser: string; visits: number }>
    clicksByDay?: Array<{ date: string; clicks: number }>
  }
}

interface ShopLinksAnalyticsProps {
  shopId?: string
}

/** Fixed colour per device type, so a device keeps its colour everywhere. */
const DEVICE_COLORS: Record<string, string> = {
  mobile: VIZ.blue, desktop: VIZ.orange, tablet: VIZ.aqua, unknown: VIZ.neutral,
}

export default function ShopLinksAnalytics({ shopId }: ShopLinksAnalyticsProps) {
  const { data: shop } = useShop()
  const id = shopId || shop?.id

  const { data: analytics, isLoading, error } = useQuery({
    queryKey: ['shop-links-analytics', id],
    queryFn: async () => {
      if (!id) return null
      const response = await apiClient.get<LinkAnalyticsData[]>(
        `/shops/${id}/analytics`
      )
      return response.data
    },
    enabled: !!id,
  })

  if (!id) return null

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Analytics</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-red-600">Failed to load analytics</p>
        </CardContent>
      </Card>
    )
  }

  if (isLoading) {
    return <ShopLinksAnalyticsSkeleton />
  }

  if (!analytics || analytics.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Analytics</CardTitle>
          <CardDescription>No analytics data available yet</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground text-center py-8">
            Create links and share them to start tracking analytics
          </p>
        </CardContent>
      </Card>
    )
  }

  // Aggregate analytics across all links
  const totalClicks = analytics.reduce((sum, link) => sum + (link.clickCount || 0), 0)
  const totalUniqueVisitors = analytics.reduce(
    (sum, link) => sum + (link.analytics?.uniqueVisitors || 0),
    0
  )
  const allCountries = analytics.flatMap((link) => link.analytics?.topCountries || [])
  const allDevices = analytics.flatMap((link) => link.analytics?.topDevices || [])
  const allBrowsers = analytics.flatMap((link) => link.analytics?.topBrowsers || [])
  const allClicks = analytics.flatMap((link) => link.analytics?.clicksByDay || [])

  // Aggregate countries
  const countryMap = new Map<string, number>()
  allCountries.forEach((item) => {
    countryMap.set(item.country, (countryMap.get(item.country) || 0) + item.visits)
  })
  const topCountries = Array.from(countryMap.entries())
    .map(([country, visits]) => ({ country, visits }))
    .sort((a, b) => b.visits - a.visits)
    .slice(0, 5)

  // Aggregate devices
  const deviceMap = new Map<string, number>()
  allDevices.forEach((item) => {
    deviceMap.set(item.device, (deviceMap.get(item.device) || 0) + item.visits)
  })
  const deviceData = Array.from(deviceMap.entries()).map(([device, visits]) => ({
    name: device.charAt(0).toUpperCase() + device.slice(1),
    value: visits,
  }))

  // Aggregate browsers
  const browserMap = new Map<string, number>()
  allBrowsers.forEach((item) => {
    browserMap.set(item.browser, (browserMap.get(item.browser) || 0) + item.visits)
  })
  const browserData = Array.from(browserMap.entries()).map(([browser, visits]) => ({
    name: browser,
    value: visits,
  }))

  // Aggregate clicks by day
  const dayMap = new Map<string, number>()
  allClicks.forEach((item) => {
    dayMap.set(item.date, (dayMap.get(item.date) || 0) + item.clicks)
  })
  const clicksData = Array.from(dayMap.entries())
    .map(([date, clicks]) => ({ date, clicks }))
    .sort((a, b) => a.date.localeCompare(b.date))

  const activeLinks = analytics.filter((l) => l.isActive).length

  return (
    <div className="min-w-0 space-y-6">
      {/* Overview */}
      <div className="grid min-w-0 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatTile label="Total clicks" icon={MousePointerClick} value={formatCount(totalClicks)} hint="Across all your links"
          trend={clicksData.map((d) => d.clicks)} />
        <StatTile label="Unique visitors" icon={Users} value={formatCount(totalUniqueVisitors)} hint="Individual people who opened a link" />
        <StatTile label="Active links" icon={Link2} value={`${activeLinks}/${analytics.length}`} hint="Links currently enabled" />
        <StatTile label="Average clicks per link" icon={TrendingUp}
          value={formatCount(analytics.length ? Math.round(totalClicks / analytics.length) : 0)} hint="Per link" />
      </div>

      {/* Clicks over time */}
      {clicksData.length > 0 && (
        <ChartCard title="Clicks over time" subtitle="Daily link clicks">
          <LazyTrendChart
            data={clicksData}
            metrics={[{ key: 'clicks', label: 'Clicks', format: (v) => formatCount(v) }]}
          />
        </ChartCard>
      )}

      {/* Devices, browsers and countries — min-w-0 cells so they fit any width */}
      <div className="grid min-w-0 gap-6 lg:grid-cols-2 2xl:grid-cols-3">
        {deviceData.length > 0 && (
          <ChartCard title="Devices" subtitle={<span className="inline-flex items-center gap-1.5"><Smartphone className="h-3.5 w-3.5" /> What visitors used to open your links</span>}>
            <PartBreakdown data={deviceData} unit="visits" colorFor={(n) => DEVICE_COLORS[n.toLowerCase()] ?? VIZ.neutral} />
          </ChartCard>
        )}
        {browserData.length > 0 && (
          <ChartCard title="Browsers" subtitle="Most used browsers">
            <RankedBars
              items={[...browserData].sort((x, y) => y.value - x.value).map((d) => ({ key: d.name, label: d.name, value: d.value }))}
              format={(v) => formatCount(v)}
              max={6}
            />
          </ChartCard>
        )}
        {topCountries.length > 0 && (
          <ChartCard title="Countries" subtitle={<span className="inline-flex items-center gap-1.5"><Globe className="h-3.5 w-3.5" /> Where your clicks come from</span>}>
            <RankedBars
              items={topCountries.map((c) => ({ key: c.country, label: c.country, value: c.visits }))}
              format={(v) => formatCount(v)}
            />
          </ChartCard>
        )}
      </div>

      {/* Links Performance Table */}
      <Card>
        <CardHeader>
          <CardTitle>Links Performance</CardTitle>
          <CardDescription>Individual link statistics</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-3 px-4 font-medium text-muted-foreground">
                    Title
                  </th>
                  <th className="text-right py-3 px-4 font-medium text-muted-foreground">
                    Clicks
                  </th>
                  <th className="text-right py-3 px-4 font-medium text-muted-foreground">
                    Visitors
                  </th>
                  <th className="text-left py-3 px-4 font-medium text-muted-foreground">
                    Status
                  </th>
                </tr>
              </thead>
              <tbody>
                {analytics.map((link, index) => (
                  <tr key={index} className="border-b hover:bg-muted/50">
                    <td className="py-3 px-4 truncate">
                      {link.title || 'Untitled Link'}
                    </td>
                    <td className="text-right py-3 px-4 font-semibold">
                      {link.clickCount}
                    </td>
                    <td className="text-right py-3 px-4">
                      {link.analytics?.uniqueVisitors || 0}
                    </td>
                    <td className="py-3 px-4">
                      <Badge
                        variant={link.isActive ? 'default' : 'outline'}
                        className="text-xs"
                      >
                        {link.isActive ? 'Active' : 'Inactive'}
                      </Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
