import { Heart } from 'lucide-react'

interface FooterProps {
  recipientName: string
  lastDay: string | null
}

function formatYear(iso: string | null): string {
  if (!iso) return new Date().getFullYear().toString()
  return new Date(iso).getFullYear().toString()
}

export function Footer({ recipientName, lastDay }: FooterProps) {
  return (
    <footer className="relative py-20 px-4 border-t border-[rgba(255,255,255,0.05)]">
      {/* Glow */}
      <div
        className="absolute inset-x-0 top-0 h-px"
        style={{ background: 'linear-gradient(90deg, transparent 0%, rgba(0,212,184,0.25) 30%, rgba(0,120,212,0.25) 70%, transparent 100%)' }}
        aria-hidden="true"
      />

      <div className="max-w-2xl mx-auto text-center space-y-4">
        <p className="text-label-s text-[rgba(255,255,255,0.20)] tracking-[0.20em] uppercase">
          {formatYear(lastDay)} · Farewell
        </p>

        <div className="accent-line w-20 mx-auto" />

        <p className="text-body-m text-[rgba(255,255,255,0.38)] max-w-sm mx-auto">
          This page was created to celebrate{' '}
          <span className="text-[rgba(255,255,255,0.65)]">{recipientName}</span>
          {' '}and the impact they've left behind.
        </p>

        <div className="flex items-center justify-center gap-1.5 text-body-s text-[rgba(255,255,255,0.22)]">
          <span>Created with gratitude</span>
          <Heart className="w-3.5 h-3.5 text-blush-rose fill-current" aria-label="love" />
          <span>by Rovin Krishnia</span>
        </div>
      </div>
    </footer>
  )
}
