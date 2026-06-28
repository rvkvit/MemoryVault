'use client'

import { useScrollProgress } from '@/hooks/useScrollProgress'
import { motion, useSpring, useTransform } from 'framer-motion'

export function ScrollProgress() {
  const rawProgress = useScrollProgress()

  // Spring-smooth the raw scroll value for a trailing, physical feel
  const smoothed = useSpring(rawProgress, { stiffness: 200, damping: 30 })
  const scaleX = useTransform(smoothed, [0, 1], [0, 1])

  return (
    <div
      className="fixed top-0 left-0 right-0 h-[2px] z-[100] pointer-events-none"
      aria-hidden="true"
    >
      <motion.div
        className="h-full origin-left"
        style={{
          scaleX,
          background: 'linear-gradient(90deg, #00D4B8 0%, #0078D4 60%, #8B7CF8 100%)',
        }}
      />
    </div>
  )
}
