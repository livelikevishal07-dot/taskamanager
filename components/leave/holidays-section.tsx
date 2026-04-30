'use client'

import * as React from 'react'
import {
  CalendarDays, ChevronLeft, ChevronRight, Loader2,
  Plus, RefreshCcw, Repeat2, Trash2, X,
} from 'lucide-react'
import { cn } from '@/lib/utils'

// ── Types ─────────────────────────────────────────────────────────────────────

type HolidayType = 'public' | 'company' | 'optional'

interface CompanyHoliday {
  id: string
  name: string
  date: string
  type: HolidayType
  recurring: boolean
  created_at: string
}

// ── Helpers ───────────────────────────────────────────────────────────────────

const TYPE_META: Record<HolidayType, { label: string; chip: string; dot: string }> = {
  public:   { label: 'Public',   chip: 'bg-emerald/10 text-emerald', dot: 'bg-emerald' },
  company:  { label: 'Company',  chip: 'bg-brand/10 text-brand',     dot: 'bg-brand'   },
  optional: { label: 'Optional', chip: 'bg-amber/10 text-amber',     dot: 'bg-amber'   },
}

const MONTHS = ['January','February','March','April','May','June',
                'July','August','September','October','November','December']

function fmtDate(iso: string): string {
  return new Date(iso + 'T12:00:00').toLocaleDateString('en-GB', {
    weekday: 'short', day: 'numeric', month: 'short',
  })
}

function groupByMonth(holidays: CompanyHoliday[]): Map<number, CompanyHoliday[]> {
  const map = new Map<number, CompanyHoliday[]>()
  for (const h of holidays) {
    const m = new Date(h.date + 'T12:00:00').getMonth() // 0-11
    if (!map.has(m)) map.set(m, [])
    map.get(m)!.push(h)
  }
  return map
}

// ── Add Form ──────────────────────────────────────────────────────────────────

