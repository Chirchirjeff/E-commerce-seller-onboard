/*
 * Page-level skeletons for the dashboard route segments.
 *
 * Each one mirrors the final layout of its page so content swaps in without
 * a layout shift. Used by the segment `loading.tsx` files and by the pages'
 * own client-side `isLoading` branches. No hooks — safe in Server Components.
 */
import * as React from 'react'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Skeleton, SkeletonGroup } from '@/components/ui/skeleton'
import {
  ChartCardSkeleton,
  FormCardSkeleton,
  KPICardSkeleton,
  ListRowsSkeleton,
  PageHeaderSkeleton,
  StatCardSkeleton,
  TableCardSkeleton,
  TableRowsSkeleton,
} from '@/components/shared/skeletons'

const range = (n: number) => Array.from({ length: n }, (_, i) => i)

// ── Dashboard ───────────────────────────────────────────────────────────────
export function DashboardSkeleton() {
  return (
    <SkeletonGroup label="Loading dashboard…">
      <PageHeaderSkeleton action className="mb-6" />
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {range(4).map((i) => <KPICardSkeleton key={i} />)}
      </div>
      <div className="mt-6 grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <ChartCardSkeleton height={350} standalone={false} />
        </div>
        <ChartCardSkeleton height={300} standalone={false} />
      </div>
      <TableCardSkeleton className="mt-6" columns={6} />
    </SkeletonGroup>
  )
}

