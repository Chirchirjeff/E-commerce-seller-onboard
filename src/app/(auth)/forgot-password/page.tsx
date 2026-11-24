/*
 * Forgot Password Page - code-based password reset for sellers
 *
 *   1. Email        → POST /auth/password-reset/request  (same answer whether or not the account exists)
 *   2. 6-digit code → POST /auth/password-reset/verify   (auto-submits once 6 digits are entered)
 *   3. New password → POST /auth/password-reset/confirm
 *
 * On success the seller is sent back to /login?email=…&reset=1 to sign in
 * normally. The access_token returned by /confirm is deliberately NOT used:
 * seller login has its own routing (/verify → KYC status) that must run.
 */

'use client'

import * as React from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { KeyRound, Loader2, ArrowLeft, MailCheck } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { PasswordInput } from '@/components/ui/password-input'
import { Label } from '@/components/ui/label'
import { apiClient, getFriendlyError, clearAuthSession } from '@/lib/api-client'
import { cn } from '@/lib/utils'

type Step = 'email' | 'code' | 'password'

const CODE_LENGTH = 6
const RESEND_COOLDOWN_SECONDS = 60
const PASSWORD_MIN_LENGTH = 8

export default function ForgotPasswordPage() {
  // useSearchParams() needs a Suspense boundary so the page can still be prerendered.
  return (
    <React.Suspense fallback={null}>
      <ForgotPasswordFlow />
    </React.Suspense>
  )
}

