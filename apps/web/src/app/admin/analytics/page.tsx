import { cookies } from 'next/headers'
import { AnalyticsClient } from './AnalyticsClient'
import type { AnalyticsResponse } from '@/types/farewell'

export const metadata = { title: 'Analytics · Admin' }

async function fetchAnalytics(cookieHeader: string): Promise<AnalyticsResponse | null> {
  const backendUrl = process.env.BACKEND_URL ?? 'http://localhost:8000'
  try {
    const res = await fetch(`${backendUrl}/api/v1/admin/analytics`, {
      headers: { Cookie: cookieHeader },
      cache: 'no-store',
    })
    if (!res.ok) return null
    return res.json() as Promise<AnalyticsResponse>
  } catch {
    return null
  }
}

export default async function AnalyticsPage() {
  const jar = await cookies()
  const ch = [jar.get('__Host-farewell-session'), jar.get('farewell-session')]
    .filter(Boolean)
    .map((c) => `${c!.name}=${c!.value}`)
    .join('; ')

  const data = await fetchAnalytics(ch)

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-display-s font-light text-[rgba(255,255,255,0.90)]">Analytics</h1>
        <p className="text-body-s text-[rgba(255,255,255,0.38)] mt-1">
          Page views and engagement across all farewell pages
        </p>
      </div>

      <AnalyticsClient initialData={data} />
    </div>
  )
}
