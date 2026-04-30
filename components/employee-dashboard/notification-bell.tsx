'use client'

import * as React from 'react'
import {
  Bell, BellOff, BellRing, Loader2,
  Send, CheckCircle2, Megaphone, ListTodo, X,
} from 'lucide-react'
import { cn } from '@/lib/utils'

function urlBase64ToBuffer(base64: string): ArrayBuffer {
  const pad = '='.repeat((4 - (base64.length % 4)) % 4)
  const b64 = (base64 + pad).replace(/-/g, '+').replace(/_/g, '/')
  const raw = atob(b64)
  const buf = new Uint8Array(raw.length)
  for (let i = 0; i < raw.length; i++) buf[i] = raw.charCodeAt(i)
  return buf.buffer
}

type State = 'unsupported' | 'loading' | 'default' | 'subscribed' | 'denied'

export function NotificationBell({ employeeId }: { employeeId: string }) {
  const [state,      setState]      = React.useState<State>('loading')
  const [open,       setOpen]       = React.useState(false)
  const [testStatus, setTestStatus] = React.useState<'idle' | 'sending' | 'sent' | 'error'>('idle')
  const [errMsg,     setErrMsg]     = React.useState<string | null>(null)
  const popoverRef = React.useRef<HTMLDivElement>(null)

  // Close popover on outside click
  React.useEffect(() => {
    if (!open) return
    const handler = (e: MouseEvent) => {
      if (popoverRef.current && !popoverRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [open])

  // Detect current state on mount
  React.useEffect(() => {
    if (!('serviceWorker' in navigator) || !('PushManager' in window) || !('Notification' in window)) {
      setState('unsupported'); return
    }
    if (Notification.permission === 'denied') { setState('denied'); return }

    navigator.serviceWorker.getRegistration('/sw.js')
      .then((reg) => {
        if (!reg) { setState('default'); return }
        return reg.pushManager.getSubscription()
          .then((sub) => setState(sub ? 'subscribed' : 'default'))
      })
      .catch(() => setState('default'))
  }, [])

  async function getSW() {
    await navigator.serviceWorker.register('/sw.js')
    return navigator.serviceWorker.ready // waits until SW is fully active
  }

  async function subscribe() {
    setState('loading'); setErrMsg(null)
    try {
      const perm = await Notification.requestPermission()
      if (perm !== 'granted') { setState(perm === 'denied' ? 'denied' : 'default'); return }

      const reg = await getSW()
      const sub = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToBuffer(process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!),
      })

      const json = sub.toJSON()
      const res  = await fetch('/api/push/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          employee_id: employeeId,
          endpoint: json.endpoint,
          p256dh:   json.keys?.p256dh,
          auth:     json.keys?.auth,
        }),
      })

      if (!res.ok) throw new Error((await res.json().catch(() => ({}))).error ?? 'Failed to save')
      setState('subscribed')
    } catch (err) {
      setErrMsg(err instanceof Error ? err.message : 'Something went wrong')
      setState('default')
    }
  }

  async function unsubscribe() {
    setState('loading'); setErrMsg(null)
    try {
      const reg = await navigator.serviceWorker.getRegistration('/sw.js')
      const sub = reg ? await reg.pushManager.getSubscription() : null
      if (sub) {
        await fetch('/api/push/subscribe', {
          method: 'DELETE',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ endpoint: sub.endpoint }),
        })
        await sub.unsubscribe()
      }
      setState('default'); setOpen(false)
    } catch { setState('subscribed') }
  }

  async function sendTest() {
    setTestStatus('sending')
    try {
      const res = await fetch('/api/push/test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ employee_id: employeeId }),
      })
      setTestStatus(res.ok ? 'sent' : 'error')
    } catch { setTestStatus('error') }
    setTimeout(() => setTestStatus('idle'), 3500)
  }

  if (state === 'unsupported') return null

  // ── Button visuals ─────────────────────────────────────────────────────────
  const isDefault    = state === 'default'
  const isSubscribed = state === 'subscribed'
  const isDenied     = state === 'denied'
  const isLoading    = state === 'loading'

  return (
    <div className="relative" ref={popoverRef}>

      {/* ── Bell button ──────────────────────────────────────────────────── */}
      <button
        type="button"
        onClick={() => {
          if (isDefault)    { subscribe(); return }
          if (isSubscribed) { setOpen((o) => !o) }
        }}
        disabled={isLoading || isDenied}
        aria-label="Notifications"
        className={cn(
          'relative grid size-9 place-items-center rounded-full border transition-all duration-200',
          isSubscribed && 'border-brand/30 bg-brand/10 text-brand shadow-[0_0_0_3px_hsl(var(--brand)/0.12)] hover:bg-brand/15 hover:shadow-[0_0_0_4px_hsl(var(--brand)/0.18)]',
          isDefault    && 'border-amber-300/60 bg-amber-50 text-amber-500 hover:bg-amber-100 dark:bg-amber-400/10 dark:border-amber-400/30',
          isDenied     && 'border-border bg-surface text-ink-soft opacity-50 cursor-default',
          isLoading    && 'border-border bg-surface text-ink-muted cursor-default opacity-70',
        )}
      >
        {/* Bell icon */}
        {isLoading ? (
          <Loader2 className="size-[17px] animate-spin" />
        ) : isDenied ? (
          <BellOff className="size-[17px]" />
        ) : isSubscribed ? (
          <BellRing className="size-[17px]" />
        ) : (
          <Bell className={cn('size-[17px]', isDefault && 'bell-ring')} />
        )}

        {/* Status dot */}
        {isSubscribed && (
          <span className="dot-pulse absolute right-1 top-1 size-2 rounded-full bg-brand ring-2 ring-white dark:ring-surface" />
        )}
        {isDefault && (
          <span className="absolute right-1 top-1 size-2 animate-pulse rounded-full bg-amber-400 ring-2 ring-white dark:ring-surface" />
        )}
        {isDenied && (
          <span className="absolute right-1 top-1 size-2 rounded-full bg-coral ring-2 ring-white dark:ring-surface" />
        )}
      </button>

      {/* ── Error hint ───────────────────────────────────────────────────── */}
      {errMsg && !open && (
        <div className="absolute right-0 top-11 z-50 flex w-[min(16rem,calc(100vw-2rem))] items-start gap-2 rounded-xl border border-coral/20 bg-coral/5 px-3 py-2.5 text-[11px] text-coral shadow-lg">
          <span className="mt-0.5 shrink-0">⚠</span>
          <span>{errMsg}</span>
        </div>
      )}

      {/* ── Popover (subscribed) ─────────────────────────────────────────── */}
      {open && isSubscribed && (
        <div className="absolute right-0 top-11 z-50 w-[min(16rem,calc(100vw-2rem))] overflow-hidden rounded-2xl border border-border bg-surface shadow-xl">

          {/* Header — gradient accent */}
          <div className="relative overflow-hidden bg-gradient-to-br from-brand/10 via-brand/5 to-transparent px-4 pb-3 pt-4">
            {/* decorative circles */}
            <div className="pointer-events-none absolute -right-4 -top-4 size-20 rounded-full bg-brand/10" />
            <div className="pointer-events-none absolute -right-1 top-4 size-10 rounded-full bg-brand/8" />

            <div className="relative flex items-start justify-between">
              <div className="flex items-center gap-2.5">
                {/* Icon bubble */}
                <div className="grid size-8 shrink-0 place-items-center rounded-xl bg-brand/15">
                  <BellRing className="size-4 text-brand" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-ink">Notifications</p>
                  <div className="mt-0.5 flex items-center gap-1">
                    <span className="size-1.5 rounded-full bg-emerald" />
                    <p className="text-[11px] text-ink-soft">Active on this device</p>
                  </div>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="grid size-5 place-items-center rounded-full text-ink-soft hover:bg-surface-2 hover:text-ink"
              >
                <X className="size-3.5" />
              </button>
            </div>
          </div>

          {/* What triggers notifications */}
          <div className="border-b border-border px-4 py-3">
            <p className="mb-2 text-[10px] font-semibold uppercase tracking-wider text-ink-soft">
              You'll be notified for
            </p>
            <div className="space-y-2">
              {[
                { icon: ListTodo,  label: 'Task assignments',  desc: 'When a task is assigned to you' },
                { icon: Megaphone, label: 'Announcements',     desc: 'Company-wide announcements' },
              ].map(({ icon: Icon, label, desc }) => (
                <div key={label} className="flex items-center gap-2.5">
                  <div className="grid size-6 shrink-0 place-items-center rounded-lg bg-surface-2">
                    <Icon className="size-3.5 text-brand" />
                  </div>
                  <div>
                    <p className="text-[11px] font-semibold text-ink">{label}</p>
                    <p className="text-[10px] text-ink-soft">{desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Test button */}
          <div className="px-4 py-3">
            <button
              type="button"
              onClick={sendTest}
              disabled={testStatus === 'sending'}
              className={cn(
                'flex w-full items-center justify-center gap-2 rounded-xl border px-3 py-2 text-xs font-semibold transition-all',
                testStatus === 'sent'
                  ? 'border-emerald/30 bg-emerald/10 text-emerald'
                  : testStatus === 'error'
                    ? 'border-coral/30 bg-coral/10 text-coral'
                    : 'border-border bg-surface-2 text-ink hover:bg-surface-3 disabled:opacity-50',
              )}
            >
              {testStatus === 'sending' ? (
                <><Loader2 className="size-3.5 animate-spin" /> Sending…</>
              ) : testStatus === 'sent' ? (
                <><CheckCircle2 className="size-3.5" /> Notification sent!</>
              ) : testStatus === 'error' ? (
                <>⚠ Failed — check console</>
              ) : (
                <><Send className="size-3.5" /> Send test notification</>
              )}
            </button>
          </div>

          {/* Turn off */}
          <div className="border-t border-border px-4 py-2.5">
            <button
              type="button"
              onClick={unsubscribe}
              className="flex w-full items-center gap-1.5 text-[11px] font-medium text-ink-soft transition-colors hover:text-coral"
            >
              <BellOff className="size-3" />
              Turn off on this device
            </button>
          </div>
        </div>
      )}

      {/* ── Tooltip (default / denied only, not when popover open) ──────── */}
      {!open && (isDefault || isDenied) && (
        <div className="pointer-events-none absolute right-0 top-11 z-40 w-max max-w-[200px] rounded-xl border border-border bg-surface px-2.5 py-1.5 text-[11px] font-medium text-ink opacity-0 shadow-lg transition-opacity group-hover:opacity-100">
          {isDenied ? 'Allow in browser settings' : 'Enable push notifications'}
        </div>
      )}
    </div>
  )
}
