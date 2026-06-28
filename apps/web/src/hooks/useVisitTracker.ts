import { useEffect, useRef } from 'react'
import { apiClient } from '@/lib/api/client'
import type { VisitStartResponse } from '@/types/farewell'

const PING_INTERVAL_MS = 30_000  // 30 seconds

/**
 * Tracks a single visit to a farewell page.
 *
 * - On mount: POSTs to /visits to create a VisitLog record.
 * - Every 30 s: PATCHes with elapsed time.
 * - On page unload: sends a final PATCH via sendBeacon (best-effort).
 *
 * pageId is the Page.id from the FarewellPageData — already returned by the
 * /pages/:slug response and available in the client component.
 */
export function useVisitTracker(pageId: string | null) {
  const visitIdRef   = useRef<string | null>(null)
  const startTimeRef = useRef<number>(Date.now())
  const intervalRef  = useRef<ReturnType<typeof setInterval> | null>(null)

  useEffect(() => {
    if (!pageId) return

    let cancelled = false
    startTimeRef.current = Date.now()

    // Start the visit
    apiClient
      .post<VisitStartResponse>('/api/v1/visits', {
        page_id: pageId,
        referrer: typeof document !== 'undefined' ? document.referrer || undefined : undefined,
      })
      .then(({ data }) => {
        if (cancelled) return
        visitIdRef.current = data.visit_id

        // Heartbeat every 30 s
        intervalRef.current = setInterval(() => {
          if (!visitIdRef.current) return
          const elapsed = Math.round((Date.now() - startTimeRef.current) / 1000)
          apiClient
            .patch(`/api/v1/visits/${visitIdRef.current}`, { elapsed_seconds: elapsed })
            .catch(() => {/* silently swallow heartbeat failures */})
        }, PING_INTERVAL_MS)
      })
      .catch(() => {/* don't break the page if tracking fails */})

    // Final ping on tab close / navigation
    const handleUnload = () => {
      if (!visitIdRef.current) return
      const elapsed = Math.round((Date.now() - startTimeRef.current) / 1000)
      const url = `/api/v1/visits/${visitIdRef.current}`
      const body = JSON.stringify({ elapsed_seconds: elapsed })
      // sendBeacon is fire-and-forget and survives page unload
      if (typeof navigator !== 'undefined' && navigator.sendBeacon) {
        const blob = new Blob([body], { type: 'application/json' })
        navigator.sendBeacon(url, blob)
      }
    }

    window.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'hidden') handleUnload()
    })
    window.addEventListener('pagehide', handleUnload)

    return () => {
      cancelled = true
      if (intervalRef.current) clearInterval(intervalRef.current)
      window.removeEventListener('pagehide', handleUnload)
    }
  }, [pageId])
}
