'use client'

import { useState } from 'react'
import { AlertCircle, Check, Globe, X, Zap } from 'lucide-react'
import { GlassButton } from '@/components/ui/GlassButton'
import { generateInvitation, publishPage } from '@/lib/api/admin'
import { storeInviteUrl } from '@/lib/invite-store'
import type { RecipientAnalyticsRow } from '@/types/farewell'

interface BulkActionsBarProps {
  rows: RecipientAnalyticsRow[]
  onComplete: () => void
}

type Action = 'publish' | 'invite'
type Phase = 'idle' | 'confirm' | 'running' | 'done'

interface Progress { done: number; total: number; failed: number }

export function BulkActionsBar({ rows, onComplete }: BulkActionsBarProps) {
  const [action, setAction] = useState<Action | null>(null)
  const [phase, setPhase]   = useState<Phase>('idle')
  const [progress, setProgress] = useState<Progress>({ done: 0, total: 0, failed: 0 })

  const unpublished = rows.filter(r => !r.is_published)

  const cancel = () => {
    setAction(null)
    setPhase('idle')
    setProgress({ done: 0, total: 0, failed: 0 })
  }

  const run = async () => {
    if (!action) return
    const targets = action === 'publish' ? unpublished : rows
    setProgress({ done: 0, total: targets.length, failed: 0 })
    setPhase('running')
    let failed = 0
    for (const r of targets) {
      try {
        if (action === 'publish') {
          await publishPage(r.id)
        } else {
          const result = await generateInvitation(r.id)
          storeInviteUrl(r.id, result.invite_url)
        }
      } catch {
        failed++
      }
      // capture failed in closure to avoid stale reads
      const f = failed
      setProgress(p => ({ ...p, done: p.done + 1, failed: f }))
    }
    setPhase('done')
    onComplete()
  }

  const pct = progress.total > 0 ? Math.round((progress.done / progress.total) * 100) : 0

  // ── Done ─────────────────────────────────────────────────────────────────────
  if (phase === 'done') {
    const ok = progress.total - progress.failed
    return (
      <div className="flex items-center justify-between gap-4 px-5 py-3 rounded-[12px] bg-emerald-500/08 border border-emerald-500/20">
        <div className="flex items-center gap-2.5">
          <Check className="w-4 h-4 text-emerald-400 shrink-0" />
          <span className="text-body-s text-emerald-400">
            {action === 'publish'
              ? `${ok} page${ok !== 1 ? 's' : ''} published`
              : `${ok} invitation${ok !== 1 ? 's' : ''} generated`}
            {progress.failed > 0 && (
              <span className="text-amber-400 ml-2">· {progress.failed} failed</span>
            )}
          </span>
        </div>
        <GlassButton size="sm" variant="ghost" onClick={cancel}>
          <X className="w-3.5 h-3.5" />
          Dismiss
        </GlassButton>
      </div>
    )
  }

  // ── Running ───────────────────────────────────────────────────────────────────
  if (phase === 'running') {
    return (
      <div className="px-5 py-3.5 rounded-[12px] bg-[rgba(255,255,255,0.02)] border border-[rgba(255,255,255,0.07)] space-y-2">
        <div className="flex items-center justify-between text-body-s">
          <span className="text-[rgba(255,255,255,0.55)]">
            {action === 'publish' ? 'Publishing pages…' : 'Generating invitations…'}
            {' '}{progress.done} / {progress.total}
          </span>
          <span className="text-[rgba(255,255,255,0.35)] tabular-nums">{pct}%</span>
        </div>
        <div className="h-1.5 rounded-full bg-[rgba(255,255,255,0.06)] overflow-hidden">
          <div
            className="h-full rounded-full bg-ms-blue transition-all duration-300 ease-out"
            style={{ width: `${pct}%` }}
          />
        </div>
      </div>
    )
  }

  // ── Confirm ───────────────────────────────────────────────────────────────────
  if (phase === 'confirm' && action) {
    const targets = action === 'publish' ? unpublished : rows
    const isEmpty  = targets.length === 0
    const detail   = action === 'publish'
      ? isEmpty
        ? 'All pages are already published.'
        : `${targets.length} unpublished page${targets.length !== 1 ? 's' : ''} will be made live.`
      : isEmpty
        ? 'No colleagues to process.'
        : `Invitation links will be generated (or refreshed) for all ${targets.length} colleague${targets.length !== 1 ? 's' : ''}.`

    return (
      <div className="flex items-center justify-between gap-4 px-5 py-3 rounded-[12px] bg-[rgba(255,255,255,0.02)] border border-[rgba(255,255,255,0.07)] flex-wrap">
        <div className="flex items-center gap-2.5 min-w-0">
          <AlertCircle className="w-4 h-4 text-amber-400 shrink-0" />
          <p className="text-body-s text-[rgba(255,255,255,0.60)]">{detail}</p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <GlassButton size="sm" variant="ghost" onClick={cancel}>Cancel</GlassButton>
          <GlassButton
            size="sm"
            variant="primary"
            disabled={isEmpty}
            onClick={() => void run()}
          >
            {isEmpty ? 'Nothing to do' : 'Confirm'}
          </GlassButton>
        </div>
      </div>
    )
  }

  // ── Idle ──────────────────────────────────────────────────────────────────────
  return (
    <div className="flex items-center gap-2.5 flex-wrap">
      <span className="text-label-s text-[rgba(255,255,255,0.28)] uppercase tracking-wider mr-1">
        Bulk actions
      </span>
      <GlassButton
        size="sm"
        variant="ghost"
        disabled={unpublished.length === 0}
        onClick={() => { setAction('publish'); setPhase('confirm') }}
      >
        <Globe className="w-3.5 h-3.5" />
        Publish All Pages{unpublished.length > 0 ? ` (${unpublished.length})` : ''}
      </GlassButton>
      <GlassButton
        size="sm"
        variant="ghost"
        disabled={rows.length === 0}
        onClick={() => { setAction('invite'); setPhase('confirm') }}
      >
        <Zap className="w-3.5 h-3.5" />
        Generate All Invitations ({rows.length})
      </GlassButton>
    </div>
  )
}
