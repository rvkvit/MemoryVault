'use client'

import { useRef, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { Image, Send } from 'lucide-react'
import { VoiceRecorder } from './VoiceRecorder'
import { StayConnected } from './StayConnected'
import { submitMemory } from '@/lib/api/memories'

type Phase = 'form' | 'saving' | 'saved' | 'connected'

const SAVING_STEPS = [
  'Saving your memory…',
  'Memory successfully preserved.',
  'Thank you for being part of my journey.',
]

interface LeaveAMemoryProps {
  slug: string
}

export function LeaveAMemory({ slug }: LeaveAMemoryProps) {
  const [phase, setPhase] = useState<Phase>('form')
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [message, setMessage] = useState('')
  const [voiceBlob, setVoiceBlob] = useState<Blob | null>(null)
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const [savingStep, setSavingStep] = useState(0)
  const [error, setError] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setImageFile(file)
    const url = URL.createObjectURL(file)
    setImagePreview(url)
  }

  const runSavingAnimation = async () => {
    setPhase('saving')
    for (let i = 0; i < SAVING_STEPS.length; i++) {
      setSavingStep(i)
      await new Promise((r) => setTimeout(r, 1100))
    }
    setPhase('connected')
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    try {
      await submitMemory(slug, {
        submitter_name: name,
        submitter_email: email || undefined,
        message,
        voice: voiceBlob,
        image: imageFile,
      })
      await runSavingAnimation()
    } catch {
      setError('Something went wrong. Please try again.')
    }
  }

  return (
    <section className="max-w-2xl mx-auto px-4 sm:px-6 py-20">
      <div className="space-y-8">
        {/* Section heading */}
        <div className="space-y-3">
          <p className="text-label-s text-[rgba(255,255,255,0.38)] uppercase tracking-[0.14em]">
            Leave a Memory
          </p>
          <p className="text-body-m text-[rgba(255,255,255,0.60)] leading-relaxed">
            Every collaboration leaves a story. If our paths crossed through projects, automation,
            AI initiatives, production incidents, coffee chats or simply a few conversations,
            I would genuinely love to hear what you&apos;ll remember. Your message will become
            part of my personal Memory Vault.
          </p>
        </div>

        <AnimatePresence mode="wait">
          {/* ── Saving animation ──────────────────────────────────── */}
          {phase === 'saving' && (
            <motion.div
              key="saving"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="py-12 flex flex-col items-center gap-4"
            >
              <div className="w-10 h-10 border-2 border-ms-blue/30 border-t-ms-blue rounded-full animate-spin" />
              <AnimatePresence mode="wait">
                <motion.p
                  key={savingStep}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  transition={{ duration: 0.35 }}
                  className="text-body-s text-[rgba(255,255,255,0.65)]"
                >
                  {SAVING_STEPS[savingStep]}
                </motion.p>
              </AnimatePresence>
            </motion.div>
          )}

          {/* ── Stay Connected ────────────────────────────────────── */}
          {phase === 'connected' && (
            <motion.div
              key="connected"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
            >
              <p className="text-body-m text-[rgba(255,255,255,0.80)] mb-2">
                Memory saved. Thank you.
              </p>
              <StayConnected />
            </motion.div>
          )}

          {/* ── Form ─────────────────────────────────────────────── */}
          {(phase === 'form') && (
            <motion.form
              key="form"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onSubmit={(e) => void handleSubmit(e)}
              className="space-y-5"
            >
              {/* Name + Email */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-label-s text-[rgba(255,255,255,0.45)]">
                    Your name <span className="text-red-400">*</span>
                  </label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                    maxLength={255}
                    className="w-full px-3.5 py-2.5 rounded-[10px] bg-[rgba(255,255,255,0.03)] border border-[rgba(255,255,255,0.08)] text-body-s text-[rgba(255,255,255,0.80)] placeholder-[rgba(255,255,255,0.22)] focus:outline-none focus:border-ms-blue/40 focus:ring-1 focus:ring-ms-blue/20 transition-all"
                    placeholder="Your name"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-label-s text-[rgba(255,255,255,0.45)]">
                    Email (optional)
                  </label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    maxLength={320}
                    className="w-full px-3.5 py-2.5 rounded-[10px] bg-[rgba(255,255,255,0.03)] border border-[rgba(255,255,255,0.08)] text-body-s text-[rgba(255,255,255,0.80)] placeholder-[rgba(255,255,255,0.22)] focus:outline-none focus:border-ms-blue/40 focus:ring-1 focus:ring-ms-blue/20 transition-all"
                    placeholder="your@email.com"
                  />
                </div>
              </div>

              {/* Message */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-label-s text-[rgba(255,255,255,0.45)]">
                    Your memory <span className="text-red-400">*</span>
                  </label>
                  <span className="text-label-s text-[rgba(255,255,255,0.28)] tabular-nums">
                    {message.length} / 5,000
                  </span>
                </div>
                <textarea
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  required
                  maxLength={5000}
                  rows={6}
                  className="w-full px-3.5 py-3 rounded-[10px] bg-[rgba(255,255,255,0.03)] border border-[rgba(255,255,255,0.08)] text-body-s text-[rgba(255,255,255,0.80)] placeholder-[rgba(255,255,255,0.22)] focus:outline-none focus:border-ms-blue/40 focus:ring-1 focus:ring-ms-blue/20 transition-all resize-none"
                  placeholder="Share a memory, a project you worked on together, a moment that stood out…"
                />
              </div>

              {/* Voice recorder */}
              <div className="space-y-1.5">
                <label className="text-label-s text-[rgba(255,255,255,0.45)]">
                  Voice note (optional)
                </label>
                <VoiceRecorder onRecorded={(b) => setVoiceBlob(b)} maxSeconds={60} />
              </div>

              {/* Image upload */}
              <div className="space-y-1.5">
                <label className="text-label-s text-[rgba(255,255,255,0.45)]">
                  Photo (optional)
                </label>
                {imagePreview ? (
                  <div className="relative w-fit">
                    <img
                      src={imagePreview}
                      alt="Selected"
                      className="h-28 w-auto rounded-[10px] object-cover border border-[rgba(255,255,255,0.10)]"
                    />
                    <button
                      type="button"
                      onClick={() => { setImageFile(null); setImagePreview(null) }}
                      className="absolute -top-2 -right-2 w-5 h-5 rounded-full bg-[#0d1117] border border-[rgba(255,255,255,0.12)] text-[rgba(255,255,255,0.50)] hover:text-red-400 text-xs flex items-center justify-center transition-colors"
                    >
                      ×
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="flex items-center gap-2.5 px-4 py-2.5 rounded-[10px] bg-[rgba(255,255,255,0.04)] border border-[rgba(255,255,255,0.09)] text-body-s text-[rgba(255,255,255,0.65)] hover:bg-[rgba(255,255,255,0.07)] transition-all"
                  >
                    <Image className="w-4 h-4" />
                    Add a photo
                  </button>
                )}
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/jpeg,image/png,image/webp,image/gif"
                  className="hidden"
                  onChange={handleImageSelect}
                />
              </div>

              {error && (
                <div className="px-4 py-3 rounded-[10px] bg-red-500/08 border border-red-500/20 text-body-s text-red-400">
                  {error}
                </div>
              )}

              <button
                type="submit"
                className="flex items-center gap-2.5 px-5 py-2.5 rounded-[10px] bg-ms-blue hover:bg-ms-blue/90 text-body-s font-medium text-white transition-all duration-150 disabled:opacity-50"
              >
                <Send className="w-4 h-4" />
                Leave this memory
              </button>
            </motion.form>
          )}
        </AnimatePresence>
      </div>
    </section>
  )
}
