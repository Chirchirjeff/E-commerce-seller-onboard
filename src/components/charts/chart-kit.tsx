'use client'

/*
 * Chart kit — lightweight, fully responsive analytics building blocks.
 *
 * Everything here is plain HTML/SVG (no recharts), so it adds nothing heavy to
 * a page's bundle and reflows naturally at any width. The one recharts-based
 * chart (TrendChart) lives in its own file and is lazy-loaded.
 *
 * Design rules (from the dataviz guidelines):
 *   • Colours come from the validated --viz-* palette and follow the entity
 *     (e.g. "delivered" is always the same colour), never its rank.
 *   • Text always uses text tokens; colour lives on marks (dots, bars) only.
 *   • Values are never colour-only: every bar/segment has a visible label.
 */

import * as React from 'react'
import { ArrowDownRight, ArrowUpRight, Minus } from 'lucide-react'
import { cn } from '@/lib/utils'

// ───────────────────────────── Formatting ─────────────────────────────

const compactFmt = new Intl.NumberFormat('en-KE', { notation: 'compact', maximumFractionDigits: 1 })
const fullFmt = new Intl.NumberFormat('en-KE', { maximumFractionDigits: 0 })
const moneyFmt = new Intl.NumberFormat('en-KE', { minimumFractionDigits: 0, maximumFractionDigits: 2 })

/** "Ksh 1,284" (or "Ksh 12.9K" when compact). */
export function formatKsh(value: number, compact = false) {
  if (!Number.isFinite(value)) return 'Ksh 0'
  return `Ksh ${compact && Math.abs(value) >= 10_000 ? compactFmt.format(value) : moneyFmt.format(Math.round(value * 100) / 100)}`
}

/** 1,284 → "1,284"; 12,900 → "12.9K" when compact. */
export function formatCount(value: number, compact = false) {
  if (!Number.isFinite(value)) return '0'
  return compact && Math.abs(value) >= 10_000 ? compactFmt.format(value) : fullFmt.format(value)
}

/** Axis ticks: full under 10,000, compact above (one style per axis). */
export function axisTick(maxValue: number, money = false) {
  const compact = maxValue >= 10_000
  return (v: number) => (money ? formatKsh(v, compact).replace('Ksh ', '') : formatCount(v, compact))
}

/** Percentage change, or null when there is no baseline to compare with. */
export function percentChange(current: number, previous: number): number | null {
  if (!previous) return current ? null : 0
  return ((current - previous) / previous) * 100
}

export function humanize(status: string) {
  const s = status.replace(/[_-]+/g, ' ').toLowerCase()
  return s.charAt(0).toUpperCase() + s.slice(1)
}

// ───────────────────────────── Colours ─────────────────────────────

export const VIZ = {
  blue: 'var(--viz-1)', orange: 'var(--viz-2)', aqua: 'var(--viz-3)', yellow: 'var(--viz-4)',
  magenta: 'var(--viz-5)', green: 'var(--viz-6)', violet: 'var(--viz-7)', red: 'var(--viz-8)',
  neutral: 'var(--viz-neutral)', grid: 'var(--viz-grid)', axis: 'var(--viz-axis)',
} as const

/** Fixed colour per order status, so a status keeps its colour on every chart. */
const STATUS_COLORS: Record<string, string> = {
  pending: VIZ.yellow,
  paid: VIZ.blue,
  accepted: VIZ.violet,
  processing: VIZ.violet,
  shipped: VIZ.aqua,
  dispatched: VIZ.aqua,
  delivered: VIZ.green,
  completed: VIZ.green,
  returned: VIZ.orange,
  refunded: VIZ.orange,
  cancelled: VIZ.red,
  failed: VIZ.red,
}
/** Display order for statuses: the lifecycle, then exceptions. */
const STATUS_ORDER = ['pending', 'paid', 'accepted', 'processing', 'shipped', 'dispatched', 'delivered', 'completed', 'returned', 'refunded', 'cancelled', 'failed']

export function statusColor(status: string) {
  return STATUS_COLORS[status.toLowerCase()] ?? VIZ.neutral
}

// ───────────────────────────── Delta badge ─────────────────────────────

