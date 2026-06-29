'use client'

import { useState, type FormEvent } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { GlassButton } from '@/components/ui/GlassButton'
import { Send, CheckCircle2 } from 'lucide-react'

const EMOJI_OPTIONS = ['❤️', '🎉', '🙏', '✨', '👏', '😢', '🚀', '💫']
const MAX_LENGTH = 500

interface GuestbookFormProps {
  onSubmit: (message: string, emoji?: string) => Promise<unknown>
  isPosting: boolean
  error: Error | null
}

export function GuestbookForm({ onSubmit, isPosting, error }: GuestbookFormProps) {
  const [message, setMessage] = useState('')
  const [emoji, setEmoji] = useState<string | undefined>()
  const [submitted, setSubmitted] = useState(false)

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    if (!message.trim() || isPosting) return
    await onSubmit(message.trim(), emoji)
    setMessage('')
    setEmoji(undefined)
    setSubmitted(true)
    setTimeout(() => setSubmitted(false), 4000)
  }

  const remaining = MAX_LENGTH - message.length
  const tooLong = remaining < 0

  return (
    <div className="glass rounded-glass-lg p-5 space-y-4">
      <h3 className="text-heading-s text-[rgba(255,255,255,0.85)]">Leave a message</h3>

      <AnimatePresence mode="wait">
        {submitted ? (
          <motion.div
            key="success"
            className="flex items-center gap-3 py-4 text-success"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
          >
            <CheckCircle2 className="w-5 h-5 shrink-0" />
            <p className="text-body-m">Your message has been added. Thank you!</p>
          </motion.div>
        ) : (
          <motion.form
            key="form"
            onSubmit={(e) => void handleSubmit(e)}
            className="space-y-3"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            {/* Emoji picker */}
            <div className="flex items-center gap-1.5 flex-wrap">
              {EMOJI_OPTIONS.map((e) => (
                <button
                  key={e}
                  type="button"
                  onClick={() => setEmoji(emoji === e ? undefined : e)}
                  className={[
                    'w-8 h-8 text-lg rounded-lg transition-all',
                    emoji === e
                      ? 'bg-[rgba(0,212,184,0.15)] ring-1 ring-copilot-teal scale-110'
                      : 'bg-[rgba(255,255,255,0.04)] hover:bg-[rgba(255,255,255,0.08)]',
                  ].join(' ')}
                  aria-label={`React with ${e}`}
                  aria-pressed={emoji === e}
                >
                  {e}
                </button>
              ))}
            </div>

            {/* Textarea */}
            <div className="relative">
              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Share a memory, a thank-you, or just your best wishes..."
                rows={3}
                maxLength={MAX_LENGTH + 10}
                className={[
                  'w-full bg-[rgba(255,255,255,0.04)] border rounded-[12px] px-4 py-3',
                  'text-body-m text-[rgba(255,255,255,0.85)] placeholder:text-[rgba(255,255,255,0.25)]',
                  'resize-none focus:outline-none transition-colors',
                  tooLong
                    ? 'border-red-400/50 focus:border-red-400'
                    : 'border-[rgba(255,255,255,0.08)] focus:border-copilot-teal/50',
                ].join(' ')}
                aria-label="Your message"
              />
              <span className={`absolute bottom-2.5 right-3 text-label-s ${tooLong ? 'text-red-400' : 'text-[rgba(255,255,255,0.25)]'}`}>
                {remaining}
              </span>
            </div>

            {/* API error */}
            {error && (
              <p className="text-body-s text-red-400">
                {error.message || 'Something went wrong. Please try again.'}
              </p>
            )}

            <GlassButton
              type="submit"
              variant="teal"
              size="md"
              disabled={!message.trim() || tooLong}
              loading={isPosting}
              className="ml-auto"
            >
              <Send className="w-4 h-4" />
              Post message
            </GlassButton>
          </motion.form>
        )}
      </AnimatePresence>
    </div>
  )
}
