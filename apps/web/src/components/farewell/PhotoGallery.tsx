'use client'

import { useState } from 'react'
import Image from 'next/image'
import { AnimatePresence, motion } from 'framer-motion'
import { X, Images } from 'lucide-react'
import { RevealOnScroll, StaggerReveal, StaggerItem } from '@/components/animations/RevealOnScroll'
import type { MediaAsset } from '@/types/farewell'

interface PhotoGalleryProps {
  photos: MediaAsset[]
}

export function PhotoGallery({ photos }: PhotoGalleryProps) {
  const [selected, setSelected] = useState<MediaAsset | null>(null)

  if (photos.length === 0) return null

  return (
    <section className="py-20 px-4">
      <RevealOnScroll className="text-center mb-14">
        <div className="flex items-center gap-2 justify-center mb-3">
          <Images className="w-4 h-4 text-soft-violet" />
          <span className="text-label-l text-[rgba(255,255,255,0.40)] tracking-[0.14em] uppercase">
            Memories
          </span>
        </div>
        <h2 className="text-display-m font-light text-gradient">Captured moments</h2>
      </RevealOnScroll>

      {/* Grid */}
      <StaggerReveal className="max-w-page mx-auto columns-2 md:columns-3 lg:columns-4 gap-3 space-y-3">
        {photos.map((photo, idx) => (
          <StaggerItem key={photo.id}>
            <motion.button
              layoutId={`photo-${photo.id}`}
              onClick={() => setSelected(photo)}
              className="relative block w-full overflow-hidden rounded-glass cursor-zoom-in ring-1 ring-[rgba(255,255,255,0.07)] hover:ring-[rgba(0,212,184,0.3)] transition-all"
              whileHover={{ scale: 1.01 }}
              transition={{ type: 'spring', stiffness: 400, damping: 30 }}
              aria-label={photo.caption ?? `Photo ${idx + 1}`}
            >
              {photo.cdn_url ? (
                <Image
                  src={photo.thumbnail_cdn_url ?? photo.cdn_url}
                  alt={photo.caption ?? ''}
                  width={photo.width_px ?? 400}
                  height={photo.height_px ?? 300}
                  className="w-full h-auto object-cover"
                  sizes="(max-width: 768px) 50vw, (max-width: 1200px) 33vw, 25vw"
                />
              ) : (
                <div className="w-full aspect-square bg-[rgba(255,255,255,0.04)] flex items-center justify-center">
                  <span className="text-[rgba(255,255,255,0.20)]">No image</span>
                </div>
              )}
              {photo.caption && (
                <div className="absolute inset-x-0 bottom-0 p-2 bg-gradient-to-t from-[rgba(5,8,16,0.8)] to-transparent">
                  <p className="text-[rgba(255,255,255,0.75)] text-body-s leading-tight">
                    {photo.caption}
                  </p>
                </div>
              )}
            </motion.button>
          </StaggerItem>
        ))}
      </StaggerReveal>

      {/* Lightbox */}
      <AnimatePresence>
        {selected && (
          <motion.div
            className="fixed inset-0 z-50 flex items-center justify-center p-4 md:p-10"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={() => setSelected(null)}
          >
            {/* Backdrop */}
            <div className="absolute inset-0 bg-[rgba(5,8,16,0.92)] backdrop-blur-glass-lg" />

            {/* Close button */}
            <motion.button
              className="absolute top-5 right-5 z-10 w-10 h-10 rounded-full glass flex items-center justify-center text-[rgba(255,255,255,0.60)] hover:text-white transition-colors"
              onClick={() => setSelected(null)}
              aria-label="Close photo"
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
            >
              <X className="w-5 h-5" />
            </motion.button>

            {/* Image — shared element transition */}
            <motion.div
              layoutId={`photo-${selected.id}`}
              className="relative z-10 max-w-5xl w-full rounded-glass-xl overflow-hidden shadow-card"
              onClick={(e) => e.stopPropagation()}
            >
              {selected.cdn_url && (
                <Image
                  src={selected.cdn_url}
                  alt={selected.caption ?? ''}
                  width={selected.width_px ?? 1200}
                  height={selected.height_px ?? 900}
                  className="w-full h-auto object-contain max-h-[80vh]"
                  sizes="(max-width: 1280px) 100vw, 1200px"
                  priority
                />
              )}
              {selected.caption && (
                <div className="p-4 bg-[rgba(8,13,26,0.95)] border-t border-[rgba(255,255,255,0.07)]">
                  <p className="text-body-m text-[rgba(255,255,255,0.65)]">{selected.caption}</p>
                </div>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  )
}