function ForgotPasswordFlow() {
  const router = useRouter()
  const searchParams = useSearchParams()

  const [step, setStep] = React.useState<Step>('email')
  const [email, setEmail] = React.useState(() => searchParams.get('email') ?? '')
  const [code, setCode] = React.useState('')
  const [password, setPassword] = React.useState('')
  const [confirmPassword, setConfirmPassword] = React.useState('')
  const [isLoading, setIsLoading] = React.useState(false)
  const [isResending, setIsResending] = React.useState(false)
  const [error, setError] = React.useState('')
  const [notice, setNotice] = React.useState('')
  const [expiresInMinutes, setExpiresInMinutes] = React.useState(15)

  // Resend cooldown: timestamp (ms) after which "Resend code" is enabled again.
  const [resendAvailableAt, setResendAvailableAt] = React.useState(0)
  const [now, setNow] = React.useState(() => Date.now())
  const secondsLeft = Math.max(0, Math.ceil((resendAvailableAt - now) / 1000))

  React.useEffect(() => {
    if (resendAvailableAt <= Date.now()) return
    const id = window.setInterval(() => {
      const t = Date.now()
      setNow(t)
      if (t >= resendAvailableAt) window.clearInterval(id)
    }, 1000)
    return () => window.clearInterval(id)
  }, [resendAvailableAt])

  const normalizedEmail = email.trim()

  const sendCode = async () => {
    const { data } = await apiClient.post<{ message: string; expiresInSeconds?: number }>(
      '/auth/password-reset/request',
      { email: normalizedEmail },
    )
    if (data?.expiresInSeconds) setExpiresInMinutes(Math.max(1, Math.round(data.expiresInSeconds / 60)))
    const t = Date.now()
    setNow(t)
    setResendAvailableAt(t + RESEND_COOLDOWN_SECONDS * 1000)
  }

  const handleRequest = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!normalizedEmail) return
    setIsLoading(true)
    setError('')
    setNotice('')
    try {
      await sendCode()
      setCode('')
      setStep('code')
    } catch (err) {
      setError(getFriendlyError(err, 'We could not send a reset code. Please try again.'))
    } finally {
      setIsLoading(false)
    }
  }

  const handleResend = async () => {
    if (secondsLeft > 0 || isResending) return
    setIsResending(true)
    setError('')
    setNotice('')
    try {
      await sendCode()
      setCode('')
      setNotice(`We sent a new code to ${normalizedEmail}.`)
    } catch (err) {
      setError(getFriendlyError(err, 'We could not resend the code. Please try again.'))
    } finally {
      setIsResending(false)
    }
  }

  const verifyCode = async (value: string) => {
    if (value.length !== CODE_LENGTH || isLoading) return
    setIsLoading(true)
    setError('')
    setNotice('')
    try {
      await apiClient.post('/auth/password-reset/verify', { email: normalizedEmail, code: value })
      setStep('password')
    } catch (err) {
      setError(getFriendlyError(err, 'The reset code is invalid or has expired.'))
      setCode('')
    } finally {
      setIsLoading(false)
    }
  }

  const handleCodeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const digits = e.target.value.replace(/\D/g, '').slice(0, CODE_LENGTH)
    setCode(digits)
    if (error) setError('')
    // Auto-verify as soon as the full code is entered (typed, pasted or autofilled).
    if (digits.length === CODE_LENGTH) void verifyCode(digits)
  }

  const handleCodeSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    void verifyCode(code)
  }

  const handleUseDifferentEmail = () => {
    setStep('email')
    setCode('')
    setError('')
    setNotice('')
    setResendAvailableAt(0)
  }

  const handleConfirm = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    if (password.length < PASSWORD_MIN_LENGTH) {
      setError(`Password must be at least ${PASSWORD_MIN_LENGTH} characters.`)
      return
    }
    if (password !== confirmPassword) {
      setError('Passwords do not match.')
      return
    }
    setIsLoading(true)
    try {
      await apiClient.post('/auth/password-reset/confirm', {
        email: normalizedEmail,
        code,
        password,
      })
      // Don't sign in with the returned token — send the seller through the
      // normal login so /verify can route them by KYC status. Drop any stale
      // session so the login page doesn't bounce them away.
      clearAuthSession()
      router.replace(`/login?email=${encodeURIComponent(normalizedEmail)}&reset=1`)
    } catch (err) {
      const message = getFriendlyError(err, 'We could not reset your password. Please try again.')
      const status = (err as { response?: { status?: number } })?.response?.status
      if (status === 400 && /code/i.test(message)) {
        // The code expired (or was used up) between steps — ask for a new one.
        setStep('code')
        setCode('')
        setPassword('')
        setConfirmPassword('')
        setError(`${message} Request a new code below.`)
      } else {
        setError(message)
      }
      setIsLoading(false)
    }
  }

  const description =
    step === 'email'
      ? "Enter the email you use to sign in and we'll send you a 6-digit code."
      : step === 'code'
        ? `Enter the 6-digit code we sent to ${normalizedEmail}`
        : 'Choose a new password for your account.'

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-background to-primary/5 p-4">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 h-80 w-80 rounded-full bg-primary/5 blur-3xl" />
        <div className="absolute -bottom-40 -left-40 h-80 w-80 rounded-full bg-primary/5 blur-3xl" />
      </div>

      <Card className="w-full max-w-md relative z-10 shadow-2xl border-primary/10">
        <CardHeader className="space-y-1 text-center">
          <div className="flex justify-center mb-4">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10 text-primary ring-1 ring-primary/20">
              {step === 'code' ? <MailCheck className="h-8 w-8" /> : <KeyRound className="h-8 w-8" />}
            </div>
          </div>
          <CardTitle className="text-2xl font-bold tracking-tight">
            {step === 'password' ? 'Set a new password' : 'Reset your password'}
          </CardTitle>
          <CardDescription className="break-words">{description}</CardDescription>
        </CardHeader>

        {step === 'email' && (
          <form onSubmit={handleRequest}>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  autoComplete="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className={cn(error && 'border-red-500')}
                  required
                  autoFocus
                  disabled={isLoading}
                />
              </div>
              {error && <ErrorBox message={error} />}
            </CardContent>
            <CardFooter className="flex flex-col space-y-4">
              <Button type="submit" className="w-full" disabled={isLoading || !normalizedEmail}>
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Sending code...
                  </>
                ) : (
                  'Send code'
                )}
              </Button>
              <BackToLogin email={normalizedEmail} />
            </CardFooter>
          </form>
        )}

        {step === 'code' && (
          <form onSubmit={handleCodeSubmit}>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="code">Reset code</Label>
                <Input
                  id="code"
                  type="text"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  autoComplete="one-time-code"
                  maxLength={CODE_LENGTH}
                  value={code}
                  onChange={handleCodeChange}
                  className={cn('text-center text-lg font-semibold tracking-[0.5em]', error && 'border-red-500')}
                  aria-describedby="code-help"
                  required
                  autoFocus
                  disabled={isLoading}
                />
                <p id="code-help" className="text-xs text-muted-foreground">
                  The code expires in {expiresInMinutes} minutes. Check your spam folder if you can&apos;t find it.
                </p>
              </div>

              {notice && !error && (
                <div role="status" className="rounded-md bg-primary/10 p-3 text-sm text-primary">
                  {notice}
                </div>
              )}
              {error && <ErrorBox message={error} />}

              <div className="flex flex-wrap items-center justify-between gap-2 text-sm">
                <button
                  type="button"
                  onClick={handleResend}
                  disabled={secondsLeft > 0 || isResending || isLoading}
                  className="text-primary hover:underline disabled:cursor-not-allowed disabled:text-muted-foreground disabled:no-underline"
                >
                  {isResending
                    ? 'Sending...'
                    : secondsLeft > 0
                      ? `Resend code in ${secondsLeft}s`
                      : 'Resend code'}
                </button>
                <button
                  type="button"
                  onClick={handleUseDifferentEmail}
                  disabled={isLoading}
                  className="text-muted-foreground hover:text-primary transition-colors disabled:cursor-not-allowed disabled:opacity-50"
                >
                  Use a different email
                </button>
              </div>
            </CardContent>
            <CardFooter className="flex flex-col space-y-4">
              <Button type="submit" className="w-full" disabled={isLoading || code.length !== CODE_LENGTH}>
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Checking code...
                  </>
                ) : (
                  'Verify code'
                )}
              </Button>
              <BackToLogin email={normalizedEmail} />
            </CardFooter>
          </form>
        )}

        {step === 'password' && (
          <form onSubmit={handleConfirm}>
            <CardContent className="space-y-4">
              {/* Lets password managers associate the new password with the account. */}
              <input type="email" name="email" autoComplete="username" value={normalizedEmail} readOnly hidden />
              <div className="space-y-2">
                <Label htmlFor="new-password">New password</Label>
                <PasswordInput
                  id="new-password"
                  autoComplete="new-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className={cn(error && 'border-red-500')}
                  minLength={PASSWORD_MIN_LENGTH}
                  required
                  autoFocus
                  disabled={isLoading}
                />
                <p className="text-xs text-muted-foreground">Must be at least {PASSWORD_MIN_LENGTH} characters</p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="confirm-password">Confirm new password</Label>
                <PasswordInput
                  id="confirm-password"
                  autoComplete="new-password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className={cn(error && 'border-red-500')}
                  required
                  disabled={isLoading}
                />
              </div>
              {error && <ErrorBox message={error} />}
            </CardContent>
            <CardFooter className="flex flex-col space-y-4">
              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Saving password...
                  </>
                ) : (
                  'Change password'
                )}
              </Button>
              <BackToLogin email={normalizedEmail} />
            </CardFooter>
          </form>
        )}
      </Card>
    </div>
  )
}

function ErrorBox({ message }: { message: string }) {
  return (
    <div role="alert" className="rounded-md bg-red-500/10 p-3 text-sm text-red-500">
      {message}
    </div>
  )
}

function BackToLogin({ email }: { email: string }) {
  const href = email ? `/login?email=${encodeURIComponent(email)}` : '/login'
  return (
    <Link
      href={href}
      className="inline-flex items-center justify-center gap-1 text-sm text-muted-foreground hover:text-primary transition-colors"
    >
      <ArrowLeft className="h-4 w-4" />
      Back to sign in
    </Link>
  )
}
