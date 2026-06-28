'use client'

import { useState } from 'react'
import { CalendarDays, Plus, Trash2, X } from 'lucide-react'
import { GlassButton } from '@/components/ui/GlassButton'
import { cn } from '@/lib/utils/cn'
import type { TimelineEventInput } from '@/types/farewell'

interface TimelineEditorProps {
  events: TimelineEventInput[]
  onChange: (events: TimelineEventInput[]) => void
}

const emptyEvent = (): TimelineEventInput => ({
  event_date: '',
  title: '',
  description: '',
  icon: '',
})

const inputCls = cn(
  'w-full px-3 py-2 rounded-[9px] text-body-s',
  'bg-[rgba(255,255,255,0.04)] border border-[rgba(255,255,255,0.09)]',
  'text-[rgba(255,255,255,0.85)] placeholder:text-[rgba(255,255,255,0.22)]',
  'focus:outline-none focus:border-ms-blue/50 transition-all',
)

export function TimelineEditor({ events, onChange }: TimelineEditorProps) {
  // Index of the event being edited inline (-1 = none, 'new' = new entry form)
  const [editing, setEditing] = useState<number | 'new' | null>(null)
  const [draft, setDraft] = useState<TimelineEventInput>(emptyEvent)

  const openNew = () => {
    setDraft(emptyEvent())
    setEditing('new')
  }

  const openEdit = (i: number) => {
    setDraft({ ...events[i]! })
    setEditing(i)
  }

  const discard = () => {
    setEditing(null)
    setDraft(emptyEvent())
  }

  const save = () => {
    if (!draft.event_date || !draft.title.trim()) return
    if (editing === 'new') {
      onChange([...events, { ...draft }])
    } else if (typeof editing === 'number') {
      onChange(events.map((e, i) => (i === editing ? { ...draft } : e)))
    }
    discard()
  }

  const remove = (i: number) => {
    onChange(events.filter((_, idx) => idx !== i))
    if (editing === i) discard()
  }

  const setDraftField =
    (key: keyof TimelineEventInput) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
      setDraft((prev) => ({ ...prev, [key]: e.target.value }))

  return (
    <div className="space-y-3">
      {/* Existing events */}
      {events.length === 0 && editing !== 'new' && (
        <p className="text-body-s text-[rgba(255,255,255,0.28)] py-2">
          No timeline events yet. Add milestones from their journey.
        </p>
      )}

      {events.map((ev, i) => (
        <div key={i}>
          {editing === i ? (
            <EventForm
              draft={draft}
              onField={setDraftField}
              onSave={save}
              onDiscard={discard}
            />
          ) : (
            <div
              className="flex items-start gap-3 p-3.5 rounded-[10px] bg-[rgba(255,255,255,0.03)] border border-[rgba(255,255,255,0.07)] cursor-pointer hover:border-[rgba(255,255,255,0.12)] transition-colors group"
              onClick={() => openEdit(i)}
            >
              <CalendarDays className="w-4 h-4 text-[rgba(255,255,255,0.30)] shrink-0 mt-0.5" />
              <div className="flex-1 min-w-0">
                <div className="flex items-baseline gap-2 flex-wrap">
                  <span className="text-label-s text-copilot-teal font-mono">{ev.event_date}</span>
                  <span className="text-body-s text-[rgba(255,255,255,0.80)]">{ev.title}</span>
                </div>
                {ev.description && (
                  <p className="text-label-s text-[rgba(255,255,255,0.38)] mt-0.5 truncate">
                    {ev.description}
                  </p>
                )}
              </div>
              <button
                onClick={(e) => { e.stopPropagation(); remove(i) }}
                className="opacity-0 group-hover:opacity-100 transition-opacity p-1 rounded-[6px] hover:bg-red-500/10 text-red-400"
                title="Remove"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          )}
        </div>
      ))}

      {/* New event form */}
      {editing === 'new' && (
        <EventForm
          draft={draft}
          onField={setDraftField}
          onSave={save}
          onDiscard={discard}
        />
      )}

      {editing === null && (
        <GlassButton type="button" variant="ghost" size="sm" onClick={openNew}>
          <Plus className="w-3.5 h-3.5" />
          Add milestone
        </GlassButton>
      )}
    </div>
  )
}

// ── Inline edit/create form ───────────────────────────────────────────────────

function EventForm({
  draft,
  onField,
  onSave,
  onDiscard,
}: {
  draft: TimelineEventInput
  onField: (key: keyof TimelineEventInput) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => void
  onSave: () => void
  onDiscard: () => void
}) {
  return (
    <div className="p-3.5 rounded-[10px] bg-[rgba(255,255,255,0.04)] border border-ms-blue/25 space-y-2.5">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
        <input
          type="date"
          className={inputCls}
          value={draft.event_date}
          onChange={onField('event_date')}
          required
          placeholder="Date"
        />
        <input
          type="text"
          className={inputCls}
          value={draft.title}
          onChange={onField('title')}
          placeholder="Milestone title"
          maxLength={255}
        />
      </div>
      <textarea
        className={cn(inputCls, 'resize-none h-16')}
        value={draft.description ?? ''}
        onChange={onField('description')}
        placeholder="Description (optional)"
        maxLength={2000}
      />
      <div className="flex gap-2 justify-end">
        <GlassButton type="button" variant="ghost" size="sm" onClick={onDiscard}>
          <X className="w-3.5 h-3.5" />
          Cancel
        </GlassButton>
        <GlassButton
          type="button"
          variant="primary"
          size="sm"
          onClick={onSave}
          disabled={!draft.event_date || !draft.title.trim()}
        >
          Save milestone
        </GlassButton>
      </div>
    </div>
  )
}
