'use client'

import { useState } from 'react'
import { Check, Copy, Link2, RefreshCw, Smartphone, Trash2 } from 'lucide-react'
import { GlassButton } from '@/components/ui/GlassButton'
import { generateInvitation, getInvitationStatus, resetTrustedDevice } from '@/lib/api/admin'
import type { InvitationStatus } from '@/types/farewell'

interface InvitationPanelProps {
  recipientId: string
  initialStatus: InvitationStatus | null
}

function formatDate(iso: string | null): string {
  if (!iso) return '—'
  return new Date(iso).toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' })
}

export function InvitationPanel({ recipientId, initialStatus }: InvitationPanelProps) {
  const [status, setStatus] = useState<InvitationStatus | null>(initialStatus)
  const [newLink, setNewLink] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const refresh = async () => {
    const s = await getInvitationStatus(recipientId)
    setStatus(s)
  }

  const handleGenerate = async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await generateInvitation(recipientId)
      setNewLink(res.invite_url)
      await refresh()
    } catch {
      setError('Failed to generate invitation.')
    } finally {
      setLoading(false)
    }
  }

  const handleCopy = async () => {
    const link = newLink
    if (!link) return
    await navigator.clipboard.writeText(link)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const handleResetDevice = async () => {
    setLoading(true)
    setError(null)
    try {
      await resetTrustedDevice(recipientId)
      setNewLink(null)
      await refresh()
    } catch {
      setError('Failed to reset device.')
    } finally {
      setLoading(false)
    }
  }

  const statusColor = !status?.exists
    ? 'text-[rgba(255,255,255,0.35)]'
    : status.is_activated
      ? 'text-emerald-400'
      : 'text-amber-400'

  const statusLabel = !status?.exists
    ? 'No invitation generated'
    : status.is_activated
      ? 'Activated'
      : 'Pending activation'

  return (
    <div className="space-y-6">
      {/* Status row */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <p className="text-label-s text-[rgba(255,255,255,0.38)] uppercase tracking-wider mb-1">
            Status
          </p>
          <span className={`text-body-s font-medium ${statusColor}`}>
            {statusLabel}
          </span>
          {status?.expires_at && (
            <p className="text-label-s text-[rgba(255,255,255,0.30)] mt-0.5">
              Expires {formatDate(status.expires_at)}
            </p>
          )}
        </div>

        <div className="flex gap-2 flex-wrap">
          <GlassButton
            size="sm"
            onClick={() => void handleGenerate()}
            disabled={loading}
          >
            <RefreshCw className="w-3.5 h-3.5" />
            {status?.exists ? 'Regenerate' : 'Generate'} Invitation
          </GlassButton>

          {status?.is_activated && (
            <GlassButton
              size="sm"
              variant="ghost"
              className="border-amber-500/20 text-amber-400 hover:bg-amber-500/10"
              onClick={() => void handleResetDevice()}
              disabled={loading}
            >
              <Smartphone className="w-3.5 h-3.5" />
              Reset Device
            </GlassButton>
          )}
        </div>
      </div>

      {error && (
        <div className="px-4 py-3 rounded-[10px] bg-red-500/08 border border-red-500/20 text-body-s text-red-400">
          {error}
        </div>
      )}

      {/* New invitation link */}
      {newLink && (
        <div className="p-4 rounded-[12px] bg-ms-blue/05 border border-ms-blue/15 space-y-3">
          <div className="flex items-center gap-2">
            <Link2 className="w-4 h-4 text-ms-blue shrink-0" />
            <p className="text-label-s text-ms-blue uppercase tracking-wider">
              Invitation link generated
            </p>
          </div>
          <div className="flex items-center gap-2">
            <code className="flex-1 text-label-s text-[rgba(255,255,255,0.65)] bg-[rgba(255,255,255,0.04)] border border-[rgba(255,255,255,0.08)] rounded-[8px] px-3 py-2 overflow-x-auto whitespace-nowrap">
              {newLink}
            </code>
            <GlassButton size="sm" onClick={() => void handleCopy()}>
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              {copied ? 'Copied' : 'Copy'}
            </GlassButton>
          </div>
          <p className="text-label-s text-[rgba(255,255,255,0.35)]">
            Send this link to the recipient. It can only be opened once from a single device.
            The link is only shown once — regenerate to get a new one.
          </p>
        </div>
      )}

      {/* Trusted device info */}
      {status?.is_activated && status.device_first_visit && (
        <div className="space-y-1">
          <p className="text-label-s text-[rgba(255,255,255,0.38)] uppercase tracking-wider mb-2">
            Trusted Device
          </p>
          <div className="grid grid-cols-2 gap-y-2 text-body-s">
            <span className="text-[rgba(255,255,255,0.38)]">First seen</span>
            <span className="text-[rgba(255,255,255,0.75)]">{formatDate(status.device_first_visit)}</span>
            <span className="text-[rgba(255,255,255,0.38)]">Last seen</span>
            <span className="text-[rgba(255,255,255,0.75)]">{formatDate(status.device_last_visit)}</span>
            <span className="text-[rgba(255,255,255,0.38)]">Visit count</span>
            <span className="text-[rgba(255,255,255,0.75)]">{status.device_visit_count ?? '—'}</span>
            {status.device_browser && (
              <>
                <span className="text-[rgba(255,255,255,0.38)]">Browser</span>
                <span className="text-[rgba(255,255,255,0.75)] truncate" title={status.device_browser}>
                  {status.device_browser.slice(0, 60)}
                </span>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
