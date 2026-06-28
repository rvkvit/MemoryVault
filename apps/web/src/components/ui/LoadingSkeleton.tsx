import { cn } from '@/lib/utils/cn'

interface SkeletonProps {
  className?: string
  width?: string
  height?: string
}

export function Skeleton({ className, width, height }: SkeletonProps) {
  return (
    <div
      className={cn('skeleton', className)}
      style={{ width, height }}
      aria-hidden="true"
    />
  )
}

// Pre-built skeleton for the guestbook entry
export function GuestbookSkeleton() {
  return (
    <div className="flex gap-3 p-4" aria-hidden="true">
      <Skeleton className="w-10 h-10 rounded-full shrink-0" />
      <div className="flex-1 space-y-2">
        <Skeleton className="h-3 w-24" />
        <Skeleton className="h-3 w-full" />
        <Skeleton className="h-3 w-3/4" />
      </div>
    </div>
  )
}

// Hero section skeleton shown during page transitions
export function HeroSkeleton() {
  return (
    <div className="flex flex-col items-center gap-6 pt-24 pb-16" aria-hidden="true">
      <Skeleton className="w-28 h-28 rounded-full" />
      <div className="space-y-3 text-center w-full max-w-sm">
        <Skeleton className="h-8 w-64 mx-auto" />
        <Skeleton className="h-4 w-40 mx-auto" />
        <Skeleton className="h-4 w-32 mx-auto" />
      </div>
    </div>
  )
}
