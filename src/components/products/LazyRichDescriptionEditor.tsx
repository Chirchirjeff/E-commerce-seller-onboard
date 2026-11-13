'use client'

/**
 * Code-split RichDescriptionEditor. The editor is only shown when the seller
 * switches the description to "Rich" mode, so its chunk is fetched on demand
 * with an editor-shaped skeleton in the meantime.
 */
import dynamic from 'next/dynamic'
import { Skeleton, SkeletonGroup } from '@/components/ui/skeleton'

export type { DescriptionBlock } from './RichDescriptionEditor'

function RichDescriptionEditorSkeleton() {
  return (
    <SkeletonGroup label="Loading editor…" className="space-y-3">
      <div className="flex gap-2">
        <Skeleton className="h-8 w-20" />
        <Skeleton className="h-8 w-20" />
        <Skeleton className="h-8 w-20" />
      </div>
      <Skeleton className="h-32 w-full" />
    </SkeletonGroup>
  )
}

export const RichDescriptionEditor = dynamic(
  () => import('./RichDescriptionEditor').then((m) => m.RichDescriptionEditor),
  { ssr: false, loading: () => <RichDescriptionEditorSkeleton /> }
)
