'use client'

import { useEffect } from 'react'
import { useMotionValue } from 'framer-motion'

export function useScrollProgress(): ReturnType<typeof useMotionValue<number>> {
  const progress = useMotionValue(0)

  useEffect(() => {
    const update = () => {
      const scrollTop = window.scrollY
      const docHeight = document.documentElement.scrollHeight - window.innerHeight
      const pct = docHeight > 0 ? scrollTop / docHeight : 0
      progress.set(Math.min(1, Math.max(0, pct)))
    }

    window.addEventListener('scroll', update, { passive: true })
    update()
    return () => window.removeEventListener('scroll', update)
  }, [progress])

  return progress
}
