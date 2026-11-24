/**
 * PhoneInput — Kenyan phone number input
 *
 * Rules:
 *   - Always prefixed with +254 (shown as a locked prefix)
 *   - User types the local number: 07XXXXXXXX or 01XXXXXXXX (10 digits)
 *   - Leading zero is stripped automatically → stored as +2547XXXXXXXX or +2541XXXXXXXX
 *   - Accepts exactly 9 digits after the country code (the 10-digit local number minus the leading 0)
 *   - Valid prefixes after stripping 0: 7XX or 1XX
 */

'use client'

import * as React from 'react'
import { cn } from '@/lib/utils'

interface PhoneInputProps {
  value: string            // always the full E.164 value: +254XXXXXXXXX
  onChange: (e164: string) => void
  disabled?: boolean
  id?: string
  required?: boolean
  className?: string
}

/** Convert whatever the user typed into a normalised E.164 string (+254XXXXXXXXX). */
function toE164(raw: string): string {
  // Strip everything except digits
  const digits = raw.replace(/\D/g, '')

  if (!digits) return '+254'

  // If they somehow typed the country code themselves, strip the leading 254
  const local = digits.startsWith('254')
    ? digits.slice(3)
    : digits.startsWith('0')
    ? digits.slice(1)
    : digits

  return '+254' + local
}

/** Pull just the local part (after +254) to show in the input box. */
function toLocalDisplay(e164: string): string {
  if (!e164.startsWith('+254')) return e164
  const local = e164.slice(4) // digits after +254
  // Re-add the leading 0 so it matches what the user expects to type
  return local ? '0' + local : ''
}

/** Validate a full E.164 Kenyan number. Returns an error string or ''. */
export function validateKenyanPhone(e164: string): string {
  if (!e164 || e164 === '+254') return 'Phone number is required'

  const digits = e164.replace(/\D/g, '')

  // Must be 254 + 9 digits = 12 digits total
  if (!digits.startsWith('254')) return 'Invalid phone number'

  const local = digits.slice(3) // 9 digits expected

  if (local.length !== 9) {
    return local.length < 9
      ? `Phone number is too short — ${9 - local.length} digit${9 - local.length === 1 ? '' : 's'} missing`
      : 'Phone number is too long'
  }

  // After stripping the leading 0, valid Kenyan prefixes are 7XX and 1XX
  if (!/^[71]/.test(local)) {
    return 'Enter a valid Safaricom/Airtel number starting with 07 or 01'
  }

  return ''
}

export function PhoneInput({
  value,
  onChange,
  disabled,
  id,
  required,
  className,
}: PhoneInputProps) {
  const [localText, setLocalText] = React.useState(() => toLocalDisplay(value))
  const [touched, setTouched] = React.useState(false)

  // Keep display in sync when the parent resets the value (e.g. form reset)
  React.useEffect(() => {
    setLocalText(toLocalDisplay(value))
  }, [value])

  const error = touched ? validateKenyanPhone(value) : ''

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const raw = e.target.value

    // Allow only digits and a single leading zero
    const cleaned = raw.replace(/[^\d]/g, '').slice(0, 10) // max 10 chars (0 + 9 digits)
    const display = cleaned ? (cleaned.startsWith('0') ? cleaned : '0' + cleaned) : ''

    setLocalText(display)
    onChange(toE164(cleaned))
  }

  function handleBlur() {
    setTouched(true)
  }

  return (
    <div className="space-y-1">
      <div
        className={cn(
          'flex h-10 w-full rounded-md border border-input bg-background text-sm ring-offset-background',
          'focus-within:outline-none focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2',
          disabled && 'cursor-not-allowed opacity-50',
          error && touched && 'border-destructive focus-within:ring-destructive',
          className,
        )}
      >
        {/* Locked country-code prefix */}
        <span
          className="flex items-center pl-3 pr-2 text-muted-foreground select-none border-r border-input shrink-0"
          aria-hidden="true"
        >
          🇰🇪 +254
        </span>

        {/* Editable local part — user types 07XXXXXXXX */}
        <input
          id={id}
          type="tel"
          inputMode="numeric"
          autoComplete="tel"
          required={required}
          disabled={disabled}
          value={localText}
          onChange={handleChange}
          onBlur={handleBlur}
          className={cn(
            'flex-1 bg-transparent pl-3 pr-3 outline-none placeholder:text-muted-foreground',
            'disabled:cursor-not-allowed',
          )}
          aria-describedby={error ? `${id}-error` : undefined}
          aria-invalid={!!error}
        />
      </div>

      {error && touched && (
        <p id={`${id}-error`} className="text-xs text-destructive flex items-center gap-1">
          {error}
        </p>
      )}

      {!error && (
        <p className="text-xs text-muted-foreground">
          Kenyan number — enter 07XX XXX XXX or 01XX XXX XXX
        </p>
      )}
    </div>
  )
}
