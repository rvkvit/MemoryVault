import type { Metadata } from 'next'
import { GlassCard } from '@/components/ui/GlassCard'
import { FloatingOrbs } from '@/components/animations/FloatingOrbs'
import { Shield, ExternalLink } from 'lucide-react'

export const metadata: Metadata = { title: 'Access Restricted · Farewell' }

export default function DeniedPage() {
  return (
    <div className="relative min-h-dvh flex items-center justify-center p-4">
      <FloatingOrbs />

      <div className="relative z-10 max-w-md w-full text-center space-y-8">

        {/* Icon */}
        <div className="flex justify-center">
          <div className="w-20 h-20 rounded-full bg-[rgba(240,180,41,0.08)] border border-[rgba(240,180,41,0.20)] flex items-center justify-center">
            <Shield className="w-9 h-9 text-warm-gold" />
          </div>
        </div>

        {/* Copy */}
        <div className="space-y-3">
          <h1 className="text-display-m font-light text-gradient">
            This page is private
          </h1>
          <p className="text-body-l text-[rgba(255,255,255,0.55)] max-w-sm mx-auto">
            This farewell page was created for a specific person. The account you
            signed in with doesn't match the intended recipient.
          </p>
        </div>

        <GlassCard variant="subtle" padding="md" radius="lg">
          <p className="text-body-s text-[rgba(255,255,255,0.42)] leading-relaxed">
            If you believe this is a mistake, please sign in with the work account
            where you received the invitation email.
          </p>
        </GlassCard>

        {/* Try again */}
        <a
          href="https://login.microsoftonline.com/common/oauth2/v2.0/logout"
          className="inline-flex items-center gap-2 px-6 py-3 rounded-[14px] glass glass-hover text-body-m text-[rgba(255,255,255,0.70)] hover:text-white transition-colors"
        >
          <ExternalLink className="w-4 h-4" />
          Sign in with a different account
        </a>

        <p className="text-body-s text-[rgba(255,255,255,0.22)]">
          Farewell · Invite-only experience
        </p>
      </div>
    </div>
  )
}
