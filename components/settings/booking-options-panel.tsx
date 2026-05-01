'use client'

import * as React from 'react'
import { Check, Globe, Loader2, MessageCircle, MoreHorizontal, Plus, Trash2, X } from 'lucide-react'
import { cn } from '@/lib/utils'

// ── Types ─────────────────────────────────────────────────────────────────────

interface BookingOption {
  id:         string
  type:       'website' | 'platform'
  label:      string
  sort_order: number
  created_at: string
}

// ── Icon map for platforms ────────────────────────────────────────────────────

const PLATFORM_ICONS: Record<string, React.ElementType> = {
  WhatsApp: MessageCircle,
  Website:  Globe,
  Others:   MoreHorizontal,
}

// ── Single option row ─────────────────────────────────────────────────────────

function OptionRow({
  option,
  onDeleted,
}: {
  option:    BookingOption
  onDeleted: (id: string) => void
}) {
  const [confirm,  setConfirm]  = React.useState(false)
  const [deleting, setDeleting] = React.useState(false)
  const [error,    setError]    = React.useState<string | null>(null)

  const Icon = option.type === 'platform' ? (PLATFORM_ICONS[option.label] ?? MoreHorizontal) : null

  async function doDelete() {
    setDeleting(true); setError(null)
    try {
      const r = await fetch(`/api/booking-options/${option.id}`, { method: 'DELETE' })
      if (!r.ok) {
        const d = await r.json().catch(() => ({}))
        throw new Error(d.error ?? 'Failed to delete')
      }
      onDeleted(option.id)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed')
      setDeleting(false)
      setConfirm(false)
    }
  }

  return (
    <div className={cn(
      'flex items-center justify-between gap-3 rounded-xl border px-4 py-2.5 transition-colors',
      confirm ? 'border-coral/30 bg-coral/[0.02]' : 'border-border bg-surface',
    )}>
      <div className="flex items-center gap-2.5">
        {Icon && (
          <span className="grid size-7 place-items-center rounded-lg bg-surface-2 text-ink-soft">
            <Icon className="size-3.5" />
          </span>
        )}
        <span className="text-sm font-medium text-ink">{option.label}</span>
      </div>

      <div className="flex items-center gap-1.5">
        {error && <span className="text-[10px] text-coral">{error}</span>}

        {confirm ? (
          <>
            <button
              type="button"
              onClick={doDelete}
              disabled={deleting}
              className="inline-flex items-center gap-1 rounded-lg bg-coral px-2.5 py-1 text-[11px] font-semibold text-white hover:opacity-90 disabled:opacity-50"
            >
              {deleting ? <Loader2 className="size-3 animate-spin" /> : <Trash2 className="size-3" />}
              Delete
            </button>
            <button
              type="button"
              onClick={() => setConfirm(false)}
              className="grid size-6 place-items-center rounded-lg border border-border text-ink-soft hover:bg-surface-2"
            >
              <X className="size-3" />
            </button>
          </>
        ) : (
          <button
            type="button"
            onClick={() => setConfirm(true)}
            className="grid size-7 place-items-center rounded-lg border border-border text-ink-soft hover:border-coral/30 hover:bg-coral/10 hover:text-coral"
            title="Delete option"
          >
            <Trash2 className="size-3.5" />
          </button>
        )}
      </div>
    </div>
  )
}

// ── Add option row ────────────────────────────────────────────────────────────

