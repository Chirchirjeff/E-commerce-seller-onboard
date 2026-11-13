'use client'

/*
 * TrendChart — a time series with one metric visible at a time.
 *
 * Revenue (Ksh) and order counts have very different scales, so they are
 * never drawn on one axis (that flattened the orders line to zero before).
 * The viewer switches metrics with tabs instead. Includes a crosshair tooltip
 * and a table view so no value is hover-only. Lazy-load this file (it pulls
 * in recharts) — see ./lazy.tsx.
 */

import * as React from 'react'
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { Table2, LineChart as LineIcon } from 'lucide-react'
import { cn } from '@/lib/utils'
import { DeltaBadge, EmptyChart, Segmented, VIZ, axisTick } from './chart-kit'

export interface TrendMetric {
  key: string
  label: string
  /** Formats a single value for tooltips, headline and table. */
  format: (v: number) => string
  money?: boolean
  color?: string
}

export interface TrendChartProps {
  /** Rows with a `date` (YYYY-MM-DD) plus a numeric field per metric key. */
  data: ReadonlyArray<{ date: string }>
  metrics: TrendMetric[]
  /** Optional headline per metric: period total and change vs previous period. */
  summary?: Record<string, { value: number; change: number | null }>
  className?: string
}

type TooltipLike = {
  active?: boolean
  payload?: ReadonlyArray<{ value?: unknown; payload?: { date?: string } }>
}

const dayFmt = new Intl.DateTimeFormat('en-KE', { day: 'numeric', month: 'short' })
const longFmt = new Intl.DateTimeFormat('en-KE', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' })

function parseDay(date: string) {
  // "2026-11-10" → local midnight, so labels don't shift a day in UTC+3.
  return /^\d{4}-\d{2}-\d{2}$/.test(date) ? new Date(`${date}T00:00:00`) : new Date(date)
}

export function TrendChart({ data: rows, metrics, summary, className }: TrendChartProps) {
  const data = rows as ReadonlyArray<{ date: string } & Record<string, unknown>>
  const [metricKey, setMetricKey] = React.useState(metrics[0]?.key)
  const [view, setView] = React.useState<'chart' | 'table'>('chart')
  const metric = metrics.find((m) => m.key === metricKey) ?? metrics[0]
  const color = metric?.color ?? VIZ.blue
  const gradientId = `trend-${React.useId().replace(/:/g, '')}`

  const values = data.map((d) => Number(d[metric.key]) || 0)
  const max = Math.max(...values, 0)
  const hasData = values.some((v) => v > 0)
  const tick = axisTick(max, metric.money)
  const head = summary?.[metric.key]

  const renderTooltip = (props: unknown) => {
    const { active, payload } = props as TooltipLike
    if (!active || !payload?.length) return null
    const row = payload[0]
    return (
      <div className="rounded-lg border bg-popover px-3 py-2 text-sm text-popover-foreground shadow-md">
        <p className="text-xs text-muted-foreground">{row.payload?.date ? longFmt.format(parseDay(row.payload.date)) : ''}</p>
        <p className="mt-0.5 flex items-center gap-2 font-semibold">
          <span className="h-2 w-2 rounded-full" style={{ backgroundColor: color }} aria-hidden="true" />
          {metric.format(Number(row.value) || 0)}
          <span className="font-normal text-muted-foreground">{metric.label.toLowerCase()}</span>
        </p>
      </div>
    )
  }

  return (
    <div className={cn('min-w-0', className)}>
      <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
        <div className="min-w-0">
          {head ? (
            <>
              <p className="text-2xl font-semibold tracking-tight sm:text-3xl">{metric.format(head.value)}</p>
              <DeltaBadge change={head.change} className="mt-1" />
            </>
          ) : (
            <p className="text-sm text-muted-foreground">{metric.label}</p>
          )}
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {metrics.length > 1 && (
            <Segmented
              label="Metric"
              value={metric.key}
              onChange={(k) => setMetricKey(k)}
              options={metrics.map((m) => ({ value: m.key, label: m.label }))}
            />
          )}
          <button
            type="button"
            onClick={() => setView((v) => (v === 'chart' ? 'table' : 'chart'))}
            className="inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-xs font-medium text-muted-foreground hover:bg-muted hover:text-foreground sm:text-sm"
            aria-pressed={view === 'table'}
          >
            {view === 'chart' ? <Table2 className="h-3.5 w-3.5" /> : <LineIcon className="h-3.5 w-3.5" />}
            {view === 'chart' ? 'Table' : 'Chart'}
          </button>
        </div>
      </div>

      {!hasData ? (
        <EmptyChart text={`No ${metric.label.toLowerCase()} in this period yet.`} />
      ) : view === 'table' ? (
        <div className="max-h-[320px] overflow-auto rounded-lg border">
          <table className="w-full text-sm">
            <thead className="sticky top-0 bg-muted/80 text-left text-xs uppercase tracking-wide text-muted-foreground backdrop-blur">
              <tr>
                <th className="px-3 py-2 font-medium">Date</th>
                {metrics.map((m) => <th key={m.key} className="px-3 py-2 text-right font-medium">{m.label}</th>)}
              </tr>
            </thead>
            <tbody className="divide-y tabular-nums">
              {[...data].reverse().map((d) => (
                <tr key={d.date}>
                  <td className="px-3 py-1.5">{dayFmt.format(parseDay(d.date))}</td>
                  {metrics.map((m) => <td key={m.key} className="px-3 py-1.5 text-right">{m.format(Number(d[m.key]) || 0)}</td>)}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="h-[220px] w-full sm:h-[280px] xl:h-[320px]">
          <ResponsiveContainer width="100%" height="100%" minWidth={0}>
            <AreaChart data={[...data]} margin={{ top: 8, right: 8, bottom: 0, left: 0 }}>
              <defs>
                <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={color} stopOpacity={0.22} />
                  <stop offset="100%" stopColor={color} stopOpacity={0.02} />
                </linearGradient>
              </defs>
              <CartesianGrid vertical={false} stroke={VIZ.grid} />
              <XAxis
                dataKey="date"
                tickFormatter={(d: string) => dayFmt.format(parseDay(d))}
                tick={{ fontSize: 12, fill: VIZ.axis }}
                tickLine={false}
                axisLine={{ stroke: VIZ.grid }}
                minTickGap={28}
                interval="preserveStartEnd"
                tickMargin={8}
              />
              <YAxis
                tickFormatter={tick}
                tick={{ fontSize: 12, fill: VIZ.axis }}
                tickLine={false}
                axisLine={false}
                width={metric.money ? 52 : 36}
                allowDecimals={false}
              />
              <Tooltip
                content={renderTooltip}
                cursor={{ stroke: VIZ.axis, strokeWidth: 1 }}
              />
              <Area
                type="monotone"
                dataKey={metric.key}
                stroke={color}
                strokeWidth={2}
                fill={`url(#${gradientId})`}
                activeDot={{ r: 5, strokeWidth: 2, stroke: 'hsl(var(--card))', fill: color }}
                dot={false}
                isAnimationActive
                animationDuration={600}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  )
}
