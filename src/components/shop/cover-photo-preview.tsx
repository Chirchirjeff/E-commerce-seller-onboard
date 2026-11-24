/*
 * CoverPhotoPreview — renders a shop cover exactly like the storefront does:
 * a blurred, scaled-up copy of the image fills the banner, and the full image
 * sits on top with object-contain so nothing is ever cropped.
 */

import * as React from 'react'
import { ImageOff } from 'lucide-react'
import { cn } from '@/lib/utils'

interface CoverPhotoPreviewProps {
  src: string
  alt?: string
  className?: string
  children?: React.ReactNode
}

export function CoverPhotoPreview({ src, alt = 'Shop cover', className, children }: CoverPhotoPreviewProps) {
  const [failedSrc, setFailedSrc] = React.useState<string | null>(null)
  const failed = failedSrc === src

  return (
    <div className={cn('relative aspect-[4/1] w-full overflow-hidden rounded-lg border bg-muted', className)}>
      {failed ? (
        <div className="flex h-full w-full items-center justify-center gap-2 text-sm text-muted-foreground">
          <ImageOff className="h-4 w-4" aria-hidden="true" />
          Image could not be loaded
        </div>
      ) : (
        <>
          {/* Plain <img>: uploaded covers live on the API/CDN host, outside next/image config. */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={src}
            alt=""
            aria-hidden="true"
            decoding="async"
            crossOrigin="anonymous"
            className="absolute inset-0 h-full w-full scale-110 object-cover blur-xl"
          />
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={src}
            alt={alt}
            decoding="async"
            crossOrigin="anonymous"
            className="relative h-full w-full object-contain"
            onError={() => {
              console.error('Cover photo failed to load:', src)
              setFailedSrc(src)
            }}
          />
        </>
      )}
      {children}
    </div>
  )
}
