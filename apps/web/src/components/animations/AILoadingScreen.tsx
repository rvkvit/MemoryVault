'use client'

/**
 * AI Memory Retrieval Loading Screen
 *
 * DESIGN PHILOSOPHY
 * -----------------
 * This screen is modeled after Microsoft Copilot's "thinking" indicator — not a
 * spinner, not a progress bar, but an AI that is visibly doing work. The key
 * principles that make it feel premium rather than playful:
 *
 *   1. Status lines ACCUMULATE (like Copilot's chain-of-thought).
 *      Previous lines don't disappear — they fade to a lower opacity and gain
 *      a checkmark, building a visible trace of completed work.
 *
 *   2. Motion is slow and intentional.
 *      Nothing bounces. Nothing springs. Timing curves are
 *      [0.16, 1, 0.3, 1] (fast start, slow finish) for entrances and
 *      [0.7, 0, 0.84, 0] (slow start, fast finish) for exits.
 *
 *   3. The avatar materializes from blur — not a reveal.
 *      It starts as an unrecognizable smear of color and sharpens phase by phase,
 *      as if the system is reconstructing the person from data.
 *
 *   4. Accent color is used sparingly.
 *      Only the progress arc and the active spinner use teal. Everything else
 *      is white at varying opacities. This is the Copilot monochrome discipline.
 *
 * ANIMATION SYSTEM
 * ----------------
 *   - Outer ring:     CSS rotation (GPU, no JS), 28s/revolution clockwise, dashed
 *   - Progress arc:   Framer Motion stroke-dashoffset, fills phase by phase
 *   - Inner glow:     CSS opacity pulse, 3s cycle
 *   - Avatar:         Framer Motion blur + opacity, keyed to phaseIndex
 *   - Scan line:      Framer Motion translateY, visible during phases 2-3
 *   - Status lines:   Framer Motion y + opacity, staggered entry
 *   - Checkmark:      SVG pathLength draw animation, 350ms ease-out
 *   - Spinner:        CSS rotate 360°, 750ms/revolution, linear
 *   - Progress bar:   Framer Motion scaleX on a 1px bottom line
 *   - Exit:           scale(1.02) + opacity(0), 600ms decelerate-out
 *
 * TIMING (total ~5.4 seconds)
 *   Phase 0 — Authenticating identity           500ms
 *   Phase 1 — Identity verified                 450ms   ← shorter, it's a confirmation
 *   Phase 2 — Searching collaboration history  1100ms
 *   Phase 3 — Analyzing shared projects         950ms
 *   Phase 4 — Generating personalized farewell  900ms
 *   Phase 5 — Rendering your memories           800ms
 *   Hold     — All lines visible                600ms
 */

import { useEffect, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import Image from 'next/image'

// ── Phase definitions ─────────────────────────────────────────────────────────

const PHASES = [
  { label: 'Authenticating identity',           ms: 500  },
  { label: 'Identity verified',                 ms: 450  },
  { label: 'Searching collaboration history',   ms: 1100 },
  { label: 'Analyzing shared projects',         ms: 950  },
  { label: 'Generating personalized farewell',  ms: 900  },
  { label: 'Rendering your memories',           ms: 800  },
] as const

const HOLD_MS = 600

// Progress arc: how much of the ring is filled at each completed phase
const RING_R = 65
const RING_CIRC = 2 * Math.PI * RING_R  // ≈ 408.4px

function progressOffset(completedPhases: number): number {
  const pct = completedPhases / PHASES.length
  // dashoffset = circ when empty, 0 when full, rotated by -90° in SVG
  return RING_CIRC * (1 - pct)
}

// Avatar blur/opacity per completed phase count
const AVATAR_BLUR    = [36, 32, 22, 14, 6, 1, 0]
const AVATAR_OPACITY = [0.10, 0.18, 0.33, 0.52, 0.74, 0.92, 1.0]

// ── Sub-components ────────────────────────────────────────────────────────────

/**
 * Checkmark: SVG path drawn with stroke-dashoffset animation.
 * The "identity verified" phase uses a teal stroke; all others use white/45%.
 */
function DrawnCheckmark({ isVerified = false }: { isVerified?: boolean }) {
  return (
    <motion.svg
      viewBox="0 0 12 12"
      fill="none"
      className="w-3 h-3 shrink-0"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.15 }}
      aria-hidden="true"
    >
      <motion.path
        d="M1.5 6 L4.5 9 L10.5 3"
        stroke={isVerified ? '#00D4B8' : 'rgba(255,255,255,0.45)'}
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
        initial={{ pathLength: 0 }}
        animate={{ pathLength: 1 }}
        transition={{ duration: 0.35, ease: 'easeOut', delay: 0.05 }}
      />
    </motion.svg>
  )
}

