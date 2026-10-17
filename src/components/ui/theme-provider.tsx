'use client'

import * as React from 'react'
import { ThemeProvider as NextThemesProvider } from 'next-themes'
import { ACCENT_STORAGE_KEY, DEFAULT_ACCENT } from '@/hooks/use-accent-theme'

/**
 * ThemeProvider wraps next-themes and also applies the seller's saved accent
 * colour on first render.  We inject a tiny inline script into <head> via
 * dangerouslySetInnerHTML so the data-accent attribute is set *before* the
 * browser paints — eliminating the flash of unstyled accent on hard reload.
 *
 * The script reads localStorage synchronously (no await, no React) and sets
 * document.documentElement.setAttribute('data-accent', <name>).
 */

// Inline script that runs synchronously before first paint
const ANTI_FLASH_SCRIPT = `
(function(){
  try {
    var a = localStorage.getItem('${ACCENT_STORAGE_KEY}') || '${DEFAULT_ACCENT}';
    document.documentElement.setAttribute('data-accent', a);
  } catch(e){}
})();
`

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  return (
    <>
      {/* Inject before anything else renders to avoid accent flash */}
      <script
        dangerouslySetInnerHTML={{ __html: ANTI_FLASH_SCRIPT }}
        suppressHydrationWarning
      />
      <NextThemesProvider
        attribute="class"
        defaultTheme="system"
        enableSystem
        disableTransitionOnChange
      >
        {children}
      </NextThemesProvider>
    </>
  )
}
