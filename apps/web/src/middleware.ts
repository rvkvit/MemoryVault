import { type NextRequest, NextResponse } from 'next/server'

const SESSION_COOKIE_NAMES = [
  '__Host-farewell-session',
  'farewell-session', // fallback for HTTP dev environments
]

function getSessionCookie(request: NextRequest): string | undefined {
  for (const name of SESSION_COOKIE_NAMES) {
    const value = request.cookies.get(name)?.value
    if (value) return value
  }
  return undefined
}

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl
  const session = getSessionCookie(request)

  // ── Protect /to/[slug] ───────────────────────────────────────────────────
  // No session → let the server component handle it; it redirects to
  // /denied?reason=invitation-required which explains how to get access.
  // (The invitation link goes directly to the backend: /api/v1/invite/{token})
  if (pathname.startsWith('/to/')) {
    if (!session) {
      return NextResponse.redirect(
        new URL('/denied?reason=invitation-required', request.url),
      )
    }
  }

  // ── Protect /admin (except /admin/login) ─────────────────────────────────
  if (pathname.startsWith('/admin')) {
    if (!session) {
      return NextResponse.redirect(new URL('/login', request.url))
    }
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/to/:slug*', '/admin/:path*'],
}