function AddHolidayForm({
  year,
  onAdded,
  onClose,
}: {
  year: number
  onAdded: (h: CompanyHoliday) => void
  onClose: () => void
}) {
  const [name,      setName]      = React.useState('')
  const [date,      setDate]      = React.useState(`${year}-`)
  const [type,      setType]      = React.useState<HolidayType>('public')
  const [recurring, setRecurring] = React.useState(false)
  const [saving,    setSaving]    = React.useState(false)
  const [error,     setError]     = React.useState<string | null>(null)

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    if (!name.trim() || !date) return
    setSaving(true); setError(null)
    try {
      const r = await fetch('/api/holidays', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: name.trim(), date, type, recurring }),
      })
      if (!r.ok) {
        const d = await r.json().catch(() => ({}))
        throw new Error(d.error ?? 'Failed to save')
      }
      onAdded(await r.json())
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed')
    } finally {
      setSaving(false)
    }
  }

  return (
    <form
      onSubmit={submit}
      className="rounded-2xl border border-brand/20 bg-brand/[0.03] p-5 shadow-sm"
    >
      <div className="mb-4 flex items-center justify-between">
        <p className="text-sm font-semibold text-ink">Add Holiday</p>
        <button type="button" onClick={onClose}
          className="grid size-7 place-items-center rounded-lg text-ink-soft hover:bg-surface-2">
          <X className="size-4" />
        </button>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        {/* Name */}
        <div className="sm:col-span-2">
          <label className="mb-1 block text-xs font-medium text-ink-muted">Holiday name</label>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Diwali, New Year's Day…"
            required
            className="h-10 w-full rounded-xl border border-border bg-surface px-3 text-sm focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/20"
          />
        </div>

        {/* Date */}
        <div>
          <label className="mb-1 block text-xs font-medium text-ink-muted">Date</label>
          <input
            type="date"
            value={date}
            min={`${year}-01-01`}
            max={`${year}-12-31`}
            onChange={(e) => setDate(e.target.value)}
            required
            className="h-10 w-full rounded-xl border border-border bg-surface px-3 text-sm focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/20"
          />
        </div>

        {/* Type */}
        <div>
          <label className="mb-1 block text-xs font-medium text-ink-muted">Type</label>
          <div className="flex gap-1.5">
            {(Object.entries(TYPE_META) as [HolidayType, typeof TYPE_META[HolidayType]][]).map(([k, m]) => (
              <button
                key={k}
                type="button"
                onClick={() => setType(k)}
                className={cn(
                  'flex-1 rounded-xl border py-2 text-xs font-semibold transition-all',
                  type === k
                    ? `${m.chip} border-current/30 shadow-sm`
                    : 'border-border text-ink-soft hover:bg-surface-2'
                )}
              >
                {m.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Recurring */}
      <label className="mt-3 flex cursor-pointer items-center gap-2.5">
        <div
          onClick={() => setRecurring((v) => !v)}
          className={cn(
            'relative h-5 w-9 rounded-full border transition-colors',
            recurring ? 'border-brand bg-brand' : 'border-border bg-surface-2'
          )}
        >
          <span className={cn(
            'absolute top-0.5 size-4 rounded-full bg-white shadow transition-transform',
            recurring ? 'translate-x-4' : 'translate-x-0.5'
          )} />
        </div>
        <span className="text-xs font-medium text-ink-muted">
          Recurring every year (same date)
        </span>
      </label>

      {error && <p className="mt-2 text-xs text-coral">{error}</p>}

      <div className="mt-4 flex gap-2">
        <button
          type="submit"
          disabled={saving || !name.trim() || !date}
          className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-brand py-2.5 text-sm font-semibold text-brand-foreground shadow-sm hover:opacity-90 disabled:opacity-50"
        >
          {saving && <Loader2 className="size-3.5 animate-spin" />}
          Add Holiday
        </button>
        <button type="button" onClick={onClose}
          className="rounded-xl border border-border px-4 py-2.5 text-sm font-medium text-ink-muted hover:bg-surface-2">
          Cancel
        </button>
      </div>
    </form>
  )
}

// ── Main Component ────────────────────────────────────────────────────────────

interface Props {
  initialHolidays: CompanyHoliday[]
  initialYear: number
}

export function HolidaysSection({ initialHolidays, initialYear }: Props) {
  const [year,     setYear]     = React.useState(initialYear)
  const [holidays, setHolidays] = React.useState<CompanyHoliday[]>(initialHolidays)
  const [loading,  setLoading]  = React.useState(false)
  const [showAdd,  setShowAdd]  = React.useState(false)
  const [deleting, setDeleting] = React.useState<string | null>(null)

  const load = React.useCallback(async (y: number) => {
    setLoading(true)
    try {
      const r = await fetch(`/api/holidays?year=${y}`)
      const d = await r.json()
      setHolidays(Array.isArray(d) ? d : [])
    } catch { /**/ }
    finally { setLoading(false) }
  }, [])

  function changeYear(delta: number) {
    const y = year + delta
    setYear(y)
    load(y)
  }

  async function deleteHoliday(id: string) {
    if (!confirm('Remove this holiday?')) return
    setDeleting(id)
    try {
      await fetch(`/api/holidays/${id}`, { method: 'DELETE' })
      setHolidays((prev) => prev.filter((h) => h.id !== id))
    } catch { /**/ }
    finally { setDeleting(null) }
  }

  function onAdded(h: CompanyHoliday) {
    setHolidays((prev) => [...prev, h].sort((a, b) => a.date.localeCompare(b.date)))
    setShowAdd(false)
  }

  const byMonth = groupByMonth(holidays)
  const today = new Date().toISOString().slice(0, 10)

  return (
    <div className="space-y-5">
      {/* ── Header card ── */}
      <div className="overflow-hidden rounded-2xl border border-border bg-surface shadow-card">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border px-6 py-4">
          {/* Year nav */}
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => changeYear(-1)}
              disabled={loading}
              className="grid size-8 place-items-center rounded-lg border border-border text-ink-muted hover:bg-surface-2 disabled:opacity-40"
            >
              <ChevronLeft className="size-4" />
            </button>
            <div className="text-center">
              <p className="text-lg font-bold tabular-nums">{year}</p>
              <p className="text-[10px] text-ink-soft">{holidays.length} holiday{holidays.length !== 1 ? 's' : ''}</p>
            </div>
            <button
              type="button"
              onClick={() => changeYear(1)}
              disabled={loading}
              className="grid size-8 place-items-center rounded-lg border border-border text-ink-muted hover:bg-surface-2 disabled:opacity-40"
            >
              <ChevronRight className="size-4" />
            </button>
          </div>

          <div className="flex items-center gap-2">
            {/* Legend */}
            <div className="hidden items-center gap-3 sm:flex">
              {(Object.entries(TYPE_META) as [HolidayType, typeof TYPE_META[HolidayType]][]).map(([k, m]) => (
                <span key={k} className="flex items-center gap-1 text-[11px] text-ink-soft">
                  <span className={cn('size-2 rounded-full', m.dot)} /> {m.label}
                </span>
              ))}
            </div>
            <button
              type="button"
              onClick={() => load(year)}
              disabled={loading}
              className="grid size-8 place-items-center rounded-lg border border-border text-ink-soft hover:bg-surface-2 disabled:opacity-40"
            >
              {loading ? <Loader2 className="size-3.5 animate-spin" /> : <RefreshCcw className="size-3.5" />}
            </button>
            <button
              type="button"
              onClick={() => setShowAdd((v) => !v)}
              className="inline-flex h-9 items-center gap-1.5 rounded-xl bg-brand px-4 text-sm font-semibold text-brand-foreground shadow-sm hover:opacity-90"
            >
              <Plus className="size-4" />
              Add Holiday
            </button>
          </div>
        </div>

        {/* Add form */}
        {showAdd && (
          <div className="border-b border-border p-5">
            <AddHolidayForm year={year} onAdded={onAdded} onClose={() => setShowAdd(false)} />
          </div>
        )}

        {/* Month groups */}
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="size-5 animate-spin text-brand" />
          </div>
        ) : holidays.length === 0 ? (
          <div className="flex flex-col items-center gap-3 py-16">
            <span className="grid size-14 place-items-center rounded-2xl bg-surface-2">
              <CalendarDays className="size-7 text-ink-soft/40" />
            </span>
            <div className="text-center">
              <p className="text-sm font-medium text-ink">No holidays for {year}</p>
              <p className="text-xs text-ink-soft">Add your first holiday using the button above.</p>
            </div>
          </div>
        ) : (
          <div className="divide-y divide-border">
            {Array.from({ length: 12 }, (_, i) => i).map((month) => {
              const items = byMonth.get(month)
              if (!items || items.length === 0) return null
              return (
                <div key={month}>
                  {/* Month header */}
                  <div className="flex items-center gap-3 bg-surface-2/50 px-6 py-2">
                    <span className="text-xs font-bold uppercase tracking-widest text-ink-soft">
                      {MONTHS[month]}
                    </span>
                    <span className="rounded-full bg-surface-2 px-1.5 py-0.5 text-[10px] font-semibold text-ink-soft">
                      {items.length}
                    </span>
                  </div>

                  {/* Holidays in this month */}
                  <ul className="divide-y divide-border/50">
                    {items.map((h) => {
                      const m       = TYPE_META[h.type]
                      const isPast  = h.date < today
                      const isToday = h.date === today

                      return (
                        <li
                          key={h.id}
                          className={cn(
                            'group flex items-center gap-4 px-6 py-3.5 transition-colors hover:bg-surface-2/30',
                            isToday && 'bg-brand/[0.03]',
                            isPast && 'opacity-60'
                          )}
                        >
                          {/* Date */}
                          <div className={cn(
                            'w-14 shrink-0 rounded-xl border py-2 text-center',
                            isToday ? 'border-brand/30 bg-brand/10' : 'border-border bg-surface-2/50'
                          )}>
                            <p className={cn(
                              'text-xs font-bold leading-tight',
                              isToday ? 'text-brand' : 'text-ink'
                            )}>
                              {new Date(h.date + 'T12:00:00').toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}
                            </p>
                            <p className="text-[9px] font-medium text-ink-soft">
                              {new Date(h.date + 'T12:00:00').toLocaleDateString('en-GB', { weekday: 'short' })}
                            </p>
                          </div>

                          {/* Name + badges */}
                          <div className="min-w-0 flex-1">
                            <div className="flex flex-wrap items-center gap-1.5">
                              <p className="text-sm font-semibold text-ink">{h.name}</p>
                              {isToday && (
                                <span className="rounded-full bg-brand/15 px-1.5 py-px text-[9px] font-bold uppercase text-brand">
                                  Today
                                </span>
                              )}
                            </div>
                            <div className="mt-1 flex items-center gap-2">
                              <span className={cn('inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold', m.chip)}>
                                <span className={cn('size-1.5 rounded-full', m.dot)} />
                                {m.label}
                              </span>
                              {h.recurring && (
                                <span className="flex items-center gap-1 text-[10px] text-ink-soft">
                                  <Repeat2 className="size-3" /> Recurring
                                </span>
                              )}
                            </div>
                          </div>

                          {/* Delete */}
                          <button
                            type="button"
                            onClick={() => deleteHoliday(h.id)}
                            disabled={deleting === h.id}
                            className="grid size-8 shrink-0 place-items-center rounded-lg text-ink-soft opacity-0 transition-opacity hover:bg-coral/10 hover:text-coral group-hover:opacity-100 disabled:opacity-40"
                          >
                            {deleting === h.id
                              ? <Loader2 className="size-3.5 animate-spin" />
                              : <Trash2 className="size-3.5" />}
                          </button>
                        </li>
                      )
                    })}
                  </ul>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
