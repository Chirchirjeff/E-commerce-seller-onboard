'use client'

import * as React from 'react'
import {
  LineChart,
  Line,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { cn } from '@/lib/utils'

interface RevenueChartProps {
  className?: string
  data?: Array<{ date: string; revenue: number; orders: number }>
  isLoading?: boolean
}

const defaultData = [
  { date: 'Jan', revenue: 0, orders: 0 },
  { date: 'Feb', revenue: 0, orders: 0 },
  { date: 'Mar', revenue: 0, orders: 0 },
  { date: 'Apr', revenue: 0, orders: 0 },
  { date: 'May', revenue: 0, orders: 0 },
  { date: 'Jun', revenue: 0, orders: 0 },
]

export function RevenueChart({ className, data = defaultData, isLoading = false }: RevenueChartProps) {
  const formattedData = data.map((item) => ({
    ...item,
    date: new Date(item.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
  }))

  return (
    <Card className={cn('col-span-3', className)}>
      <CardHeader>
        <CardTitle>Revenue Overview</CardTitle>
        <p className="text-sm text-muted-foreground">
          {isLoading ? 'Loading...' : 'Monthly revenue and order trends'}
        </p>
      </CardHeader>
      <CardContent>
        <div className="h-[350px]">
          {isLoading ? (
            <div className="flex items-center justify-center h-full">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={formattedData}>
                <defs>
                  <linearGradient id="revenueGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.1} />
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis dataKey="date" className="text-xs text-muted-foreground" />
                <YAxis className="text-xs text-muted-foreground" tickFormatter={(value) => `$${value}`} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'hsl(var(--background))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '8px',
                    boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
                  }}
                  formatter={(value: number, name: string) => {
                    if (name === 'revenue') return [`$${value}`, 'Revenue']
                    if (name === 'orders') return [value, 'Orders']
                    return [value, name]
                  }}
                />
                <Legend />
                <Area type="monotone" dataKey="revenue" stroke="#3b82f6" strokeWidth={2} fill="url(#revenueGradient)" name="Revenue" />
                <Line type="monotone" dataKey="orders" stroke="#8b5cf6" strokeWidth={2} dot={false} name="Orders" />
              </LineChart>
            </ResponsiveContainer>
          )}
        </div>
      </CardContent>
    </Card>
  )
}