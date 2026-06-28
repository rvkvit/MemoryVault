'use client'

import { motion } from 'framer-motion'

interface TypingEffectProps {
  text: string
  delay?: number     // initial delay before typing starts (seconds)
  speed?: number     // seconds per character
  className?: string
}

export function TypingEffect({
  text,
  delay = 0.3,
  speed = 0.025,
  className,
}: TypingEffectProps) {
  const chars = Array.from(text)

  return (
    <span className={className} aria-label={text}>
      {chars.map((char, i) => (
        <motion.span
          key={i}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{
            delay: delay + i * speed,
            duration: 0.01,
          }}
          // Non-breaking space so whitespace renders correctly
          aria-hidden="true"
        >
          {char === ' ' ? ' ' : char}
        </motion.span>
      ))}
      {/* Blinking cursor — fades out after text is complete */}
      <motion.span
        className="inline-block w-[2px] h-[1em] bg-copilot-teal ml-[2px] align-middle"
        initial={{ opacity: 1 }}
        animate={{ opacity: 0 }}
        transition={{
          delay: delay + chars.length * speed + 0.4,
          duration: 0.3,
        }}
        aria-hidden="true"
      />
    </span>
  )
}
