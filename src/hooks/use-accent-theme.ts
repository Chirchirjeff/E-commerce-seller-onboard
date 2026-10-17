'use client'

/*
 * useAccentTheme — manages the seller's chosen accent colour.
 *
 * How it works:
 *   • The accent name is stored in localStorage under 'seller-accent'.
 *   • On every call it ensures document.documentElement has the matching
 *     data-accent attribute, which activates the CSS variable overrides
 *     defined in globals.css.
 *   • Reading from localStorage happens synchronously inside a useEffect
 *     (client-only) so there is no SSR mismatch.
 *   • The ThemeProvider calls applyAccent() directly before React hydrates
 *     via an inline <script> to eliminate the first-paint flash.
 */

import * as React from 'react'

export type AccentName =
  | 'blue'
  | 'purple'
  | 'violet'
  | 'rose'
  | 'orange'
  | 'amber'
  | 'green'
  | 'teal'
  | 'slate'

export const ACCENT_STORAGE_KEY = 'seller-accent'
export const DEFAULT_ACCENT: AccentName = 'blue'

/** All available accents with display metadata */
export const ACCENT_PALETTES: {
  name: AccentName
  label: string
  /** A representative hex swatch colour (approximates the CSS hsl value) */
  swatch: string
  swatchDark: string
}[] = [
  { name: 'blue',   label: 'Blue',    swatch: '#3b82f6', swatchDark: '#60a5fa' },
  { name: 'purple', label: 'Purple',  swatch: '#9333ea', swatchDark: '#a855f7' },
  { name: 'violet', label: 'Violet',  swatch: '#7c3aed', swatchDark: '#8b5cf6' },
  { name: 'rose',   label: 'Rose',    swatch: '#e11d48', swatchDark: '#fb7185' },
  { name: 'orange', label: 'Orange',  swatch: '#f97316', swatchDark: '#fb923c' },
  { name: 'amber',  label: 'Amber',   swatch: '#f59e0b', swatchDark: '#fbbf24' },
  { name: 'green',  label: 'Green',   swatch: '#16a34a', swatchDark: '#4ade80' },
  { name: 'teal',   label: 'Teal',    swatch: '#0d9488', swatchDark: '#2dd4bf' },
  { name: 'slate',  label: 'Slate',   swatch: '#64748b', swatchDark: '#94a3b8' },
]

/** Apply an accent immediately — safe to call outside React (e.g. in a script tag) */
export function applyAccent(name: AccentName) {
  if (typeof document === 'undefined') return
  document.documentElement.setAttribute('data-accent', name)
}

/** Read the stored accent (falls back to default if nothing saved) */
export function readStoredAccent(): AccentName {
  if (typeof window === 'undefined') return DEFAULT_ACCENT
  return (localStorage.getItem(ACCENT_STORAGE_KEY) as AccentName) ?? DEFAULT_ACCENT
}

/** Persist and apply an accent */
export function saveAccent(name: AccentName) {
  if (typeof window === 'undefined') return
  localStorage.setItem(ACCENT_STORAGE_KEY, name)
  applyAccent(name)
}

// ---------------------------------------------------------------------------
// React hook
// ---------------------------------------------------------------------------

export function useAccentTheme() {
  const [accent, setAccentState] = React.useState<AccentName>(DEFAULT_ACCENT)
  const [mounted, setMounted] = React.useState(false)

  // Read stored value on mount and apply it
  React.useEffect(() => {
    const stored = readStoredAccent()
    setAccentState(stored)
    applyAccent(stored)
    setMounted(true)
  }, [])

  function setAccent(name: AccentName) {
    saveAccent(name)
    setAccentState(name)
  }

  return { accent, setAccent, mounted, palettes: ACCENT_PALETTES }
}
