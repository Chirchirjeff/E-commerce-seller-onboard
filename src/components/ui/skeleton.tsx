import * as React from 'react'
import { cn } from '@/lib/utils'

/** A single placeholder shape. Decorative — hidden from assistive tech. */
function Skeleton({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      aria-hidden="true"
      className={cn('animate-pulse rounded-md bg-muted', className)}
      {...props}
    />
  )
}

/**
 * Wraps a group of skeleton shapes and announces a single "Loading…"
 * to screen readers.
 */
function SkeletonGroup({
  className,
  label = 'Loading…',
  children,
  ...props
}: React.HTMLAttributes<HTMLDivElement> & { label?: string }) {
  return (
    <div role="status" aria-live="polite" className={className} {...props}>
      <span className="sr-only">{label}</span>
      {children}
    </div>
  )
}

export { Skeleton, SkeletonGroup }
