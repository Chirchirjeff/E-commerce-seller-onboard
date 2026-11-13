'use client'

/**
 * Client-only, code-split chart components.
 * recharts measures the DOM (ResponsiveContainer), so the trend chart never
 * renders on the server (`ssr: false`), and its bundle is only fetched when a
 * chart is on screen. The lighter HTML charts (StatTile, RankedBars,
 * PartBreakdown, StatusBreakdown) live in ./chart-kit and need no lazy loading.
 */
import dynamic from 'next/dynamic'
import { Skeleton, SkeletonGroup } from '@/components/ui/skeleton'

export const LazyTrendChart = dynamic(
  () => import('./trend-chart').then((m) => m.TrendChart),
  {
    ssr: false,
    loading: () => (
      <SkeletonGroup label="Loading chart…" className="space-y-4">
        <Skeleton className="h-9 w-40" />
        <Skeleton className="h-[220px] w-full sm:h-[280px] xl:h-[320px]" />
      </SkeletonGroup>
    ),
  }
)
