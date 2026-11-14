/*
 * Illustrative dashboard mock-up for the landing hero.
 * Pure markup — the numbers are sample data, not live stats.
 */

import { BadgeCheck, Package, Smartphone, TrendingUp } from 'lucide-react'

const bars = [38, 52, 44, 61, 57, 72, 66, 84, 78, 92, 88, 100]

const orders = [
  { id: 'QZ-10482', item: 'Kiondo basket, large', amount: '2,400', status: 'Paid' },
  { id: 'QZ-10481', item: 'Maasai shuka throw', amount: '1,850', status: 'Shipped' },
  { id: 'QZ-10479', item: 'Soapstone bowl set', amount: '3,200', status: 'Delivered' },
]

const statusStyle: Record<string, string> = {
  Paid: 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400',
  Shipped: 'bg-primary/10 text-primary',
  Delivered: 'bg-muted text-muted-foreground',
}

export function DashboardPreview() {
  return (
    <div className="relative mx-auto w-full max-w-xl" aria-hidden="true">
      {/* Glow */}
      <div className="absolute -inset-6 -z-10 rounded-[2rem] bg-gradient-to-tr from-primary/25 via-primary/5 to-transparent blur-2xl" />

      {/* Window */}
      <div className="overflow-hidden rounded-2xl border bg-card shadow-2xl shadow-primary/10">
        <div className="flex items-center gap-1.5 border-b bg-muted/40 px-4 py-3">
          <span className="h-2.5 w-2.5 rounded-full bg-red-400/80" />
          <span className="h-2.5 w-2.5 rounded-full bg-amber-400/80" />
          <span className="h-2.5 w-2.5 rounded-full bg-emerald-400/80" />
          <span className="ml-3 truncate text-xs text-muted-foreground">Your shop · Overview</span>
        </div>

        <div className="space-y-4 p-4 sm:p-5">
          {/* KPIs */}
          <div className="grid grid-cols-3 gap-3">
            {[
              { label: 'Revenue', value: 'KES 184K', delta: '+18%' },
              { label: 'Orders', value: '126', delta: '+9%' },
              { label: 'Visitors', value: '3.4K', delta: '+24%' },
            ].map((kpi) => (
              <div key={kpi.label} className="rounded-xl border bg-background p-3">
                <p className="text-[11px] font-medium text-muted-foreground">{kpi.label}</p>
                <p className="mt-1 text-sm font-semibold tabular-nums sm:text-base">{kpi.value}</p>
                <p className="mt-0.5 flex items-center gap-1 text-[11px] font-medium text-emerald-600 dark:text-emerald-400">
                  <TrendingUp className="h-3 w-3" />
                  {kpi.delta}
                </p>
              </div>
            ))}
          </div>

          {/* Chart */}
          <div className="rounded-xl border bg-background p-3">
            <div className="mb-3 flex items-center justify-between">
              <p className="text-xs font-medium">Sales, last 12 weeks</p>
              <p className="text-[11px] text-muted-foreground">KES</p>
            </div>
            <div className="flex h-24 items-end gap-1.5">
              {bars.map((h, i) => (
                <div
                  key={i}
                  className="flex-1 rounded-t-sm bg-primary/80"
                  style={{ height: `${h}%`, opacity: 0.35 + (i / bars.length) * 0.65 }}
                />
              ))}
            </div>
          </div>

          {/* Orders */}
          <div className="rounded-xl border bg-background">
            <p className="border-b px-3 py-2 text-xs font-medium">Recent orders</p>
            <ul className="divide-y">
              {orders.map((o) => (
                <li key={o.id} className="flex items-center gap-3 px-3 py-2.5">
                  <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-muted">
                    <Package className="h-3.5 w-3.5 text-muted-foreground" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-xs font-medium">{o.item}</p>
                    <p className="text-[11px] text-muted-foreground">{o.id}</p>
                  </div>
                  <p className="hidden text-xs font-medium tabular-nums sm:block">KES {o.amount}</p>
                  <span className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${statusStyle[o.status]}`}>
                    {o.status}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>

      {/* Floating toasts */}
      <div className="absolute -left-4 top-24 hidden items-center gap-2.5 rounded-xl border bg-card/95 px-3 py-2.5 shadow-lg backdrop-blur sm:flex motion-safe:animate-in motion-safe:fade-in motion-safe:slide-in-from-left-4 motion-safe:duration-700 lg:-left-10">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-500/15">
          <Smartphone className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
        </div>
        <div>
          <p className="text-xs font-semibold">M-Pesa payment received</p>
          <p className="text-[11px] text-muted-foreground">KES 2,400 · just now</p>
        </div>
      </div>

      <div className="absolute -right-3 bottom-10 hidden items-center gap-2 rounded-xl border bg-card/95 px-3 py-2 shadow-lg backdrop-blur sm:flex motion-safe:animate-in motion-safe:fade-in motion-safe:slide-in-from-right-4 motion-safe:duration-700 lg:-right-8">
        <BadgeCheck className="h-4 w-4 text-primary" />
        <p className="text-xs font-semibold">Verified seller</p>
      </div>
    </div>
  )
}
