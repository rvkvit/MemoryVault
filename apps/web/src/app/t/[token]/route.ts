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
  const destination = new URL(`/api/v1/invite/${token}`, request.nextUrl.origin)
  return NextResponse.redirect(destination, { status: 302 })
}
