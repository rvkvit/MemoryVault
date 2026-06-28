'use client'

import { BarChart2, Clock, Globe, MousePointerClick } from 'lucide-react'
import { VisitsChart } from '@/components/admin/charts/VisitsChart'
import { BrowserChart } from '@/components/admin/charts/BrowserChart'
import { DeviceChart } from '@/components/admin/charts/DeviceChart'
import { AnalyticsTable } from '@/components/admin/AnalyticsTable'
import { StatsCard } from '@/components/admin/StatsCard'
import { useAnalytics } from '@/hooks/useAnalytics'
import type { AnalyticsResponse } from '@/types/farewell'

interface AnalyticsClientProps {
  initialData: AnalyticsResponse | null
}

function ChartCard({
  title,
  children,
}: {
  title: string
  children: React.ReactNode
}) {
  return (
    <div className="bg-[rgba(255,255,255,0.02)] border border-[rgba(255,255,255,0.07)] rounded-[14px] p-5 space-y-4">
      <p className="text-label-s text-[rgba(255,255,255,0.38)] uppercase tracking-wider">{title}</p>
      {children}
    </div>
  )
}

function avgDuration(rows: AnalyticsResponse['recipients']): string {
  const vals = rows.map((r) => r.avg_duration_seconds).filter((v): v is number => v !== null)
  if (!vals.length) return '—'
  const avg = vals.reduce((a, b) => a + b, 0) / vals.length
  if (avg < 60) return `${Math.round(avg)}s`
  return `${Math.floor(avg / 60)}m ${Math.round(avg % 60)}s`
}

export function AnalyticsClient({ initialData }: AnalyticsClientProps) {
  const { data } = useAnalytics()
  const analytics = data ?? initialData

  if (!analytics) {
    return (
      <div className="py-20 text-center text-body-s text-[rgba(255,255,255,0.28)]">
        No analytics data available.
      </div>
    )
  }

  const { stats, recipients, charts } = analytics

  return (
    <div className="space-y-8">
      {/* Stats row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatsCard label="Total visits"   value={stats.total_visits}  icon={MousePointerClick} accent="blue"   />
        <StatsCard label="Live pages"     value={stats.published_pages} icon={Globe}           accent="teal"   />
        <StatsCard label="Total views"    value={stats.total_views}   icon={BarChart2}         accent="violet" />
        <StatsCard
          label="Avg time"
          value={avgDuration(recipients)}
          icon={Clock}
          accent="gold"
        />
      </div>

      {/* Charts row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2">
          <ChartCard title="Visits — last 30 days">
            <VisitsChart data={charts.daily_visits} />
          </ChartCard>
        </div>
        <ChartCard title="Browser breakdown">
          <BrowserChart data={charts.browsers} />
        </ChartCard>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-1">
          <ChartCard title="Device breakdown">
            <DeviceChart data={charts.devices} />
          </ChartCard>
        </div>

        {/* Summary callouts */}
        <div className="lg:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-4 content-start">
          {recipients
            .filter((r) => r.total_visits > 0)
            .slice(0, 4)
            .map((r) => (
              <div
                key={r.id}
                className="bg-[rgba(255,255,255,0.02)] border border-[rgba(255,255,255,0.07)] rounded-[14px] p-4"
              >
                <p className="text-body-s font-medium text-[rgba(255,255,255,0.80)] truncate">
                  {r.display_name}
                </p>
                <p className="text-label-s text-[rgba(255,255,255,0.35)] mb-3 truncate">{r.email}</p>
                <div className="grid grid-cols-2 gap-y-1.5 text-label-s">
                  <span className="text-[rgba(255,255,255,0.35)]">Visits</span>
                  <span className="text-[rgba(255,255,255,0.70)] tabular-nums text-right">
                    {r.total_visits}
                  </span>
                  <span className="text-[rgba(255,255,255,0.35)]">Avg time</span>
                  <span className="text-[rgba(255,255,255,0.70)] tabular-nums text-right">
                    {r.avg_duration_seconds !== null
                      ? r.avg_duration_seconds < 60
                        ? `${Math.round(r.avg_duration_seconds)}s`
                        : `${Math.floor(r.avg_duration_seconds / 60)}m`
                      : '—'}
                  </span>
                  <span className="text-[rgba(255,255,255,0.35)]">Last visit</span>
                  <span className="text-[rgba(255,255,255,0.70)] text-right">
                    {r.last_visit
                      ? new Date(r.last_visit).toLocaleDateString('en-US', {
                          month: 'short', day: 'numeric',
                        })
                      : '—'}
                  </span>
                </div>
              </div>
            ))}
        </div>
      </div>

      {/* Full table */}
      <AnalyticsTable rows={recipients} />
    </div>
  )
}
