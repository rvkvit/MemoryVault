import { GlassCard } from '@/components/ui/GlassCard'
import { FloatingOrbs } from '@/components/animations/FloatingOrbs'
import { Search } from 'lucide-react'

export default function NotFound() {
  return (
    <div className="relative min-h-dvh flex items-center justify-center p-4">
      <FloatingOrbs />
      <div className="relative z-10 max-w-md w-full text-center space-y-8">
        <div className="flex justify-center">
          <div className="w-20 h-20 rounded-full glass flex items-center justify-center">
            <Search className="w-8 h-8 text-[rgba(255,255,255,0.40)]" />
          </div>
        </div>
        <div className="space-y-3">
          <h1 className="text-display-m font-light text-gradient">Page not found</h1>
          <p className="text-body-l text-[rgba(255,255,255,0.50)]">
            This farewell page doesn't exist or may have been removed.
          </p>
        </div>
        <GlassCard variant="subtle" padding="md" radius="lg">
          <p className="text-body-s text-[rgba(255,255,255,0.38)]">
            Check the link in your invitation email and try again.
          </p>
        </GlassCard>
      </div>
    </div>
  )
}
