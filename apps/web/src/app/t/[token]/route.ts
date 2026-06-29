import { NextRequest, NextResponse } from 'next/server'

/**
 * /t/[token] — clean invitation URL for recipients.
 *
 * Redirects to /api/v1/invite/[token] on the same origin so the Next.js
 * rewrite proxy picks it up. This ensures session cookies are set on the
 * frontend domain rather than the raw backend domain.
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ token: string }> },
) {
  const { token } = await params

  // On self-hosted Next.js (Render), request.nextUrl.origin can resolve to the
  // internal bind address (e.g. localhost:10000) instead of the public domain.
  // Read the forwarded host/proto headers directly for a reliable origin.
  const host = request.headers.get('x-forwarded-host') ?? request.headers.get('host')
  const proto = request.headers.get('x-forwarded-proto') ?? 'https'
  const origin = host ? `${proto}://${host}` : request.nextUrl.origin

  const destination = new URL(`/api/v1/invite/${token}`, origin)
  return NextResponse.redirect(destination, { status: 302 })
}
