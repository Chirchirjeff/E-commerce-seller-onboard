'use client'

import * as React from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts'
import { TrendingUp, Users, Globe, Smartphone } from 'lucide-react'
import { useShop } from '@/hooks/use-shop'
import { useQuery } from '@tanstack/react-query'
import { apiClient } from '@/lib/api-client'
import { Loader2 } from 'lucide-react'

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

const DEVICE_COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444']
const BROWSER_COLORS = ['#8b5cf6', '#ec4899', '#06b6d4', '#14b8a6']

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
    return (
      <Card>
        <CardHeader>
          <CardTitle>Analytics</CardTitle>
        </CardHeader>
        <CardContent className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    )
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

  return (
    <div className="space-y-6">
      {/* Overview Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Clicks</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalClicks}</div>
            <p className="text-xs text-muted-foreground">
              Across all your links
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Unique Visitors</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalUniqueVisitors}</div>
            <p className="text-xs text-muted-foreground">
              Individual visitors
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Links</CardTitle>
            <Badge variant="secondary" className="bg-green-100 text-green-800 border-0">
              {analytics.filter((l) => l.isActive).length}
            </Badge>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {analytics.filter((l) => l.isActive).length}/{analytics.length}
            </div>
            <p className="text-xs text-muted-foreground">
              Links enabled
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Clicks/Link</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {analytics.length > 0
                ? Math.round(totalClicks / analytics.length)
                : 0}
            </div>
            <p className="text-xs text-muted-foreground">
              Per link average
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Clicks Over Time */}
      {clicksData.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Clicks Over Time</CardTitle>
            <CardDescription>Daily click activity</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={clicksData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis
                  dataKey="date"
                  stroke="#888"
                  style={{ fontSize: '12px' }}
                />
                <YAxis stroke="#888" style={{ fontSize: '12px' }} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#fff',
                    border: '1px solid #e5e7eb',
                    borderRadius: '6px',
                  }}
                />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="clicks"
                  stroke="#3b82f6"
                  strokeWidth={2}
                  dot={{ fill: '#3b82f6', r: 4 }}
                  activeDot={{ r: 6 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}

      {/* Device and Browser Distribution */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Device Distribution */}
        {deviceData.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Smartphone className="h-5 w-5" />
                Device Distribution
              </CardTitle>
              <CardDescription>Visitor device types</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={250}>
                <PieChart>
                  <Pie
                    data={deviceData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={(entry) => `${entry.name}: ${entry.value}`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {deviceData.map((entry, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={DEVICE_COLORS[index % DEVICE_COLORS.length]}
                      />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        )}

        {/* Browser Distribution */}
        {browserData.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Top Browsers</CardTitle>
              <CardDescription>Most used browsers</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={browserData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="name" stroke="#888" style={{ fontSize: '12px' }} />
                  <YAxis stroke="#888" style={{ fontSize: '12px' }} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#fff',
                      border: '1px solid #e5e7eb',
                      borderRadius: '6px',
                    }}
                  />
                  <Bar dataKey="value" fill="#8b5cf6" radius={[8, 8, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Geographic Distribution */}
      {topCountries.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Globe className="h-5 w-5" />
              Top Countries
            </CardTitle>
            <CardDescription>Geographic distribution of clicks</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {topCountries.map((country, index) => (
                <div key={index} className="flex items-center gap-4">
                  <span className="font-medium text-sm flex-1">{country.country}</span>
                  <div className="flex-1 bg-muted rounded-full h-2 overflow-hidden">
                    <div
                      className="bg-primary h-full rounded-full transition-all"
                      style={{
                        width: `${
                          (country.visits / Math.max(...topCountries.map((c) => c.visits))) *
                          100
                        }%`,
                      }}
                    />
                  </div>
                  <span className="font-semibold text-sm w-12 text-right">
                    {country.visits}
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

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
