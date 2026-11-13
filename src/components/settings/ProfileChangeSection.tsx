'use client'

/*
 * ProfileChangeSection — lets sellers change account and business details
 * through the proper channel for each one:
 *
 *   • Email  → code sent to the NEW address, old address notified.
 *   • Phone  → code sent to the current login email (step-up check).
 *   • Legal name / business name / address / tax PIN → reviewed by a Quza admin.
 *
 * Every change needs the current password and a reason, and is recorded with
 * a reference number the seller can quote to support.
 */

import * as React from 'react'
import {
  User, Mail, Phone, Building2, MapPin, Hash, ShieldCheck, KeyRound, Loader2,
  CheckCircle2, Clock, XCircle, Ban, Paperclip, History, Pencil, Info, CalendarDays,
} from 'lucide-react'
import { cn, formatDate } from '@/lib/utils'
import { apiClient, getFriendlyError } from '@/lib/api-client'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { SkeletonGroup } from '@/components/ui/skeleton'
import { DetailRowsCardSkeleton } from '@/components/shared/page-skeletons'
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from '@/components/ui/dialog'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'

// ---------------------------------------------------------------------------
// Types (mirror the backend's /seller/profile-changes response)
// ---------------------------------------------------------------------------

type ProfileField = 'EMAIL' | 'PHONE' | 'FULL_NAME' | 'BUSINESS_NAME' | 'BUSINESS_ADDRESS' | 'TAX_ID'
type Channel = 'OTP_NEW_EMAIL' | 'OTP_CURRENT_EMAIL' | 'ADMIN_REVIEW'
type Status = 'PENDING_VERIFICATION' | 'PENDING_REVIEW' | 'COMPLETED' | 'REJECTED' | 'CANCELLED' | 'EXPIRED'

interface FieldDefinition {
  field: ProfileField
  label: string
  channel: Channel
  requiresVerifiedKyc: boolean
  process: string
  updates: string[]
  reasons: { code: string; label: string }[]
}

interface ChangeRequest {
  id: string
  reference: string
  field: ProfileField
  oldValue: string | null
  newValue: string
  reasonCode: string
  reasonNote: string | null
  supportingDocUrl: string | null
  channel: Channel
  status: Status
  codeExpiresAt: string | null
  reviewNote: string | null
  reviewedAt: string | null
  completedAt: string | null
  createdAt: string
}

interface Overview {
  current: Record<ProfileField, string | null>
  kycStatus: string
  fields: FieldDefinition[]
  requests: ChangeRequest[]
}

const FIELD_ICONS: Record<ProfileField, React.ComponentType<{ className?: string }>> = {
  EMAIL: Mail, PHONE: Phone, FULL_NAME: User, BUSINESS_NAME: Building2, BUSINESS_ADDRESS: MapPin, TAX_ID: Hash,
}

const INPUT_TYPES: Partial<Record<ProfileField, string>> = { EMAIL: 'email', PHONE: 'tel' }
const PLACEHOLDERS: Record<ProfileField, string> = {
  EMAIL: 'you@business.co.ke',
  PHONE: '0712 345 678',
  FULL_NAME: 'As it appears on your ID',
  BUSINESS_NAME: 'As registered with the registrar',
  BUSINESS_ADDRESS: 'Building, street, town',
  TAX_ID: 'A012345678Z',
}

