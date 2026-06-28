'use client'

import { useRef, useEffect } from 'react'
import { AnimatePresence } from 'framer-motion'
import { useGuestbook } from '@/hooks/useGuestbook'
import { GuestbookEntryCard } from './GuestbookEntry'
import { GuestbookForm } from './GuestbookForm'
import { GuestbookSkeleton } from '@/components/ui/LoadingSkeleton'
import { RevealOnScroll } from '@/components/animations/RevealOnScroll'
import { GlassButton } from '@/components/ui/GlassButton'
import { MessageSquare, ChevronDown } from 'lucide-react'
import type { GuestbookListResponse } from '@/types/farewell'

interface GuestbookProps {
  slug: string
  initialData?: GuestbookListResponse
  recipientRole: 'recipient' | 'admin' | 'colleague'
}

export function Guestbook({ slug, initialData, recipientRole }: GuestbookProps) {
  const {
    entries,
    total,
    hasNextPage,
    isFetchingNextPage,
    fetchNextPage,
    isLoading,
    postEntry,
    isPosting,
    postError,
  } = useGuestbook(slug, initialData)

  // Recipients and colleagues can both leave messages
  const canPost = recipientRole === 'colleague' || recipientRole === 'recipient'

  return (
    <section className="py-20 px-4">
      <RevealOnScroll className="text-center mb-14">
        <div className="flex items-center gap-2 justify-center mb-3">
          <MessageSquare className="w-4 h-4 text-warm-gold" />
          <span className="text-label-l text-[rgba(255,255,255,0.40)] tracking-[0.14em] uppercase">
            Guestbook
          </span>
        </div>
        <h2 className="text-display-m font-light text-gradient">Words from the team</h2>
        {total > 0 && (
          <p className="text-body-m text-[rgba(255,255,255,0.38)] mt-3">
            {total} message{total !== 1 ? 's' : ''}
          </p>
        )}
      </RevealOnScroll>

      <div className="max-w-2xl mx-auto space-y-4">
        {/* Post form — only for colleagues (not the recipient reading their own page) */}
        {canPost && recipientRole === 'colleague' && (
          <RevealOnScroll>
            <GuestbookForm
              onSubmit={(msg, emoji) => postEntry({ message: msg, reaction_emoji: emoji })}
              isPosting={isPosting}
              error={postError instanceof Error ? postError : null}
            />
          </RevealOnScroll>
        )}

        {/* Entry list */}
        {isLoading ? (
          <div className="space-y-2">
            {Array.from({ length: 3 }).map((_, i) => (
              <GuestbookSkeleton key={i} />
            ))}
          </div>
        ) : entries.length === 0 ? (
          <div className="text-center py-16 text-[rgba(255,255,255,0.30)]">
            <MessageSquare className="w-8 h-8 mx-auto mb-3 opacity-30" />
            <p className="text-body-m">No messages yet. Be the first to leave one.</p>
          </div>
        ) : (
          <div className="space-y-3">
            <AnimatePresence initial={false}>
              {entries.map((entry) => (
                <GuestbookEntryCard key={entry.id} entry={entry} />
              ))}
            </AnimatePresence>
          </div>
        )}

        {/* Load more */}
        {hasNextPage && (
          <div className="flex justify-center pt-4">
            <GlassButton
              variant="ghost"
              size="sm"
              loading={isFetchingNextPage}
              onClick={() => void fetchNextPage()}
            >
              <ChevronDown className="w-4 h-4" />
              Load more messages
            </GlassButton>
          </div>
        )}
      </div>
    </section>
  )
}
