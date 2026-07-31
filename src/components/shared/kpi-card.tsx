'use client'

import * as React from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { cn } from '@/lib/utils'
import { ArrowDown, ArrowUp, LucideIcon } from 'lucide-react'

interface KPICardProps {
  title: string
  value: string | number
  icon: LucideIcon
  trend?: number
  trendLabel?: string
  className?: string
  isLoading?: boolean
}

export function KPICard({
  title,
  value,
  icon: Icon,
  trend,
  trendLabel,
  className,
  isLoading = false,
}: KPICardProps) {
  const isPositive = trend && trend > 0
  const isNegative = trend && trend < 0

  return (
    <Card className={cn('overflow-hidden', className)}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">
          {title}
        </CardTitle>
        <div className="rounded-lg bg-primary/10 p-2 text-primary">
          <Icon className="h-4 w-4" />
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="h-8 w-24 animate-pulse rounded bg-muted" />
        ) : (
          <div className="text-2xl font-bold">{value}</div>
        )}
        {trend !== undefined && (
          <div className="mt-2 flex items-center gap-2">
            <span
              className={cn(
                'flex items-center text-xs font-medium',
                isPositive && 'text-green-600 dark:text-green-400',
                isNegative && 'text-red-600 dark:text-red-400',
                trend === 0 && 'text-muted-foreground'
              )}
            >
              {isPositive && <ArrowUp className="mr-1 h-3 w-3" />}
              {isNegative && <ArrowDown className="mr-1 h-3 w-3" />}
              {Math.abs(trend)}%
            </span>
            {trendLabel && (
              <span className="text-xs text-muted-foreground">
                {trendLabel}
              </span>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  )
}