import * as React from 'react'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Skeleton, SkeletonGroup } from '@/components/ui/skeleton'
import { cn } from '@/lib/utils'

/** Page title + subtitle, optionally with an action button on the right. */
export function PageHeaderSkeleton({ action = false, className }: { action?: boolean; className?: string }) {
  return (
    <div className={cn('flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between', className)} aria-hidden="true">
      <div className="space-y-2">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-4 w-72 max-w-full" />
      </div>
      {action && <Skeleton className="h-10 w-36" />}
    </div>
  )
}

/** Mirrors KPICard: title + icon chip, big value, trend line. */
export function KPICardSkeleton({ className }: { className?: string }) {
  return (
    <Card className={cn('overflow-hidden', className)} aria-hidden="true">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <Skeleton className="h-4 w-24" />
        <Skeleton className="h-8 w-8 rounded-lg" />
      </CardHeader>
      <CardContent>
        <Skeleton className="h-8 w-24" />
        <Skeleton className="mt-3 h-3 w-32" />
      </CardContent>
    </Card>
  )
}

/** Compact stat card (label + number) used on products/collections/orders. */
export function StatCardSkeleton({ className }: { className?: string }) {
  return (
    <Card className={className} aria-hidden="true">
      <CardContent className="p-4">
        <Skeleton className="h-3 w-20" />
        <Skeleton className="mt-2 h-7 w-12" />
      </CardContent>
    </Card>
  )
}

/** Card with title/description and a chart-sized box. */
export function ChartCardSkeleton({
  className,
  height = 300,
  standalone = true,
}: {
  className?: string
  height?: number
  /** When true, wraps itself in role="status". */
  standalone?: boolean
}) {
  const card = (
    <Card className={className} aria-hidden={standalone ? undefined : true}>
      <CardHeader>
        <Skeleton className="h-6 w-40" />
        <Skeleton className="h-4 w-56 max-w-full" />
      </CardHeader>
      <CardContent>
        <Skeleton className="w-full" style={{ height }} />
      </CardContent>
    </Card>
  )
  return standalone ? <SkeletonGroup label="Loading chart…">{card}</SkeletonGroup> : card
}

/** Table body rows — render inside an existing <tbody>. */
export function TableRowsSkeleton({
  rows = 5,
  columns,
  rowClassName = 'border-b last:border-b-0',
}: {
  rows?: number
  columns: number
  rowClassName?: string
}) {
  return (
    <>
      {Array.from({ length: rows }).map((_, r) => (
        <tr key={r} className={rowClassName} aria-hidden="true">
          {Array.from({ length: columns }).map((_, c) => (
            <td key={c} className="px-4 py-3">
              <Skeleton className={cn('h-4', c === 0 ? 'w-3/4' : c === columns - 1 ? 'ml-auto w-8' : 'w-2/3')} />
            </td>
          ))}
        </tr>
      ))}
    </>
  )
}

/** Stand-alone table card (header + rows), mirrors DataTable. */
export function TableCardSkeleton({
  rows = 5,
  columns = 5,
  withHeader = true,
  className,
}: {
  rows?: number
  columns?: number
  withHeader?: boolean
  className?: string
}) {
  return (
    <Card className={cn('overflow-hidden', className)} aria-hidden="true">
      {withHeader && (
        <CardHeader>
          <Skeleton className="h-6 w-40" />
          <Skeleton className="h-4 w-56 max-w-full" />
        </CardHeader>
      )}
      <CardContent className="p-0">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b bg-muted/50">
                {Array.from({ length: columns }).map((_, i) => (
                  <th key={i} className="px-4 py-3">
                    <Skeleton className="h-3 w-16" />
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              <TableRowsSkeleton rows={rows} columns={columns} />
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  )
}

/** Stack of list rows (thumbnail + two text lines + trailing action). */
export function ListRowsSkeleton({ rows = 3, className }: { rows?: number; className?: string }) {
  return (
    <div className={cn('space-y-3', className)} aria-hidden="true">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="flex items-center gap-3 rounded-lg border p-3">
          <Skeleton className="h-10 w-10 shrink-0 rounded-md" />
          <div className="min-w-0 flex-1 space-y-2">
            <Skeleton className="h-4 w-1/3" />
            <Skeleton className="h-3 w-1/2" />
          </div>
          <Skeleton className="h-8 w-16" />
        </div>
      ))}
    </div>
  )
}

/** Form card: labelled inputs + a submit button. */
export function FormCardSkeleton({ fields = 4, className }: { fields?: number; className?: string }) {
  return (
    <Card className={className} aria-hidden="true">
      <CardHeader>
        <Skeleton className="h-6 w-40" />
        <Skeleton className="h-4 w-64 max-w-full" />
      </CardHeader>
      <CardContent className="space-y-4">
        {Array.from({ length: fields }).map((_, i) => (
          <div key={i} className="space-y-2">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-10 w-full" />
          </div>
        ))}
        <Skeleton className="h-10 w-32" />
      </CardContent>
    </Card>
  )
}
