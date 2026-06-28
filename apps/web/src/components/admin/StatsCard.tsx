import { cn } from '@/lib/utils/cn'
import type { LucideIcon } from 'lucide-react'

interface StatsCardProps {
  label: string
  value: number | string
  icon: LucideIcon
  accent?: 'blue' | 'teal' | 'violet' | 'gold'
}

const accentMap = {
  blue:   'text-ms-blue   bg-ms-blue/10   border-ms-blue/15',
  teal:   'text-copilot-teal bg-copilot-teal/10 border-copilot-teal/15',
  violet: 'text-soft-violet  bg-soft-violet/10  border-soft-violet/15',
  gold:   'text-warm-gold    bg-warm-gold/10    border-warm-gold/15',
} as const

export function StatsCard({ label, value, icon: Icon, accent = 'blue' }: StatsCardProps) {
  return (
    <div className="bg-[rgba(255,255,255,0.03)] border border-[rgba(255,255,255,0.07)] rounded-[14px] p-5 flex items-start justify-between gap-4">
      <div className="min-w-0">
        <p className="text-label-s text-[rgba(255,255,255,0.40)] uppercase tracking-wider truncate">
          {label}
        </p>
        <p className="text-display-s font-light text-[rgba(255,255,255,0.90)] mt-1.5 tabular-nums">
          {typeof value === 'number' ? value.toLocaleString() : value}
        </p>
      </div>
      <div className={cn('p-2.5 rounded-[10px] border shrink-0', accentMap[accent])}>
        <Icon className="w-5 h-5" />
      </div>
    </div>
  )
}