export function DeltaBadge({
  change,
  label = 'vs previous period',
  upIsGood = true,
  className,
}: {
  change: number | null
  label?: string
  upIsGood?: boolean
  className?: string
}) {
  if (change === null) {
    return <span className={cn('text-xs text-muted-foreground', className)}>New this period</span>
  }
  const flat = Math.abs(change) < 0.5
  const up = change > 0
  const good = flat ? null : up === upIsGood
  const Icon = flat ? Minus : up ? ArrowUpRight : ArrowDownRight
  return (
    <span className={cn('inline-flex flex-wrap items-center gap-1 text-xs', className)}>
      <span
        className="inline-flex items-center gap-0.5 rounded-full px-1.5 py-0.5 font-semibold"
        style={{
          color: good === null ? undefined : good ? 'var(--viz-good)' : 'var(--viz-bad)',
          backgroundColor: good === null ? 'hsl(var(--muted))' : good ? 'color-mix(in srgb, var(--viz-good) 12%, transparent)' : 'color-mix(in srgb, var(--viz-bad) 12%, transparent)',
        }}
      >
        <Icon className="h-3 w-3" aria-hidden="true" />
        {flat ? '0%' : `${up ? '+' : '−'}${Math.abs(change) >= 100 ? Math.round(Math.abs(change)) : Math.abs(change).toFixed(1)}%`}
      </span>
      <span className="text-muted-foreground">{label}</span>
    </span>
  )
}

// ───────────────────────────── Sparkline ─────────────────────────────

