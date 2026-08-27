/*
 * API Client - Configured axios instance with interceptors
 * Handles authentication tokens and error responses
 */

import axios from 'axios'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000'

export const apiClient = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true,
})

/**
 * Maps an API error to a safe, user-friendly message.
 * Raw server details (stack traces, internal messages) never reach the UI.
 * The original error is always logged to the console for developers.
 */
export function getFriendlyError(
  err: any,
  fallback = 'Something went wrong. Please try again.',
  context?: 'login' | 'register' | 'kyc' | 'general',
): string {
  const status: number | undefined = err?.response?.status
  // Surface backend validation messages when they are safe to show (4xx client errors).
  // The backend sends a human-readable `message` field for things like
  // "Password must be at least 8 characters" — pass those straight through.
  const backendMessage: string | undefined = err?.response?.data?.message

  if (process.env.NODE_ENV !== 'production') {
    console.error('[API Error]', err)
  } else {
    console.error('[API Error]', status, err?.config?.url)
  }

  switch (status) {
    case 400:
      // Prefer the backend's own validation message (e.g. "Password must be at
      // least 8 characters") over the generic fallback.
      if (backendMessage) return backendMessage
      return context === 'register'
        ? 'Please fill in all required fields correctly.'
        : 'Please check your details and try again.'
    case 401:
      return context === 'register'
        ? 'Registration failed. Please try again.'
        : 'Incorrect email or password.'
    case 403:
      return "You don't have permission to do that."
    case 404:
      return context === 'kyc'
        ? 'Verification record not found. Please submit your details.'
        : 'The requested resource was not found.'
    case 409:
      return context === 'register'
        ? 'An account with this email already exists. Try signing in instead.'
        : 'This record already exists.'
    case 422:
      // 422 Unprocessable Entity also carries validation detail from the backend.
      if (backendMessage) return backendMessage
      return 'Please check your details and try again.'
    case 429:
      return 'Too many attempts. Please wait a moment and try again.'
    case 500:
    case 502:
    case 503:
      return 'Our servers are having trouble right now. Please try again shortly.'
    default:
      return fallback
  }
}

// Request interceptor — attach token from sessionStorage to every request
apiClient.interceptors.request.use(
  (config) => {
    if (typeof window !== 'undefined') {
      const token = sessionStorage.getItem('access_token')
      if (token) {
        config.headers.Authorization = `Bearer ${token}`
      }
    }
    return config
  },
  (error) => Promise.reject(error)
)

/**
 * Wipes all auth and KYC session state in one place.
 *
 * Call this on logout, on a fresh login (before storing the new token), and
 * whenever a 401 invalidates the current session. Keeping it centralised
 * means the kyc_status cache is never left behind when credentials change —
 * which would let a stale REJECTED/PENDING status bypass the dashboard guard.
 */
export function clearAuthSession() {
  if (typeof window === 'undefined') return
  sessionStorage.removeItem('access_token')
  sessionStorage.removeItem('user')
  sessionStorage.removeItem('kyc_status')
  sessionStorage.removeItem('kyc_status_timestamp')
  document.cookie = 'access_token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT; SameSite=Lax;'
}

// Response interceptor — propagate errors to callers.
//
// We intentionally do NOT redirect on 401 here. Every page that needs
// authentication already handles 401 in its own catch block (dashboard
// layout, KYCGuard, etc.). A global hard redirect via window.location.href
// caused the flash-then-login-redirect bug because it fired before React
// could finish rendering the guarded page.
//
// The only thing we do here is clear credentials so stale tokens aren't
// re-used on the next request.
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401 && typeof window !== 'undefined') {
      clearAuthSession()
      // Do NOT redirect here — let the calling code decide where to send the user.
    }
    return Promise.reject(error)
  }
)
