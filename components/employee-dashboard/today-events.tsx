'use client'

import * as React from 'react'
import { CalendarCheck, MapPin, PartyPopper, Phone, Globe, Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useEmployee } from '@/app/employee/context'

interface TodayEvent {
  id: string
  customer_name: string
  customer_phone: string
  city: string
  event_date: string
  occasion: string
  website: string
}

function localISO() {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

export function TodayEvents() {
  const employee = useEmployee()
  const [events, setEvents] = React.useState<TodayEvent[]>([])
  const [loading, setLoading] = React.useState(true)
  const [error, setError] = React.useState<string | null>(null)

  React.useEffect(() => {
    let cancelled = false
    async function load() {
      try {
        setLoading(true)
        setError(null)
        const today = localISO()
        const url = `/api/bookings?employee_id=${employee.id}&event_from=${today}&event_to=${today}`
        const res = await fetch(url)
        if (!res.ok) throw new Error('Failed to load')
        const json = await res.json()
        if (!cancelled) setEvents(json.data ?? json ?? [])
      } catch {
        if (!cancelled) setError('Could not load events')
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    load()
    // Refresh every 2 minutes
    const id = setInterval(load, 120_000)
    return () => { cancelled = true; clearInterval(id) }
  }, [employee.id])

  return (
    <div className="rounded-2xl border border-border bg-surface p-5 shadow-card">
      {/* Header */}
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="grid size-9 place-items-center rounded-xl bg-brand/10 text-brand">
            <CalendarCheck className="size-5" />
          </div>
          <div>
            <h3 className="text-base font-semibold">Today&apos;s Events</h3>
            <p className="text-[11px] text-ink-soft">Bookings scheduled for today</p>
          </div>
        </div>
        <span className={cn(
          'grid size-8 place-items-center rounded-full text-sm font-bold',
          events.length > 0
            ? 'bg-brand/10 text-brand'
            : 'bg-surface-2 text-ink-soft',
        )}>
          {loading ? '...' : events.length}
        </span>
      </div>

      {/* Content */}
      {loading ? (
        <div className="flex items-center justify-center py-8">
          <Loader2 className="size-5 animate-spin text-ink-soft" />
        </div>
      ) : error ? (
        <p className="py-6 text-center text-sm text-coral">{error}</p>
      ) : events.length === 0 ? (
        <div className="py-6 text-center">
          <CalendarCheck className="mx-auto mb-2 size-8 text-ink-soft/40" />
          <p className="text-sm text-ink-soft">No events scheduled for today</p>
        </div>
      ) : (
        <div className="space-y-2.5">
          {events.map((ev, i) => (
            <div
              key={ev.id}
              className="rounded-xl border border-border bg-surface-2/30 px-4 py-3 transition-colors hover:border-brand/30 hover:bg-surface-2/60"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  {/* Customer name + index */}
                  <div className="flex items-center gap-2">
                    <span className="grid size-5 shrink-0 place-items-center rounded-full bg-brand text-[10px] font-bold text-white">
                      {i + 1}
                    </span>
                    <p className="truncate text-sm font-semibold text-ink">
                      {ev.customer_name}
                    </p>
                  </div>

                  {/* Details row */}
                  <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-ink-soft">
                    <span className="inline-flex items-center gap-1">
                      <MapPin className="size-3 text-ink-soft/70" />
                      {ev.city}
                    </span>
                    <span className="inline-flex items-center gap-1">
                      <PartyPopper className="size-3 text-ink-soft/70" />
                      {ev.occasion}
                    </span>
                    <span className="inline-flex items-center gap-1">
                      <Globe className="size-3 text-ink-soft/70" />
                      {ev.website}
                    </span>
                  </div>
                </div>

                {/* Phone - quick call */}
                <a
                  href={`tel:${ev.customer_phone}`}
                  className="mt-0.5 grid size-8 shrink-0 place-items-center rounded-lg border border-border bg-surface text-ink-soft hover:border-brand/30 hover:bg-brand/5 hover:text-brand transition-colors"
                  title={ev.customer_phone}
                >
                  <Phone className="size-3.5" />
                </a>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
