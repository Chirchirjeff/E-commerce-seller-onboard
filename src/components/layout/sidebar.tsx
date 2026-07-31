'use client'

import * as React from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { cn } from '@/lib/utils'
import {
  LayoutDashboard,
  Store,
  Package,
  ShoppingCart,
  TrendingUp,
  Settings,
  LogOut,
  Plus,
  X,
  Tag,
} from 'lucide-react'
import { Button } from '@/components/ui/button'

const routes = [
  { label: 'Dashboard', icon: LayoutDashboard, href: '/dashboard' },
  { label: 'My Shop', icon: Store, href: '/shop' },
  { label: 'Products', icon: Package, href: '/products' },
  { label: 'Categories', icon: Tag, href: '/categories' },
  { label: 'Orders', icon: ShoppingCart, href: '/orders' },
  { label: 'Analytics', icon: TrendingUp, href: '/analytics' },
  { label: 'Settings', icon: Settings, href: '/settings' },
]

interface SidebarProps {
  onClose?: () => void
}

export function Sidebar({ onClose }: SidebarProps) {
  const pathname = usePathname()
  const router = useRouter()

  const handleLogout = () => {
    sessionStorage.removeItem('access_token')
    sessionStorage.removeItem('user')
    router.push('/login')
  }

  return (
    <div className="flex h-full flex-col">
      {/* Close button - mobile only */}
      <div className="flex h-16 items-center justify-between border-b px-4 lg:hidden">
        <Link href="/" className="flex items-center gap-2 font-semibold">
          <Store className="h-5 w-5 text-primary" />
          <span>SellerHub</span>
        </Link>
        <Button variant="ghost" size="icon" onClick={onClose}>
          <X className="h-5 w-5" />
        </Button>
      </div>

      {/* Logo - desktop only */}
      <div className="hidden h-16 items-center border-b px-4 lg:flex">
        <Link href="/" className="flex items-center gap-2 font-semibold">
          <Store className="h-5 w-5 text-primary" />
          <span>SellerHub</span>
        </Link>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto p-2 space-y-1">
        {routes.map((route) => {
          const isActive = pathname === route.href || pathname?.startsWith(route.href + '/')
          return (
            <Link
              key={route.href}
              href={route.href}
              onClick={onClose}
              className={cn(
                'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-all hover:bg-accent hover:text-accent-foreground',
                isActive && 'bg-accent text-accent-foreground font-medium'
              )}
            >
              <route.icon className="h-4 w-4 flex-shrink-0" />
              <span>{route.label}</span>
            </Link>
          )
        })}

        {/* Add Product Quick Action */}
        <div className="pt-2 mt-2 border-t">
          <Link href="/products/new" onClick={onClose}>
            <Button className="w-full" size="sm">
              <Plus className="mr-2 h-4 w-4" />
              Add Product
            </Button>
          </Link>
        </div>
      </nav>

      {/* Bottom */}
      <div className="border-t p-2">
        <Button
          variant="ghost"
          className="w-full justify-start gap-3 text-red-500 hover:bg-red-500/10 hover:text-red-600"
          onClick={handleLogout}
        >
          <LogOut className="h-4 w-4" />
          <span>Logout</span>
        </Button>
      </div>
    </div>
  )
}