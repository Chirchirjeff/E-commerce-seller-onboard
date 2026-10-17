'use client'

import * as React from 'react'
import { ThemeToggle } from '@/components/ui/theme-toggle'
import { Button } from '@/components/ui/button'
import { Bell, Menu, Store, LogOut, ShoppingBag, ArrowRight, CheckCheck } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useRouter } from 'next/navigation'
import { apiClient } from '@/lib/api-client'
import {
  useNotifications,
  formatNotificationTitle,
  formatNotificationMeta,
  type SaleNotification,
} from '@/context/notifications'

interface HeaderProps {
  onMenuClick?: () => void
  className?: string
}

export function Header({ onMenuClick, className }: HeaderProps) {
  const router = useRouter()
  const [user, setUser] = React.useState<any>(null)

  // ── user loading (unchanged) ──────────────────────────────────────────────
  React.useEffect(() => {
    const load = async () => {
      const userStr = sessionStorage.getItem('user')
      if (userStr) {
        try {
          const parsed = JSON.parse(userStr)
          setUser(parsed?.user ?? parsed)
          return
        } catch { /* fall through */ }
      }
      const token = sessionStorage.getItem('access_token')
      if (!token) return
      try {
        const { data } = await apiClient.get('/auth/me')
        const userObj = data?.user ?? data
        sessionStorage.setItem('user', JSON.stringify(userObj))
        setUser(userObj)
      } catch { /* silently ignore */ }
    }
    load()
    window.addEventListener('storage', load)
    return () => window.removeEventListener('storage', load)
  }, [])

  const handleLogout = () => {
    sessionStorage.removeItem('access_token')
    sessionStorage.removeItem('user')
    router.push('/login')
  }

  return (
    <header className={cn(
      'sticky top-0 z-30 flex h-16 items-center gap-4 border-b bg-background px-4 md:px-6',
      className,
    )}>
      {/* Hamburger — mobile only */}
      <Button variant="ghost" size="icon" className="lg:hidden" onClick={onMenuClick}>
        <Menu className="h-5 w-5" />
      </Button>

      {/* Logo — mobile only */}
      <div className="flex flex-1 items-center">
        <div className="flex items-center gap-2 font-semibold lg:hidden">
          <Store className="h-5 w-5 text-primary" />
          <span>SellerHub</span>
        </div>
      </div>

      <div className="flex flex-1 items-center justify-end gap-2 md:gap-4">
        {/* ── Notification bell ── */}
        <NotificationBell />

        <ThemeToggle />

        {/* ── User chip ── */}
        <div className="flex items-center gap-3 border-l pl-3 md:pl-4">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-primary-foreground text-sm font-medium">
            {user?.name?.[0]?.toUpperCase() || user?.email?.[0]?.toUpperCase() || 'S'}
          </div>
          <div className="hidden md:block">
            <p className="text-sm font-medium leading-tight">
              {user?.name || user?.email || 'Seller'}
            </p>
            {user?.name && user?.email && (
              <p className="text-xs text-muted-foreground">{user.email}</p>
            )}
          </div>
          <Button variant="ghost" size="sm" className="hidden md:flex" onClick={handleLogout}>
            <LogOut className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </header>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// NotificationBell — self-contained; reads from NotificationContext
// ─────────────────────────────────────────────────────────────────────────────

function NotificationBell() {
  const router = useRouter()
  const { notifications, unreadCount, markAllRead, markRead } = useNotifications()
  const [open, setOpen] = React.useState(false)
  const panelRef = React.useRef<HTMLDivElement>(null)
  const triggerRef = React.useRef<HTMLButtonElement>(null)

  // Close on outside click
  React.useEffect(() => {
    if (!open) return
    const handler = (e: MouseEvent) => {
      if (
        panelRef.current && !panelRef.current.contains(e.target as Node) &&
        triggerRef.current && !triggerRef.current.contains(e.target as Node)
      ) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [open])

  // Close on Escape
  React.useEffect(() => {
    if (!open) return
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') setOpen(false) }
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [open])

  const handleOpen = () => {
    setOpen((v) => !v)
  }

  const handleViewOrder = (n: SaleNotification) => {
    markRead(n.id)
    setOpen(false)
    router.push(`/orders/${n.id}`)
  }

  const handleMarkAllRead = () => {
    markAllRead()
  }

  return (
    <div className="relative">
      {/* Trigger */}
      <button
        ref={triggerRef}
        type="button"
        aria-label={`Notifications${unreadCount > 0 ? `, ${unreadCount} unread` : ''}`}
        aria-haspopup="dialog"
        aria-expanded={open}
        onClick={handleOpen}
        className="relative inline-flex h-9 w-9 items-center justify-center rounded-md text-foreground/70 transition-colors hover:bg-accent hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      >
        <Bell className="h-5 w-5" />
        {unreadCount > 0 && (
          <span
            className="absolute right-1 top-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold leading-none text-white"
            aria-hidden
          >
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {/* Panel */}
      {open && (
        <div
          ref={panelRef}
          role="dialog"
          aria-label="Notifications"
          className={cn(
            'absolute right-0 top-11 z-50 w-80 sm:w-96',
            'rounded-xl border bg-popover shadow-xl',
            'animate-in fade-in-0 zoom-in-95 slide-in-from-top-2',
          )}
        >
          {/* Panel header */}
          <div className="flex items-center justify-between border-b px-4 py-3">
            <div className="flex items-center gap-2">
              <Bell className="h-4 w-4 text-primary" />
              <span className="text-sm font-semibold">Notifications</span>
              {unreadCount > 0 && (
                <span className="inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-primary px-1.5 text-[10px] font-bold text-primary-foreground">
                  {unreadCount}
                </span>
              )}
            </div>
            {notifications.length > 0 && (
              <button
                type="button"
                onClick={handleMarkAllRead}
                className="flex items-center gap-1 text-xs text-muted-foreground transition-colors hover:text-foreground"
              >
                <CheckCheck className="h-3.5 w-3.5" />
                Mark all read
              </button>
            )}
          </div>

          {/* Notification list */}
          <div className="max-h-[420px] overflow-y-auto">
            {notifications.length === 0 ? (
              <EmptyState />
            ) : (
              <ul>
                {notifications.map((n) => (
                  <NotificationItem
                    key={n.id}
                    notification={n}
                    onView={handleViewOrder}
                  />
                ))}
              </ul>
            )}
          </div>

          {/* Panel footer */}
          {notifications.length > 0 && (
            <div className="border-t px-4 py-2.5">
              <button
                type="button"
                onClick={() => { setOpen(false); router.push('/orders') }}
                className="flex w-full items-center justify-center gap-1.5 rounded-md py-1.5 text-xs font-medium text-muted-foreground transition-colors hover:text-foreground"
              >
                View all orders
                <ArrowRight className="h-3.5 w-3.5" />
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// NotificationItem
// ─────────────────────────────────────────────────────────────────────────────

function NotificationItem({
  notification: n,
  onView,
}: {
  notification: SaleNotification
  onView: (n: SaleNotification) => void
}) {
  return (
    <li
      className={cn(
        'border-b last:border-b-0',
        !n.read && 'bg-primary/5',
      )}
    >
      <div className="flex items-start gap-3 px-4 py-3">
        {/* Icon */}
        <div className="mt-0.5 flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400">
          <ShoppingBag className="h-4 w-4" />
        </div>

        {/* Content */}
        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-2">
            <p className={cn('text-sm leading-snug', !n.read && 'font-medium')}>
              {formatNotificationTitle(n)}
            </p>
            {!n.read && (
              <span className="mt-1 h-2 w-2 flex-shrink-0 rounded-full bg-primary" aria-label="Unread" />
            )}
          </div>
          <p className="mt-0.5 text-xs text-muted-foreground">{formatNotificationMeta(n)}</p>

          {/* Actions */}
          <button
            type="button"
            onClick={() => onView(n)}
            className="mt-1.5 inline-flex items-center gap-1 text-xs font-medium text-primary transition-colors hover:text-primary/80"
          >
            View order details
            <ArrowRight className="h-3 w-3" />
          </button>
        </div>
      </div>
    </li>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// EmptyState
// ─────────────────────────────────────────────────────────────────────────────

function EmptyState() {
  return (
    <div className="flex flex-col items-center gap-2 px-4 py-10 text-center">
      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted">
        <Bell className="h-5 w-5 text-muted-foreground" />
      </div>
      <p className="text-sm font-medium">No notifications yet</p>
      <p className="text-xs text-muted-foreground">
        You'll be notified here when a customer purchases from your shop.
      </p>
    </div>
  )
}