/**
 * Spinner: a small circle with one transparent arc, spinning continuously.
 * CSS-driven (not Framer Motion JS) so it runs smoothly even under React load.
 */
function Spinner() {
  return (
    <div
      className="w-3 h-3 rounded-full shrink-0"
      style={{
        border: '1.5px solid rgba(0, 212, 184, 0.25)',
        borderTopColor: '#00D4B8',
        animation: 'ai-spin 0.75s linear infinite',
      }}
      aria-hidden="true"
    />
  )
}

/**
 * A single status line.
 *
 * ENTRY: fades in from y+8 → y+0, opacity 0 → target. Duration 320ms.
 * ACTIVE: white text (0.90), spinner prefix. A blinking cursor at end of text.
 * DONE: lighter text (0.40), drawn checkmark prefix. Text stays, dims.
 *
 * The cursor blink uses a CSS animation so it doesn't re-render the React tree.
 */
function StatusLine({
  label,
  state,
  isVerified = false,
}: {
  label: string
  state: 'active' | 'done'
  isVerified?: boolean
}) {
  const isDone = state === 'done'

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: isDone ? 0.42 : 0.92, y: 0 }}
      transition={{ duration: 0.32, ease: [0.16, 1, 0.3, 1] }}
      className="flex items-center gap-2.5 select-none"
    >
      {/* Left indicator */}
      <div className="w-3 h-3 flex items-center justify-center shrink-0">
        {isDone ? <DrawnCheckmark isVerified={isVerified} /> : <Spinner />}
      </div>

      {/* Label text */}
      <span
        className="font-mono leading-none"
        style={{
          fontSize: '13px',
          color: isDone
            ? 'rgba(255,255,255,0.42)'
            : isVerified
              ? '#00D4B8'
              : 'rgba(255,255,255,0.90)',
          transition: 'color 0.3s ease',
        }}
      >
        {label}
        {/* Blinking cursor — only on active line */}
        {!isDone && (
          <span
            className="inline-block ml-[3px] w-[1.5px] h-[11px] align-middle"
            style={{
              background: '#00D4B8',
              animation: 'ai-cursor 1s step-end infinite',
            }}
            aria-hidden="true"
          />
        )}
      </span>
    </motion.div>
  )
}

/**
 * The SVG orbital system around the avatar.
 *
 * THREE LAYERS:
 *   1. Outer dashed ring (r=74) — decorative, CSS clockwise rotation, 28s
 *   2. Progress arc     (r=65) — fills as phases complete, Framer Motion dashoffset
 *   3. Inner glow ring  (r=56) — CSS opacity pulse, 3s
 *
 * The -90° transform on the progress arc group moves the starting point from
 * 3 o'clock (SVG default) to 12 o'clock.
 *
 * SCAN LINE: during the searching (2) and analyzing (3) phases, a horizontal
 * gradient line sweeps downward across the orb — a subtle scanner effect.
 */
