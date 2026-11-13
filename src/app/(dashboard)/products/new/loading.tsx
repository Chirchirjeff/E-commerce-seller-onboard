import { ProductFormSkeleton } from '@/components/shared/page-skeletons'

// Instant fallback while this route segment loads (wrapped in Suspense by Next).
export default function Loading() {
  return <ProductFormSkeleton />
}
