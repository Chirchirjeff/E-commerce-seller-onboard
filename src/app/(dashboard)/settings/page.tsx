'use client'

/*
 * Settings page — /settings
 *
 * Two tabs:
 *   • Appearance   — light/dark/system + accent colour (existing logic unchanged)
 *   • Account      — seller personal info fetched from /auth/me + KYC summary
 *                    from /seller/kyc-status; all read-only (fields are KYC-verified)
 */

import * as React from 'react'
import { useTheme } from 'next-themes'
import {
  Sun,
  Moon,
  Monitor,
  Check,
  Palette,
  User,
  Mail,
  Phone,
  Building2,
  FileText,
  ShieldCheck,
  Loader2,
  AlertCircle,
  RefreshCw,
  CalendarDays,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { useAccentTheme, type AccentName } from '@/hooks/use-accent-theme'
import { apiClient, getFriendlyError } from '@/lib/api-client'
import { formatDate } from '@/lib/utils'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface SellerProfile {
  id: string
  name: string
  email: string
  phone?: string
  createdAt: string
}

interface KycInfo {
  status: string
  businessName?: string
  taxId?: string // not selected by getKYCStatus — shown as "––" if absent
  submittedAt?: string
  reviewedAt?: string
}

// ---------------------------------------------------------------------------
// Tab definitions
// ---------------------------------------------------------------------------

type Tab = 'appearance' | 'account'

const TABS: { id: Tab; label: string }[] = [
  { id: 'appearance', label: 'Appearance' },
  { id: 'account',    label: 'Account' },
]

// ---------------------------------------------------------------------------
// Mode options
// ---------------------------------------------------------------------------

const MODES = [
  { value: 'light',  label: 'Light',  icon: Sun },
  { value: 'dark',   label: 'Dark',   icon: Moon },
  { value: 'system', label: 'System', icon: Monitor },
] as const

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export default function SettingsPage() {
  const [activeTab, setActiveTab] = React.useState<Tab>('appearance')
  const { theme, setTheme, resolvedTheme } = useTheme()
  const { accent, setAccent, mounted, palettes } = useAccentTheme()

  if (!mounted) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">Settings</h1>
        <div className="h-64 animate-pulse rounded-xl bg-muted" />
      </div>
    )
  }

  const isDark = resolvedTheme === 'dark'

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">Settings</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Manage your account details and personalise your dashboard.
        </p>
      </div>

      {/* ── Tab bar ── */}
      <div className="flex gap-1 rounded-lg border bg-muted/40 p-1 w-fit">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setActiveTab(tab.id)}
            className={cn(
              'rounded-md px-4 py-1.5 text-sm font-medium transition-all',
              activeTab === tab.id
                ? 'bg-background text-foreground shadow-sm'
                : 'text-muted-foreground hover:text-foreground',
            )}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* ── Appearance tab ── */}
      {activeTab === 'appearance' && (
        <AppearanceTab
          theme={theme}
          setTheme={setTheme}
          isDark={isDark}
          accent={accent}
          setAccent={setAccent}
          palettes={palettes}
        />
      )}

      {/* ── Account tab ── */}
      {activeTab === 'account' && <AccountTab />}
    </div>
  )
}

// ---------------------------------------------------------------------------
// AppearanceTab — exactly the same content as the old single-page settings
// ---------------------------------------------------------------------------

interface AppearanceTabProps {
  theme: string | undefined
  setTheme: (theme: string) => void
  isDark: boolean
  accent: AccentName
  setAccent: (name: AccentName) => void
  palettes: ReturnType<typeof useAccentTheme>['palettes']
}

