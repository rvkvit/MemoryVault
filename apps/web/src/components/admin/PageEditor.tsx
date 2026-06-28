'use client'

import { useEffect, useState } from 'react'
import { CheckCircle2, ExternalLink, Globe, GlobeLock, Loader2 } from 'lucide-react'
import { GlassButton } from '@/components/ui/GlassButton'
import { TimelineEditor } from './TimelineEditor'
import { MediaUploader } from './MediaUploader'
import { cn } from '@/lib/utils/cn'
import { useAdminPage, usePublishPage, useUnpublishPage, useUpsertPage } from '@/hooks/useAdminPage'
import type { Page, TimelineEventInput } from '@/types/farewell'

interface PageEditorProps {
  recipientId: string
  recipientSlug: string
}

// Reusable toggle row
function Toggle({
  label,
  checked,
  onChange,
}: {
  label: string
  checked: boolean
  onChange: (v: boolean) => void
}) {
  return (
    <label className="flex items-center justify-between cursor-pointer select-none">
      <span className="text-body-s text-[rgba(255,255,255,0.70)]">{label}</span>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        className={cn(
          'relative w-9 h-5 rounded-full border transition-all duration-200',
          checked
            ? 'bg-ms-blue border-ms-blue'
            : 'bg-[rgba(255,255,255,0.08)] border-[rgba(255,255,255,0.12)]',
        )}
      >
        <span
          className={cn(
            'absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white transition-transform duration-200',
            checked ? 'translate-x-4' : 'translate-x-0',
          )}
        />
      </button>
    </label>
  )
}

// Collapsible section header
function Section({
  title,
  children,
}: {
  title: string
  children: React.ReactNode
}) {
  return (
    <div className="space-y-3">
      <h3 className="text-label-s text-[rgba(255,255,255,0.40)] uppercase tracking-wider">{title}</h3>
      {children}
    </div>
  )
}

