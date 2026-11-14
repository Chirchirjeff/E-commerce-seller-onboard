/*
 * Landing Page - Seller Onboarding
 * Server-rendered marketing page; signed-in sellers are bounced to /verify
 * by the small <AuthRedirect /> client component.
 */

import type { Metadata } from 'next'
import Link from 'next/link'
import {
  ArrowRight,
  BadgeCheck,
  BarChart3,
  Bell,
  Check,
  ChevronDown,
  FileCheck2,
  FolderTree,
  Link2,
  Package,
  ShieldCheck,
  Smartphone,
  Store,
  Truck,
  UserPlus,
  Wallet,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { ThemeToggle } from '@/components/ui/theme-toggle'
import { AuthRedirect } from '@/components/landing/auth-redirect'
import { DashboardPreview } from '@/components/landing/dashboard-preview'

export const metadata: Metadata = {
  title: 'Sell on Quza — SellerHub',
  description:
    'Open your shop on Quza, get verified, and sell to customers across Kenya with M-Pesa payments, order tracking and sales analytics.',
}

const highlights = [
  { icon: Smartphone, label: 'M-Pesa payments' },
  { icon: ShieldCheck, label: 'KYC-verified sellers' },
  { icon: BarChart3, label: 'Live sales analytics' },
  { icon: Truck, label: 'Order tracking' },
]

const steps = [
  {
    icon: UserPlus,
    title: 'Create your account',
    body: 'Sign up with your email and business details. It takes a couple of minutes.',
  },
  {
    icon: FileCheck2,
    title: 'Verify your identity',
    body: 'Upload your KYC documents. Our team reviews them so buyers know you’re genuine.',
  },
  {
    icon: Store,
    title: 'Set up your shop',
    body: 'Add your logo, list products, group them into collections and set your prices.',
  },
  {
    icon: Wallet,
    title: 'Sell and get paid',
    body: 'Customers check out with M-Pesa. You fulfil the order and track it to delivery.',
  },
]

const faqs = [
  {
    q: 'What do I need to register?',
    a: 'An email address, your phone number and basic business details. To be verified you’ll upload identity documents during the KYC step.',
  },
  {
    q: 'How long does verification take?',
    a: 'Our team reviews KYC submissions manually. You can follow the status from your account, and we’ll let you know once you’re approved — or what to fix if something is missing.',
  },
  {
    q: 'How do customers pay me?',
    a: 'Buyers pay through M-Pesa at checkout. Each order records its M-Pesa receipt so you can match payments to orders.',
  },
  {
    q: 'Can I manage my shop from my phone?',
    a: 'Yes. The seller dashboard works in any modern mobile browser, so you can add products and update orders on the go.',
  },
]

export default function LandingPage() {
  return (
    <div className="relative min-h-screen overflow-x-hidden bg-background">
      <AuthRedirect />

      {/* ── Navigation ─────────────────────────────────────────────── */}
      <header className="sticky top-0 z-50 border-b border-border/60 bg-background/80 backdrop-blur-md">
        <nav className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
          <Link href="/" className="flex items-center gap-2.5">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-sm shadow-primary/30">
              <Store className="h-[18px] w-[18px]" />
            </span>
            <span className="text-lg font-bold tracking-tight">SellerHub</span>
          </Link>

          <div className="hidden items-center gap-8 text-sm text-muted-foreground md:flex">
            <a href="#features" className="hover:text-foreground">Features</a>
            <a href="#how-it-works" className="hover:text-foreground">How it works</a>
            <a href="#faq" className="hover:text-foreground">FAQ</a>
          </div>

          <div className="flex items-center gap-1.5 sm:gap-2">
            <ThemeToggle />
            <Button asChild variant="ghost" size="sm" className="hidden sm:inline-flex">
              <Link href="/login">Sign in</Link>
            </Button>
            <Button asChild size="sm" className="rounded-full px-4">
              <Link href="/register">Start selling</Link>
            </Button>
          </div>
        </nav>
      </header>

      <main>
        {/* ── Hero ───────────────────────────────────────────────────── */}
        <section className="relative">
          {/* Backdrop: soft grid + accent glow */}
          <div className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
            <div className="absolute inset-0 bg-[linear-gradient(to_right,hsl(var(--border))_1px,transparent_1px),linear-gradient(to_bottom,hsl(var(--border))_1px,transparent_1px)] bg-[size:48px_48px] opacity-40 [mask-image:radial-gradient(ellipse_70%_60%_at_50%_0%,#000_40%,transparent_100%)]" />
            <div className="absolute -top-32 left-1/2 h-[28rem] w-[56rem] -translate-x-1/2 rounded-full bg-primary/15 blur-3xl" />
          </div>

          <div className="mx-auto grid max-w-6xl items-center gap-14 px-4 pb-20 pt-14 sm:px-6 md:pt-20 lg:grid-cols-[1.05fr_1fr] lg:gap-10 lg:pb-28">
            <div className="text-center lg:text-left motion-safe:animate-in motion-safe:fade-in motion-safe:slide-in-from-bottom-4 motion-safe:duration-700">
              <span className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
                <span className="relative flex h-2 w-2">
                  <span className="absolute inline-flex h-full w-full rounded-full bg-primary opacity-60 motion-safe:animate-ping" />
                  <span className="relative inline-flex h-2 w-2 rounded-full bg-primary" />
                </span>
                Now onboarding sellers across Kenya
              </span>

              <h1 className="mt-6 text-4xl font-extrabold leading-[1.1] tracking-tight sm:text-5xl lg:text-6xl">
                Your shop on Quza,{' '}
                <span className="bg-gradient-to-r from-primary via-primary to-primary/60 bg-clip-text text-transparent">
                  open in minutes.
                </span>
              </h1>

              <p className="mx-auto mt-6 max-w-xl text-lg leading-relaxed text-muted-foreground lg:mx-0">
                List your products, take M-Pesa payments and track every order from one
                simple dashboard — built for Kenyan sellers, big and small.
              </p>

              <div className="mt-9 flex flex-col items-center justify-center gap-3 sm:flex-row lg:justify-start">
                <Button asChild size="lg" className="group h-12 w-full rounded-full px-7 text-base shadow-lg shadow-primary/25 sm:w-auto">
                  <Link href="/register">
                    Create your seller account
                    <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                  </Link>
                </Button>
                <Button asChild size="lg" variant="outline" className="h-12 w-full rounded-full px-7 text-base sm:w-auto">
                  <Link href="/login">I already have an account</Link>
                </Button>
              </div>

              <ul className="mt-8 flex flex-wrap items-center justify-center gap-x-5 gap-y-2 text-sm text-muted-foreground lg:justify-start">
                {['Free to sign up', 'Verified in-app', 'Works on mobile'].map((t) => (
                  <li key={t} className="flex items-center gap-1.5">
                    <Check className="h-4 w-4 text-primary" />
                    {t}
                  </li>
                ))}
              </ul>
            </div>

            <div className="motion-safe:animate-in motion-safe:fade-in motion-safe:zoom-in-95 motion-safe:duration-1000">
              <DashboardPreview />
            </div>
          </div>
        </section>

        {/* ── Highlights strip ──────────────────────────────────────── */}
        <section className="border-y border-border/60 bg-muted/30">
          <ul className="mx-auto grid max-w-6xl grid-cols-2 gap-px px-4 sm:px-6 md:grid-cols-4">
            {highlights.map(({ icon: Icon, label }) => (
              <li key={label} className="flex items-center justify-center gap-2.5 py-6 text-sm font-medium">
                <Icon className="h-5 w-5 text-primary" />
                {label}
              </li>
            ))}
          </ul>
        </section>

        {/* ── Features (bento) ──────────────────────────────────────── */}
        <section id="features" className="scroll-mt-20 py-20 sm:py-28">
          <div className="mx-auto max-w-6xl px-4 sm:px-6">
            <div className="mx-auto max-w-2xl text-center">
              <p className="text-sm font-semibold uppercase tracking-wider text-primary">Everything in one place</p>
              <h2 className="mt-3 text-3xl font-bold tracking-tight sm:text-4xl">
                The tools to run your shop, without the hassle
              </h2>
              <p className="mt-4 text-lg text-muted-foreground">
                From your first listing to your hundredth delivery, SellerHub keeps the busywork out of your way.
              </p>
            </div>

            <div className="mt-14 grid gap-4 md:grid-cols-6">
              {/* Payments — wide */}
              <article className="group relative overflow-hidden rounded-2xl border bg-card p-7 md:col-span-4">
                <div className="absolute -right-16 -top-16 h-48 w-48 rounded-full bg-emerald-500/10 blur-2xl transition-opacity group-hover:opacity-80" />
                <FeatureIcon icon={Smartphone} />
                <h3 className="mt-5 text-xl font-semibold">Get paid with M-Pesa</h3>
                <p className="mt-2 max-w-md text-muted-foreground">
                  Buyers pay the way they already do. Every order carries its M-Pesa receipt,
                  so reconciling your sales takes seconds, not evenings.
                </p>
                <div className="mt-6 flex flex-wrap gap-2">
                  {['STK push checkout', 'Receipt on every order', 'Clear payment status'].map((t) => (
                    <span key={t} className="rounded-full border bg-background px-3 py-1 text-xs font-medium">
                      {t}
                    </span>
                  ))}
                </div>
              </article>

              {/* Verified */}
              <article className="rounded-2xl border bg-card p-7 md:col-span-2">
                <FeatureIcon icon={BadgeCheck} />
                <h3 className="mt-5 text-xl font-semibold">Verified seller badge</h3>
                <p className="mt-2 text-muted-foreground">
                  KYC review means buyers shop with confidence — and trust converts.
                </p>
              </article>

              {/* Analytics */}
              <article className="rounded-2xl border bg-card p-7 md:col-span-2">
                <FeatureIcon icon={BarChart3} />
                <h3 className="mt-5 text-xl font-semibold">Sales analytics</h3>
                <p className="mt-2 text-muted-foreground">
                  Revenue, orders and top products at a glance, with trends over time.
                </p>
              </article>

              {/* Orders — wide */}
              <article className="relative overflow-hidden rounded-2xl border bg-card p-7 md:col-span-4">
                <FeatureIcon icon={Package} />
                <h3 className="mt-5 text-xl font-semibold">Orders, start to doorstep</h3>
                <p className="mt-2 max-w-md text-muted-foreground">
                  See new orders the moment they land, update their status as you ship,
                  and keep customers informed without a single phone call.
                </p>
                <ol className="mt-6 flex items-center gap-2 text-xs font-medium">
                  {['Paid', 'Processing', 'Shipped', 'Delivered'].map((s, i, arr) => (
                    <li key={s} className="flex items-center gap-2">
                      <span className={i < 3 ? 'rounded-full bg-primary/10 px-2.5 py-1 text-primary' : 'rounded-full bg-muted px-2.5 py-1 text-muted-foreground'}>
                        {s}
                      </span>
                      {i < arr.length - 1 && <span className="h-px w-3 bg-border sm:w-6" />}
                    </li>
                  ))}
                </ol>
              </article>

              {/* Small trio */}
              <article className="rounded-2xl border bg-card p-7 md:col-span-2">
                <FeatureIcon icon={FolderTree} />
                <h3 className="mt-5 text-lg font-semibold">Collections & categories</h3>
                <p className="mt-2 text-sm text-muted-foreground">Organise your catalogue so buyers find things fast.</p>
              </article>
              <article className="rounded-2xl border bg-card p-7 md:col-span-2">
                <FeatureIcon icon={Link2} />
                <h3 className="mt-5 text-lg font-semibold">Shareable shop links</h3>
                <p className="mt-2 text-sm text-muted-foreground">Share your shop on WhatsApp or Instagram and see which links bring sales.</p>
              </article>
              <article className="rounded-2xl border bg-card p-7 md:col-span-2">
                <FeatureIcon icon={Bell} />
                <h3 className="mt-5 text-lg font-semibold">Instant notifications</h3>
                <p className="mt-2 text-sm text-muted-foreground">Know right away about new orders and account updates.</p>
              </article>
            </div>
          </div>
        </section>

        {/* ── How it works ──────────────────────────────────────────── */}
        <section id="how-it-works" className="scroll-mt-20 border-y border-border/60 bg-muted/30 py-20 sm:py-28">
          <div className="mx-auto max-w-6xl px-4 sm:px-6">
            <div className="mx-auto max-w-2xl text-center">
              <p className="text-sm font-semibold uppercase tracking-wider text-primary">How it works</p>
              <h2 className="mt-3 text-3xl font-bold tracking-tight sm:text-4xl">From sign-up to first sale in four steps</h2>
            </div>

            <ol className="relative mt-14 grid gap-8 sm:grid-cols-2 lg:grid-cols-4 lg:gap-6">
              {/* Connector line on desktop */}
              <div className="absolute left-[12.5%] right-[12.5%] top-7 hidden h-px bg-gradient-to-r from-primary/10 via-primary/40 to-primary/10 lg:block" />
              {steps.map(({ icon: Icon, title, body }, i) => (
                <li key={title} className="relative text-center">
                  <div className="relative mx-auto flex h-14 w-14 items-center justify-center rounded-2xl border bg-background shadow-sm">
                    <Icon className="h-6 w-6 text-primary" />
                    <span className="absolute -right-2 -top-2 flex h-6 w-6 items-center justify-center rounded-full bg-primary text-[11px] font-bold text-primary-foreground">
                      {i + 1}
                    </span>
                  </div>
                  <h3 className="mt-5 text-lg font-semibold">{title}</h3>
                  <p className="mx-auto mt-2 max-w-xs text-sm leading-relaxed text-muted-foreground">{body}</p>
                </li>
              ))}
            </ol>
          </div>
        </section>

        {/* ── FAQ ───────────────────────────────────────────────────── */}
        <section id="faq" className="scroll-mt-20 py-20 sm:py-28">
          <div className="mx-auto grid max-w-6xl gap-10 px-4 sm:px-6 lg:grid-cols-[1fr_1.4fr] lg:gap-16">
            <div>
              <p className="text-sm font-semibold uppercase tracking-wider text-primary">FAQ</p>
              <h2 className="mt-3 text-3xl font-bold tracking-tight sm:text-4xl">Questions sellers ask</h2>
              <p className="mt-4 text-muted-foreground">
                Still unsure? Create your account — you can explore the setup before you list anything.
              </p>
            </div>

            <div className="divide-y rounded-2xl border bg-card">
              {faqs.map(({ q, a }) => (
                <details key={q} className="group px-6 [&_summary::-webkit-details-marker]:hidden">
                  <summary className="flex cursor-pointer list-none items-center justify-between gap-4 py-5 font-medium">
                    {q}
                    <ChevronDown className="h-4 w-4 shrink-0 text-muted-foreground transition-transform group-open:rotate-180" />
                  </summary>
                  <p className="-mt-1 pb-5 text-sm leading-relaxed text-muted-foreground">{a}</p>
                </details>
              ))}
            </div>
          </div>
        </section>

        {/* ── Final CTA ─────────────────────────────────────────────── */}
        <section className="px-4 pb-20 sm:px-6 sm:pb-28">
          <div className="relative mx-auto max-w-6xl overflow-hidden rounded-3xl bg-primary px-6 py-16 text-center text-primary-foreground sm:px-12">
            <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_20%_0%,rgba(255,255,255,0.25),transparent_45%),radial-gradient(circle_at_90%_100%,rgba(0,0,0,0.2),transparent_50%)]" />
            <div className="relative">
              <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">Ready to open your shop?</h2>
              <p className="mx-auto mt-4 max-w-xl text-lg opacity-90">
                Join Quza today and start reaching customers who are ready to buy.
              </p>
              <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
                <Button asChild size="lg" variant="secondary" className="group h-12 w-full rounded-full px-7 text-base sm:w-auto">
                  <Link href="/register">
                    Start selling
                    <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                  </Link>
                </Button>
                <Button
                  asChild
                  size="lg"
                  variant="ghost"
                  className="h-12 w-full rounded-full px-7 text-base text-primary-foreground hover:bg-white/10 hover:text-primary-foreground sm:w-auto"
                >
                  <Link href="/login">Sign in</Link>
                </Button>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* ── Footer ─────────────────────────────────────────────────── */}
      <footer className="border-t border-border/60">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 px-4 py-8 text-sm text-muted-foreground sm:flex-row sm:px-6">
          <div className="flex items-center gap-2">
            <Store className="h-4 w-4 text-primary" />
            <span className="font-semibold text-foreground">SellerHub</span>
            <span>by Quza · © {new Date().getFullYear()}</span>
          </div>
          <div className="flex items-center gap-5">
            <a href="#features" className="hover:text-foreground">Features</a>
            <a href="#faq" className="hover:text-foreground">FAQ</a>
            <Link href="/login" className="hover:text-foreground">Sign in</Link>
            <Link href="/register" className="hover:text-foreground">Register</Link>
          </div>
        </div>
      </footer>
    </div>
  )
}

function FeatureIcon({ icon: Icon }: { icon: React.ComponentType<{ className?: string }> }) {
  return (
    <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10 ring-1 ring-primary/15">
      <Icon className="h-5 w-5 text-primary" />
    </div>
  )
}