function AppearanceTab({ theme, setTheme, isDark, accent, setAccent, palettes }: AppearanceTabProps) {
  return (
    <Card>
      <CardHeader className="pb-4">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
            <Palette className="h-4 w-4" />
          </div>
          <div>
            <CardTitle className="text-base">Appearance</CardTitle>
            <p className="mt-0.5 text-sm text-muted-foreground">
              Choose your preferred colour mode and accent colour.
            </p>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-8">

        {/* Mode */}
        <div className="space-y-3">
          <p className="text-sm font-medium">Mode</p>
          <div className="flex flex-wrap gap-3">
            {MODES.map(({ value, label, icon: Icon }) => {
              const isActive = theme === value
              return (
                <button
                  key={value}
                  type="button"
                  onClick={() => setTheme(value)}
                  className={cn(
                    'group flex flex-col items-center gap-2 rounded-xl border-2 p-4 transition-all hover:border-primary/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
                    isActive ? 'border-primary bg-primary/5' : 'border-border bg-card',
                  )}
                >
                  <ModePreview mode={value} />
                  <span className={cn(
                    'flex items-center gap-1.5 text-sm font-medium',
                    isActive ? 'text-primary' : 'text-muted-foreground group-hover:text-foreground',
                  )}>
                    <Icon className="h-3.5 w-3.5" />
                    {label}
                    {isActive && <Check className="h-3 w-3" />}
                  </span>
                </button>
              )
            })}
          </div>
        </div>

        {/* Accent */}
        <div className="space-y-3">
          <p className="text-sm font-medium">Accent colour</p>
          <div className="flex flex-wrap gap-3">
            {palettes.map((p) => {
              const isActive = accent === p.name
              const swatchColour = isDark ? p.swatchDark : p.swatch
              return (
                <button
                  key={p.name}
                  type="button"
                  title={p.label}
                  onClick={() => setAccent(p.name as AccentName)}
                  className={cn(
                    'group flex flex-col items-center gap-2 rounded-xl border-2 p-3 transition-all hover:border-primary/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
                    isActive ? 'border-primary bg-primary/5' : 'border-border',
                  )}
                >
                  <span
                    className="relative flex h-8 w-8 items-center justify-center rounded-full shadow-sm transition-transform group-hover:scale-110"
                    style={{ backgroundColor: swatchColour }}
                  >
                    {isActive && <Check className="h-4 w-4 text-white drop-shadow" />}
                  </span>
                  <span className={cn(
                    'text-xs font-medium',
                    isActive ? 'text-primary' : 'text-muted-foreground group-hover:text-foreground',
                  )}>
                    {p.label}
                  </span>
                </button>
              )
            })}
          </div>
        </div>

        {/* Live preview */}
        <div className="space-y-2">
          <p className="text-sm font-medium">Preview</p>
          <div className="flex flex-wrap items-center gap-3 rounded-lg border bg-background p-4">
            <Button size="sm">Primary button</Button>
            <Button size="sm" variant="outline">Outline button</Button>
            <Button size="sm" variant="secondary">Secondary</Button>
            <Button size="sm" variant="ghost">Ghost</Button>
            <span className="inline-flex h-6 items-center rounded-full bg-primary px-2.5 text-xs font-semibold text-primary-foreground">
              Badge
            </span>
            <span className="h-4 w-4 rounded-full bg-primary" />
            <span className="h-4 w-4 rounded-full border-2 border-primary" />
          </div>
          <p className="text-xs text-muted-foreground">
            Changes apply instantly across the entire dashboard.
          </p>
        </div>

      </CardContent>
    </Card>
  )
}

// ---------------------------------------------------------------------------
// AccountTab — seller personal info + KYC summary
// ---------------------------------------------------------------------------

function AccountTab() {
  const [profile, setProfile] = React.useState<SellerProfile | null>(null)
  const [kyc, setKyc] = React.useState<KycInfo | null>(null)
  const [loading, setLoading] = React.useState(true)
  const [error, setError] = React.useState<string | null>(null)

  const load = React.useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const [profileRes, kycRes] = await Promise.all([
        apiClient.get('/auth/me'),
        apiClient.get('/seller/kyc-status'),
      ])
      const raw = profileRes.data
      setProfile(raw?.user ?? raw)
      setKyc(kycRes.data)
    } catch (err) {
      setError(getFriendlyError(err, 'Could not load account details.'))
    } finally {
      setLoading(false)
    }
  }, [])

  React.useEffect(() => { load() }, [load])

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex flex-col items-center gap-3 py-16 text-center">
        <AlertCircle className="h-8 w-8 text-destructive" />
        <p className="text-sm text-muted-foreground">{error}</p>
        <Button variant="outline" size="sm" onClick={load}>
          <RefreshCw className="mr-2 h-3.5 w-3.5" />
          Try again
        </Button>
      </div>
    )
  }

  return (
    <div className="space-y-6">

      {/* Personal info card */}
      <Card>
        <CardHeader className="pb-4">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <User className="h-4 w-4" />
            </div>
            <div>
              <CardTitle className="text-base">Personal Information</CardTitle>
              <p className="mt-0.5 text-sm text-muted-foreground">
                Your account details as registered.
              </p>
            </div>
          </div>
        </CardHeader>

        <CardContent>
          <dl className="divide-y">
            <InfoRow
              icon={<User className="h-4 w-4" />}
              label="Full name"
              value={profile?.name}
            />
            <InfoRow
              icon={<Mail className="h-4 w-4" />}
              label="Email address"
              value={profile?.email}
            />
            <InfoRow
              icon={<Phone className="h-4 w-4" />}
              label="Phone number"
              value={profile?.phone || '—'}
            />
            <InfoRow
              icon={<CalendarDays className="h-4 w-4" />}
              label="Member since"
              value={profile?.createdAt ? formatDate(profile.createdAt) : '—'}
            />
          </dl>
        </CardContent>
      </Card>

      {/* KYC / Business verification card */}
      <Card>
        <CardHeader className="pb-4">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <ShieldCheck className="h-4 w-4" />
            </div>
            <div>
              <CardTitle className="text-base">Business Verification</CardTitle>
              <p className="mt-0.5 text-sm text-muted-foreground">
                Details submitted during seller verification (KYC). Contact support to update these.
              </p>
            </div>
          </div>
        </CardHeader>

        <CardContent>
          <div className="mb-4">
            <KycStatusBadge status={kyc?.status} />
          </div>

          <dl className="divide-y">
            <InfoRow
              icon={<Building2 className="h-4 w-4" />}
              label="Business name"
              value={kyc?.businessName}
            />
            <InfoRow
              icon={<FileText className="h-4 w-4" />}
              label="Submitted"
              value={kyc?.submittedAt ? formatDate(kyc.submittedAt) : '—'}
            />
            {kyc?.reviewedAt && (
              <InfoRow
                icon={<ShieldCheck className="h-4 w-4" />}
                label="Reviewed"
                value={formatDate(kyc.reviewedAt)}
              />
            )}
          </dl>

          <p className="mt-4 rounded-lg bg-muted/60 px-3 py-2.5 text-xs text-muted-foreground">
            These details were verified by the Quza team. To request a change, please contact
            support at <span className="font-medium text-foreground">support@quza.com</span>.
          </p>
        </CardContent>
      </Card>

    </div>
  )
}

