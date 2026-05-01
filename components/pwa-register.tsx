'use client'

import { useEffect } from 'react'

/**
 * Registers the service worker on the client.
 * Renders nothing — purely a side-effect component.
 * Add this once inside the employee layout.
 */
export function PwaRegister() {
  useEffect(() => {
    if (typeof window === 'undefined' || !('serviceWorker' in navigator)) return

    navigator.serviceWorker
      .register('/sw.js', { scope: '/' })
      .then((reg) => {
        // Check for updates every time the page loads
        reg.update().catch(() => {})
      })
      .catch((err) => {
        console.warn('[PWA] Service worker registration failed:', err)
      })
  }, [])

  return null
}
