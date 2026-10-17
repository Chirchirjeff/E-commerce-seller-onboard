'use client'

/*
 * NotificationContext
 *
 * Polls GET /orders/seller/list every 30 s and surfaces newly-arrived paid
 * orders as in-app notifications. "New" means an order ID that was not present
 * in the previous poll response (not in localStorage from a prior session).
 *
 * Key design decisions:
 * - "First load" is tracked via a ref, not state, so the interval callback
 *   always sees the correct value without stale-closure issues.
 * - localStorage stores the seen-IDs set so reloading the page doesn't
 *   re-notify about old orders.
 * - All poll state lives in refs; only the notifications array and the
 *   ready flag live in React state (to trigger re-renders).
 */

import * as React from 'react'
import { apiClient } from '@/lib/api-client'
import { formatCurrency, formatDate } from '@/lib/utils'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface SaleNotification {
  id: string           // order id
  orderNumber: string
  buyerName: string
  productNames: string[]
  total: number
  /** ISO timestamp */
  createdAt: string
  /** False until the user opens the bell panel */
  read: boolean
}

interface NotificationContextValue {
  notifications: SaleNotification[]
  unreadCount: number
  markAllRead: () => void
  markRead: (id: string) => void
  /** Whether the first poll has completed */
  ready: boolean
}

// ---------------------------------------------------------------------------
// localStorage helpers
// ---------------------------------------------------------------------------

const SEEN_KEY = 'seller-seen-order-ids'

function loadSeenIds(): Set<string> {
  if (typeof window === 'undefined') return new Set()
  try {
    const raw = localStorage.getItem(SEEN_KEY)
    return raw ? new Set<string>(JSON.parse(raw) as string[]) : new Set()
  } catch {
    return new Set()
  }
}

function persistSeenIds(ids: Set<string>) {
  if (typeof window === 'undefined') return
  // Cap at 500 IDs so localStorage doesn't grow unbounded
  const arr = Array.from(ids).slice(-500)
  localStorage.setItem(SEEN_KEY, JSON.stringify(arr))
}

// ---------------------------------------------------------------------------
// Context
// ---------------------------------------------------------------------------

const NotificationContext = React.createContext<NotificationContextValue>({
  notifications: [],
  unreadCount: 0,
  markAllRead: () => {},
  markRead: () => {},
  ready: false,
})

const POLL_INTERVAL_MS = 30_000 // 30 seconds

// ---------------------------------------------------------------------------
// Email helper (fire-and-forget)
// ---------------------------------------------------------------------------

async function sendSaleEmail(
  notification: SaleNotification,
  sellerEmail: string,
  sellerName: string,
  token: string,
) {
  try {
    await fetch('/api/notify-seller', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        sellerEmail,
        sellerName,
        orderNumber:  notification.orderNumber,
        buyerName:    notification.buyerName,
        productNames: notification.productNames,
        total:        notification.total,
        orderedAt:    notification.createdAt,
        orderId:      notification.id,
      }),
    })
  } catch {
    // Silently ignore — in-app notification is already visible
  }
}

// ---------------------------------------------------------------------------
// Provider
// ---------------------------------------------------------------------------