// ---------------------------------------------------------------------------
// Small presentational helpers
// ---------------------------------------------------------------------------

function InfoRow({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode
  label: string
  value?: string | null
}) {
  return (
    <div className="flex items-center gap-3 py-3 first:pt-0 last:pb-0">
      <span className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-md bg-muted text-muted-foreground">
        {icon}
      </span>
      <dt className="w-32 flex-shrink-0 text-sm text-muted-foreground">{label}</dt>
      <dd className="flex-1 text-sm font-medium truncate">{value ?? '—'}</dd>
    </div>
  )
}

function KycStatusBadge({ status }: { status?: string }) {
  const map: Record<string, { label: string; className: string }> = {
    VERIFIED:      { label: 'Verified',      className: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400' },
    PENDING:       { label: 'Under review',  className: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400' },
    REJECTED:      { label: 'Rejected',      className: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' },
    NOT_SUBMITTED: { label: 'Not submitted', className: 'bg-muted text-muted-foreground' },
  }
  const config = map[status ?? 'NOT_SUBMITTED'] ?? map['NOT_SUBMITTED']

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-semibold',
        config.className,
      )}
    >
      <ShieldCheck className="h-3 w-3" />
      {config.label}
    </span>
  )
}

// ---------------------------------------------------------------------------
// ModePreview — same thumbnails as before
// ---------------------------------------------------------------------------

function ModePreview({ mode }: { mode: 'light' | 'dark' | 'system' }) {
  if (mode === 'light') {
    return (
      <div className="h-14 w-20 overflow-hidden rounded-md border bg-white shadow-sm">
        <div className="h-2.5 w-full bg-slate-100 border-b" />
        <div className="flex gap-1 p-1.5">
          <div className="h-8 w-3.5 rounded-sm bg-slate-200" />
          <div className="flex-1 space-y-1 pt-0.5">
            <div className="h-1.5 rounded bg-slate-200" />
            <div className="h-1.5 w-3/4 rounded bg-slate-100" />
            <div className="mt-1 h-2 w-1/2 rounded bg-blue-400" />
          </div>
        </div>
      </div>
    )
  }

  if (mode === 'dark') {
    return (
      <div className="h-14 w-20 overflow-hidden rounded-md border border-slate-700 bg-slate-900 shadow-sm">
        <div className="h-2.5 w-full bg-slate-800 border-b border-slate-700" />
        <div className="flex gap-1 p-1.5">
          <div className="h-8 w-3.5 rounded-sm bg-slate-700" />
          <div className="flex-1 space-y-1 pt-0.5">
            <div className="h-1.5 rounded bg-slate-700" />
            <div className="h-1.5 w-3/4 rounded bg-slate-800" />
            <div className="mt-1 h-2 w-1/2 rounded bg-blue-500" />
          </div>
        </div>
      </div>
    )
  }

  return (
    <div
      className="h-14 w-20 overflow-hidden rounded-md border shadow-sm"
      style={{ background: 'linear-gradient(to right, white 50%, #0f172a 50%)' }}
    >
      <div
        className="h-2.5 w-full"
        style={{
          background: 'linear-gradient(to right, #f1f5f9 50%, #1e293b 50%)',
          borderBottom: '1px solid #e2e8f0',
        }}
      />
      <div className="flex gap-1 p-1.5">
        <div
          className="h-8 w-3.5 rounded-sm"
          style={{ background: 'linear-gradient(to right, #e2e8f0 50%, #334155 50%)' }}
        />
        <div className="flex-1 space-y-1 pt-0.5">
          <div className="h-1.5 rounded" style={{ background: 'linear-gradient(to right, #e2e8f0 50%, #334155 50%)' }} />
          <div className="h-1.5 w-3/4 rounded" style={{ background: 'linear-gradient(to right, #f1f5f9 50%, #1e293b 50%)' }} />
          <div className="mt-1 h-2 w-1/2 rounded bg-blue-500" />
        </div>
      </div>
    </div>
  )
}
