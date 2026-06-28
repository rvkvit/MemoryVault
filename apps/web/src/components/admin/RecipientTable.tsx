'use client'

import { useMemo, useState } from 'react'
import Link from 'next/link'
import { Eye, Pencil, Search, Trash2, UserPlus } from 'lucide-react'
import { GlassButton } from '@/components/ui/GlassButton'
import { StatusBadge } from './StatusBadge'
import { cn } from '@/lib/utils/cn'
import type { RecipientAnalyticsRow } from '@/types/farewell'

interface RecipientTableProps {
  rows: RecipientAnalyticsRow[]
  loading?: boolean
  onDelete: (id: string, name: string) => void
}

export function RecipientTable({ rows, loading, onDelete }: RecipientTableProps) {
  const [query, setQuery] = useState('')

  const filtered = useMemo(() => {
    if (!query.trim()) return rows
    const q = query.toLowerCase()
    return rows.filter(
      (r) =>
        r.display_name.toLowerCase().includes(q) ||
        r.email.toLowerCase().includes(q) ||
        r.department?.toLowerCase().includes(q),
    )
  }, [rows, query])

  return (
    <div className="bg-[rgba(255,255,255,0.02)] border border-[rgba(255,255,255,0.07)] rounded-[14px] overflow-hidden">
      {/* Toolbar */}
      <div className="flex items-center gap-3 px-5 py-4 border-b border-[rgba(255,255,255,0.06)]">
        <div className="relative flex-1 max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[rgba(255,255,255,0.28)]" />
          <input
            type="text"
            placeholder="Search by name, email, or department…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className={cn(
              'w-full pl-8 pr-3 py-2 rounded-[9px] text-body-s',
              'bg-[rgba(255,255,255,0.04)] border border-[rgba(255,255,255,0.08)]',
              'text-[rgba(255,255,255,0.80)] placeholder:text-[rgba(255,255,255,0.22)]',
              'focus:outline-none focus:border-ms-blue/50 transition-colors',
            )}
          />
        </div>
        <div className="ml-auto">
          <Link href="/admin/recipients/new">
            <GlassButton variant="primary" size="sm">
              <UserPlus className="w-3.5 h-3.5" />
              Add Colleague
            </GlassButton>
          </Link>
        </div>
      </div>

      {/* Body */}
      {loading ? (
        <div className="p-5 space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="h-[52px] rounded-[9px] bg-[rgba(255,255,255,0.03)] animate-pulse" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="py-20 text-center">
          <p className="text-body-s text-[rgba(255,255,255,0.28)]">
            {query ? 'No results match your search.' : 'No colleagues added yet.'}
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[640px]">
            <thead>
              <tr className="border-b border-[rgba(255,255,255,0.05)]">
                {['Colleague', 'Department', 'Last Day', 'Status', 'Views', ''].map((h) => (
                  <th
                    key={h}
                    className="px-5 py-3 text-left text-label-s text-[rgba(255,255,255,0.30)] font-normal uppercase tracking-wider whitespace-nowrap"
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((r) => (
                <tr
                  key={r.id}
                  className="border-b border-[rgba(255,255,255,0.04)] last:border-0 hover:bg-[rgba(255,255,255,0.02)] transition-colors group"
                >
                  {/* Name + email */}
                  <td className="px-5 py-3.5">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-ms-blue/50 to-copilot-teal/50 flex items-center justify-center shrink-0 text-white text-xs font-semibold">
                        {r.display_name.charAt(0).toUpperCase()}
                      </div>
                      <div className="min-w-0">
                        <p className="text-body-s font-medium text-[rgba(255,255,255,0.85)] truncate max-w-[180px]">
                          {r.display_name}
                        </p>
                        <p className="text-label-s text-[rgba(255,255,255,0.35)] truncate max-w-[180px]">
                          {r.email}
                        </p>
                      </div>
                    </div>
                  </td>

                  <td className="px-5 py-3.5 text-body-s text-[rgba(255,255,255,0.42)] whitespace-nowrap">
                    {r.department ?? '—'}
                  </td>

                  <td className="px-5 py-3.5 text-body-s text-[rgba(255,255,255,0.42)] whitespace-nowrap">
                    {r.last_day
                      ? new Date(r.last_day).toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric',
                        })
                      : '—'}
                  </td>

                  <td className="px-5 py-3.5">
                    <StatusBadge published={r.is_published} active={r.is_active} />
                  </td>

                  <td className="px-5 py-3.5 text-body-s text-[rgba(255,255,255,0.42)] tabular-nums">
                    {r.view_count.toLocaleString()}
                  </td>

                  {/* Row actions — visible on hover */}
                  <td className="px-5 py-3.5">
                    <div className="flex items-center gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                      {r.is_published && (
                        <Link href={`/to/${r.slug}`} target="_blank" rel="noopener">
                          <GlassButton variant="ghost" size="sm" className="!px-2 !py-1.5" title="View page">
                            <Eye className="w-3.5 h-3.5" />
                          </GlassButton>
                        </Link>
                      )}
                      <Link href={`/admin/recipients/${r.id}`}>
                        <GlassButton variant="ghost" size="sm" className="!px-2 !py-1.5" title="Edit">
                          <Pencil className="w-3.5 h-3.5" />
                        </GlassButton>
                      </Link>
                      <GlassButton
                        variant="ghost"
                        size="sm"
                        className="!px-2 !py-1.5 text-red-400 hover:bg-red-500/10 hover:border-red-500/20"
                        title="Delete"
                        onClick={() => onDelete(r.id, r.display_name)}
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </GlassButton>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