const STATUS_STYLES: Record<Status, { label: string; icon: React.ComponentType<{ className?: string }>; className: string }> = {
  PENDING_VERIFICATION: { label: 'Awaiting code', icon: KeyRound, className: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400' },
  PENDING_REVIEW:       { label: 'Under review',  icon: Clock,    className: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' },
  COMPLETED:            { label: 'Completed',     icon: CheckCircle2, className: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400' },
  REJECTED:             { label: 'Rejected',      icon: XCircle,  className: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' },
  CANCELLED:            { label: 'Cancelled',     icon: Ban,      className: 'bg-muted text-muted-foreground' },
  EXPIRED:              { label: 'Expired',       icon: Clock,    className: 'bg-muted text-muted-foreground' },
}

const OPEN: Status[] = ['PENDING_VERIFICATION', 'PENDING_REVIEW']
const CODE_LENGTH = 6

// ---------------------------------------------------------------------------
// Main section
// ---------------------------------------------------------------------------

export function ProfileChangeSection({ memberSince, onChanged }: { memberSince?: string; onChanged?: () => void }) {
  const [data, setData] = React.useState<Overview | null>(null)
  const [error, setError] = React.useState<string | null>(null)
  const [dialog, setDialog] = React.useState<{ field: FieldDefinition; resume?: ChangeRequest } | null>(null)
  const [cancelling, setCancelling] = React.useState<string | null>(null)

  const load = React.useCallback(async () => {
    try {
      const res = await apiClient.get<Overview>('/seller/profile-changes')
      setData(res.data)
      setError(null)
    } catch (err) {
      setError(getFriendlyError(err, 'Could not load your account details.'))
    }
  }, [])

  React.useEffect(() => {
    let active = true
    apiClient.get<Overview>('/seller/profile-changes')
      .then((res) => { if (active) setData(res.data) })
      .catch((err) => { if (active) setError(getFriendlyError(err, 'Could not load your account details.')) })
    return () => { active = false }
  }, [])

  const refresh = async () => {
    await load()
    onChanged?.()
  }

  const cancelRequest = async (request: ChangeRequest) => {
    if (!window.confirm(`Cancel change request ${request.reference}?`)) return
    setCancelling(request.id)
    try {
      await apiClient.post(`/seller/profile-changes/${request.id}/cancel`)
      await load()
    } catch (err) {
      window.alert(getFriendlyError(err, 'Could not cancel this request.'))
    } finally {
      setCancelling(null)
    }
  }

  if (error) {
    return (
      <Card><CardContent className="py-8 text-center text-sm text-muted-foreground">{error}</CardContent></Card>
    )
  }
  if (!data) {
    return (
      <SkeletonGroup label="Loading account details…" className="space-y-6">
        <DetailRowsCardSkeleton rows={4} />
        <DetailRowsCardSkeleton rows={3} />
      </SkeletonGroup>
    )
  }

  const openByField = new Map(
    data.requests.filter((r) => OPEN.includes(r.status)).map((r) => [r.field, r] as const),
  )
  const personal = data.fields.filter((f) => !f.requiresVerifiedKyc)
  const business = data.fields.filter((f) => f.requiresVerifiedKyc)
  const kycVerified = data.kycStatus === 'VERIFIED'

  const renderRow = (field: FieldDefinition) => {
    const Icon = FIELD_ICONS[field.field]
    const open = openByField.get(field.field)
    const locked = field.requiresVerifiedKyc && !kycVerified
    return (
      <div key={field.field} className="flex flex-col gap-3 py-4 first:pt-0 last:pb-0 sm:flex-row sm:items-center">
        <div className="flex min-w-0 flex-1 items-center gap-3">
          <span className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-md bg-muted text-muted-foreground">
            <Icon className="h-4 w-4" />
          </span>
          <div className="min-w-0">
            <p className="text-sm text-muted-foreground">{field.label}</p>
            <p className="truncate text-sm font-medium">{data.current[field.field] || '—'}</p>
            {open && (
              <p className="mt-1 flex flex-wrap items-center gap-1.5 text-xs">
                <StatusBadge status={open.status} />
                <span className="text-muted-foreground">
                  → <span className="font-medium text-foreground">{open.newValue}</span> · {open.reference}
                </span>
              </p>
            )}
          </div>
        </div>
        <div className="flex flex-shrink-0 items-center gap-2 sm:justify-end">
          <ChannelHint channel={field.channel} />
          {open?.status === 'PENDING_VERIFICATION' ? (
            <Button size="sm" onClick={() => setDialog({ field, resume: open })}>Enter code</Button>
          ) : (
            <Button
              size="sm"
              variant="outline"
              disabled={locked || open?.status === 'PENDING_REVIEW'}
              title={locked ? 'Available once your business verification is approved' : open ? 'A change is already under review' : undefined}
              onClick={() => setDialog({ field })}
            >
              <Pencil className="mr-1.5 h-3.5 w-3.5" />
              {field.channel === 'ADMIN_REVIEW' ? 'Request change' : 'Change'}
            </Button>
          )}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="pb-4">
          <SectionTitle icon={User} title="Personal & contact details" subtitle="Email and phone changes are confirmed with a one-time code. Name changes are reviewed against your ID." />
        </CardHeader>
        <CardContent>
          <div className="divide-y">{personal.map(renderRow)}</div>
          {memberSince && (
            <p className="mt-4 flex items-center gap-2 border-t pt-4 text-xs text-muted-foreground">
              <CalendarDays className="h-3.5 w-3.5" /> Member since {formatDate(memberSince)}
            </p>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-4">
          <SectionTitle icon={Building2} title="Business details" subtitle="These were verified during KYC, so every change is reviewed by the Quza team before it takes effect." />
        </CardHeader>
        <CardContent>
          {!kycVerified && (
            <p className="mb-4 flex items-start gap-2 rounded-lg bg-muted/60 px-3 py-2.5 text-xs text-muted-foreground">
              <Info className="mt-0.5 h-3.5 w-3.5 flex-shrink-0" />
              {data.kycStatus === 'PENDING'
                ? 'Your business verification is under review. You can request changes once it is approved.'
                : 'Complete your business verification (KYC) before requesting changes to these details.'}
            </p>
          )}
          <div className="divide-y">{business.map(renderRow)}</div>
        </CardContent>
      </Card>

      <RequestHistory requests={data.requests} fields={data.fields} cancelling={cancelling} onCancel={cancelRequest}
        onResume={(r) => { const f = data.fields.find((x) => x.field === r.field); if (f) setDialog({ field: f, resume: r }) }} />

      {dialog && (
        <ChangeDialog
          key={dialog.resume?.id ?? dialog.field.field}
          field={dialog.field}
          currentValue={data.current[dialog.field.field]}
          resume={dialog.resume}
          onClose={() => setDialog(null)}
          onFinished={refresh}
        />
      )}
    </div>
  )
}

// ---------------------------------------------------------------------------
// Change dialog: form → (code) → done
// ---------------------------------------------------------------------------

type Step = 'form' | 'code' | 'done'

function ChangeDialog({
  field, currentValue, resume, onClose, onFinished,
}: {
  field: FieldDefinition
  currentValue: string | null
  resume?: ChangeRequest
  onClose: () => void
  onFinished: () => void
}) {
  const isReview = field.channel === 'ADMIN_REVIEW'
  const [step, setStep] = React.useState<Step>(resume ? 'code' : 'form')
  const [newValue, setNewValue] = React.useState('')
  const [reasonCode, setReasonCode] = React.useState('')
  const [reasonNote, setReasonNote] = React.useState('')
  const [password, setPassword] = React.useState('')
  const [docUrl, setDocUrl] = React.useState<string | null>(null)
  const [uploading, setUploading] = React.useState(false)
  const [busy, setBusy] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)
  const [request, setRequest] = React.useState<ChangeRequest | null>(resume ?? null)
  const [codeSentTo, setCodeSentTo] = React.useState<string | null>(null)
  const [code, setCode] = React.useState('')
  const [updated, setUpdated] = React.useState<string[]>([])
  const [resendIn, setResendIn] = React.useState(resume ? 0 : 60)
  const attempted = React.useRef<string | null>(null)
  const codeRef = React.useRef<HTMLInputElement>(null)

  React.useEffect(() => {
    if (step !== 'code' || resendIn <= 0) return
    const t = window.setTimeout(() => setResendIn((s) => s - 1), 1000)
    return () => window.clearTimeout(t)
  }, [step, resendIn])

  const needsNote = reasonCode === 'OTHER'
  const canSubmit =
    newValue.trim() && reasonCode && password && (!needsNote || reasonNote.trim().length >= 10) && !uploading && !busy

  const upload = async (file: File) => {
    if (!file.type.startsWith('image/')) { setError('Upload a photo or scan of the document (image file).'); return }
    if (file.size > 10 * 1024 * 1024) { setError('That file is larger than 10 MB.'); return }
    setUploading(true); setError(null)
    try {
      const form = new FormData()
      form.append('files', file)
      const { data } = await apiClient.post<{ files: string[] }>('/uploads', form, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })
      setDocUrl(data.files[0] ?? null)
    } catch (err) {
      setError(getFriendlyError(err, 'Could not upload the document.'))
    } finally {
      setUploading(false)
    }
  }

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!canSubmit) return
    setBusy(true); setError(null)
    try {
      const { data } = await apiClient.post<{ request: ChangeRequest; codeSentTo: string | null }>('/seller/profile-changes', {
        field: field.field, newValue, reasonCode, reasonNote: reasonNote.trim() || undefined,
        currentPassword: password, supportingDocUrl: docUrl ?? undefined,
      })
      setRequest(data.request)
      setPassword('')
      if (isReview) {
        setStep('done')
        onFinished()
      } else {
        setCodeSentTo(data.codeSentTo)
        setResendIn(60)
        setStep('code')
        onFinished()
        requestAnimationFrame(() => codeRef.current?.focus())
      }
    } catch (err) {
      setError(getFriendlyError(err, 'Could not submit this change.'))
    } finally {
      setBusy(false)
    }
  }

  const verify = async (value: string) => {
    if (!request || value.length !== CODE_LENGTH || attempted.current === value) return
    attempted.current = value
    setBusy(true); setError(null)
    try {
      const { data } = await apiClient.post<{ updated: string[]; access_token?: string }>(
        `/seller/profile-changes/${request.id}/verify`, { code: value },
      )
      if (data.access_token) storeNewSession(data.access_token, request.newValue)
      setUpdated(data.updated ?? [])
      setStep('done')
      onFinished()
    } catch (err) {
      setError(getFriendlyError(err, 'Could not verify the code.'))
      setCode('')
      attempted.current = null
      requestAnimationFrame(() => codeRef.current?.focus())
    } finally {
      setBusy(false)
    }
  }

  const onCodeChange = (raw: string) => {
    const value = raw.replace(/\D/g, '').slice(0, CODE_LENGTH)
    setCode(value)
    if (error) setError(null)
    if (value.length === CODE_LENGTH) void verify(value) // auto-verify on the last digit
  }

  const resend = async () => {
    if (!request) return
    setError(null)
    try {
      const { data } = await apiClient.post<{ codeSentTo: string }>(`/seller/profile-changes/${request.id}/resend`)
      setCodeSentTo(data.codeSentTo)
      setResendIn(60)
    } catch (err) {
      setError(getFriendlyError(err, 'Could not send a new code.'))
    }
  }

  return (
    <Dialog open onOpenChange={(open) => { if (!open) onClose() }}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>
            {step === 'done' ? (isReview ? 'Request submitted' : 'Change confirmed') : `${isReview ? 'Request a change to' : 'Change'} your ${field.label.toLowerCase()}`}
          </DialogTitle>
          {step === 'form' && <DialogDescription>{field.process}</DialogDescription>}
        </DialogHeader>

        {error && <p className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive" role="alert">{error}</p>}

        {step === 'form' && (
          <form onSubmit={submit} className="space-y-4">
            <div className="rounded-lg bg-muted/50 px-3 py-2 text-sm">
              <span className="text-muted-foreground">Current: </span>
              <span className="font-medium">{currentValue || '—'}</span>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="pc-new">New {field.label.toLowerCase()}</Label>
              {field.field === 'BUSINESS_ADDRESS' ? (
                <Textarea id="pc-new" rows={2} value={newValue} onChange={(e) => setNewValue(e.target.value)} placeholder={PLACEHOLDERS[field.field]} required />
              ) : (
                <Input id="pc-new" type={INPUT_TYPES[field.field] ?? 'text'} value={newValue} onChange={(e) => setNewValue(e.target.value)} placeholder={PLACEHOLDERS[field.field]} autoComplete="off" required />
              )}
            </div>

            <div className="space-y-1.5">
              <Label>Reason for the change</Label>
              <Select value={reasonCode} onValueChange={setReasonCode}>
                <SelectTrigger><SelectValue placeholder="Choose a reason" /></SelectTrigger>
                <SelectContent>
                  {field.reasons.map((r) => <SelectItem key={r.code} value={r.code}>{r.label}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="pc-note">
                {needsNote ? 'Please explain' : 'Additional details'}{' '}
                <span className="font-normal text-muted-foreground">{needsNote ? '(required)' : '(optional)'}</span>
              </Label>
              <Textarea id="pc-note" rows={2} maxLength={500} value={reasonNote} onChange={(e) => setReasonNote(e.target.value)}
                placeholder={needsNote ? 'Tell us why you need this change (at least 10 characters)' : 'Anything the reviewer should know'} />
            </div>

            {isReview && (
              <div className="space-y-1.5">
                <Label>Supporting document <span className="font-normal text-muted-foreground">(optional, recommended)</span></Label>
                {docUrl ? (
                  <div className="flex items-center justify-between rounded-md border px-3 py-2 text-sm">
                    <a href={docUrl} target="_blank" rel="noreferrer" className="flex items-center gap-2 truncate text-primary underline-offset-2 hover:underline">
                      <Paperclip className="h-4 w-4" /> Document attached
                    </a>
                    <button type="button" className="text-xs text-muted-foreground hover:text-foreground" onClick={() => setDocUrl(null)}>Remove</button>
                  </div>
                ) : (
                  <label className="flex cursor-pointer items-center gap-2 rounded-md border border-dashed px-3 py-3 text-sm text-muted-foreground hover:bg-muted/40">
                    {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Paperclip className="h-4 w-4" />}
                    {uploading ? 'Uploading…' : 'Attach a photo or scan (image, up to 10 MB)'}
                    <input type="file" accept="image/*" className="sr-only" disabled={uploading}
                      onChange={(e) => { const f = e.target.files?.[0]; if (f) void upload(f); e.target.value = '' }} />
                  </label>
                )}
              </div>
            )}

            <div className="space-y-1.5">
              <Label htmlFor="pc-password">Current password</Label>
              <Input id="pc-password" type="password" autoComplete="current-password" value={password} onChange={(e) => setPassword(e.target.value)} required />
              <p className="text-xs text-muted-foreground">For your security, confirm it&apos;s you before changing account details.</p>
            </div>

            <div className="rounded-lg border bg-muted/30 px-3 py-2.5 text-xs text-muted-foreground">
              <p className="mb-1 font-medium text-foreground">Once {isReview ? 'approved' : 'confirmed'}, this updates:</p>
              <ul className="list-disc space-y-0.5 pl-4">{field.updates.map((u) => <li key={u}>{u}</li>)}</ul>
            </div>

            <DialogFooter className="gap-2">
              <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
              <Button type="submit" disabled={!canSubmit}>
                {busy && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {isReview ? 'Submit for review' : 'Send verification code'}
              </Button>
            </DialogFooter>
          </form>
        )}

        {step === 'code' && request && (
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              {codeSentTo
                ? <>We sent a 6-digit code to <span className="font-medium text-foreground">{codeSentTo}</span>.</>
                : <>Enter the 6-digit code we emailed you for request <span className="font-medium text-foreground">{request.reference}</span>.</>}
              {' '}It expires in 10 minutes.
            </p>
            {field.channel === 'OTP_CURRENT_EMAIL' && (
              <p className="flex items-start gap-2 rounded-md bg-muted/50 px-3 py-2 text-xs text-muted-foreground">
                <Info className="mt-0.5 h-3.5 w-3.5 flex-shrink-0" />
                The code goes to your login email to confirm it&apos;s really you making this change.
              </p>
            )}
            <Input
              ref={codeRef}
              autoFocus
              inputMode="numeric"
              autoComplete="one-time-code"
              aria-label="Verification code"
              maxLength={CODE_LENGTH}
              value={code}
              disabled={busy}
              onChange={(e) => onCodeChange(e.target.value)}
              placeholder="000000"
              className="h-14 text-center font-mono text-2xl tracking-[0.45em]"
            />
            <p className="text-center text-xs text-muted-foreground">We&apos;ll confirm automatically once all {CODE_LENGTH} digits are in.</p>
            <div className="flex items-center justify-between text-sm">
              <button type="button" disabled={resendIn > 0} onClick={resend}
                className="text-primary disabled:cursor-not-allowed disabled:text-muted-foreground">
                {resendIn > 0 ? `Resend code in ${resendIn}s` : 'Resend code'}
              </button>
              <Button size="sm" disabled={busy || code.length !== CODE_LENGTH} onClick={() => { attempted.current = null; void verify(code) }}>
                {busy && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}Confirm
              </Button>
            </div>
          </div>
        )}

        {step === 'done' && request && (
          <div className="space-y-4">
            <div className="flex items-start gap-3 rounded-lg bg-emerald-50 px-4 py-3 text-sm text-emerald-800 dark:bg-emerald-900/20 dark:text-emerald-300">
              <CheckCircle2 className="mt-0.5 h-5 w-5 flex-shrink-0" />
              <div>
                {isReview ? (
                  <p>Your request was sent to the Quza team. We&apos;ll email you when it&apos;s reviewed — usually within 1–2 business days.</p>
                ) : (
                  <p>Your {field.label.toLowerCase()} is now <span className="font-semibold">{request.newValue}</span>.</p>
                )}
                <p className="mt-1 text-xs opacity-80">Reference: <span className="font-mono font-semibold">{request.reference}</span></p>
              </div>
            </div>
            {updated.length > 0 && (
              <div className="text-sm">
                <p className="mb-1 font-medium">Updated in:</p>
                <ul className="list-disc space-y-0.5 pl-5 text-muted-foreground">{updated.map((u) => <li key={u}>{u}</li>)}</ul>
              </div>
            )}
            {field.field === 'EMAIL' && !isReview && (
              <p className="text-xs text-muted-foreground">Use your new email the next time you sign in. We&apos;ve let your old address know about this change.</p>
            )}
            <DialogFooter><Button onClick={onClose}>Done</Button></DialogFooter>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}

/** After an email change the backend issues a new token (the JWT carries the email). */
function storeNewSession(token: string, newEmail: string) {
  if (typeof window === 'undefined') return
  sessionStorage.setItem('access_token', token)
  document.cookie = `access_token=${token}; path=/; SameSite=Lax;`
  try {
    const user = JSON.parse(sessionStorage.getItem('user') ?? 'null')
    if (user) sessionStorage.setItem('user', JSON.stringify({ ...user, email: newEmail }))
  } catch { /* ignore malformed cache */ }
}

// ---------------------------------------------------------------------------
// History
// ---------------------------------------------------------------------------

function RequestHistory({
  requests, fields, cancelling, onCancel, onResume,
}: {
  requests: ChangeRequest[]
  fields: FieldDefinition[]
  cancelling: string | null
  onCancel: (r: ChangeRequest) => void
  onResume: (r: ChangeRequest) => void
}) {
  const [expanded, setExpanded] = React.useState(false)
  if (requests.length === 0) return null
  const labelFor = (r: ChangeRequest) => fields.find((f) => f.field === r.field)
  const visible = expanded ? requests : requests.slice(0, 3)

  return (
    <Card>
      <CardHeader className="pb-4">
        <SectionTitle icon={History} title="Change requests" subtitle="A record of every change to your account details. Quote the reference if you contact support." />
      </CardHeader>
      <CardContent>
        <ul className="divide-y">
          {visible.map((r) => {
            const def = labelFor(r)
            const reason = def?.reasons.find((x) => x.code === r.reasonCode)?.label ?? r.reasonCode
            return (
              <li key={r.id} className="flex flex-col gap-2 py-3 first:pt-0 last:pb-0 sm:flex-row sm:items-start sm:justify-between">
                <div className="min-w-0 space-y-0.5 text-sm">
                  <p className="flex flex-wrap items-center gap-2">
                    <span className="font-medium">{def?.label ?? r.field}</span>
                    <StatusBadge status={r.status} />
                    <span className="font-mono text-xs text-muted-foreground">{r.reference}</span>
                  </p>
                  <p className="truncate text-muted-foreground">
                    {r.oldValue || '—'} → <span className="text-foreground">{r.newValue}</span>
                  </p>
                  <p className="text-xs text-muted-foreground">{reason}{r.reasonNote ? ` — “${r.reasonNote}”` : ''} · {formatDate(r.createdAt)}</p>
                  {r.reviewNote && (
                    <p className={cn('mt-1 rounded-md px-2 py-1 text-xs', r.status === 'REJECTED' ? 'bg-red-50 text-red-700 dark:bg-red-900/20 dark:text-red-300' : 'bg-muted text-muted-foreground')}>
                      Reviewer: {r.reviewNote}
                    </p>
                  )}
                </div>
                {OPEN.includes(r.status) && (
                  <div className="flex flex-shrink-0 gap-2">
                    {r.status === 'PENDING_VERIFICATION' && <Button size="sm" variant="outline" onClick={() => onResume(r)}>Enter code</Button>}
                    <Button size="sm" variant="ghost" disabled={cancelling === r.id} onClick={() => onCancel(r)}>
                      {cancelling === r.id ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Cancel'}
                    </Button>
                  </div>
                )}
              </li>
            )
          })}
        </ul>
        {requests.length > 3 && (
          <button type="button" onClick={() => setExpanded((v) => !v)} className="mt-3 w-full rounded-md py-1.5 text-sm font-medium text-primary hover:bg-muted/50">
            {expanded ? 'Show less' : `Show all ${requests.length} requests`}
          </button>
        )}
      </CardContent>
    </Card>
  )
}

// ---------------------------------------------------------------------------
// Small helpers
// ---------------------------------------------------------------------------

function SectionTitle({ icon: Icon, title, subtitle }: { icon: React.ComponentType<{ className?: string }>; title: string; subtitle: string }) {
  return (
    <div className="flex items-center gap-3">
      <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
        <Icon className="h-4 w-4" />
      </div>
      <div>
        <CardTitle className="text-base">{title}</CardTitle>
        <p className="mt-0.5 text-sm text-muted-foreground">{subtitle}</p>
      </div>
    </div>
  )
}

function StatusBadge({ status }: { status: Status }) {
  const s = STATUS_STYLES[status]
  const Icon = s.icon
  return (
    <span className={cn('inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-semibold', s.className)}>
      <Icon className="h-3 w-3" />{s.label}
    </span>
  )
}

function ChannelHint({ channel }: { channel: Channel }) {
  const review = channel === 'ADMIN_REVIEW'
  return (
    <span className="hidden items-center gap-1 text-xs text-muted-foreground md:inline-flex" title={review ? 'Reviewed by the Quza team' : 'Confirmed with a one-time code'}>
      {review ? <ShieldCheck className="h-3.5 w-3.5" /> : <KeyRound className="h-3.5 w-3.5" />}
      {review ? 'Reviewed' : 'Code'}
    </span>
  )
}
