'use client'

import Image from 'next/image'
import { motion } from 'framer-motion'
import type { GuestbookEntry } from '@/types/farewell'

interface GuestbookEntryProps {
  entry: GuestbookEntry
}

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime()
  const mins = Math.floor(diff / 60_000)
  if (mins < 1) return 'just now'
  if (mins < 60) return `${mins}m ago`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs}h ago`
  const days = Math.floor(hrs / 24)
  if (days < 7) return `${days}d ago`
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

function initials(name: string): string {
  return name
    .split(' ')
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? '')
    .join('')
}

export function GuestbookEntryCard({ entry }: GuestbookEntryProps) {
  return (
    <motion.article
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
      className="flex gap-3 p-4 rounded-glass glass-hover glass group"
    >
      {/* Avatar */}
      <div className="shrink-0 w-10 h-10 rounded-full overflow-hidden ring-1 ring-[rgba(255,255,255,0.10)]">
        {entry.author_avatar_url ? (
          <Image
            src={entry.author_avatar_url}
            alt={entry.author_display_name}
            width={40}
            height={40}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-ms-blue/80 to-copilot-teal/80 flex items-center justify-center">
            <span className="text-white text-xs font-semibold">
              {initials(entry.author_display_name)}
            </span>
          </div>
        )}
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-baseline gap-2 mb-1">
          <span className="text-body-s font-semibold text-[rgba(255,255,255,0.82)] truncate">
            {entry.author_display_name}
          </span>
          <span className="text-body-s text-[rgba(255,255,255,0.28)] shrink-0">
            {timeAgo(entry.created_at)}
          </span>
        </div>
        <p className="text-body-m text-[rgba(255,255,255,0.68)] leading-relaxed">
          {entry.reaction_emoji && (
            <span className="mr-1.5" aria-label="reaction">
              {entry.reaction_emoji}
            </span>
          )}
          {entry.message}
        </p>
      </div>
    </motion.article>
  )
}