export function PageEditor({ recipientId, recipientSlug }: PageEditorProps) {
  const { data: page, isLoading, isError } = useAdminPage(recipientId)
  const upsert   = useUpsertPage(recipientId)
  const publish  = usePublishPage(recipientId)
  const unpublish = useUnpublishPage(recipientId)

  // Local draft state — synced from server data on first load
  const [message,       setMessage]       = useState('')
  const [showGuestbook, setShowGuestbook] = useState(true)
  const [showTimeline,  setShowTimeline]  = useState(true)
  const [showPhotos,    setShowPhotos]    = useState(true)
  const [showVideo,     setShowVideo]     = useState(false)
  const [timeline,      setTimeline]      = useState<TimelineEventInput[]>([])
  const [saved,         setSaved]         = useState(false)
  const [saveError,     setSaveError]     = useState<string | null>(null)

  // Populate form when page data arrives
  useEffect(() => {
    if (!page) return
    setMessage(page.personalized_message ?? '')
    setShowGuestbook(page.show_guestbook)
    setShowTimeline(page.show_timeline)
    setShowPhotos(page.show_photos)
    setShowVideo(page.show_video)
    setTimeline(
      page.timeline_events.map((e) => ({
        event_date:  e.event_date,
        title:       e.title,
        description: e.description,
        icon:        e.icon,
      })),
    )
  }, [page])

  const handleSave = () => {
    setSaveError(null)
    upsert.mutate(
      {
        personalized_message: message || null,
        show_guestbook: showGuestbook,
        show_timeline:  showTimeline,
        show_photos:    showPhotos,
        show_video:     showVideo,
        timeline_events: timeline,
      },
      {
        onSuccess: () => {
          setSaved(true)
          setTimeout(() => setSaved(false), 2500)
        },
        onError: (err) => {
          setSaveError((err as Error).message || 'Failed to save page. Please try again.')
        },
      },
    )
  }

  if (isLoading) {
    return (
      <div className="flex items-center gap-2.5 py-12 justify-center text-[rgba(255,255,255,0.35)]">
        <Loader2 className="w-4 h-4 animate-spin" />
        <span className="text-body-s">Loading page content…</span>
      </div>
    )
  }

  if (isError && !page) {
    return (
      <div className="py-12 text-center space-y-3">
        <p className="text-body-s text-[rgba(255,255,255,0.40)]">
          No page created yet for this colleague.
        </p>
        <GlassButton variant="primary" size="sm" loading={upsert.isPending} onClick={handleSave}>
          Create Page
        </GlassButton>
        {saveError && (
          <p className="text-body-s text-red-400">{saveError}</p>
        )}
      </div>
    )
  }

  const isPublished = page?.is_published ?? false

  return (
    <div className="space-y-8">
      {/* Publish bar */}
      <div className="flex items-center justify-between gap-4 p-4 rounded-[12px] bg-[rgba(255,255,255,0.03)] border border-[rgba(255,255,255,0.07)]">
        <div className="flex items-center gap-3 min-w-0">
          {isPublished ? (
            <>
              <Globe className="w-4 h-4 text-copilot-teal shrink-0" />
              <div>
                <p className="text-body-s text-[rgba(255,255,255,0.80)]">Page is live</p>
                {page?.published_at && (
                  <p className="text-label-s text-[rgba(255,255,255,0.35)]">
                    Published {new Date(page.published_at).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
                  </p>
                )}
              </div>
            </>
          ) : (
            <>
              <GlobeLock className="w-4 h-4 text-[rgba(255,255,255,0.35)] shrink-0" />
              <p className="text-body-s text-[rgba(255,255,255,0.50)]">Draft — not visible to recipient</p>
            </>
          )}
        </div>

        <div className="flex items-center gap-2.5 shrink-0">
          {isPublished && (
            <a href={`/to/${recipientSlug}`} target="_blank" rel="noopener">
              <GlassButton variant="ghost" size="sm">
                <ExternalLink className="w-3.5 h-3.5" />
                View
              </GlassButton>
            </a>
          )}
          {isPublished ? (
            <GlassButton
              variant="ghost"
              size="sm"
              loading={unpublish.isPending}
              className="border-red-500/25 text-red-400 hover:bg-red-500/10 hover:border-red-500/50"
              onClick={() => unpublish.mutate()}
            >
              Unpublish
            </GlassButton>
          ) : (
            <GlassButton
              variant="teal"
              size="sm"
              loading={publish.isPending}
              onClick={() => publish.mutate()}
            >
              <Globe className="w-3.5 h-3.5" />
              Publish
            </GlassButton>
          )}
        </div>
      </div>

      {/* Personal message */}
      <Section title="Personal message">
        <textarea
          className={cn(
            'w-full px-4 py-3 rounded-[12px] text-body-m resize-none',
            'bg-[rgba(255,255,255,0.03)] border border-[rgba(255,255,255,0.09)]',
            'text-[rgba(255,255,255,0.85)] placeholder:text-[rgba(255,255,255,0.22)]',
            'focus:outline-none focus:border-ms-blue/50 transition-all',
            'h-48 leading-relaxed',
          )}
          placeholder="Write a heartfelt, personalized message for this colleague. This appears prominently on their farewell page…"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          maxLength={50_000}
        />
        <p className="text-label-s text-[rgba(255,255,255,0.25)] text-right">
          {message.length.toLocaleString()} / 50,000
        </p>
      </Section>

      {/* Visibility toggles */}
      <Section title="Sections">
        <div className="space-y-3 p-4 rounded-[12px] bg-[rgba(255,255,255,0.02)] border border-[rgba(255,255,255,0.06)]">
          <Toggle label="Guestbook" checked={showGuestbook} onChange={setShowGuestbook} />
          <Toggle label="Timeline"  checked={showTimeline}  onChange={setShowTimeline}  />
          <Toggle label="Photo gallery" checked={showPhotos} onChange={setShowPhotos} />
          <Toggle label="Video"     checked={showVideo}     onChange={setShowVideo}     />
        </div>
      </Section>

      {/* Timeline editor */}
      {showTimeline && (
        <Section title="Timeline milestones">
          <TimelineEditor events={timeline} onChange={setTimeline} />
        </Section>
      )}

      {/* Media uploader */}
      {(showPhotos || showVideo) && page && (
        <Section title="Photos & videos">
          <MediaUploader
            recipientId={recipientId}
            assets={page.media_assets}
            accept={showPhotos && showVideo ? 'all' : showPhotos ? 'photos' : 'videos'}
          />
        </Section>
      )}

      {/* Save button */}
      <div className="flex items-center gap-3 pt-2 border-t border-[rgba(255,255,255,0.06)]">
        <GlassButton
          variant="primary"
          size="md"
          loading={upsert.isPending}
          onClick={handleSave}
        >
          Save Changes
        </GlassButton>
        {saved && (
          <span className="flex items-center gap-1.5 text-body-s text-copilot-teal">
            <CheckCircle2 className="w-4 h-4" />
            Saved
          </span>
        )}
        {saveError && (
          <span className="text-body-s text-red-400">{saveError}</span>
        )}
      </div>
    </div>
  )
}
