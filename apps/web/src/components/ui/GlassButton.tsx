'use client'

import { cn } from '@/lib/utils/cn'
import { motion } from 'framer-motion'
import type { ComponentPropsWithoutRef } from 'react'

interface GlassButtonProps extends ComponentPropsWithoutRef<'button'> {
  variant?: 'primary' | 'ghost' | 'teal'
  size?: 'sm' | 'md' | 'lg'
  loading?: boolean
  as?: 'button' | 'a'
  href?: string
}

const variantStyles = {
  primary: [
    'bg-ms-blue/90 border border-ms-blue',
    'text-white',
    'hover:bg-ms-blue hover:shadow-glow-blue',
  ].join(' '),
  ghost: [
    'bg-[rgba(255,255,255,0.04)] border border-[rgba(255,255,255,0.08)]',
    'text-[rgba(255,255,255,0.80)]',
    'hover:bg-[rgba(255,255,255,0.08)] hover:border-[rgba(255,255,255,0.18)] hover:text-white',
  ].join(' '),
  teal: [
    'bg-copilot-teal/10 border border-copilot-teal/30',
    'text-copilot-teal',
    'hover:bg-copilot-teal/20 hover:border-copilot-teal/60 hover:shadow-glow-teal-sm',
  ].join(' '),
}

const sizeStyles = {
  sm: 'px-4 py-2 text-sm gap-1.5 rounded-[10px]',
  md: 'px-5 py-2.5 text-body-m gap-2 rounded-[12px]',
  lg: 'px-7 py-3.5 text-body-l gap-2.5 rounded-[14px]',
}

export function GlassButton({
  variant = 'ghost',
  size = 'md',
  loading = false,
  className,
  children,
  disabled,
  ...props
}: GlassButtonProps) {
  return (
    <motion.button
      whileTap={{ scale: 0.96 }}
      whileHover={{ scale: 1.01 }}
      transition={{ type: 'spring', stiffness: 500, damping: 30 }}
      className={cn(
        'relative inline-flex items-center justify-center font-medium',
        'backdrop-blur-glass-sm',
        'transition-all duration-150',
        'disabled:opacity-40 disabled:pointer-events-none',
        'cursor-pointer select-none',
        variantStyles[variant],
        sizeStyles[size],
        className,
      )}
      disabled={disabled ?? loading}
      {...(props as ComponentPropsWithoutRef<typeof motion.button>)}
    >
      {loading && (
        <svg
          className="absolute inset-0 m-auto w-4 h-4 animate-spin"
          fill="none"
          viewBox="0 0 24 24"
        >
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4l3-3-3-3v4a8 8 0 00-8 8h4z" />
        </svg>
      )}
      <span className={cn('flex items-center gap-inherit', loading && 'opacity-0')}>
        {children}
      </span>
    </motion.button>
  )
}
