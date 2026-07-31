'use client'

import * as React from 'react'
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from 'recharts'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { cn } from '@/lib/utils'

interface OrderStatusChartProps {
  className?: string
  data?: Array<{ name: string; value: number }>
  isLoading?: boolean
}

const COLORS = ['#f59e0b', '#8b5cf6', '#3b82f6', '#10b981', '#ef4444', '#6b7280']

export function OrderStatusChart({ className, data = [], isLoading = false }: OrderStatusChartProps) {
  const chartData = data.length > 0 ? data : [{ name: 'No Data', value: 1 }]

  return (
    <Card className={cn('col-span-1', className)}>
      <CardHeader>
        <CardTitle>Order Status</CardTitle>
        <p className="text-sm text-muted-foreground">
          {isLoading ? 'Loading...' : 'Distribution of order statuses'}
        </p>
      </CardHeader>
      <CardContent>
        <div className="h-[300px]">
          {isLoading ? (
            <div className="flex items-center justify-center h-full">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={chartData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {chartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'hsl(var(--background))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '8px',
                    boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
                  }}
                  formatter={(value: number) => [value, 'Orders']}
                />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          )}
        </div>
      </CardContent>
    </Card>
  )
}