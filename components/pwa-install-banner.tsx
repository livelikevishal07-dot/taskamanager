'use client'

import * as React from 'react'
import { Download, X } from 'lucide-react'

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>
}

const DISMISSED_KEY = 'pwa-install-dismissed'

/**
 * Shows a "Add to Home Screen" banner at the bottom of the screen on mobile.
 * Appears when the browser fires `beforeinstallprompt` and the user hasn't
 * already dismissed it this session.
 *
 * On iOS (which doesn't fire `beforeinstallprompt`) we show a manual
 * instruction banner with Safari share-icon guidance.
 */
export function PwaInstallBanner() {
  const [deferredPrompt, setDeferredPrompt] = React.useState<BeforeInstallPromptEvent | null>(null)
  const [showIosTip,     setShowIosTip]     = React.useState(false)
  const [dismissed,      setDismissed]      = React.useState(false)
  const [installing,     setInstalling]     = React.useState(false)

  React.useEffect(() => {
    // Already dismissed this session
    if (sessionStorage.getItem(DISMISSED_KEY)) {
      setDismissed(true)
      return
    }

    // Already installed as PWA
    if (window.matchMedia('(display-mode: standalone)').matches) return

    // Android / Chrome / Edge — native install prompt
    const handler = (e: Event) => {
      e.preventDefault()
      setDeferredPrompt(e as BeforeInstallPromptEvent)
    }
    window.addEventListener('beforeinstallprompt', handler)

    // iOS / iPadOS — no `beforeinstallprompt`, show manual tip
    const isIos = /iphone|ipad|ipod/i.test(navigator.userAgent)
    const isSafari = /^((?!chrome|android).)*safari/i.test(navigator.userAgent)
    if (isIos && isSafari) {
      // Show iOS tip after a short delay so it doesn't flash on load
      const t = setTimeout(() => setShowIosTip(true), 3000)
      return () => {
        window.removeEventListener('beforeinstallprompt', handler)
        clearTimeout(t)
      }
    }

    return () => window.removeEventListener('beforeinstallprompt', handler)
  }, [])

  function dismiss() {
    sessionStorage.setItem(DISMISSED_KEY, '1')
    setDismissed(true)
    setShowIosTip(false)
    setDeferredPrompt(null)
  }

  async function install() {
    if (!deferredPrompt) return
    setInstalling(true)
    try {
      await deferredPrompt.prompt()
      const { outcome } = await deferredPrompt.userChoice
      if (outcome === 'accepted') dismiss()
    } finally {
      setInstalling(false)
      setDeferredPrompt(null)
    }
  }

  if (dismissed) return null

  // ── Android / Chrome install banner ──────────────────────────────────────────
  if (deferredPrompt) {
    return (
      <div className="fixed bottom-0 left-0 right-0 z-[60] safe-bottom">
        <div className="mx-3 mb-3 overflow-hidden rounded-2xl border border-brand/20 bg-white shadow-[0_8px_32px_rgba(111,92,255,0.18)] backdrop-blur-sm dark:bg-surface">
          <div className="flex items-center gap-3 px-4 py-3.5">
            {/* App icon */}
            <div className="flex size-12 shrink-0 items-center justify-center rounded-xl bg-brand">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/icon.svg" alt="Workly" className="size-8" />
            </div>

            {/* Text */}
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold text-ink">Add Workly to Home Screen</p>
              <p className="text-xs text-ink-soft">Works offline · Fast · No App Store needed</p>
            </div>

            {/* Actions */}
            <div className="flex shrink-0 items-center gap-2">
              <button
                type="button"
                onClick={install}
                disabled={installing}
                className="inline-flex h-8 items-center gap-1.5 rounded-xl bg-brand px-3 text-xs font-semibold text-white shadow-sm hover:opacity-90 disabled:opacity-60"
              >
                <Download className="size-3.5" />
                {installing ? 'Installing…' : 'Install'}
              </button>
              <button
                type="button"
                onClick={dismiss}
                className="grid size-8 place-items-center rounded-xl text-ink-soft hover:bg-surface-2"
                aria-label="Dismiss"
              >
                <X className="size-4" />
              </button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // ── iOS Safari manual tip ─────────────────────────────────────────────────────
  if (showIosTip) {
    return (
      <div className="fixed bottom-0 left-0 right-0 z-[60]">
        <div className="mx-3 mb-3 overflow-hidden rounded-2xl border border-brand/20 bg-white shadow-[0_8px_32px_rgba(111,92,255,0.18)] dark:bg-surface">
          <div className="flex items-start gap-3 px-4 py-3.5">
            <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-brand">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/icon.svg" alt="Workly" className="size-6" />
            </div>
            <div className="flex-1">
              <p className="text-sm font-semibold text-ink">Install Workly</p>
              <p className="mt-0.5 text-xs text-ink-soft leading-relaxed">
                Tap the{' '}
                <span className="inline-flex items-center gap-0.5 font-semibold text-brand">
                  Share{' '}
                  {/* Safari share icon */}
                  <svg className="inline size-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8" />
                    <polyline points="16 6 12 2 8 6" />
                    <line x1="12" y1="2" x2="12" y2="15" />
                  </svg>
                </span>{' '}
                button in Safari, then tap{' '}
                <span className="font-semibold text-ink">"Add to Home Screen"</span>
              </p>
            </div>
            <button
              type="button"
              onClick={dismiss}
              className="mt-0.5 grid size-7 shrink-0 place-items-center rounded-lg text-ink-soft hover:bg-surface-2"
              aria-label="Dismiss"
            >
              <X className="size-3.5" />
            </button>
          </div>

          {/* Arrow pointing down (toward Safari toolbar) */}
          <div className="flex justify-center pb-2">
            <div className="size-3 rotate-45 border-b border-r border-brand/20 bg-white dark:bg-surface" />
          </div>
        </div>
      </div>
    )
  }

  return null
}
