'use client'

import * as React from 'react'
import { ThemeToggle } from '@/components/ui/theme-toggle'
import { Button } from '@/components/ui/button'
import { Bell, Menu, Store, LogOut } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useRouter } from 'next/navigation'
import { apiClient } from '@/lib/api-client'

interface HeaderProps {
  onMenuClick?: () => void
  className?: string
}

export function Header({ onMenuClick, className }: HeaderProps) {
  const router = useRouter()
  const [user, setUser] = React.useState<any>(null)

  React.useEffect(() => {
    const load = async () => {
      // 1. Try sessionStorage first (fast path)
      const userStr = sessionStorage.getItem('user')
      if (userStr) {
        try {
          const parsed = JSON.parse(userStr)
          // Unwrap { user: {...} } if needed
          setUser(parsed?.user ?? parsed)
          return
        } catch {
          // malformed — fall through to API
        }
      }

      // 2. No cached user — fetch from API if a token exists
      const token = sessionStorage.getItem('access_token')
      if (!token) return

      try {
        const { data } = await apiClient.get('/auth/me')
        const userObj = data?.user ?? data
        sessionStorage.setItem('user', JSON.stringify(userObj))
        setUser(userObj)
      } catch {
        // silently ignore — user stays null, fallback UI shown
      }
    }

    load()

    // Pick up updates written to sessionStorage from other tabs / the verify page
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
      "sticky top-0 z-30 flex h-16 items-center gap-4 border-b bg-background px-4 md:px-6",
      className
    )}>
      <Button variant="ghost" size="icon" className="lg:hidden" onClick={onMenuClick}>
        <Menu className="h-5 w-5" />
      </Button>

      <div className="flex flex-1 items-center">
        <div className="flex items-center gap-2 font-semibold lg:hidden">
          <Store className="h-5 w-5 text-primary" />
          <span>SellerHub</span>
        </div>
      </div>

      <div className="flex flex-1 items-center justify-end gap-2 md:gap-4">
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-5 w-5" />
          <span className="absolute right-1 top-1 h-2 w-2 rounded-full bg-red-500" />
        </Button>

        <ThemeToggle />

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