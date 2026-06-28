'use client'

import { motion } from 'framer-motion'
import { GlassCard } from '@/components/ui/GlassCard'
import { RevealOnScroll, StaggerReveal, StaggerItem } from '@/components/animations/RevealOnScroll'
import { Clock } from 'lucide-react'
import type { TimelineEvent } from '@/types/farewell'

interface TimelineProps {
  events: TimelineEvent[]
}

function formatEventDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-US', {
    month: 'short',
    year: 'numeric',
  })
}

export function Timeline({ events }: TimelineProps) {
  if (events.length === 0) return null

  const sorted = [...events].sort((a, b) => a.display_order - b.display_order)

  return (
    <section className="py-20 px-4">
      <RevealOnScroll className="text-center mb-14">
        <div className="flex items-center gap-2 justify-center mb-3">
          <Clock className="w-4 h-4 text-copilot-teal" />
          <span className="text-label-l text-[rgba(255,255,255,0.40)] tracking-[0.14em] uppercase">
            The journey
          </span>
        </div>
        <h2 className="text-display-m font-light text-gradient">Milestones</h2>
      </RevealOnScroll>

      {/* Vertical timeline */}
      <div className="max-w-2xl mx-auto">
        <StaggerReveal className="relative">

          {/* Connecting line */}
          <div
            className="absolute left-[19px] top-3 bottom-3 w-[1px] md:left-1/2 md:-translate-x-[0.5px]"
            style={{ background: 'linear-gradient(180deg, transparent, rgba(0,212,184,0.25) 10%, rgba(0,212,184,0.25) 90%, transparent)' }}
            aria-hidden="true"
          />

          <div className="space-y-10">
            {sorted.map((event, idx) => {
              const isRight = idx % 2 === 0

              return (
                <StaggerItem key={event.id}>
                  <div className={`flex items-start gap-4 md:gap-8 ${isRight ? 'md:flex-row-reverse' : ''}`}>

                    {/* Dot on the line */}
                    <div className="shrink-0 relative z-10 flex items-center justify-center w-10 h-10 rounded-full bg-space-black border border-[rgba(0,212,184,0.30)] shadow-glow-teal-sm md:absolute md:left-1/2 md:-translate-x-1/2 md:top-1">
                      <span className="text-lg leading-none" role="img" aria-label={event.title}>
                        {event.icon ?? '⭐'}
                      </span>
                    </div>

                    {/* Card — offset to the right on desktop */}
                    <div className={`flex-1 md:w-[calc(50%-2.5rem)] md:flex-none ${isRight ? 'md:mr-auto' : 'md:ml-auto'}`}>
                      <GlassCard
                        variant="default"
                        padding="md"
                        radius="lg"
                        className="glass-hover"
                      >
                        <time className="text-label-s text-copilot-teal tracking-[0.08em] uppercase">
                          {formatEventDate(event.event_date)}
                        </time>
                        <h3 className="text-heading-s text-[rgba(255,255,255,0.90)] mt-1">
                          {event.title}
                        </h3>
                        {event.description && (
                          <p className="text-body-s text-[rgba(255,255,255,0.50)] mt-2 leading-relaxed">
                            {event.description}
                          </p>
                        )}
                      </GlassCard>
                    </div>
                  </div>
                </StaggerItem>
              )
            })}
          </div>
        </StaggerReveal>
      </div>
    </section>
  )
}
