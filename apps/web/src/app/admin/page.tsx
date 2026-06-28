import { cookies } from 'next/headers'
import { BarChart2, Globe, Users, MousePointerClick } from 'lucide-react'
import { StatsCard } from '@/components/admin/StatsCard'
import { DashboardClient } from './DashboardClient'
import type { AnalyticsResponse } from '@/types/farewell'

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

function cookieHeader(jar: Awaited<ReturnType<typeof cookies>>): string {
  return [jar.get('__Host-farewell-session'), jar.get('farewell-session')]
    .filter(Boolean)
    .map((c) => `${c!.name}=${c!.value}`)
    .join('; ')
}

export default async function AdminDashboard() {
  const jar = await cookies()
  const analytics = await fetchAnalytics(cookieHeader(jar))
  const stats = analytics?.stats
  const recipients = analytics?.recipients ?? []

  return (
    <div className="space-y-8">
      {/* Page header */}
      <div>
        <h1 className="text-display-s font-light text-[rgba(255,255,255,0.90)]">Dashboard</h1>
        <p className="text-body-s text-[rgba(255,255,255,0.38)] mt-1">
          Farewell pages and visit statistics
        </p>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatsCard
          label="Colleagues"
          value={stats?.total_recipients ?? 0}
          icon={Users}
          accent="blue"
        />
        <StatsCard
          label="Live pages"
          value={stats?.published_pages ?? 0}
          icon={Globe}
          accent="teal"
        />
        <StatsCard
          label="Draft pages"
          value={stats?.unpublished_pages ?? 0}
          icon={BarChart2}
          accent="violet"
        />
        <StatsCard
          label="Total visits"
          value={stats?.total_visits ?? 0}
          icon={MousePointerClick}
          accent="gold"
        />
      </div>

      {/* Colleagues table — client component handles delete confirmation */}
      <DashboardClient initialRows={recipients} />
    </div>
  )
}
