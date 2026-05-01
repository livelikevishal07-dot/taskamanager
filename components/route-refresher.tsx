'use client'

import { useRouter } from 'next/navigation'
import { useEffect } from 'react'

/**
 * Invisible component that calls router.refresh() once on mount.
 * This busts Next.js 14's client-side router cache so every page
 * always shows live data on first render, not a 30-second-old snapshot.
 */
export function RouteRefresher() {
  const router = useRouter()
  useEffect(() => { router.refresh() }, []) // eslint-disable-line react-hooks/exhaustive-deps
  return null
}
