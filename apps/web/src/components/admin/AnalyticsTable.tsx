'use client'

import { useState } from 'react'
import { ArrowUpDown, Download, Eye } from 'lucide-react'
import Link from 'next/link'
import { GlassButton } from '@/components/ui/GlassButton'
import { StatusBadge } from './StatusBadge'
import { exportAnalyticsCsv } from '@/lib/api/admin'
import type { RecipientAnalyticsRow } from '@/types/farewell'

type SortKey = 'display_name' | 'total_visits' | 'last_visit' | 'avg_duration' | 'last_day'
type SortDir = 'asc' | 'desc'

interface AnalyticsTableProps {
  rows: RecipientAnalyticsRow[]
}

function formatDuration(secs: number | null): string {
  if (secs === null) return '—'
  if (secs < 60) return `${Math.round(secs)}s`
  const m = Math.floor(secs / 60)
  const s = Math.round(secs % 60)
  return `${m}m ${s}s`
}

function formatDate(iso: string | null): string {
  if (!iso) return '—'
  return new Date(iso).toLocaleDateString('en-US', {
    month: 'short', day: 'numeric', year: 'numeric',
  })
}

export function AnalyticsTable({ rows }: AnalyticsTableProps) {
  const [sortKey, setSortKey] = useState<SortKey>('total_visits')
  const [sortDir, setSortDir] = useState<SortDir>('desc')
  const [exporting, setExporting] = useState(false)

  const toggleSort = (key: SortKey) => {
    if (key === sortKey) setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'))
    else { setSortKey(key); setSortDir('desc') }
  }

  const sorted = [...rows].sort((a, b) => {
    let av: string | number | null
    let bv: string | number | null
    switch (sortKey) {
      case 'display_name':  av = a.display_name;        bv = b.display_name;        break
      case 'total_visits':  av = a.total_visits;        bv = b.total_visits;        break
      case 'last_visit':    av = a.last_visit ?? '';    bv = b.last_visit ?? '';    break
      case 'avg_duration':  av = a.avg_duration_seconds ?? -1; bv = b.avg_duration_seconds ?? -1; break
      case 'last_day':      av = a.last_day ?? '';      bv = b.last_day ?? '';      break
      default:              av = 0; bv = 0
    }
    if (av === bv) return 0
    const cmp = av! < bv! ? -1 : 1
    return sortDir === 'asc' ? cmp : -cmp
  })

  const handleExport = async () => {
    setExporting(true)
    try {
      const blob = await exportAnalyticsCsv()
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = 'farewell-analytics.csv'
      a.click()
      URL.revokeObjectURL(url)
    } catch { /* noop */ } finally {
      setExporting(false)
    }
  }

  const SortTh = ({ k, label }: { k: SortKey; label: string }) => (
    <th
      onClick={() => toggleSort(k)}
      className="px-5 py-3 text-left text-label-s text-[rgba(255,255,255,0.30)] font-normal uppercase tracking-wider whitespace-nowrap cursor-pointer hover:text-white transition-colors select-none"
    >
      {label}
      <ArrowUpDown
        className={`w-3 h-3 ml-1 inline ${sortKey === k ? 'text-ms-blue' : 'text-[rgba(255,255,255,0.20)]'}`}
      />
    </th>
  )

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-body-m font-medium text-[rgba(255,255,255,0.70)]">
          {rows.length} colleagues
        </h2>
        <GlassButton variant="ghost" size="sm" loading={exporting} onClick={handleExport}>
          <Download className="w-3.5 h-3.5" />
          Export CSV
        </GlassButton>
      </div>

      <div className="bg-[rgba(255,255,255,0.02)] border border-[rgba(255,255,255,0.07)] rounded-[14px] overflow-hidden">
        {rows.length === 0 ? (
          <div className="py-16 text-center text-body-s text-[rgba(255,255,255,0.28)]">
            No data yet.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[900px]">
              <thead>
                <tr className="border-b border-[rgba(255,255,255,0.05)]">
                  <SortTh k="display_name" label="Colleague" />
                  <th className="px-5 py-3 text-left text-label-s text-[rgba(255,255,255,0.30)] font-normal uppercase tracking-wider">
                    Status
                  </th>
                  <SortTh k="total_visits"  label="Visits" />
                  <SortTh k="last_visit"    label="Last Visit" />
                  <SortTh k="avg_duration"  label="Avg Time" />
                  <SortTh k="last_day"      label="Last Day" />
                  <th className="px-5 py-3" />
                </tr>
              </thead>
              <tbody>
                {sorted.map((r) => (
                  <tr
                    key={r.id}
                    className="border-b border-[rgba(255,255,255,0.04)] last:border-0 hover:bg-[rgba(255,255,255,0.02)] transition-colors"
                  >
                    <td className="px-5 py-3.5">
                      <p className="text-body-s font-medium text-[rgba(255,255,255,0.85)]">{r.display_name}</p>
                      <p className="text-label-s text-[rgba(255,255,255,0.35)]">{r.email}</p>
                      {r.first_visit && (
                        <p className="text-label-s text-[rgba(255,255,255,0.25)] mt-0.5">
                          First: {formatDate(r.first_visit)}
                        </p>
                      )}
                    </td>
                    <td className="px-5 py-3.5">
                      <StatusBadge published={r.is_published} active={r.is_active} />
                    </td>
                    <td className="px-5 py-3.5 text-body-s font-medium text-[rgba(255,255,255,0.80)] tabular-nums">
                      {r.total_visits.toLocaleString()}
                    </td>
                    <td className="px-5 py-3.5 text-body-s text-[rgba(255,255,255,0.42)] whitespace-nowrap">
                      {formatDate(r.last_visit)}
                    </td>
                    <td className="px-5 py-3.5 text-body-s text-[rgba(255,255,255,0.42)] tabular-nums whitespace-nowrap">
                      {formatDuration(r.avg_duration_seconds)}
                    </td>
                    <td className="px-5 py-3.5 text-body-s text-[rgba(255,255,255,0.42)] whitespace-nowrap">
                      {r.last_day ? formatDate(r.last_day) : '—'}
                    </td>
                    <td className="px-5 py-3.5">
                      {r.is_published && (
                        <Link href={`/to/${r.slug}`} target="_blank" rel="noopener">
                          <GlassButton variant="ghost" size="sm" className="!px-2 !py-1.5">
                            <Eye className="w-3.5 h-3.5" />
                          </GlassButton>
                        </Link>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