export function NotificationProvider({ children }: { children: React.ReactNode }) {
  const [notifications, setNotifications] = React.useState<SaleNotification[]>([])
  const [ready, setReady] = React.useState(false)

  // All mutable poll state lives in refs so the interval callback is
  // never stale — we never need to recreate it.
  const seenIdsRef    = React.useRef<Set<string>>(new Set())
  const isFirstRef    = React.useRef(true)   // true until first poll completes
  const sellerRef     = React.useRef<{ email: string; name: string } | null>(null)

  // Stable poll function — created once, uses only refs (no state closures)
  const poll = React.useCallback(async () => {
    const token = sessionStorage.getItem('access_token')
    if (!token) return

    // Lazily fetch seller info once
    if (!sellerRef.current) {
      try {
        const { data } = await apiClient.get('/auth/me')
        const u = data?.user ?? data
        sellerRef.current = {
          email: u?.email ?? '',
          name:  u?.name  ?? 'Seller',
        }
      } catch {
        sellerRef.current = { email: '', name: 'Seller' }
      }
    }

    let orders: Array<{
      id: string
      orderNumber: string
      total: number
      paymentStatus: string
      createdAt: string
      buyer?: { name?: string }
      items?: Array<{ product?: { name?: string } }>
    }>

    try {
      const { data: payload } = await apiClient.get('/orders/seller/list', {
        params: { paymentStatus: 'PAID', limit: 50 },
      })
      orders = payload?.data ?? []
    } catch {
      return // silent — bell won't update this cycle
    }

    const isFirst = isFirstRef.current

    if (isFirst) {
      // First poll: seed the seen set from the current order list.
      // Exception: orders created within the last 2 minutes are treated as
      // "new" even on first load — this handles the case where a buyer just
      // purchased and the seller refreshes the dashboard.
      const twoMinutesAgo = Date.now() - 2 * 60 * 1000
      const recentNewOrders: typeof orders = []

      for (const o of orders) {
        const age = new Date(o.createdAt).getTime()
        if (age >= twoMinutesAgo && !seenIdsRef.current.has(o.id)) {
          // Very recent — treat as a new notification
          recentNewOrders.push(o)
        } else {
          seenIdsRef.current.add(o.id)
        }
      }

      persistSeenIds(seenIdsRef.current)
      isFirstRef.current = false

      if (recentNewOrders.length > 0) {
        // Fall through to the new-notification logic below
        orders = recentNewOrders
      } else {
        setReady(true)
        return
      }
    }

    // Subsequent polls: find orders that arrived since the last poll
    const newNotifs: SaleNotification[] = []

    for (const o of orders) {
      if (seenIdsRef.current.has(o.id)) continue

      seenIdsRef.current.add(o.id)

      const notif: SaleNotification = {
        id:           o.id,
        orderNumber:  o.orderNumber,
        buyerName:    o.buyer?.name ?? 'A customer',
        productNames: (o.items ?? [])
          .map((i) => i.product?.name ?? '')
          .filter(Boolean),
        total:     o.total,
        createdAt: o.createdAt,
        read:      false,
      }

      newNotifs.push(notif)

      // Fire sale email (non-blocking)
      if (sellerRef.current?.email) {
        sendSaleEmail(notif, sellerRef.current.email, sellerRef.current.name, token)
      }
    }

    if (newNotifs.length > 0) {
      persistSeenIds(seenIdsRef.current)
      setNotifications((prev) => [...newNotifs, ...prev])
    }

    // Mark ready after first real poll completes (covers the recent-order path)
    setReady(true)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []) // stable — deliberately no deps; all state accessed via refs

  // Mount: load seen IDs from localStorage then start polling
  React.useEffect(() => {
    seenIdsRef.current = loadSeenIds()
    poll()
    const id = setInterval(poll, POLL_INTERVAL_MS)
    return () => clearInterval(id)
  }, [poll])

  const markAllRead = React.useCallback(() => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })))
  }, [])

  const markRead = React.useCallback((id: string) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: true } : n)),
    )
  }, [])

  const unreadCount = notifications.filter((n) => !n.read).length

  return (
    <NotificationContext.Provider
      value={{ notifications, unreadCount, markAllRead, markRead, ready }}
    >
      {children}
    </NotificationContext.Provider>
  )
}

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------

export function useNotifications() {
  return React.useContext(NotificationContext)
}

// ---------------------------------------------------------------------------
// Formatting helpers
// ---------------------------------------------------------------------------

export function formatNotificationTitle(n: SaleNotification): string {
  const count = n.productNames.length
  const product =
    count === 0 ? 'a product'
    : count === 1 ? n.productNames[0]
    : count === 2 ? `${n.productNames[0]} & ${n.productNames[1]}`
    : `${n.productNames[0]} +${count - 1} more`

  return `${n.buyerName} bought ${product}`
}

export function formatNotificationMeta(n: SaleNotification): string {
  return `${formatCurrency(n.total)} · ${formatDate(n.createdAt)}`
}
