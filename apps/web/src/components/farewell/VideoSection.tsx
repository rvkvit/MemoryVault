'use client'

import { useState, useRef } from 'react'
import { motion } from 'framer-motion'
import { Play, Pause, Volume2, VolumeX, Video } from 'lucide-react'
import { RevealOnScroll } from '@/components/animations/RevealOnScroll'
import { GlassCard } from '@/components/ui/GlassCard'
import type { MediaAsset } from '@/types/farewell'

interface VideoSectionProps {
  video: MediaAsset
}

export function VideoSection({ video }: VideoSectionProps) {
  const [playing, setPlaying] = useState(false)
  const [muted, setMuted] = useState(false)
  const [started, setStarted] = useState(false)
  const videoRef = useRef<HTMLVideoElement>(null)

  if (!video.cdn_url) return null

  const toggle = () => {
    const el = videoRef.current
    if (!el) return
    if (playing) {
      el.pause()
      setPlaying(false)
    } else {
      void el.play()
      setPlaying(true)
      setStarted(true)
    }
  }

  const toggleMute = () => {
    const el = videoRef.current
    if (!el) return
    el.muted = !el.muted
    setMuted(el.muted)
  }

  return (
    <section className="py-20 px-4">
      <RevealOnScroll className="text-center mb-14">
        <div className="flex items-center gap-2 justify-center mb-3">
          <Video className="w-4 h-4 text-blush-rose" />
          <span className="text-label-l text-[rgba(255,255,255,0.40)] tracking-[0.14em] uppercase">
            A message
          </span>
        </div>
        <h2 className="text-display-m font-light text-gradient">From the team</h2>
      </RevealOnScroll>

      <RevealOnScroll className="max-w-card mx-auto">
        <GlassCard variant="default" padding="none" radius="xl" className="overflow-hidden group">
          {/* Video element */}
          <div className="relative aspect-video bg-[rgba(5,8,16,0.6)]">
            <video
              ref={videoRef}
              src={video.cdn_url}
              poster={video.thumbnail_cdn_url ?? undefined}
              className="absolute inset-0 w-full h-full object-cover"
              loop
              onEnded={() => setPlaying(false)}
              aria-label={video.caption ?? 'Farewell video'}
            />

            {/* Play overlay — visible before first play */}
            {!started && (
              <div className="absolute inset-0 flex items-center justify-center bg-[rgba(5,8,16,0.40)]">
                <motion.button
                  onClick={toggle}
                  className="w-20 h-20 rounded-full glass flex items-center justify-center text-white shadow-glow-teal"
                  whileHover={{ scale: 1.08 }}
                  whileTap={{ scale: 0.94 }}
                  aria-label="Play video"
                >
                  <Play className="w-8 h-8 ml-1" fill="currentColor" />
                </motion.button>
              </div>
            )}

            {/* Controls bar */}
            <div className="absolute bottom-0 inset-x-0 p-4 bg-gradient-to-t from-[rgba(5,8,16,0.80)] to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex items-center gap-3">
              <button
                onClick={toggle}
                className="w-8 h-8 rounded-full glass flex items-center justify-center text-white hover:text-copilot-teal transition-colors"
                aria-label={playing ? 'Pause' : 'Play'}
              >
                {playing
                  ? <Pause className="w-4 h-4" fill="currentColor" />
                  : <Play className="w-4 h-4 ml-0.5" fill="currentColor" />
                }
              </button>
              <button
                onClick={toggleMute}
                className="w-8 h-8 rounded-full glass flex items-center justify-center text-white hover:text-copilot-teal transition-colors"
                aria-label={muted ? 'Unmute' : 'Mute'}
              >
                {muted
                  ? <VolumeX className="w-4 h-4" />
                  : <Volume2 className="w-4 h-4" />
                }
              </button>
            </div>
          </div>

          {/* Caption */}
          {video.caption && (
            <div className="px-6 py-4 border-t border-[rgba(255,255,255,0.06)]">
              <p className="text-body-s text-[rgba(255,255,255,0.45)]">{video.caption}</p>
            </div>
          )}
        </GlassCard>
      </RevealOnScroll>
    </section>
  )
}
