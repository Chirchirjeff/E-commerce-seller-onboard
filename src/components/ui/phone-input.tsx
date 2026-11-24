/**
 * PhoneInput — Kenyan phone number input
 *
 * Rules:
 *   - Always prefixed with +254 (shown as a locked prefix)
 *   - User types the local number; a leading zero (07… / 01…) is dropped as they type
 *   - The box only ever holds the 9 digits after the country code: 7XXXXXXXX or 1XXXXXXXX
 *   - Stored as +2547XXXXXXXX or +2541XXXXXXXX
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

const LOCAL_LENGTH = 9

/**
 * Reduce whatever the user typed or pasted to the local part: digits only,
 * no country code, no leading zero, at most 9 digits.
 */
function toLocalDigits(raw: string): string {
  let digits = raw.replace(/\D/g, '')

  // A pasted full number (254712345678 / +254 712 345 678) — drop the country code
  if (digits.startsWith('254') && digits.length > LOCAL_LENGTH) {
    digits = digits.slice(3)
  }

  // Drop the leading zero(s): 0712345678 → 712345678
  digits = digits.replace(/^0+/, '')

  return digits.slice(0, LOCAL_LENGTH)
}

/** Pull just the local part (after +254) to show in the input box. */
function toLocalDisplay(e164: string): string {
  return toLocalDigits(e164)
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
    return 'Enter a valid number starting with 7 or 1'
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
    const local = toLocalDigits(e.target.value)

    setLocalText(local)
    onChange('+254' + local)
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

        {/* Editable local part — 9 digits, leading zero is dropped */}
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
    </div>
  )
}
