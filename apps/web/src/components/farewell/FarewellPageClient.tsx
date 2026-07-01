'use client'

import { useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { AILoadingScreen } from '@/components/animations/AILoadingScreen'
import { FloatingOrbs } from '@/components/animations/FloatingOrbs'
import { ScrollProgress } from '@/components/ui/ScrollProgress'
import { HeroSection } from './HeroSection'
import { PersonalMessage } from './PersonalMessage'
import { Timeline } from './Timeline'
import { PhotoGallery } from './PhotoGallery'
import { VideoSection } from './VideoSection'
import { LeaveAMemory } from './LeaveAMemory'
import { Footer } from './Footer'
import { useVisitTracker } from '@/hooks/useVisitTracker'
import type { FarewellPageData, UserRole } from '@/types/farewell'

interface FarewellPageClientProps {
  data: FarewellPageData
  role: UserRole
  currentUserName?: string
  currentUserEmail?: string
}

export function FarewellPageClient({
  data,
  role,
  currentUserName,
  currentUserEmail,
}: FarewellPageClientProps) {
  const [showLoader, setShowLoader] = useState(true)
  const { recipient, page } = data

  // Start tracking this visit once the loading screen clears
  useVisitTracker(showLoader ? null : page.id)

  const photos = page.media_assets.filter((a) => a.asset_type === 'photo')
  const video  = page.media_assets.find((a) => a.asset_type === 'video')

  return (
    <>
      {/* Ambient background orbs — always visible */}
      <FloatingOrbs />

      {/* AI loading screen → fades out when complete */}
      <AnimatePresence>
        {showLoader && (
          <AILoadingScreen
            recipientName={recipient.display_name}
            avatarUrl={recipient.avatar_blob_url}
            onComplete={() => setShowLoader(false)}
          />
        )}
      </AnimatePresence>

      {/* Main page content — mounts immediately but stays hidden under the loader */}
      <AnimatePresence>
        {!showLoader && (
          <motion.main
            className="relative z-10 above-mesh"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
          >
            <ScrollProgress />

            <HeroSection recipient={recipient} />

            {page.personalized_message && (
              <PersonalMessage message={page.personalized_message} />
            )}

            {page.show_timeline && page.timeline_events.length > 0 && (
              <Timeline events={page.timeline_events} />
            )}

            {page.show_photos && photos.length > 0 && (
              <PhotoGallery photos={photos} />
            )}

            {page.show_video && video && (
              <VideoSection video={video} />
            )}

            <LeaveAMemory
              slug={recipient.slug}
              defaultName={currentUserName}
              defaultEmail={currentUserEmail}
            />

            <Footer
              recipientName={recipient.display_name}
              lastDay={recipient.last_day}
            />
          </motion.main>
        )}
      </AnimatePresence>
    </>
  )
}
