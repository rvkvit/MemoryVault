'use client'

import Image from 'next/image'
import { motion } from 'framer-motion'
import { ChevronDown, Calendar, Building2, Users } from 'lucide-react'
import type { Recipient } from '@/types/farewell'

interface HeroSectionProps {
  recipient: Recipient
}

function formatTenure(hireDate: string | null, lastDay: string | null): string | null {
  if (!hireDate) return null
  const start = new Date(hireDate)
  const end = lastDay ? new Date(lastDay) : new Date()
  const years = (end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24 * 365.25)
  if (years < 1) {
    const months = Math.round(years * 12)
    return `${months} month${months !== 1 ? 's' : ''}`
  }
  const y = Math.floor(years)
  return `${y} year${y !== 1 ? 's' : ''}`
}

function formatDate(iso: string | null): string | null {
  if (!iso) return null
  return new Date(iso).toLocaleDateString('en-US', {
    year: 'numeric', month: 'long', day: 'numeric',
  })
}

const stagger = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.08, delayChildren: 0.1 } },
}

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: [0.16, 1, 0.3, 1] } },
}

export function HeroSection({ recipient }: HeroSectionProps) {
  const tenure = formatTenure(recipient.hire_date, recipient.last_day)
  const lastDay = formatDate(recipient.last_day)

  return (
    <section className="relative min-h-screen flex flex-col items-center justify-center pt-12 pb-24 px-4">

      {/* Soft glow behind hero */}
      <div
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full pointer-events-none"
        style={{ background: 'radial-gradient(circle, rgba(0,120,212,0.06) 0%, transparent 70%)' }}
        aria-hidden="true"
      />

      <motion.div
        variants={stagger}
        initial="hidden"
        animate="visible"
        className="relative z-10 flex flex-col items-center gap-8 text-center max-w-2xl"
      >
        {/* Avatar with animated teal ring */}
        <motion.div variants={fadeUp} className="relative">
          <div className="relative w-32 h-32">
            {/* Ring */}
            <svg viewBox="0 0 128 128" className="absolute inset-0 w-full h-full -rotate-90" aria-hidden="true">
              <circle cx="64" cy="64" r="60" fill="none" stroke="rgba(0,212,184,0.12)" strokeWidth="2" />
              <motion.circle
                cx="64" cy="64" r="60"
                fill="none"
                stroke="url(#hero-ring)"
                strokeWidth="2"
                strokeLinecap="round"
                strokeDasharray="90 377"
                animate={{ strokeDashoffset: [0, -377] }}
                transition={{ duration: 12, repeat: Infinity, ease: 'linear' }}
              />
              <defs>
                <linearGradient id="hero-ring" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="#00D4B8" />
                  <stop offset="100%" stopColor="transparent" />
                </linearGradient>
              </defs>
            </svg>

            {/* Avatar image */}
            <div className="absolute inset-3 rounded-full overflow-hidden ring-1 ring-[rgba(255,255,255,0.1)]">
              {recipient.avatar_blob_url ? (
                <Image
                  src={recipient.avatar_blob_url}
                  alt={recipient.display_name}
                  fill
                  sizes="104px"
                  className="object-cover"
                  priority
                />
              ) : (
                <div className="w-full h-full bg-gradient-to-br from-ms-blue to-copilot-teal flex items-center justify-center">
                  <span className="text-3xl font-light text-white">
                    {recipient.display_name.charAt(0).toUpperCase()}
                  </span>
                </div>
              )}
            </div>
          </div>
        </motion.div>

        {/* Name */}
        <motion.h1
          variants={fadeUp}
          className="text-display-xl font-light tracking-tight text-gradient leading-none"
        >
          {recipient.display_name}
        </motion.h1>

        {/* Role / Department / Team */}
        <motion.div variants={fadeUp} className="space-y-1">
          {recipient.job_title && (
            <p className="text-heading-s text-[rgba(255,255,255,0.70)]">
              {recipient.job_title}
            </p>
          )}
          <div className="flex items-center justify-center gap-4 flex-wrap">
            {recipient.department && (
              <span className="flex items-center gap-1.5 text-body-s text-[rgba(255,255,255,0.45)]">
                <Building2 className="w-3.5 h-3.5" />
                {recipient.department}
              </span>
            )}
            {recipient.team && (
              <span className="flex items-center gap-1.5 text-body-s text-[rgba(255,255,255,0.45)]">
                <Users className="w-3.5 h-3.5" />
                {recipient.team}
              </span>
            )}
          </div>
        </motion.div>

        {/* Tenure + Last day badge */}
        <motion.div variants={fadeUp} className="flex items-center gap-3 flex-wrap justify-center">
          {tenure && (
            <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[rgba(255,255,255,0.04)] border border-[rgba(255,255,255,0.08)] text-body-s text-[rgba(255,255,255,0.60)]">
              <span className="text-copilot-teal font-semibold">{tenure}</span>
              of extraordinary work
            </span>
          )}
          {lastDay && (
            <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[rgba(240,180,41,0.08)] border border-[rgba(240,180,41,0.20)] text-warm-gold text-body-s">
              <Calendar className="w-3.5 h-3.5" />
              Last day: {lastDay}
            </span>
          )}
        </motion.div>

        {/* Accent divider */}
        <motion.div
          variants={fadeUp}
          className="accent-line w-32 mx-auto"
        />
      </motion.div>

      {/* Scroll chevron */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-1">
        <p className="text-label-s text-[rgba(255,255,255,0.25)] tracking-[0.15em] uppercase">
          Scroll
        </p>
        <ChevronDown className="w-4 h-4 text-[rgba(255,255,255,0.25)] animate-scroll-chevron" />
      </div>
    </section>
  )
}