function OrbSystem({
  completedPhases,
  phaseIndex,
  avatarUrl,
  recipientName,
}: {
  completedPhases: number
  phaseIndex: number
  avatarUrl: string | null
  recipientName: string
}) {
  const dashOffset = progressOffset(completedPhases)
  const blurPx     = AVATAR_BLUR[Math.min(completedPhases, AVATAR_BLUR.length - 1)] ?? 0
  const opacity    = AVATAR_OPACITY[Math.min(completedPhases, AVATAR_OPACITY.length - 1)] ?? 1

  const showScanLine = phaseIndex === 2 || phaseIndex === 3

  return (
    <div className="relative w-[160px] h-[160px]">

      {/* SVG orbital rings */}
      <svg
        viewBox="0 0 160 160"
        className="absolute inset-0 w-full h-full"
        aria-hidden="true"
      >
        <defs>
          <linearGradient id="arc-grad" x1="1" y1="0" x2="0" y2="1">
            <stop offset="0%"   stopColor="#00D4B8" />
            <stop offset="100%" stopColor="#0078D4" />
          </linearGradient>
        </defs>

        {/* Ambient glow — wide faint stroke, brightens with avatar */}
        <circle
          cx="80" cy="80" r="52"
          fill="none"
          stroke="rgba(0,212,184,0.08)"
          strokeWidth="18"
          opacity={opacity * 0.8}
        />

        {/* Outer dashed ring — CSS rotation, 28s clockwise */}
        <circle
          cx="80" cy="80" r="74"
          fill="none"
          stroke="rgba(255,255,255,0.09)"
          strokeWidth="1"
          strokeDasharray="3 10"
          style={{ animation: 'ai-spin-cw 28s linear infinite', transformOrigin: '80px 80px' }}
        />

        {/* Progress arc — starts at 12 o'clock via rotate(-90) group */}
        <g style={{ transform: 'rotate(-90deg)', transformOrigin: '80px 80px' }}>
          <circle
            cx="80" cy="80" r={RING_R}
            fill="none"
            stroke="rgba(255,255,255,0.05)"
            strokeWidth="1.5"
          />
          <motion.circle
            cx="80" cy="80" r={RING_R}
            fill="none"
            stroke="url(#arc-grad)"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeDasharray={RING_CIRC}
            animate={{ strokeDashoffset: dashOffset }}
            transition={{ duration: 0.7, ease: [0.4, 0, 0.2, 1] }}
          />
        </g>

        {/* Inner glow ring — CSS pulse */}
        <circle
          cx="80" cy="80" r="56"
          fill="none"
          stroke="rgba(0,212,184,0.10)"
          strokeWidth="8"
          style={{ animation: 'ai-glow-pulse 3s ease-in-out infinite' }}
        />
      </svg>

      {/* Avatar — HTML overlay avoids foreignObject quirks with next/image.
          Centered at the same position as the SVG rings: 30px inset = (160-100)/2 */}
      <div className="absolute" style={{ top: 30, left: 30, width: 100, height: 100 }}>
        <motion.div
          className="w-full h-full rounded-full overflow-hidden"
          animate={{ filter: `blur(${blurPx}px)`, opacity }}
          transition={{ duration: 0.75, ease: [0.16, 1, 0.3, 1] }}
        >
          {avatarUrl ? (
            <Image
              src={avatarUrl}
              alt={recipientName}
              width={100}
              height={100}
              className="object-cover w-full h-full"
              priority
            />
          ) : (
            <div
              className="w-full h-full flex items-center justify-center"
              style={{ background: 'linear-gradient(135deg, #0A1128 0%, #0078D4 100%)' }}
            >
              <span style={{ fontSize: 28, fontWeight: 300, color: 'rgba(255,255,255,0.9)' }}>
                {recipientName.charAt(0).toUpperCase()}
              </span>
            </div>
          )}
        </motion.div>
      </div>

      {/* Scan line — sweeps across the avatar circle during analysis phases */}
      <AnimatePresence>
        {showScanLine && (
          <motion.div
            key="scan"
            className="absolute pointer-events-none rounded-full overflow-hidden"
            style={{ top: 30, left: 30, width: 100, height: 100 }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.4 }}
            aria-hidden="true"
          >
            <motion.div
              className="absolute inset-x-0 h-[1px]"
              style={{
                background: 'linear-gradient(90deg, transparent 0%, rgba(0,212,184,0.30) 25%, rgba(0,212,184,0.55) 50%, rgba(0,212,184,0.30) 75%, transparent 100%)',
                boxShadow: '0 0 5px rgba(0,212,184,0.25)',
              }}
              initial={{ top: '0%' }}
              animate={{ top: '100%' }}
              transition={{ duration: 2.0, repeat: Infinity, ease: 'linear' }}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

// ── Main component ────────────────────────────────────────────────────────────

interface AILoadingScreenProps {
  recipientName: string
  avatarUrl: string | null
  onComplete: () => void
}

export function AILoadingScreen({
  recipientName,
  avatarUrl,
  onComplete,
}: AILoadingScreenProps) {
  // How many phases have been started (index into PHASES)
  const [phaseIndex, setPhaseIndex] = useState<number>(-1)
  // How many phases have been fully completed
  const [completedPhases, setCompletedPhases] = useState<number>(0)

  const onCompleteRef = useRef(onComplete)
  onCompleteRef.current = onComplete

  // Advance through phases sequentially using nested setTimeout chains.
  // We avoid setInterval because phase durations are non-uniform.
  useEffect(() => {
    let cancelled = false

    async function runPhases() {
      for (let i = 0; i < PHASES.length; i++) {
        if (cancelled) return
        setPhaseIndex(i)

        // Wait for this phase's duration
        await sleep(PHASES[i]!.ms)
        if (cancelled) return

        setCompletedPhases(i + 1)

        // Small pause between phases so the checkmark draw is visible
        await sleep(120)
      }

      if (cancelled) return

      // Hold with all phases complete before calling onComplete
      await sleep(HOLD_MS)
      if (!cancelled) onCompleteRef.current()
    }

    void runPhases()
    return () => { cancelled = true }
  }, [])

  return (
    <motion.div
      className="fixed inset-0 z-50 flex flex-col items-center justify-center overflow-hidden"
      style={{ backgroundColor: '#050810' }}
      exit={{ opacity: 0, scale: 1.02 }}
      transition={{ duration: 0.6, ease: [0.7, 0, 0.84, 0] }}
    >
      {/* Ambient radial gradient — deepens as phases advance */}
      <motion.div
        className="absolute inset-0 pointer-events-none"
        animate={{
          opacity: completedPhases === 0 ? 0 : Math.min(1, completedPhases / 4),
        }}
        transition={{ duration: 1.0 }}
        style={{
          background: 'radial-gradient(ellipse 600px 500px at 50% 40%, rgba(0,120,212,0.08) 0%, transparent 70%)',
        }}
        aria-hidden="true"
      />

      {/* Top wordmark */}
      <div className="absolute top-8 left-1/2 -translate-x-1/2 flex items-center gap-2">
        <div
          className="w-1 h-1 rounded-full"
          style={{ background: '#00D4B8', opacity: phaseIndex >= 0 ? 1 : 0, transition: 'opacity 0.5s' }}
          aria-hidden="true"
        />
        <span
          style={{
            fontFamily: 'monospace',
            fontSize: '10px',
            letterSpacing: '0.22em',
            color: 'rgba(255,255,255,0.20)',
            textTransform: 'uppercase',
          }}
        >
          Farewell · Memory System
        </span>
      </div>

      {/* Main layout: orb + status */}
      <div className="relative z-10 flex flex-col items-center gap-10">

        {/* Central orb */}
        <OrbSystem
          completedPhases={completedPhases}
          phaseIndex={phaseIndex}
          avatarUrl={avatarUrl}
          recipientName={recipientName}
        />

        {/* Status line stack */}
        <div className="flex flex-col gap-3 min-w-[280px]" role="status" aria-live="polite" aria-label="Loading progress">
          {PHASES.map((phase, i) => {
            if (i > phaseIndex) return null  // Not yet started

            const isDone = i < phaseIndex || completedPhases > i

            return (
              <StatusLine
                key={i}
                label={phase.label}
                state={isDone ? 'done' : 'active'}
                isVerified={i === 1}  // "Identity verified" gets teal treatment
              />
            )
          })}
        </div>
      </div>

      {/* Progress bar — 1px line at screen bottom */}
      <div
        className="absolute bottom-0 left-0 right-0 h-[1px]"
        style={{ background: 'rgba(255,255,255,0.04)' }}
        aria-hidden="true"
      >
        <motion.div
          className="h-full origin-left"
          animate={{ scaleX: completedPhases / PHASES.length }}
          transition={{ duration: 0.7, ease: [0.4, 0, 0.2, 1] }}
          style={{
            background: 'linear-gradient(90deg, #00D4B8 0%, #0078D4 60%, #8B7CF8 100%)',
          }}
        />
      </div>

      {/* Inlined CSS animations — no globals.css dependency */}
      <style>{`
        @keyframes ai-spin-cw {
          from { transform: rotate(0deg); }
          to   { transform: rotate(360deg); }
        }
        @keyframes ai-glow-pulse {
          0%, 100% { opacity: 0.35; }
          50%       { opacity: 1.0; }
        }
        @keyframes ai-cursor {
          0%, 100% { opacity: 1; }
          50%       { opacity: 0; }
        }
        @keyframes ai-spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </motion.div>
  )
}

// ── Utility ───────────────────────────────────────────────────────────────────

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}
