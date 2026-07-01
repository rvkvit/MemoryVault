'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { Eye, Mail, Pencil, Search, Trash2, UserPlus } from 'lucide-react'
import { GlassButton } from '@/components/ui/GlassButton'
import { cn } from '@/lib/utils/cn'
import { buildFrontendUrl, buildMailtoUrl } from '@/lib/email-template'
import { getStoredInviteUrl } from '@/lib/invite-store'
import type { RecipientAnalyticsRow } from '@/types/farewell'

interface RecipientTableProps {
  rows: RecipientAnalyticsRow[]
  loading?: boolean
  onDelete: (id: string, name: string) => void
}

function formatDate(iso: string | null): string {
  if (!iso) return '—'
  return new Date(iso).toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' })
}

type InvStatus = 'not_generated' | 'generated' | 'regenerated' | 'activated'

function invitationStatus(row: RecipientAnalyticsRow): InvStatus {
  if (row.invitation_generation_count === 0) return 'not_generated'
  if (row.invitation_is_activated) return 'activated'
  if (row.invitation_generation_count > 1) return 'regenerated'
  return 'generated'
}

const INV_LABEL: Record<InvStatus, string> = {
  not_generated: 'Not Generated',
  generated:     'Generated',
  regenerated:   'Regenerated',
  activated:     'Activated',
}

const INV_STYLE: Record<InvStatus, string> = {
  not_generated: 'text-[rgba(255,255,255,0.28)] bg-[rgba(255,255,255,0.04)] border-[rgba(255,255,255,0.07)]',
  generated:     'text-amber-400 bg-amber-500/08 border-amber-500/20',
  regenerated:   'text-sky-400 bg-sky-500/08 border-sky-500/20',
  activated:     'text-emerald-400 bg-emerald-500/08 border-emerald-500/20',
}

export function RecipientTable({ rows, loading, onDelete }: RecipientTableProps) {
  const [query, setQuery] = useState('')

  // Load stored invite URLs from localStorage after mount (avoids SSR hydration mismatch)
  const [storedUrls, setStoredUrls] = useState<Record<string, string>>({})
  useEffect(() => {
    const map: Record<string, string> = {}
    for (const r of rows) {
      const url = getStoredInviteUrl(r.id)
      if (url) map[r.id] = url
    }
    setStoredUrls(map)
  }, [rows])

  const handleSendOutlook = (r: RecipientAnalyticsRow) => {
    const backendUrl = storedUrls[r.id]
    if (!backendUrl) return
    const frontendUrl = buildFrontendUrl(backendUrl)
    const firstName = r.display_name.split(' ')[0] ?? r.display_name
    const mailtoUrl = buildMailtoUrl(r.email, firstName, frontendUrl)
    // Hidden anchor click is the most reliable way to trigger the OS mailto
    // protocol handler (opens Outlook). window.location.href can be intercepted
    // by browsers that have their own mailto handler configured (e.g. Gmail in Chrome).
    const a = document.createElement('a')
    a.href = mailtoUrl
    a.style.display = 'none'
    document.body.appendChild(a)
    a.click()
    setTimeout(() => document.body.removeChild(a), 100)
  }

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
          <table className="w-full min-w-[700px]">
            <thead>
              <tr className="border-b border-[rgba(255,255,255,0.05)]">
                {['Colleague', 'Invitation', 'Visits', 'Memory', ''].map((h) => (
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
              {filtered.map((r) => {
                const invStatus = invitationStatus(r)
                const hasStoredUrl = Boolean(storedUrls[r.id])
                return (
                  <tr
                    key={r.id}
                    className="border-b border-[rgba(255,255,255,0.04)] last:border-0 hover:bg-[rgba(255,255,255,0.02)] transition-colors group"
                  >
                    {/* Colleague */}
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-ms-blue/50 to-copilot-teal/50 flex items-center justify-center shrink-0 text-white text-xs font-semibold">
                          {r.display_name.charAt(0).toUpperCase()}
                        </div>
                        <div className="min-w-0">
                          <p className="text-body-s font-medium text-[rgba(255,255,255,0.85)] truncate max-w-[200px]">
                            {r.display_name}
                          </p>
                          <p className="text-label-s text-[rgba(255,255,255,0.35)] truncate max-w-[200px]">
                            {r.email}
                          </p>
                        </div>
                      </div>
                    </td>

                    {/* Invitation status + date */}
                    <td className="px-5 py-3.5">
                      <span className={cn(
                        'inline-flex items-center px-2 py-0.5 rounded-[6px] text-label-s font-medium border',
                        INV_STYLE[invStatus],
                      )}>
                        {INV_LABEL[invStatus]}
                      </span>
                      {r.invitation_generated_at && (
                        <p className="text-label-s text-[rgba(255,255,255,0.28)] mt-0.5">
                          {invStatus === 'regenerated' ? 'Last: ' : ''}
                          {formatDate(r.invitation_generated_at)}
                        </p>
                      )}
                    </td>

                    {/* Visits */}
                    <td className="px-5 py-3.5 text-body-s text-[rgba(255,255,255,0.42)] tabular-nums whitespace-nowrap">
                      {r.total_visits.toLocaleString()}
                    </td>

                    {/* Memory submitted */}
                    <td className="px-5 py-3.5">
                      <span className={cn(
                        'inline-flex items-center px-2 py-0.5 rounded-[6px] text-label-s font-medium border',
                        r.has_guestbook_entry
                          ? 'text-emerald-400 bg-emerald-500/08 border-emerald-500/20'
                          : 'text-[rgba(255,255,255,0.28)] bg-[rgba(255,255,255,0.04)] border-[rgba(255,255,255,0.07)]',
                      )}>
                        {r.has_guestbook_entry ? 'Yes' : 'No'}
                      </span>
                    </td>

                    {/* Row actions */}
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                        {/* Send via Outlook — only shown when a stored invite URL exists */}
                        {hasStoredUrl && (
                          <GlassButton
                            variant="ghost"
                            size="sm"
                            className="!px-2 !py-1.5 text-ms-blue hover:bg-ms-blue/10 hover:border-ms-blue/30"
                            title="Send invite via Outlook"
                            onClick={() => handleSendOutlook(r)}
                          >
                            <Mail className="w-3.5 h-3.5" />
                          </GlassButton>
                        )}

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
                )
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
