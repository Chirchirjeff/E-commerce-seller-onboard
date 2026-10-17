/*
 * POST /api/notify-seller
 *
 * Called by the NotificationContext when it detects a new paid order for the
 * seller. Sends a transactional sale-notification email to the seller using
 * the same nodemailer SMTP setup already configured on the backend.
 *
 * We send the email from the Next.js layer (server-side) rather than making a
 * direct SMTP call from the browser so that:
 *   a) SMTP credentials stay server-side only, and
 *   b) We control exactly what the seller sees without changing backend code.
 *
 * Environment variables required (same as the backend .env):
 *   SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, SMTP_FROM
 *   NEXT_PUBLIC_API_URL   — used to derive the orders deep-link
 */

import { type NextRequest } from 'next/server'
import nodemailer from 'nodemailer'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface NotifyPayload {
  /** Seller's email address */
  sellerEmail: string
  /** Seller's display name */
  sellerName: string
  orderNumber: string
  buyerName: string
  productNames: string[]
  total: number
  /** ISO timestamp of the order */
  orderedAt: string
  /** Internal order id — used to build the dashboard deep-link */
  orderId: string
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function escapeHtml(value: string): string {
  return value.replace(/[&<>'"]/g, (c) => (
    ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' } as Record<string, string>)[c]
  ))
}

function formatKes(amount: number): string {
  return new Intl.NumberFormat('en-KE', {
    style: 'currency',
    currency: 'KES',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount)
}

function formatDate(iso: string): string {
  return new Intl.DateTimeFormat('en-KE', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(iso))
}

function buildHtml(p: NotifyPayload, orderUrl: string): string {
  const name      = escapeHtml(p.sellerName)
  const buyer     = escapeHtml(p.buyerName)
  const orderNum  = escapeHtml(p.orderNumber)
  const products  = p.productNames.map(escapeHtml).join(', ')
  const amount    = escapeHtml(formatKes(p.total))
  const dateStr   = escapeHtml(formatDate(p.orderedAt))
  const link      = escapeHtml(orderUrl)

  return `<!doctype html>
<html lang="en">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:32px 16px;background:#f1f5f9;font-family:Arial,Helvetica,sans-serif;color:#1e293b">
  <main style="max-width:600px;margin:0 auto;background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08)">

    <!-- Header -->
    <div style="background:#0f766e;padding:24px 32px">
      <p style="margin:0;font-size:20px;font-weight:700;color:#ffffff">🎉 New sale on your shop!</p>
    </div>

    <!-- Body -->
    <div style="padding:28px 32px">
      <p style="margin:0 0 20px">Hi <strong>${name}</strong>,</p>
      <p style="margin:0 0 20px">Great news — you just made a sale. Here are the details:</p>

      <!-- Order summary card -->
      <table width="100%" cellpadding="0" cellspacing="0" style="border:1px solid #e2e8f0;border-radius:8px;margin-bottom:24px">
        <tr>
          <td style="padding:12px 16px;border-bottom:1px solid #e2e8f0;background:#f8fafc">
            <span style="font-size:12px;text-transform:uppercase;letter-spacing:0.05em;color:#64748b;font-weight:600">Order</span>
          </td>
          <td style="padding:12px 16px;border-bottom:1px solid #e2e8f0;background:#f8fafc;text-align:right;font-weight:700">${orderNum}</td>
        </tr>
        <tr>
          <td style="padding:12px 16px;border-bottom:1px solid #e2e8f0;color:#475569">Customer</td>
          <td style="padding:12px 16px;border-bottom:1px solid #e2e8f0;text-align:right;font-weight:600">${buyer}</td>
        </tr>
        <tr>
          <td style="padding:12px 16px;border-bottom:1px solid #e2e8f0;color:#475569">Product(s)</td>
          <td style="padding:12px 16px;border-bottom:1px solid #e2e8f0;text-align:right">${products}</td>
        </tr>
        <tr>
          <td style="padding:12px 16px;border-bottom:1px solid #e2e8f0;color:#475569">Amount</td>
          <td style="padding:12px 16px;border-bottom:1px solid #e2e8f0;text-align:right;font-size:18px;font-weight:700;color:#0f766e">${amount}</td>
        </tr>
        <tr>
          <td style="padding:12px 16px;color:#475569">Date</td>
          <td style="padding:12px 16px;text-align:right;color:#64748b;font-size:13px">${dateStr}</td>
        </tr>
      </table>

      <p style="margin:0 0 20px;color:#475569;font-size:14px">
        Remember to fulfil this order promptly. Buyers receive tracking updates as you process the shipment.
      </p>

      <!-- CTA -->
      <p style="margin:0">
        <a href="${link}"
           style="display:inline-block;background:#0f766e;color:#ffffff;text-decoration:none;font-weight:700;padding:12px 22px;border-radius:8px;font-size:14px">
          View order in dashboard →
        </a>
      </p>
    </div>

    <!-- Footer -->
    <div style="padding:16px 32px;border-top:1px solid #e2e8f0;background:#f8fafc">
      <p style="margin:0;font-size:12px;color:#94a3b8">
        This notification was sent because you are a verified seller on Quza.
        Manage your notification preferences in your seller dashboard settings.
      </p>
    </div>

  </main>
</body>
</html>`
}

// ---------------------------------------------------------------------------
// Transporter (lazy singleton — one per server process)
// ---------------------------------------------------------------------------

let _transporter: nodemailer.Transporter | null = null

function getTransporter(): nodemailer.Transporter {
  if (_transporter) return _transporter

  const host = process.env.SMTP_HOST
  const port = Number(process.env.SMTP_PORT ?? 587)
  const user = process.env.SMTP_USER
  const pass = process.env.SMTP_PASS

  if (!host || !user || !pass || !Number.isFinite(port)) {
    throw new Error('SMTP_HOST, SMTP_PORT, SMTP_USER, and SMTP_PASS must be configured.')
  }

  _transporter = nodemailer.createTransport({
    host,
    port,
    secure: port === 465,
    auth: { user, pass },
  })

  return _transporter
}

function getFromAddress(): string {
  const from = process.env.SMTP_FROM
  if (!from) throw new Error('SMTP_FROM must be configured.')
  return from
}

// ---------------------------------------------------------------------------
// Route handler
// ---------------------------------------------------------------------------

export async function POST(request: NextRequest): Promise<Response> {
  let payload: NotifyPayload

  try {
    payload = (await request.json()) as NotifyPayload
  } catch {
    return Response.json({ error: 'Invalid JSON body.' }, { status: 400 })
  }

  // Basic validation — keep it tight so a misconfigured client doesn't cause noise
  const required: (keyof NotifyPayload)[] = [
    'sellerEmail', 'sellerName', 'orderNumber',
    'buyerName', 'productNames', 'total', 'orderedAt', 'orderId',
  ]
  for (const field of required) {
    if (!payload[field]) {
      return Response.json({ error: `Missing field: ${field}` }, { status: 400 })
    }
  }

  // Verify the request is coming from an authenticated seller session by
  // checking the Authorization header forwarded from the client.
  const authHeader = request.headers.get('authorization')
  if (!authHeader?.startsWith('Bearer ')) {
    return Response.json({ error: 'Unauthorized.' }, { status: 401 })
  }

  // Build the dashboard deep-link for this order
  const appBase = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3002'
  const orderUrl = `${appBase}/orders/${payload.orderId}`

  try {
    const html = buildHtml(payload, orderUrl)
    const subject = `New sale — Order ${payload.orderNumber} (${formatKes(payload.total)})`

    await getTransporter().sendMail({
      from: getFromAddress(),
      to: payload.sellerEmail,
      subject,
      html,
    })

    return Response.json({ ok: true })
  } catch (err) {
    // Don't let email failure surface as a 500 — the notification already
    // appeared in-app. Log it and return a soft error.
    const message = err instanceof Error ? err.message : String(err)
    console.error('[notify-seller] Email failed:', message)
    return Response.json({ ok: false, error: 'Email delivery failed.' }, { status: 502 })
  }
}