/** Tiny trend line (inline SVG, scales to its container's width). */
export function Sparkline({ values, color = VIZ.blue, className }: { values: number[]; color?: string; className?: string }) {
  const id = React.useId().replace(/:/g, '')
  if (values.length < 2) return null
  const max = Math.max(...values)
  const min = Math.min(...values, 0)
  const span = max - min || 1
  const W = 100, H = 32, PAD = 3
  const pts = values.map((v, i) => [
    (i / (values.length - 1)) * W,
    H - PAD - ((v - min) / span) * (H - PAD * 2),
  ])
  const line = pts.map(([x, y], i) => `${i ? 'L' : 'M'}${x.toFixed(2)},${y.toFixed(2)}`).join(' ')
  const area = `${line} L${W},${H} L0,${H} Z`
  const [lx, ly] = pts[pts.length - 1]
  return (
    <svg viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none" className={cn('h-8 w-full overflow-visible', className)} aria-hidden="true">
      <defs>
        <linearGradient id={`spark-${id}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity={0.18} />
          <stop offset="100%" stopColor={color} stopOpacity={0} />
        </linearGradient>
      </defs>
      <path d={area} fill={`url(#spark-${id})`} />
      <path d={line} fill="none" stroke={color} strokeWidth={2} vectorEffect="non-scaling-stroke" strokeLinejoin="round" strokeLinecap="round" />
      <circle cx={lx} cy={ly} r={2.5} fill={color} vectorEffect="non-scaling-stroke" />
    </svg>
  )
}

// ───────────────────────────── Stat tile ─────────────────────────────

export function StatTile({
  label,
  value,
  change,
  changeLabel,
  upIsGood = true,
  trend,
  icon: Icon,
  hint,
  className,
}: {
  label: string
  value: string
  change?: number | null
  changeLabel?: string
  upIsGood?: boolean
  trend?: number[]
  icon?: React.ComponentType<{ className?: string }>
  hint?: string
  className?: string
}) {
  return (
    <div className={cn('flex min-w-0 flex-col gap-2 rounded-xl border bg-card p-4 text-card-foreground shadow-sm', className)}>
      <div className="flex items-center justify-between gap-2">
        <p className="truncate text-sm font-medium text-muted-foreground">{label}</p>
        {Icon && (
          <span className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg bg-muted text-muted-foreground">
            <Icon className="h-4 w-4" />
          </span>
        )}
      </div>
      <p className="truncate text-2xl font-semibold tracking-tight sm:text-[1.65rem]" title={value}>{value}</p>
      <div className="flex min-h-[1.25rem] items-center">
        {change !== undefined ? <DeltaBadge change={change} label={changeLabel} upIsGood={upIsGood} /> : hint ? <span className="text-xs text-muted-foreground">{hint}</span> : null}
      </div>
      {trend && trend.some((v) => v !== 0) && <Sparkline values={trend} className="mt-1" />}
    </div>
  )
}

// ───────────────────────────── Ranked bars ─────────────────────────────

export interface RankedItem {
  key: string
  label: string
  value: number
  /** Secondary line under the label, e.g. "12 orders · 4.6★". */
  detail?: string
  color?: string
  image?: string | null
}

/**
 * Horizontal ranked bars in plain HTML. Labels wrap instead of being clipped,
 * and the layout works from phone to ultrawide.
 */
export function RankedBars({
  items,
  format,
  emptyText = 'No data for this period yet.',
  max: maxItems = 8,
  className,
}: {
  items: RankedItem[]
  format: (v: number) => string
  emptyText?: string
  max?: number
  /** e.g. "lg:columns-2 lg:gap-10" to flow a long list into columns on wide screens. */
  className?: string
}) {
  const rows = items.slice(0, maxItems)
  const top = Math.max(...rows.map((r) => r.value), 0)
  if (rows.length === 0 || top === 0) return <EmptyChart text={emptyText} />
  return (
    <ol className={cn('space-y-3.5', className)}>
      {rows.map((r, i) => (
        <li key={r.key} className="group break-inside-avoid pb-0.5">
          <div className="mb-1.5 flex items-start justify-between gap-3 text-sm">
            <div className="flex min-w-0 items-center gap-2.5">
              <span className="w-4 flex-shrink-0 text-right text-xs tabular-nums text-muted-foreground">{i + 1}</span>
              {r.image !== undefined && (
                r.image
                  // eslint-disable-next-line @next/next/no-img-element
                  ? <img src={r.image} alt="" loading="lazy" decoding="async" className="h-8 w-8 flex-shrink-0 rounded-md object-cover" />
                  : <span className="h-8 w-8 flex-shrink-0 rounded-md bg-muted" aria-hidden="true" />
              )}
              <div className="min-w-0">
                <p className="break-words font-medium leading-snug">{r.label}</p>
                {r.detail && <p className="text-xs text-muted-foreground">{r.detail}</p>}
              </div>
            </div>
            <span className="flex-shrink-0 font-semibold tabular-nums">{format(r.value)}</span>
          </div>
          <div className="ml-6 h-2 overflow-hidden rounded-full bg-muted" aria-hidden="true">
            <div
              className="h-full rounded-full transition-[width] duration-700 ease-out group-hover:opacity-90"
              style={{ width: `${Math.max((r.value / top) * 100, 2)}%`, backgroundColor: r.color ?? VIZ.blue }}
            />
          </div>
        </li>
      ))}
    </ol>
  )
}

// ───────────────────────────── Part-to-whole breakdown ─────────────────────────────

/** Categorical slots in validated order, for breakdowns without fixed colours. */
const SLOT_ORDER = [VIZ.blue, VIZ.orange, VIZ.aqua, VIZ.yellow, VIZ.magenta, VIZ.green, VIZ.violet, VIZ.red]

/**
 * Part-to-whole: a total, one segmented bar (2px surface gap between parts) and
 * a legend listing every part with count and share. Replaces pie charts, whose
 * outside labels were clipped in narrow columns. Max 6 parts; the rest fold
 * into "Other" so no colour is ever generated or reused.
 */
export function PartBreakdown({
  data,
  unit,
  colorFor,
  sort,
  emptyText = 'No data in this period.',
}: {
  data: { name: string; value: number }[]
  unit: string
  /** Fixed colour per entity (e.g. statuses). Defaults to palette slots by first appearance. */
  colorFor?: (name: string) => string
  sort?: (a: { name: string }, b: { name: string }) => number
  emptyText?: string
}) {
  let rows = data.filter((d) => d.value > 0)
  rows = sort ? [...rows].sort(sort) : [...rows].sort((a, b) => b.value - a.value)
  if (rows.length > 6) {
    const rest = rows.slice(5).reduce((t, r) => t + r.value, 0)
    rows = [...rows.slice(0, 5), { name: 'Other', value: rest }]
  }
  const total = rows.reduce((t, r) => t + r.value, 0)
  if (!total) return <EmptyChart text={emptyText} />
  const color = (name: string, i: number) => (name === 'Other' ? VIZ.neutral : colorFor ? colorFor(name) : SLOT_ORDER[i % SLOT_ORDER.length])

  return (
    <div className="space-y-5">
      <div>
        <p className="text-3xl font-semibold tracking-tight">{formatCount(total)}</p>
        <p className="text-sm text-muted-foreground">{unit}</p>
      </div>
      <div
        className="flex h-3 w-full gap-[2px] overflow-hidden rounded-full"
        role="img"
        aria-label={rows.map((r) => `${humanize(r.name)}: ${r.value} (${Math.round((r.value / total) * 100)}%)`).join(', ')}
      >
        {rows.map((r, i) => (
          <div
            key={r.name}
            className="h-full first:rounded-l-full last:rounded-r-full transition-[flex-grow] duration-700"
            style={{ flexGrow: r.value, flexBasis: 0, minWidth: 3, backgroundColor: color(r.name, i) }}
            title={`${humanize(r.name)}: ${r.value}`}
          />
        ))}
      </div>
      <ul className="grid grid-cols-1 gap-x-6 gap-y-2.5 text-sm min-[420px]:grid-cols-2">
        {rows.map((r, i) => (
          <li key={r.name} className="flex items-center justify-between gap-3">
            <span className="flex min-w-0 items-center gap-2">
              <span className="h-2.5 w-2.5 flex-shrink-0 rounded-full" style={{ backgroundColor: color(r.name, i) }} aria-hidden="true" />
              <span className="truncate">{humanize(r.name)}</span>
            </span>
            <span className="flex-shrink-0 tabular-nums">
              <span className="font-semibold">{formatCount(r.value)}</span>
              <span className="ml-1.5 text-muted-foreground">{Math.round((r.value / total) * 100)}%</span>
            </span>
          </li>
        ))}
      </ul>
    </div>
  )
}

/** Order statuses: fixed colour per status, lifecycle order. */
export function StatusBreakdown({ data, emptyText = 'No orders in this period.' }: { data: { name: string; value: number }[]; emptyText?: string }) {
  const rank = (n: string) => {
    const i = STATUS_ORDER.indexOf(n.toLowerCase())
    return i === -1 ? 99 : i
  }
  return (
    <PartBreakdown
      data={data}
      unit="orders"
      colorFor={statusColor}
      sort={(a, b) => rank(a.name) - rank(b.name)}
      emptyText={emptyText}
    />
  )
}

// ───────────────────────────── Chrome ─────────────────────────────

/** Card shell for a chart: title, optional subtitle and actions, then body. */
export function ChartCard({
  title,
  subtitle,
  actions,
  children,
  className,
}: {
  title: string
  subtitle?: React.ReactNode
  actions?: React.ReactNode
  children: React.ReactNode
  className?: string
}) {
  return (
    <section className={cn('flex min-w-0 flex-col rounded-xl border bg-card p-4 text-card-foreground shadow-sm sm:p-6', className)}>
      <header className="mb-5 flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <h2 className="text-base font-semibold leading-tight">{title}</h2>
          {subtitle && <div className="mt-1 text-sm text-muted-foreground">{subtitle}</div>}
        </div>
        {actions && <div className="flex flex-shrink-0 flex-wrap items-center gap-2">{actions}</div>}
      </header>
      <div className="min-w-0 flex-1">{children}</div>
    </section>
  )
}

/** Segmented control (range pickers, metric tabs). */
export function Segmented<T extends string | number>({
  value,
  onChange,
  options,
  label,
}: {
  value: T
  onChange: (v: T) => void
  options: { value: T; label: string }[]
  label: string
}) {
  return (
    <div role="radiogroup" aria-label={label} className="inline-flex rounded-lg border bg-muted/50 p-0.5">
      {options.map((o) => (
        <button
          key={String(o.value)}
          type="button"
          role="radio"
          aria-checked={value === o.value}
          onClick={() => onChange(o.value)}
          className={cn(
            'rounded-md px-2.5 py-1 text-xs font-medium transition-colors sm:px-3 sm:text-sm',
            value === o.value ? 'bg-background text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground',
          )}
        >
          {o.label}
        </button>
      ))}
    </div>
  )
}

export function EmptyChart({ text }: { text: string }) {
  return (
    <div className="flex min-h-[160px] flex-col items-center justify-center rounded-lg border border-dashed px-4 py-8 text-center text-sm text-muted-foreground">
      {text}
    </div>
  )
}
