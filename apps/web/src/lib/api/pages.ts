import type { CurrentUser, FarewellPageData } from '@/types/farewell'
import { get } from './client'

// ── Server-side fetch (RSC) ───────────────────────────────────────────────────
// Used inside server components; forwards the session cookie directly to the
// internal FastAPI URL, bypassing the Next.js proxy.

export async function fetchPageDataSSR(
  slug: string,
  cookieHeader: string,
): Promise<{ data: FarewellPageData | null; status: number }> {
  const backendUrl = process.env.BACKEND_URL ?? 'http://localhost:8000'

  const response = await fetch(`${backendUrl}/api/v1/pages/${slug}`, {
    headers: {
      Cookie: cookieHeader,
      'Content-Type': 'application/json',
    },
    cache: 'no-store',
  })

  if (!response.ok) {
    return { data: null, status: response.status }
  }

  const data = (await response.json()) as FarewellPageData
  return { data, status: 200 }
}

// ── SSR current-user fetch (RSC) ─────────────────────────────────────────────

export async function fetchCurrentUserSSR(
  cookieHeader: string,
): Promise<CurrentUser | null> {
  const backendUrl = process.env.BACKEND_URL ?? 'http://localhost:8000'
  try {
    const response = await fetch(`${backendUrl}/api/v1/auth/me`, {
      headers: {
        Cookie: cookieHeader,
        'Content-Type': 'application/json',
      },
      cache: 'no-store',
    })
    if (!response.ok) return null
    return (await response.json()) as CurrentUser
  } catch {
    return null
  }
}

// ── Client-side fetch (React Query) ──────────────────────────────────────────

export async function fetchCurrentUser(): Promise<CurrentUser> {
  return get<CurrentUser>('/api/v1/auth/me')
}
