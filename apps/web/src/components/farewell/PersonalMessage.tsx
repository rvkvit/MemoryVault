'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { RevealOnScroll } from '@/components/animations/RevealOnScroll'
import { Sparkles } from 'lucide-react'

const TRUNCATE_AT = 400

interface PersonalMessageProps {
  message: string
  authorName?: string
}

export function PersonalMessage({ message, authorName }: PersonalMessageProps) {
  const [expanded, setExpanded] = useState(false)
  const needsTruncate = message.length > TRUNCATE_AT
  const displayText = needsTruncate && !expanded ? message.slice(0, TRUNCATE_AT) + '…' : message

  return (
    <RevealOnScroll>
      <section className="relative px-4 sm:px-6 py-20">
        <div className="max-w-2xl mx-auto w-full">

          {/* Section label */}
          <div className="flex items-center gap-2 mb-8 justify-center">
            <Sparkles className="w-4 h-4 text-warm-gold shrink-0" />
            <span className="text-label-l text-[rgba(255,255,255,0.40)] tracking-[0.14em] uppercase">
              A personal note
            </span>
          </div>

          <div className="relative bg-[rgba(255,255,255,0.04)] border border-[rgba(255,255,255,0.08)] backdrop-blur-md rounded-[20px] p-6 sm:p-10 overflow-hidden">
            {/* Left accent */}
            <div
              className="absolute left-0 top-8 bottom-8 w-[2px] rounded-full"
              style={{ background: 'linear-gradient(180deg, transparent 0%, #00D4B8 30%, #0078D4 70%, transparent 100%)' }}
              aria-hidden="true"
            />

            {/* Decorative quote mark */}
            <div
              className="absolute top-2 right-4 text-[80px] sm:text-[120px] font-serif leading-none select-none pointer-events-none"
              style={{ color: 'rgba(0,212,184,0.06)' }}
              aria-hidden="true"
            >
              &ldquo;
            </div>

            <div className="pl-4 sm:pl-6 relative">
              <motion.p
                className="text-body-l text-[rgba(255,255,255,0.82)] leading-[1.85] whitespace-pre-wrap break-words w-full"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
              >
                {displayText}
              </motion.p>

              <AnimatePresence>
                {needsTruncate && !expanded && (
                  <motion.button
                    onClick={() => setExpanded(true)}
                    className="mt-4 text-copilot-teal text-body-s hover:underline focus-visible:outline-none"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                  >
                    Read more
                  </motion.button>
                )}
              </AnimatePresence>

              {authorName && (
                <div className="mt-6 pt-5 border-t border-[rgba(255,255,255,0.06)]">
                  <p className="text-body-s text-[rgba(255,255,255,0.40)] italic">
                    — {authorName}
                  </p>
                </div>
              )}
            </div>
          </div>

        </div>
      </section>
    </RevealOnScroll>
  )
}
