'use client'

import { useState } from 'react'
import { Download, Heart, Play, Search, Trash2 } from 'lucide-react'
import { GlassButton } from '@/components/ui/GlassButton'
import { useExportMemories, useHideMemory, useMemories, useToggleMemoryFavourite } from '@/hooks/useMemories'
import type { MemoryEntry, RecipientSummary } from '@/types/farewell'

interface MemoryVaultClientProps {
  recipients: RecipientSummary[]
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-US', {
    day: 'numeric', month: 'short', year: 'numeric',
  })
}

function MemoryCard({ entry }: { entry: MemoryEntry }) {
  const favourite = useToggleMemoryFavourite()
  const hide = useHideMemory()
  const [playing, setPlaying] = useState(false)
  const [audio] = useState(() => entry.voice_url ? new Audio(entry.voice_url) : null)

  const togglePlay = () => {
    if (!audio) return
    if (playing) {
      audio.pause()
      setPlaying(false)
    } else {
      void audio.play()
      setPlaying(true)
      audio.onended = () => setPlaying(false)
    }
  }

  return (
    <div className="bg-[rgba(255,255,255,0.02)] border border-[rgba(255,255,255,0.07)] rounded-[14px] p-5 space-y-4">
      {/* Header */}
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-body-s font-medium text-[rgba(255,255,255,0.85)]">
            {entry.submitter_name}
          </p>
          {entry.submitter_email && (
            <p className="text-label-s text-[rgba(255,255,255,0.35)]">{entry.submitter_email}</p>
          )}
        </div>
        <div className="flex items-center gap-1.5 shrink-0">
          <span className="text-label-s text-[rgba(255,255,255,0.28)]">{formatDate(entry.created_at)}</span>
          <button
            onClick={() => favourite.mutate(entry.id)}
            className={`p-1.5 rounded-[6px] transition-colors ${
              entry.is_favourite
                ? 'text-red-400 bg-red-400/10'
                : 'text-[rgba(255,255,255,0.25)] hover:text-red-400'
            }`}
          >
            <Heart className="w-3.5 h-3.5" fill={entry.is_favourite ? 'currentColor' : 'none'} />
          </button>
          <button
            onClick={() => hide.mutate(entry.id)}
            className="p-1.5 rounded-[6px] text-[rgba(255,255,255,0.20)] hover:text-red-400 transition-colors"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Message */}
      <p className="text-body-s text-[rgba(255,255,255,0.65)] leading-relaxed whitespace-pre-wrap">
        {entry.message}
      </p>

      {/* Attachments */}
      {(entry.voice_url || entry.image_url) && (
        <div className="flex gap-3 flex-wrap">
          {entry.voice_url && (
            <button
              onClick={togglePlay}
              className="flex items-center gap-2 px-3 py-1.5 rounded-[8px] bg-[rgba(255,255,255,0.04)] border border-[rgba(255,255,255,0.08)] text-label-s text-[rgba(255,255,255,0.55)] hover:text-[rgba(255,255,255,0.80)] transition-colors"
            >
              <Play className="w-3 h-3" />
              {playing ? 'Playing…' : 'Voice note'}
            </button>
          )}
          {entry.image_url && (
            <a
              href={entry.image_url}
              target="_blank"
              rel="noopener noreferrer"
              className="block"
            >
              <img
                src={entry.image_url}
                alt="Memory photo"
                className="h-16 w-auto rounded-[8px] object-cover border border-[rgba(255,255,255,0.10)] hover:opacity-80 transition-opacity"
              />
            </a>
          )}
        </div>
      )}
    </div>
  )
}

export function MemoryVaultClient({ recipients }: MemoryVaultClientProps) {
  const [recipientId, setRecipientId] = useState<string | null>(
    recipients[0]?.id ?? null,
  )
  const [search, setSearch] = useState('')
  const [favouritesOnly, setFavouritesOnly] = useState(false)

  const { data, isLoading } = useMemories(recipientId, {
    search: search || undefined,
    favourites_only: favouritesOnly || undefined,
  })
  const exportMut = useExportMemories(recipientId ?? '')

  const handleRecipientChange = (id: string) => {
    setRecipientId(id)
    setSearch('')
    setFavouritesOnly(false)
  }

  if (!recipients.length) {
    return (
      <p className="text-body-s text-[rgba(255,255,255,0.35)]">
        No colleagues found. Add a recipient first.
      </p>
    )
  }

  return (
    <div className="space-y-6">
      {/* Colleague selector + filters */}
      <div className="flex flex-wrap gap-3 items-center">
        <select
          value={recipientId ?? ''}
          onChange={(e) => handleRecipientChange(e.target.value)}
          className="px-3.5 py-2.5 rounded-[10px] bg-[rgba(255,255,255,0.04)] border border-[rgba(255,255,255,0.09)] text-body-s text-[rgba(255,255,255,0.80)] focus:outline-none focus:border-ms-blue/50 transition-all"
        >
          {recipients.map((r) => (
            <option key={r.id} value={r.id} className="bg-[#0d1117]">
              {r.display_name}
            </option>
          ))}
        </select>

        <div className="flex items-center gap-2 px-3.5 py-2.5 rounded-[10px] bg-[rgba(255,255,255,0.04)] border border-[rgba(255,255,255,0.09)] flex-1 min-w-[180px]">
          <Search className="w-4 h-4 text-[rgba(255,255,255,0.28)] shrink-0" />
          <input
            type="text"
            placeholder="Search memories…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="flex-1 bg-transparent text-body-s text-[rgba(255,255,255,0.75)] placeholder-[rgba(255,255,255,0.25)] focus:outline-none"
          />
        </div>

        <button
          onClick={() => setFavouritesOnly((v) => !v)}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-[10px] border text-body-s transition-all ${
            favouritesOnly
              ? 'bg-red-400/10 border-red-400/25 text-red-400'
              : 'bg-[rgba(255,255,255,0.04)] border-[rgba(255,255,255,0.09)] text-[rgba(255,255,255,0.50)] hover:text-[rgba(255,255,255,0.75)]'
          }`}
        >
          <Heart className="w-3.5 h-3.5" fill={favouritesOnly ? 'currentColor' : 'none'} />
          Favourites
        </button>

        {recipientId && (
          <GlassButton
            size="sm"
            onClick={() => exportMut.mutate()}
            disabled={exportMut.isPending}
          >
            <Download className="w-3.5 h-3.5" />
            Export CSV
          </GlassButton>
        )}
      </div>

      {/* Count */}
      {data && (
        <p className="text-label-s text-[rgba(255,255,255,0.35)]">
          {data.total} {data.total === 1 ? 'memory' : 'memories'}
        </p>
      )}

      {/* Cards */}
      {isLoading ? (
        <div className="py-12 text-center text-body-s text-[rgba(255,255,255,0.28)]">
          Loading…
        </div>
      ) : !data?.entries.length ? (
        <div className="py-12 text-center text-body-s text-[rgba(255,255,255,0.28)]">
          No memories yet{favouritesOnly ? ' in favourites' : ''}.
        </div>
      ) : (
        <div className="space-y-4">
          {data.entries.map((entry) => (
            <MemoryCard key={entry.id} entry={entry} />
          ))}
        </div>
      )}
    </div>
  )
}
