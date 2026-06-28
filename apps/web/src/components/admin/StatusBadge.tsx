import { cn } from '@/lib/utils/cn'

interface StatusBadgeProps {
  published: boolean
  active?: boolean
  className?: string
}

export function StatusBadge({ published, active = true, className }: StatusBadgeProps) {
  if (!active) {
    return (
      <span className={cn(
        'inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-label-s',
        'bg-[rgba(255,255,255,0.04)] text-[rgba(255,255,255,0.30)] border border-[rgba(255,255,255,0.07)]',
        className,
      )}>
        <span className="w-1.5 h-1.5 rounded-full bg-[rgba(255,255,255,0.20)]" />
        Inactive
      </span>
    )
  }

  if (published) {
    return (
      <span className={cn(
        'inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-label-s',
        'bg-copilot-teal/10 text-copilot-teal border border-copilot-teal/20',
        className,
      )}>
        <span className="w-1.5 h-1.5 rounded-full bg-copilot-teal animate-pulse" />
        Live
      </span>
    )
  }

  return (
    <span className={cn(
      'inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-label-s',
      'bg-[rgba(255,255,255,0.04)] text-[rgba(255,255,255,0.45)] border border-[rgba(255,255,255,0.09)]',
      className,
    )}>
      <span className="w-1.5 h-1.5 rounded-full bg-[rgba(255,255,255,0.30)]" />
      Draft
    </span>
  )
}
