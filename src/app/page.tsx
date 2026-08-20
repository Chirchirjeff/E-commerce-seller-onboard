/*
 * Landing Page - Seller Onboarding
 * Beautiful landing page that redirects to login or register
 */

'use client'

import * as React from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Store, ArrowRight, ShoppingBag, TrendingUp, Shield, Users, CheckCircle, Star, Truck, Headphones } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { ThemeToggle } from '@/components/ui/theme-toggle'

interface PlatformStats {
  activeSellers?: number
  productsListed?: number
  happyCustomers?: number
  uptime?: number
}

export default function LandingPage() {
  const router = useRouter()
  const [isLoading, setIsLoading] = React.useState(false)
  const [statsLoading, setStatsLoading] = React.useState(true)
  const [platformStats, setPlatformStats] = React.useState<PlatformStats>({
    activeSellers: 10000,
    productsListed: 50000,
    happyCustomers: 100000,
    uptime: 99.9,
  })

  React.useEffect(() => {
    // Check if user is already logged in
    const token = sessionStorage.getItem('access_token')
    if (token) {
      router.replace('/dashboard')
    }
  }, [router])

  React.useEffect(() => {
    // Fetch real platform statistics
    const fetchPlatformStats = async () => {
      try {
        setStatsLoading(true)
        const response = await fetch('/api/analytics/platform-stats')
        
        if (response.ok) {
          const data = await response.json()
          setPlatformStats({
            activeSellers: data.activeSellers || 10000,
            productsListed: data.productsListed || 50000,
            happyCustomers: data.happyCustomers || 100000,
            uptime: data.uptime || 99.9,
          })
        }
      } catch (err) {
        // Fall back to default stats if API fails
        console.error('Failed to fetch platform stats:', err)
      } finally {
        setStatsLoading(false)
      }
    }

    fetchPlatformStats()
  }, [])

  const features = [
    {
      icon: ShoppingBag,
      title: 'Sell Products',
      description: 'List your products with ease and reach thousands of customers.',
    },
    {
      icon: TrendingUp,
      title: 'Track Analytics',
      description: 'Monitor your sales, revenue, and growth with real-time insights.',
    },
    {
      icon: Shield,
      title: 'Secure Payments',
      description: 'Safe and secure payment processing with multiple options.',
    },
    {
      icon: Users,
      title: 'Customer Management',
      description: 'Build relationships with your customers and grow your business.',
    },
  ]

  const formatNumber = (num: number) => {
    if (num >= 1000000) {
      return `${(num / 1000000).toFixed(0)}M+`
    }
    if (num >= 1000) {
      return `${(num / 1000).toFixed(0)}K+`
    }
    return num.toString()
  }

  const stats = [
    { value: formatNumber(platformStats.activeSellers || 10000), label: 'Active Sellers' },
    { value: formatNumber(platformStats.productsListed || 50000), label: 'Products Listed' },
    { value: formatNumber(platformStats.happyCustomers || 100000), label: 'Happy Customers' },
    { value: `${platformStats.uptime || 99.9}%`, label: 'Uptime Guarantee' },
  ]

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5">
      {/* Navigation */}
      <nav className="sticky top-0 z-50 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto px-4 flex h-16 items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <Store className="h-5 w-5" />
            </div>
            <span className="text-xl font-bold">SellerHub</span>
          </div>
          <div className="flex items-center gap-4">
            <ThemeToggle />
            <Link href="/login">
              <Button variant="ghost" size="sm">Sign In</Button>
            </Link>
            <Link href="/register">
              <Button size="sm">Get Started</Button>
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative overflow-hidden py-20 md:py-28">
        <div className="absolute inset-0 -z-10">
          <div className="absolute -top-40 -right-40 h-80 w-80 rounded-full bg-primary/5 blur-3xl" />
          <div className="absolute -bottom-40 -left-40 h-80 w-80 rounded-full bg-primary/5 blur-3xl" />
        </div>
        <div className="container mx-auto px-4">
          <div className="mx-auto max-w-4xl text-center">
            <div className="inline-flex items-center rounded-full border bg-primary/10 px-4 py-1.5 text-sm text-primary mb-6">
              <Star className="mr-2 h-4 w-4" />
              Trusted by {formatNumber(platformStats.activeSellers || 10000)} sellers
            </div>
            <h1 className="text-4xl font-bold tracking-tight sm:text-6xl">
              Start Selling with{' '}
              <span className="bg-gradient-to-r from-primary to-primary/50 bg-clip-text text-transparent">
                Confidence
              </span>
            </h1>
            <p className="mt-6 text-xl text-muted-foreground max-w-2xl mx-auto">
              Join thousands of successful sellers. List your products, manage orders, 
              and grow your business with our powerful platform.
            </p>
            <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
              <Link href="/register">
                <Button size="lg" className="gap-2">
                  Get Started Free
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
              <Link href="/login">
                <Button size="lg" variant="outline">
                  Sign In
                </Button>
              </Link>
            </div>
            <p className="mt-4 text-sm text-muted-foreground">
              No credit card required • Free 14-day trial
            </p>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="border-t border-border/50 bg-muted/30 py-12">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
            {stats.map((stat, index) => (
              <div key={index} className="text-center">
                <p className="text-3xl font-bold">{stat.value}</p>
                <p className="text-sm text-muted-foreground">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
              Everything You Need to Sell
            </h2>
            <p className="mt-4 text-lg text-muted-foreground max-w-2xl mx-auto">
              Powerful features designed to help you build and grow your online business.
            </p>
          </div>
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            {features.map((feature, index) => {
              const Icon = feature.icon
              return (
                <Card key={index} className="border-primary/10 hover:shadow-lg transition-shadow">
                  <CardHeader>
                    <div className="rounded-lg bg-primary/10 w-12 h-12 flex items-center justify-center mb-2">
                      <Icon className="h-6 w-6 text-primary" />
                    </div>
                    <CardTitle className="text-lg">{feature.title}</CardTitle>
                    <CardDescription>{feature.description}</CardDescription>
                  </CardHeader>
                </Card>
              )
            })}
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="border-t border-border/50 bg-muted/30 py-20">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
              How It Works
            </h2>
            <p className="mt-4 text-lg text-muted-foreground max-w-2xl mx-auto">
              Get started in just a few simple steps
            </p>
          </div>
          <div className="grid gap-6 md:grid-cols-3">
            <div className="text-center">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-primary/10 text-primary text-2xl font-bold mb-4">
                1
              </div>
              <h3 className="text-xl font-semibold">Create Account</h3>
              <p className="mt-2 text-muted-foreground">
                Sign up as a seller and get verified by our team.
              </p>
            </div>
            <div className="text-center">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-primary/10 text-primary text-2xl font-bold mb-4">
                2
              </div>
              <h3 className="text-xl font-semibold">Set Up Your Shop</h3>
              <p className="mt-2 text-muted-foreground">
                Create your store, add products, and set your pricing.
              </p>
            </div>
            <div className="text-center">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-primary/10 text-primary text-2xl font-bold mb-4">
                3
              </div>
              <h3 className="text-xl font-semibold">Start Selling</h3>
              <p className="mt-2 text-muted-foreground">
                Reach customers, manage orders, and grow your business.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Trust Section */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <div className="mx-auto max-w-4xl text-center">
            <div className="flex justify-center gap-6 mb-8">
              <div className="flex items-center gap-2">
                <CheckCircle className="h-5 w-5 text-green-500" />
                <span className="text-sm">Verified Sellers</span>
              </div>
              <div className="flex items-center gap-2">
                <Shield className="h-5 w-5 text-green-500" />
                <span className="text-sm">Secure Platform</span>
              </div>
              <div className="flex items-center gap-2">
                <Truck className="h-5 w-5 text-green-500" />
                <span className="text-sm">Fast Delivery</span>
              </div>
              <div className="flex items-center gap-2">
                <Headphones className="h-5 w-5 text-green-500" />
                <span className="text-sm">24/7 Support</span>
              </div>
            </div>
            <Card className="border-primary/10 bg-primary/5">
              <CardContent className="p-8">
                <h3 className="text-2xl font-bold">Ready to Start Selling?</h3>
                <p className="mt-2 text-muted-foreground">
                  Join our community of successful sellers today.
                </p>
                <div className="mt-6 flex flex-wrap items-center justify-center gap-4">
                  <Link href="/register">
                    <Button size="lg" className="gap-2">
                      Get Started Now
                      <ArrowRight className="h-4 w-4" />
                    </Button>
                  </Link>
                  <Link href="/login">
                    <Button size="lg" variant="outline">
                      Sign In
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border/50 bg-background py-8">
        <div className="container mx-auto px-4">
          <div className="flex flex-col items-center justify-between gap-4 sm:flex-row">
            <div className="flex items-center gap-2">
              <Store className="h-5 w-5 text-primary" />
              <span className="font-semibold">SellerHub</span>
              <span className="text-sm text-muted-foreground">
                © {new Date().getFullYear()} All rights reserved.
              </span>
            </div>
            <div className="flex items-center gap-4 text-sm text-muted-foreground">
              <Link href="/terms" className="hover:text-foreground transition-colors">
                Terms
              </Link>
              <Link href="/privacy" className="hover:text-foreground transition-colors">
                Privacy
              </Link>
              <Link href="/support" className="hover:text-foreground transition-colors">
                Support
              </Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}
