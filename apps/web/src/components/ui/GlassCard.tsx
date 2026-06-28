import { cn } from '@/lib/utils/cn'
import type { ComponentPropsWithoutRef } from 'react'

interface GlassCardProps extends ComponentPropsWithoutRef<'div'> {
  variant?: 'default' | 'dark' | 'subtle'
  padding?: 'none' | 'sm' | 'md' | 'lg' | 'xl'
  radius?: 'md' | 'lg' | 'xl'
}

const paddingMap = {
  none: '',
  sm: 'p-4',
  md: 'p-6',
  lg: 'p-8',
  xl: 'p-12 md:p-16',
} as const

const radiusMap = {
  md: 'rounded-glass',
  lg: 'rounded-glass-lg',
  xl: 'rounded-glass-xl',
} as const

const variantMap = {
  default: 'bg-[rgba(255,255,255,0.04)] border border-[rgba(255,255,255,0.08)]',
  dark:    'bg-[rgba(10,17,40,0.95)] border border-[rgba(255,255,255,0.12)]',
  subtle:  'bg-[rgba(255,255,255,0.02)] border border-[rgba(255,255,255,0.05)]',
} as const

export function GlassCard({
  variant = 'default',
  padding = 'md',
  radius = 'lg',
  className,
  children,
  ...props
}: GlassCardProps) {
  return (
    <div
      className={cn(
        'backdrop-blur-glass-md',
        variantMap[variant],
        paddingMap[padding],
        radiusMap[radius],
        className,
      )}
      {...props}
    >
      {children}
    </div>
  )
}