// ── Analytics ───────────────────────────────────────────────────────────────
function IconStatCardSkeleton() {
  return (
    <Card aria-hidden="true">
      <CardContent className="p-4">
        <div className="flex items-center gap-4">
          <Skeleton className="h-11 w-11 rounded-lg" />
          <div className="space-y-2">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-6 w-20" />
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

export function AnalyticsSkeleton() {
  return (
    <SkeletonGroup label="Loading analytics…">
      <PageHeaderSkeleton className="mb-6" />
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {range(4).map((i) => <IconStatCardSkeleton key={i} />)}
      </div>
      <div className="mt-6">
        <ChartCardSkeleton height={300} standalone={false} />
      </div>
    </SkeletonGroup>
  )
}

// ── Products ────────────────────────────────────────────────────────────────
export function ProductsSkeleton() {
  return (
    <SkeletonGroup label="Loading products…">
      <PageHeaderSkeleton action className="mb-6" />
      <div className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {range(4).map((i) => <StatCardSkeleton key={i} />)}
      </div>
      <TableCardSkeleton columns={8} />
    </SkeletonGroup>
  )
}

// ── Orders ──────────────────────────────────────────────────────────────────
export function OrdersSkeleton() {
  return (
    <SkeletonGroup label="Loading orders…" className="space-y-6">
      <PageHeaderSkeleton action />
      <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-5">
        {range(9).map((i) => <StatCardSkeleton key={i} />)}
      </div>
      <Card aria-hidden="true">
        <CardContent className="flex flex-col gap-3 p-4 sm:p-6 lg:flex-row">
          <Skeleton className="h-10 flex-1" />
          <Skeleton className="h-10 w-28" />
        </CardContent>
      </Card>
      <div className="flex gap-2 overflow-hidden border-b pb-2" aria-hidden="true">
        {range(6).map((i) => <Skeleton key={i} className="h-6 w-24 shrink-0" />)}
      </div>
      <div className="overflow-hidden rounded-lg border bg-card" aria-hidden="true">
        <table className="w-full text-sm">
          <thead className="bg-muted/50">
            <tr>
              {range(9).map((i) => (
                <th key={i} className="px-4 py-3"><Skeleton className="h-3 w-14" /></th>
              ))}
            </tr>
          </thead>
          <tbody>
            <TableRowsSkeleton rows={6} columns={9} rowClassName="border-t" />
          </tbody>
        </table>
      </div>
    </SkeletonGroup>
  )
}

// ── Order detail ────────────────────────────────────────────────────────────
function SmallCardSkeleton({ lines = 3 }: { lines?: number }) {
  return (
    <Card aria-hidden="true">
      <CardHeader><Skeleton className="h-6 w-32" /></CardHeader>
      <CardContent className="space-y-3">
        {range(lines).map((i) => (
          <div key={i} className="flex justify-between gap-4">
            <Skeleton className="h-4 w-20" />
            <Skeleton className="h-4 w-16" />
          </div>
        ))}
      </CardContent>
    </Card>
  )
}

export function OrderDetailSkeleton() {
  return (
    <SkeletonGroup label="Loading order…" className="space-y-6">
      <Skeleton className="h-9 w-36" />
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between" aria-hidden="true">
        <div className="space-y-2">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-4 w-56" />
        </div>
        <Skeleton className="h-6 w-24 rounded-full" />
      </div>
      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <Card aria-hidden="true">
            <CardHeader><Skeleton className="h-6 w-20" /></CardHeader>
            <CardContent className="space-y-4">
              {range(3).map((i) => (
                <div key={i} className="flex items-center gap-3 border-b pb-4 last:border-0 last:pb-0">
                  <Skeleton className="h-14 w-14 rounded-md" />
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-4 w-1/2" />
                    <Skeleton className="h-3 w-1/3" />
                  </div>
                  <Skeleton className="h-4 w-16" />
                </div>
              ))}
              <div className="flex justify-between border-t pt-4">
                <Skeleton className="h-6 w-24" />
                <Skeleton className="h-6 w-20" />
              </div>
            </CardContent>
          </Card>
          <Card aria-hidden="true">
            <CardHeader><Skeleton className="h-6 w-36" /></CardHeader>
            <CardContent className="space-y-4">
              {range(3).map((i) => (
                <div key={i} className="flex gap-3">
                  <Skeleton className="mt-1 h-2 w-2 rounded-full" />
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-4 w-2/3" />
                    <Skeleton className="h-3 w-32" />
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
        <div className="space-y-6">
          <SmallCardSkeleton lines={1} />
          <SmallCardSkeleton lines={3} />
          <SmallCardSkeleton lines={3} />
        </div>
      </div>
    </SkeletonGroup>
  )
}

// ── Collections ─────────────────────────────────────────────────────────────
export function CollectionListSkeleton({ rows = 3 }: { rows?: number }) {
  return (
    <SkeletonGroup label="Loading collections…" className="space-y-3">
      {range(rows).map((i) => (
        <div key={i} className="flex items-center gap-4 rounded-lg border bg-card p-4" aria-hidden="true">
          <Skeleton className="h-10 w-10 shrink-0 rounded-lg" />
          <div className="min-w-0 flex-1 space-y-2">
            <div className="flex items-center gap-2">
              <Skeleton className="h-4 w-40" />
              <Skeleton className="h-5 w-14 rounded-full" />
            </div>
            <Skeleton className="h-3 w-48" />
          </div>
          <div className="flex shrink-0 gap-1">
            {range(4).map((j) => <Skeleton key={j} className="h-9 w-9" />)}
          </div>
        </div>
      ))}
    </SkeletonGroup>
  )
}

export function CollectionsSkeleton() {
  return (
    <SkeletonGroup label="Loading collections…">
      <PageHeaderSkeleton action className="mb-6" />
      <div className="mb-6 grid gap-4 sm:grid-cols-3">
        {range(3).map((i) => <StatCardSkeleton key={i} />)}
      </div>
      <div aria-hidden="true"><CollectionListSkeleton /></div>
    </SkeletonGroup>
  )
}

/** Product rows inside a collection (thumbnail + name + price + action). */
export function ProductRowsSkeleton({ rows = 3, label = 'Loading products…' }: { rows?: number; label?: string }) {
  return (
    <SkeletonGroup label={label}>
      <ListRowsSkeleton rows={rows} className="space-y-2" />
    </SkeletonGroup>
  )
}

export function CollectionDetailSkeleton() {
  return (
    <SkeletonGroup label="Loading collection…" className="space-y-6">
      <Skeleton className="h-9 w-32" />
      <div className="flex items-center gap-3" aria-hidden="true">
        <Skeleton className="h-10 w-10 rounded-lg" />
        <div className="space-y-2">
          <Skeleton className="h-7 w-48" />
          <Skeleton className="h-4 w-40" />
        </div>
      </div>
      <Skeleton className="h-11 w-80 max-w-full rounded-lg" />
      <ListRowsSkeleton rows={4} className="space-y-2" />
    </SkeletonGroup>
  )
}

// ── Categories ──────────────────────────────────────────────────────────────
export function CategoryTreeSkeleton({ rows = 6 }: { rows?: number }) {
  return (
    <SkeletonGroup label="Loading categories…" className="space-y-1 rounded-lg border p-4">
      {range(rows).map((i) => (
        <div key={i} className="flex items-center gap-2 px-3 py-2" aria-hidden="true">
          <Skeleton className="h-4 w-4" />
          <div className="flex-1 space-y-1.5">
            <Skeleton className="h-4 w-40 max-w-full" />
            <Skeleton className="h-3 w-64 max-w-full" />
          </div>
          <Skeleton className="h-5 w-20 rounded-full" />
        </div>
      ))}
    </SkeletonGroup>
  )
}

export function CategoriesSkeleton() {
  return (
    <SkeletonGroup label="Loading categories…">
      <PageHeaderSkeleton className="mb-6" />
      <Card aria-hidden="true">
        <CardHeader>
          <Skeleton className="h-7 w-56" />
          <Skeleton className="h-4 w-96 max-w-full" />
        </CardHeader>
        <CardContent>
          <CategoryTreeSkeleton />
        </CardContent>
      </Card>
    </SkeletonGroup>
  )
}

// ── Shop ────────────────────────────────────────────────────────────────────
export function ShopSkeleton() {
  return (
    <SkeletonGroup label="Loading shop details…">
      <PageHeaderSkeleton action className="mb-6" />
      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <Card aria-hidden="true">
            <CardHeader>
              <Skeleton className="h-7 w-44" />
              <Skeleton className="h-4 w-64 max-w-full" />
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-10 w-full" />
              </div>
              <div className="space-y-2">
                <Skeleton className="h-4 w-36" />
                <Skeleton className="h-[100px] w-full" />
              </div>
              <div className="space-y-2">
                <Skeleton className="h-4 w-20" />
                <Skeleton className="h-20 w-20 rounded-lg" />
              </div>
              <div className="space-y-2">
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-32 w-full rounded-lg" />
              </div>
            </CardContent>
          </Card>
          <Card aria-hidden="true">
            <CardHeader><Skeleton className="h-6 w-40" /></CardHeader>
            <CardContent><ListRowsSkeleton rows={2} /></CardContent>
          </Card>
        </div>
        <SmallCardSkeleton lines={4} />
      </div>
      <div className="mt-8" aria-hidden="true">
        <Skeleton className="mb-6 h-8 w-64" />
        <ShopLinksAnalyticsSkeleton standalone={false} />
      </div>
    </SkeletonGroup>
  )
}

/** Mirrors ShopLinksAnalytics: stat cards + two chart boxes. */
export function ShopLinksAnalyticsSkeleton({ standalone = true }: { standalone?: boolean }) {
  const body = (
    <div className="space-y-6" aria-hidden="true">
      <div className="grid gap-4 md:grid-cols-4">
        {range(4).map((i) => <KPICardSkeleton key={i} />)}
      </div>
      <ChartCardSkeleton height={300} standalone={false} />
      <div className="grid gap-6 md:grid-cols-2">
        <ChartCardSkeleton height={250} standalone={false} />
        <ChartCardSkeleton height={250} standalone={false} />
      </div>
    </div>
  )
  return standalone ? <SkeletonGroup label="Loading link analytics…">{body}</SkeletonGroup> : body
}

// ── Settings ────────────────────────────────────────────────────────────────
/** Card of label/value rows with a trailing button (account details). */
export function DetailRowsCardSkeleton({ rows = 5 }: { rows?: number }) {
  return (
    <Card aria-hidden="true">
      <CardHeader className="pb-4">
        <div className="flex items-center gap-3">
          <Skeleton className="h-9 w-9 rounded-lg" />
          <div className="space-y-2">
            <Skeleton className="h-4 w-36" />
            <Skeleton className="h-3 w-56 max-w-full" />
          </div>
        </div>
      </CardHeader>
      <CardContent className="divide-y">
        {range(rows).map((i) => (
          <div key={i} className="flex items-center gap-3 py-4 first:pt-0 last:pb-0">
            <Skeleton className="h-8 w-8 rounded-md" />
            <div className="flex-1 space-y-2">
              <Skeleton className="h-3 w-24" />
              <Skeleton className="h-4 w-44 max-w-full" />
            </div>
            <Skeleton className="h-8 w-20" />
          </div>
        ))}
      </CardContent>
    </Card>
  )
}

export function AccountDetailsSkeleton() {
  return (
    <SkeletonGroup label="Loading account details…" className="space-y-6">
      <DetailRowsCardSkeleton rows={4} />
      <DetailRowsCardSkeleton rows={3} />
    </SkeletonGroup>
  )
}

export function SettingsSkeleton() {
  return (
    <SkeletonGroup label="Loading settings…" className="space-y-6">
      <PageHeaderSkeleton />
      <Skeleton className="h-10 w-56 rounded-lg" />
      <FormCardSkeleton fields={3} />
    </SkeletonGroup>
  )
}

// ── New product form ────────────────────────────────────────────────────────
export function ProductFormSkeleton() {
  return (
    <SkeletonGroup label="Loading product form…">
      <PageHeaderSkeleton className="mb-6" />
      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <FormCardSkeleton fields={6} />
        </div>
        <Card aria-hidden="true">
          <CardHeader>
            <Skeleton className="h-6 w-36" />
            <Skeleton className="h-4 w-56 max-w-full" />
          </CardHeader>
          <CardContent>
            <Skeleton className="h-32 w-full rounded-lg" />
          </CardContent>
        </Card>
      </div>
    </SkeletonGroup>
  )
}