function AddOptionRow({
  type,
  onAdded,
}: {
  type:    'website' | 'platform'
  onAdded: (opt: BookingOption) => void
}) {
  const [label,  setLabel]  = React.useState('')
  const [saving, setSaving] = React.useState(false)
  const [error,  setError]  = React.useState<string | null>(null)

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    const trimmed = label.trim()
    if (!trimmed) return
    setSaving(true); setError(null)
    try {
      const r = await fetch('/api/booking-options', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type, label: trimmed }),
      })
      if (!r.ok) {
        const d = await r.json().catch(() => ({}))
        throw new Error(d.error ?? 'Failed to add')
      }
      onAdded(await r.json())
      setLabel('')
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed')
    } finally {
      setSaving(false)
    }
  }

  return (
    <form onSubmit={submit} className="flex items-center gap-2">
      <input
        type="text"
        value={label}
        onChange={(e) => { setLabel(e.target.value); setError(null) }}
        placeholder={type === 'website' ? 'e.g. MyNewSite' : 'e.g. Instagram'}
        className="h-9 flex-1 rounded-xl border border-border bg-surface px-3 text-sm placeholder:text-ink-soft/60 focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/20"
      />
      <button
        type="submit"
        disabled={saving || !label.trim()}
        className="inline-flex h-9 items-center gap-1.5 rounded-xl bg-brand px-3 text-xs font-semibold text-brand-foreground shadow-sm hover:opacity-90 disabled:opacity-40"
      >
        {saving ? <Loader2 className="size-3.5 animate-spin" /> : <Plus className="size-3.5" />}
        Add
      </button>
      {error && <span className="text-[11px] text-coral">{error}</span>}
    </form>
  )
}

// ── Section ───────────────────────────────────────────────────────────────────

function Section({
  title,
  description,
  type,
  options,
  onAdded,
  onDeleted,
}: {
  title:       string
  description: string
  type:        'website' | 'platform'
  options:     BookingOption[]
  onAdded:     (opt: BookingOption) => void
  onDeleted:   (id: string) => void
}) {
  return (
    <div className="overflow-hidden rounded-2xl border border-border bg-surface shadow-card">
      <div className="border-b border-border px-5 py-4">
        <p className="text-sm font-semibold text-ink">{title}</p>
        <p className="mt-0.5 text-xs text-ink-soft">{description}</p>
      </div>

      <div className="space-y-2 px-5 py-4">
        {options.length === 0 ? (
          <p className="py-3 text-center text-xs text-ink-soft">No options yet — add one below.</p>
        ) : (
          options.map((opt) => (
            <OptionRow key={opt.id} option={opt} onDeleted={onDeleted} />
          ))
        )}
      </div>

      <div className="border-t border-border px-5 py-3.5">
        <AddOptionRow type={type} onAdded={onAdded} />
      </div>
    </div>
  )
}

// ── Main Panel ────────────────────────────────────────────────────────────────

export function BookingOptionsPanel() {
  const [options,  setOptions]  = React.useState<BookingOption[]>([])
  const [loading,  setLoading]  = React.useState(true)

  React.useEffect(() => {
    fetch('/api/booking-options')
      .then((r) => r.json())
      .then((d) => { if (Array.isArray(d)) setOptions(d) })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  function onAdded(opt: BookingOption) {
    setOptions((prev) => [...prev, opt])
  }

  function onDeleted(id: string) {
    setOptions((prev) => prev.filter((o) => o.id !== id))
  }

  const websites  = options.filter((o) => o.type === 'website')
  const platforms = options.filter((o) => o.type === 'platform')

  if (loading) {
    return (
      <div className="space-y-5">
        {[1, 2].map((i) => (
          <div key={i} className="h-48 animate-pulse rounded-2xl border border-border bg-surface" />
        ))}
      </div>
    )
  }

  return (
    <div className="space-y-5">
      {/* Info banner */}
      <div className="flex items-start gap-3 rounded-2xl border border-brand/20 bg-brand/[0.04] px-5 py-3.5">
        <Check className="mt-0.5 size-4 shrink-0 text-brand" />
        <div>
          <p className="text-sm font-semibold text-ink">Booking Form Options</p>
          <p className="text-xs text-ink-soft">
            Changes apply instantly to both the employee booking form and the admin edit modal.
            Deleting an option hides it from new bookings — existing bookings are not affected.
          </p>
        </div>
      </div>

      <Section
        title="Booking Websites"
        description="Websites that employees can select when logging a booking (e.g. BalloonDekor, 7eventzz)."
        type="website"
        options={websites}
        onAdded={onAdded}
        onDeleted={onDeleted}
      />

      <Section
        title="Booking Platforms"
        description="Channels through which the customer contacted you (e.g. WhatsApp, Website, Instagram)."
        type="platform"
        options={platforms}
        onAdded={onAdded}
        onDeleted={onDeleted}
      />
    </div>
  )
}
