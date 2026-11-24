'use client'

/*
 * UserAvatar / UserIdentity — compact public identity for buyers and reviewers.
 * Shows a circular avatar (initials fallback when there is no photo or it fails
 * to load), the display name, and the public @username as muted secondary text.
 */

import * as React from 'react'
import { cn } from '@/lib/utils'
import type { PublicUserProfile } from '@/types/user'

const SIZES = {
  sm: { box: 'h-8 w-8 text-xs', px: 32 },
  md: { box: 'h-10 w-10 text-sm', px: 40 },
} as const

type AvatarSize = keyof typeof SIZES

const cleanUsername = (username?: string | null) => username?.trim().replace(/^@/, '') || null

export function getInitials(name?: string | null, username?: string | null): string {
  const source = name?.trim() || cleanUsername(username) || ''
  const parts = source.split(/[\s._-]+/).filter(Boolean)
  if (parts.length === 0) return '?'
  const first = Array.from(parts[0])
  const letters = parts.length > 1
    ? first[0] + Array.from(parts[parts.length - 1])[0]
    : first.slice(0, 2).join('')
  return letters.toUpperCase()
}

/**
 * Candidate image URLs, best first. Cloudinary avatars are stored at 512px, so
 * we ask Cloudinary for a small rendition and keep the original as a fallback
 * (e.g. if the account restricts on-the-fly transformations).
 */
function avatarSources(url: string | null | undefined, px: number): string[] {
  if (!url) return []
  let parsed: URL
  try {
    parsed = new URL(url)
  } catch {
    return []
  }
  if (parsed.protocol !== 'https:' && parsed.protocol !== 'http:') return []
  if (parsed.hostname === 'res.cloudinary.com' && parsed.pathname.includes('/image/upload/')) {
    const dim = px * 2 // crisp on high-DPI screens
    const sized = url.replace('/image/upload/', `/image/upload/c_fill,w_${dim},h_${dim},q_auto,f_auto/`)
    return [sized, url]
  }
  return [url]
}

interface UserAvatarProps {
  name?: string | null
  username?: string | null
  avatarUrl?: string | null
  size?: AvatarSize
  className?: string
}

/** Decorative avatar — pair it with a visible name (it is hidden from screen readers). */
export function UserAvatar({ name, username, avatarUrl, size = 'sm', className }: UserAvatarProps) {
  const { box, px } = SIZES[size]
  const sources = React.useMemo(() => avatarSources(avatarUrl, px), [avatarUrl, px])
  // Failures are tracked per URL so a new avatarUrl starts from its best source.
  const [failed, setFailed] = React.useState<{ url: string | null | undefined; count: number }>({ url: avatarUrl, count: 0 })
  const attempt = failed.url === avatarUrl ? failed.count : 0
  const src = sources[attempt]

  return (
    <span
      aria-hidden
      className={cn(
        'relative inline-flex flex-shrink-0 select-none items-center justify-center overflow-hidden rounded-full bg-muted font-medium text-muted-foreground',
        box,
        className,
      )}
    >
      {getInitials(name, username)}
      {src && (
        // eslint-disable-next-line @next/next/no-img-element -- tiny avatar already sized by Cloudinary
        <img
          key={src}
          src={src}
          alt=""
          width={px}
          height={px}
          loading="lazy"
          decoding="async"
          referrerPolicy="no-referrer"
          className="absolute inset-0 h-full w-full object-cover"
          onError={() => setFailed({ url: avatarUrl, count: attempt + 1 })}
        />
      )}
    </span>
  )
}

interface UserIdentityProps extends Omit<PublicUserProfile, 'id'> {
  /** Shown when the user has neither a name nor a username (e.g. guest orders). */
  fallbackName?: string
  size?: AvatarSize
  className?: string
  nameClassName?: string
}

export function UserIdentity({
  name,
  username,
  avatarUrl,
  fallbackName = 'Unknown',
  size = 'sm',
  className,
  nameClassName,
}: UserIdentityProps) {
  const handle = cleanUsername(username)
  const displayName = name?.trim() || (handle ? `@${handle}` : fallbackName)
  const showHandle = Boolean(handle && name?.trim())

  return (
    <div className={cn('flex min-w-0 items-center gap-2.5', className)}>
      <UserAvatar name={name} username={handle} avatarUrl={avatarUrl} size={size} />
      <div className="min-w-0">
        <p className={cn('truncate font-medium leading-tight', nameClassName)}>{displayName}</p>
        {showHandle && (
          <p className="truncate text-xs leading-tight text-muted-foreground">@{handle}</p>
        )}
      </div>
    </div>
  )
}
