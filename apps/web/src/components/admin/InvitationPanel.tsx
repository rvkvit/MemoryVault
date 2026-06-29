'use client'

import { useState } from 'react'
import { Check, Copy, ExternalLink, Mail, RefreshCw, Smartphone, Zap } from 'lucide-react'
import { GlassButton } from '@/components/ui/GlassButton'
import { generateInvitation, getInvitationStatus, resetTrustedDevice } from '@/lib/api/admin'
import type { InvitationStatus } from '@/types/farewell'

interface InvitationPanelProps {
  recipientId: string
  recipientName: string
  initialStatus: InvitationStatus | null
}

function formatDate(iso: string | null): string {
  if (!iso) return '—'
  return new Date(iso).toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' })
}

function buildOutlookEmail(firstName: string, inviteUrl: string): string {
  return [
    'Subject: A small personal request before I leave ❤️',
    '',
    `Hi ${firstName},`,
    '',
    'As I prepare for my final days at LähiTapiola, I wanted to ask something a little different.',
    '',
    'Rather than simply saying goodbye, I created a small private Memory Vault for the people who made this journey meaningful.',
    '',
    'I would be truly grateful if you could spend just a couple of minutes sharing a memory, a message, or anything you\'d like me to remember.',
    '',
    'Your invitation is private and only accessible using your personal link below.',
    '',
    inviteUrl,
    '',
    'Thank you for being part of my journey.',
    '',
    'Warm regards,',
    '',
    'Rovin Krishnia',
    'Personal Email: rvk.vit@gmail.com',
    'LinkedIn: https://www.linkedin.com/in/rovin-krishnia-a88a2b1a/',
  ].join('\n')
}

export function InvitationPanel({ recipientId, recipientName, initialStatus }: InvitationPanelProps) {
  const [status, setStatus] = useState<InvitationStatus | null>(initialStatus)
  const [newLink, setNewLink] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [toast, setToast] = useState<string | null>(null)

  const firstName = recipientName.split(' ')[0]

  const showToast = (message: string) => {
    setToast(message)
    setTimeout(() => setToast(null), 3000)
  }

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
      setError('Failed to generate invitation. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const handleCopyLink = async () => {
    if (!newLink) return
    await navigator.clipboard.writeText(newLink)
    showToast('Invitation link copied.')
  }

  const handleCopyOutlookEmail = async () => {
    if (!newLink) return
    const emailText = buildOutlookEmail(firstName, newLink)
    await navigator.clipboard.writeText(emailText)
    showToast('Outlook email copied successfully.')
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

  const hasInvitation = status?.exists ?? false
  const isActivated = status?.is_activated ?? false

  return (
    <div className="space-y-6 relative">

      {/* ── Status bar ──────────────────────────────────────────────────── */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <p className="text-label-s text-[rgba(255,255,255,0.38)] uppercase tracking-wider mb-1.5">
            Invitation Status
          </p>
          <span className={`text-body-s font-medium ${
            !hasInvitation
              ? 'text-[rgba(255,255,255,0.35)]'
              : isActivated
                ? 'text-emerald-400'
                : 'text-amber-400'
          }`}>
            {!hasInvitation ? 'Not Generated' : isActivated ? 'Activated' : 'Pending Activation'}
          </span>
          {status?.created_at && (
            <p className="text-label-s text-[rgba(255,255,255,0.30)] mt-0.5">
              Generated {formatDate(status.created_at)}
              {status.expires_at ? ` · Expires ${formatDate(status.expires_at)}` : ''}
            </p>
          )}
        </div>

        {isActivated && (
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

      {/* ── Error ────────────────────────────────────────────────────────── */}
      {error && (
        <div className="px-4 py-3 rounded-[10px] bg-red-500/08 border border-red-500/20 text-body-s text-red-400">
          {error}
        </div>
      )}

      {/* ── Invitation card (shown after generation) ─────────────────────── */}
      {newLink ? (
        <div className="rounded-[14px] bg-gradient-to-br from-ms-blue/08 to-copilot-teal/04 border border-ms-blue/20 overflow-hidden">

          {/* Card header */}
          <div className="flex items-center gap-2.5 px-5 py-3.5 border-b border-[rgba(255,255,255,0.06)]">
            <Zap className="w-4 h-4 text-ms-blue shrink-0" />
            <span className="text-label-s text-ms-blue uppercase tracking-wider font-medium">
              Invitation Link Ready
            </span>
          </div>

          {/* URL display */}
          <div className="px-5 pt-4 pb-3">
            <code className="block w-full text-label-s text-[rgba(255,255,255,0.65)] bg-[rgba(0,0,0,0.20)] border border-[rgba(255,255,255,0.07)] rounded-[8px] px-4 py-3 overflow-x-auto whitespace-nowrap">
              {newLink}
            </code>
          </div>

          {/* Action buttons */}
          <div className="flex items-center gap-2 px-5 pb-4 flex-wrap">
            <a href={newLink} target="_blank" rel="noopener noreferrer" tabIndex={-1}>
              <GlassButton size="sm" variant="ghost">
                <ExternalLink className="w-3.5 h-3.5" />
                Open
              </GlassButton>
            </a>

            <GlassButton size="sm" onClick={() => void handleCopyLink()}>
              <Copy className="w-3.5 h-3.5" />
              Copy Link
            </GlassButton>

            <GlassButton size="sm" variant="primary" onClick={() => void handleCopyOutlookEmail()}>
              <Mail className="w-3.5 h-3.5" />
              Copy Outlook Email
            </GlassButton>

            <GlassButton
              size="sm"
              variant="ghost"
              onClick={() => void handleGenerate()}
              disabled={loading}
              className="ml-auto"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
              Regenerate
            </GlassButton>
          </div>

          <p className="px-5 pb-4 text-label-s text-[rgba(255,255,255,0.28)] leading-relaxed">
            This link is unique to {firstName} and works on one device only.
            Regenerating invalidates the current link — {firstName} would need the new one.
          </p>
        </div>

      ) : (
        /* ── Pre-generation state ──────────────────────────────────────── */
        <div className="rounded-[14px] border border-[rgba(255,255,255,0.07)] bg-[rgba(255,255,255,0.02)] p-5 space-y-4">
          <p className="text-body-s text-[rgba(255,255,255,0.45)] leading-relaxed">
            {hasInvitation
              ? `An invitation was previously generated for ${firstName}. Click below to regenerate — this creates a new link and invalidates the old one.`
              : `No invitation has been generated yet. Click below to create a personal link for ${firstName}.`
            }
          </p>
          <GlassButton
            variant="primary"
            onClick={() => void handleGenerate()}
            disabled={loading}
          >
            {loading
              ? <RefreshCw className="w-3.5 h-3.5 animate-spin" />
              : <Zap className="w-3.5 h-3.5" />
            }
            {hasInvitation ? 'Regenerate Invitation' : 'Generate Invitation'}
          </GlassButton>
        </div>
      )}

      {/* ── Trusted device info ──────────────────────────────────────────── */}
      {isActivated && status?.device_first_visit && (
        <div className="space-y-2">
          <p className="text-label-s text-[rgba(255,255,255,0.38)] uppercase tracking-wider">
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

      {/* ── Toast ────────────────────────────────────────────────────────── */}
      {toast && (
        <div className="fixed bottom-8 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2 px-4 py-2.5 rounded-[10px] bg-emerald-600 text-white text-body-s font-medium shadow-xl animate-in fade-in slide-in-from-bottom-2 duration-200">
          <Check className="w-4 h-4 shrink-0" />
          {toast}
        </div>
      )}
    </div>
  )
}
