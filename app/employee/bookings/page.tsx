'use client'

import * as React from 'react'
import {
  ChevronLeft, ChevronRight, Check, Loader2,
  Plus, AlertCircle, BookOpen, Zap,
  MessageCircle, Globe, MoreHorizontal,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { useEmployee } from '@/app/employee/context'
import { EmployeeTopbar } from '@/components/employee-dashboard/topbar'

// ── Constants ─────────────────────────────────────────────────────────────────

// Quick-pick city pills — one tap fills the city field.
// These are the 9 most common cities in the dataset.
const QUICK_CITIES = [
  'Bangalore', 'Hyderabad', 'Delhi', 'Mumbai',
  'Pune', 'Kolkata', 'Chennai', 'Noida', 'Gurgaon',
]

const CITIES = [
  'Bangalore','Delhi','Mumbai','Hyderabad','Pune','Kolkata','Chennai',
  'Gurgaon','Noida','Ghaziabad','Ahmedabad','Jaipur','Nagpur','Navi Mumbai',
  'Lucknow','Bhubaneshwar','Chandigarh','Vadodara','Option 19','Others',
]

const OCCASIONS = [
  'Birthday','Romantic','Welcome Baby','Baby Shower','First Night',
  'Kids Birthday','Wedding Others','Corporate','Flowers','Cakes','Hampers','Others',
]

const WEBSITES  = ['BalloonDekor','7eventzz','Giftlaya'] as const
const PLATFORMS = ['WhatsApp','Website','Others'] as const

const DAYS = ['Su','Mo','Tu','We','Th','Fr','Sa']
const MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December']

// ── Types ─────────────────────────────────────────────────────────────────────

interface Booking {
  id: string
  employee_id: string
  order_date: string
  customer_name: string
  customer_phone: string
  city: string
  event_date: string
  total_amount: number
  advance_paid: number
  website: string
  occasion: string
  booking_platform: string
  created_at: string
}

interface FormData {
  order_date:       string
  customer_name:    string
  customer_phone:   string
  city:             string
  event_date:       string
  total_amount:     string
  advance_paid:     string
  website:          string
  occasion:         string
  booking_platform: string
}

// ── Helpers ───────────────────────────────────────────────────────────────────

// Local date as YYYY-MM-DD. Avoids `toISOString()` which returns UTC date —
// for IST users past midnight that would yield yesterday's date.
function todayISO() {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

function isoToDisplay(iso: string) {
  return new Date(iso + 'T12:00:00').toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
}

function timeAgo(iso: string) {
  const diff = Math.floor((Date.now() - new Date(iso).getTime()) / 1000)
  if (diff < 60)   return 'just now'
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`
  return `${Math.floor(diff / 3600)}h ago`
}

function fmtINR(n: number) {
  return new Intl.NumberFormat('en-IN').format(n)
}

function getDaysInMonth(year: number, month: number) {
  return new Date(year, month + 1, 0).getDate()
}

function getFirstDayOfMonth(year: number, month: number) {
  return new Date(year, month, 1).getDay() // 0=Sun
}

// ── Pill radio / select helpers ───────────────────────────────────────────────

function PillGroup({
  label, options, value, onChange, required, large, icons,
}: {
  label: string
  options: readonly string[]
  value: string
  onChange: (v: string) => void
  required?: boolean
  /** Bigger pill variant — used for Website and Platform selectors */
  large?: boolean
  /** Optional icon component keyed by option label */
  icons?: Partial<Record<string, React.ElementType>>
}) {
  return (
    <div>
      <label className="mb-1.5 block text-[11px] font-semibold uppercase tracking-wider text-ink-muted">
        {label}{required && <span className="ml-0.5 text-coral">*</span>}
      </label>
      <div className={cn('flex flex-wrap', large ? 'gap-2' : 'gap-1.5')}>
        {options.map((opt) => {
          const Icon = icons?.[opt]
          return (
            <button
              key={opt}
              type="button"
              onClick={() => onChange(opt)}
              className={cn(
                'inline-flex items-center gap-1.5 rounded-xl border font-semibold transition-all',
                large
                  ? 'px-4 py-2.5 text-sm'
                  : 'px-3 py-1.5 text-xs rounded-lg',
                value === opt
                  ? 'border-brand bg-brand text-brand-foreground shadow-sm'
                  : 'border-border bg-surface-2/50 text-ink-muted hover:border-brand/40 hover:text-ink',
              )}
            >
              {value === opt
                ? <Check className={large ? 'size-4' : 'size-3'} />
                : Icon && <Icon className={large ? 'size-4' : 'size-3'} />}
              {opt}
            </button>
          )
        })}
      </div>
    </div>
  )
}

function FieldInput({
  label, required, children,
}: {
  label: string
  required?: boolean
  children: React.ReactNode
}) {
  return (
    <div>
      <label className="mb-1.5 block text-[11px] font-semibold uppercase tracking-wider text-ink-muted">
        {label}{required && <span className="ml-0.5 text-coral">*</span>}
      </label>
      {children}
    </div>
  )
}

const inputCls = 'h-10 w-full rounded-xl border border-border bg-surface px-3 text-sm text-ink placeholder:text-ink-soft/60 focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/20 transition-colors'
const selectCls = inputCls + ' appearance-none cursor-pointer'

// ── Calendar ──────────────────────────────────────────────────────────────────

function BookingCalendar({
  year, month, filedDates, selectedDate,
  onSelectDate, onPrev, onNext,
}: {
  year: number
  month: number
  filedDates: Set<string>
  selectedDate: string
  onSelectDate: (d: string) => void
  onPrev: () => void
  onNext: () => void
}) {
  const today      = todayISO()
  const daysInMonth = getDaysInMonth(year, month)
  const firstDay   = getFirstDayOfMonth(year, month)
  const cells: (number | null)[] = [
    ...Array(firstDay).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ]

  return (
    <div className="overflow-hidden rounded-2xl border border-border bg-surface shadow-card">
      {/* Month nav */}
      <div className="flex items-center justify-between border-b border-border px-4 py-3">
        <button type="button" onClick={onPrev}
          className="grid size-7 place-items-center rounded-lg border border-border text-ink-soft hover:bg-surface-2">
          <ChevronLeft className="size-4" />
        </button>
        <p className="text-sm font-semibold text-ink">{MONTHS[month]} {year}</p>
        <button type="button" onClick={onNext}
          className="grid size-7 place-items-center rounded-lg border border-border text-ink-soft hover:bg-surface-2">
          <ChevronRight className="size-4" />
        </button>
      </div>

      {/* Day headers */}
      <div className="grid grid-cols-7 border-b border-border">
        {DAYS.map((d) => (
          <div key={d} className="py-1.5 text-center text-[10px] font-bold uppercase tracking-wider text-ink-soft">{d}</div>
        ))}
      </div>

      {/* Date cells */}
      <div className="grid grid-cols-7 gap-px bg-border p-px">
        {cells.map((day, idx) => {
          if (!day) return <div key={`empty-${idx}`} className="bg-surface" />

          const iso      = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
          const isPast   = iso < today
          const isToday  = iso === today
          const isFuture = iso > today
          const isFiled  = filedDates.has(iso)
          const isSelected = iso === selectedDate

          return (
            <button
              key={iso}
              type="button"
              onClick={() => !isFuture && onSelectDate(iso)}
              disabled={isFuture}
              className={cn(
                'relative flex flex-col items-center justify-center bg-surface py-2 text-sm font-medium transition-all',
                isFuture && 'cursor-default opacity-30',
                !isFuture && !isSelected && 'hover:bg-surface-2',
                isSelected && 'bg-brand/10',
              )}
            >
              <span className={cn(
                'flex size-7 items-center justify-center rounded-full text-xs font-semibold',
                isSelected && 'bg-brand text-brand-foreground shadow-sm',
                isToday && !isSelected && 'ring-2 ring-brand text-brand',
                !isSelected && !isToday && (isPast || isToday) && 'text-ink',
              )}>
                {day}
              </span>
              {/* Status dot */}
              {(isPast || isToday) && (
                <span className={cn(
                  'mt-0.5 size-1.5 rounded-full',
                  isFiled ? 'bg-emerald' : 'bg-coral',
                )} />
              )}
            </button>
          )
        })}
      </div>

      {/* Legend */}
      <div className="flex items-center justify-center gap-4 border-t border-border px-4 py-2">
        <span className="flex items-center gap-1.5 text-[10px] text-ink-soft">
          <span className="size-2 rounded-full bg-emerald" /> Filed
        </span>
        <span className="flex items-center gap-1.5 text-[10px] text-ink-soft">
          <span className="size-2 rounded-full bg-coral" /> Missing
        </span>
      </div>
    </div>
  )
}

// ── Booking List ──────────────────────────────────────────────────────────────
// Read-only for employees. Once a booking is submitted, only an admin can edit
// or delete it — this prevents accidental loss of records the company depends on.

function BookingList({ bookings }: { bookings: Booking[] }) {
  if (bookings.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-border px-4 py-6 text-center">
        <p className="text-xs text-ink-soft">No bookings recorded for this date.</p>
      </div>
    )
  }

  return (
    <div className="space-y-2">
      {bookings.map((b) => (
        <div key={b.id}
          className="flex items-start gap-3 rounded-xl border border-border bg-surface px-4 py-3 shadow-sm">
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <p className="text-sm font-semibold text-ink">{b.customer_name}</p>
              <span className="rounded-full bg-surface-2 px-1.5 py-px text-[9px] font-semibold text-ink-soft">{b.city}</span>
            </div>
            <p className="text-[11px] text-ink-soft">{b.customer_phone} · {b.occasion}</p>
            <div className="mt-1 flex flex-wrap items-center gap-1.5">
              <span className="rounded-full bg-brand/10 px-2 py-px text-[10px] font-semibold text-brand">{b.website}</span>
              <span className="rounded-full bg-surface-2 px-2 py-px text-[10px] font-semibold text-ink-soft">{b.booking_platform}</span>
              {/* Amounts masked */}
              <span className="rounded-full bg-surface-2 px-2 py-px text-[10px] font-mono font-semibold text-ink-soft">
                ₹ ****
              </span>
            </div>
          </div>
          <p className="shrink-0 text-[10px] text-ink-soft">{timeAgo(b.created_at)}</p>
        </div>
      ))}
    </div>
  )
}

// ── Main Page ─────────────────────────────────────────────────────────────────

const EMPTY_FORM = (orderDate: string): FormData => ({
  order_date:       orderDate,
  customer_name:    '',
  customer_phone:   '',
  city:             '',
  event_date:       '',
  total_amount:     '',
  advance_paid:     '',
  website:          '',
  occasion:         '',
  booking_platform: '',
})

const ALLOWED_DEPARTMENTS = ['Sales', 'Operations']

export default function BookingsPage() {
  const employee = useEmployee()

  // ── Cal state ──────────────────────────────────────────────────────────────
  const now = new Date()
  const [calYear,  setCalYear]  = React.useState(now.getFullYear())
  const [calMonth, setCalMonth] = React.useState(now.getMonth())
  const [selectedDate, setSelectedDate] = React.useState(todayISO())

  // ── Data state ─────────────────────────────────────────────────────────────
  const [monthBookings, setMonthBookings] = React.useState<Booking[]>([])
  const [loadingCal,    setLoadingCal]    = React.useState(true)

  // ── Form state ─────────────────────────────────────────────────────────────
  const [form,    setForm]    = React.useState<FormData>(EMPTY_FORM(todayISO()))
  const [saving,  setSaving]  = React.useState(false)
  const [success, setSuccess] = React.useState(false)
  const [errors,  setErrors]  = React.useState<Partial<Record<keyof FormData, string>>>({})
  const [apiErr,  setApiErr]  = React.useState<string | null>(null)

  const nameRef  = React.useRef<HTMLInputElement>(null)
  const phoneRef = React.useRef<HTMLInputElement>(null)

  // ── Load bookings for current calendar month ───────────────────────────────
  const loadMonth = React.useCallback(async () => {
    if (!employee.id) return
    setLoadingCal(true)
    const from = `${calYear}-${String(calMonth + 1).padStart(2, '0')}-01`
    const to   = `${calYear}-${String(calMonth + 1).padStart(2, '0')}-${getDaysInMonth(calYear, calMonth)}`
    try {
      const r = await fetch(`/api/bookings?employee_id=${employee.id}&from=${from}&to=${to}`)
      const d = await r.json()
      // Defensive: numeric → number coercion
      const rows: Booking[] = Array.isArray(d)
        ? d.map((b: any) => ({
            ...b,
            total_amount: Number(b.total_amount) || 0,
            advance_paid: Number(b.advance_paid) || 0,
          }))
        : []
      setMonthBookings(rows)
    } catch { /**/ }
    finally { setLoadingCal(false) }
  }, [employee.id, calYear, calMonth])

  React.useEffect(() => { loadMonth() }, [loadMonth])

  // Sync form order_date when calendar date selected
  React.useEffect(() => {
    setForm((f) => ({ ...f, order_date: selectedDate }))
  }, [selectedDate])

  // ── Derived ────────────────────────────────────────────────────────────────
  const filedDates = React.useMemo(() => {
    return new Set(monthBookings.map((b) => b.order_date))
  }, [monthBookings])

  const selectedDateBookings = React.useMemo(() => {
    return monthBookings.filter((b) => b.order_date === selectedDate)
  }, [monthBookings, selectedDate])

  const todayCount = monthBookings.filter((b) => b.order_date === todayISO()).length
  const monthCount = monthBookings.length
  const missingDays = React.useMemo(() => {
    const today = todayISO()
    const count  = getDaysInMonth(calYear, calMonth)
    let missing  = 0
    for (let d = 1; d <= count; d++) {
      const iso = `${calYear}-${String(calMonth + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`
      if (iso > today) break
      if (!filedDates.has(iso)) missing++
    }
    return missing
  }, [calYear, calMonth, filedDates])

  // ── Live amount derived values ─────────────────────────────────────────────
  const totalAmt   = parseFloat(form.total_amount)  || 0
  const advanceAmt = parseFloat(form.advance_paid)  || 0
  const pendingAmt = Math.max(0, totalAmt - advanceAmt)
  const showAmountSummary = totalAmt > 0

  // Live advance-exceeds-total warning (shown immediately, not just on submit)
  const advanceExceedsTotal =
    form.total_amount !== '' &&
    form.advance_paid !== '' &&
    advanceAmt > totalAmt

  // ── Cal navigation ─────────────────────────────────────────────────────────
  function prevMonth() {
    if (calMonth === 0) { setCalYear((y) => y - 1); setCalMonth(11) }
    else setCalMonth((m) => m - 1)
  }
  function nextMonth() {
    if (calMonth === 11) { setCalYear((y) => y + 1); setCalMonth(0) }
    else setCalMonth((m) => m + 1)
  }

  // ── Form helpers ───────────────────────────────────────────────────────────
  function set(key: keyof FormData, value: string) {
    setForm((f) => ({ ...f, [key]: value }))
    if (errors[key]) setErrors((e) => ({ ...e, [key]: undefined }))
  }

  // Phone: strip non-digits, cap at 10
  function handlePhoneChange(raw: string) {
    const digits = raw.replace(/\D/g, '').slice(0, 10)
    set('customer_phone', digits)
  }

  // City quick-pick — sets city + clears city error
  function pickCity(c: string) {
    setForm((f) => ({ ...f, city: c }))
    setErrors((e) => ({ ...e, city: undefined }))
  }

  function validate(): boolean {
    const e: Partial<Record<keyof FormData, string>> = {}

    if (!form.order_date)           e.order_date       = 'Required'
    if (!form.customer_name.trim()) e.customer_name    = 'Required'

    // Phone: required + must be exactly 10 digits
    if (!form.customer_phone.trim()) {
      e.customer_phone = 'Required'
    } else if (!/^\d{10}$/.test(form.customer_phone.trim())) {
      e.customer_phone = 'Enter a valid 10-digit mobile number'
    }

    if (!form.city)             e.city             = 'Select or type a city'
    if (!form.event_date)       e.event_date       = 'Required'

    // Event date must not be before order date
    if (form.event_date && form.order_date && form.event_date < form.order_date) {
      e.event_date = 'Event date cannot be before the order date'
    }

    if (!form.total_amount)     e.total_amount     = 'Required'
    if (!form.advance_paid)     e.advance_paid     = 'Required'

    // Advance cannot exceed total
    if (form.total_amount && form.advance_paid) {
      const total   = parseFloat(form.total_amount)
      const advance = parseFloat(form.advance_paid)
      if (!isNaN(total) && !isNaN(advance) && advance > total) {
        e.advance_paid = `Advance (₹${fmtINR(advance)}) cannot exceed total (₹${fmtINR(total)})`
      }
    }

    if (!form.website)          e.website          = 'Select one'
    if (!form.occasion)         e.occasion         = 'Required'
    if (!form.booking_platform) e.booking_platform = 'Select one'

    setErrors(e)
    return Object.keys(e).length === 0
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!validate()) return
    setSaving(true); setApiErr(null)
    try {
      const r = await fetch('/api/bookings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          employee_id:      employee.id,
          order_date:       form.order_date,
          customer_name:    form.customer_name.trim(),
          customer_phone:   form.customer_phone.trim(),
          city:             form.city,
          event_date:       form.event_date,
          total_amount:     parseFloat(form.total_amount),
          advance_paid:     parseFloat(form.advance_paid),
          website:          form.website,
          occasion:         form.occasion,
          booking_platform: form.booking_platform,
        }),
      })
      if (!r.ok) {
        const d = await r.json().catch(() => ({}))
        throw new Error(d.error ?? 'Failed to save')
      }
      const createdRaw = await r.json()
      const created: Booking = {
        ...createdRaw,
        total_amount: Number(createdRaw.total_amount) || 0,
        advance_paid: Number(createdRaw.advance_paid) || 0,
      }

      // Update local state immediately (no re-fetch needed)
      setMonthBookings((prev) => [created, ...prev])

      // Flash success, reset customer fields, keep sticky fields
      setSuccess(true)
      setTimeout(() => setSuccess(false), 2500)
      setForm((f) => ({
        ...EMPTY_FORM(f.order_date),
        // Keep city, website, occasion, platform — saves time for repeat entries
        city:             f.city,
        website:          f.website,
        occasion:         f.occasion,
        booking_platform: f.booking_platform,
      }))
      setTimeout(() => nameRef.current?.focus(), 50)
    } catch (err) {
      setApiErr(err instanceof Error ? err.message : 'Failed to save')
    } finally {
      setSaving(false)
    }
  }


  // ── Department guard ───────────────────────────────────────────────────────
  // Strict: must explicitly belong to Sales or Operations. Null/undefined
  // department is denied — direct URL access is blocked even if sidebar hid the link.
  if (!employee.department || !ALLOWED_DEPARTMENTS.includes(employee.department)) {
    return (
      <>
        <EmployeeTopbar title="Bookings" breadcrumb={[{ label: 'Home' }, { label: 'Bookings' }]} />
        <main className="flex flex-col items-center justify-center gap-4 py-32">
          <div className="grid size-16 place-items-center rounded-2xl bg-surface-2">
            <BookOpen className="size-8 text-ink-soft/40" />
          </div>
          <p className="text-sm font-medium text-ink">Access Restricted</p>
          <p className="text-xs text-ink-soft">Bookings are only available for Sales and Operations teams.</p>
        </main>
      </>
    )
  }

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <>
      <EmployeeTopbar
        title="Bookings"
        breadcrumb={[{ label: 'Home' }, { label: 'Bookings' }]}
        subtitle={`${todayCount} today · ${monthCount} this month`}
      />

      <main className="px-4 py-4 sm:px-6 sm:py-5">
        <div className="grid gap-4 sm:gap-5 lg:grid-cols-[320px_1fr]">

          {/* ── LEFT: Calendar + day entries ── */}
          <div className="space-y-4">

            {/* Stats strip */}
            <div className="grid grid-cols-3 gap-3">
              {[
                { label: 'Today',   value: todayCount,  color: 'text-brand'   },
                { label: 'Month',   value: monthCount,  color: 'text-emerald' },
                { label: 'Missing', value: missingDays, color: missingDays > 0 ? 'text-coral' : 'text-emerald' },
              ].map((s) => (
                <div key={s.label} className="rounded-xl border border-border bg-surface px-3 py-2.5 text-center shadow-card">
                  <p className={cn('text-xl font-bold tabular-nums', s.color)}>{s.value}</p>
                  <p className="text-[10px] font-medium text-ink-soft">{s.label}</p>
                </div>
              ))}
            </div>

            {/* Calendar */}
            <BookingCalendar
              year={calYear}
              month={calMonth}
              filedDates={filedDates}
              selectedDate={selectedDate}
              onSelectDate={(d) => setSelectedDate(d)}
              onPrev={prevMonth}
              onNext={nextMonth}
            />

            {/* Entries for selected date */}
            <div>
              <div className="mb-2 flex items-center justify-between">
                <p className="text-[11px] font-bold uppercase tracking-wider text-ink-soft">
                  {selectedDate === todayISO() ? "Today's Entries" : isoToDisplay(selectedDate)}
                </p>
                <span className="rounded-full bg-surface-2 px-1.5 py-px text-[10px] font-semibold text-ink-soft">
                  {selectedDateBookings.length}
                </span>
              </div>
              {loadingCal ? (
                <div className="space-y-2">
                  {[1, 2].map((i) => <div key={i} className="h-16 animate-pulse rounded-xl bg-surface-2" />)}
                </div>
              ) : (
                <BookingList bookings={selectedDateBookings} />
              )}
            </div>
          </div>

          {/* ── RIGHT: Booking form ── */}
          <div className="overflow-hidden rounded-2xl border border-border bg-surface shadow-card">
            {/* Form header */}
            <div className={cn(
              'flex items-center justify-between border-b border-border px-6 py-4 transition-colors',
              success && 'border-emerald/30 bg-emerald/[0.04]',
            )}>
              <div>
                <h2 className="text-base font-semibold text-ink">New Booking Entry</h2>
                <p className="text-xs text-ink-soft">
                  {success
                    ? '✓ Saved! Customer fields cleared — ready for next entry.'
                    : 'Fill all fields and press Save. City, website & platform are remembered.'}
                </p>
              </div>
              {success && <Check className="size-5 text-emerald" />}
            </div>

            <form onSubmit={handleSubmit} className="space-y-5 px-6 py-5">

              {/* ── Row 1: Order Date · Customer Name · Phone — 3 uniform inputs ── */}
              <div className="grid gap-4 sm:grid-cols-3">
                <FieldInput label="Order Date" required>
                  <input
                    type="date"
                    value={form.order_date}
                    max={todayISO()}
                    onChange={(e) => { set('order_date', e.target.value); setSelectedDate(e.target.value) }}
                    className={cn(inputCls, errors.order_date && 'border-coral')}
                  />
                  {errors.order_date && <p className="mt-1 text-[10px] text-coral">{errors.order_date}</p>}
                </FieldInput>

                <FieldInput label="Customer Name" required>
                  <input
                    ref={nameRef}
                    type="text"
                    placeholder="e.g. Rahul Sharma"
                    value={form.customer_name}
                    onChange={(e) => set('customer_name', e.target.value)}
                    onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); phoneRef.current?.focus() } }}
                    autoComplete="off"
                    className={cn(inputCls, errors.customer_name && 'border-coral')}
                  />
                  {errors.customer_name && <p className="mt-1 text-[10px] text-coral">{errors.customer_name}</p>}
                </FieldInput>

                <FieldInput label="Customer Phone" required>
                  <div className="relative">
                    <input
                      ref={phoneRef}
                      type="tel"
                      inputMode="numeric"
                      placeholder="10-digit mobile number"
                      value={form.customer_phone}
                      onChange={(e) => handlePhoneChange(e.target.value)}
                      maxLength={10}
                      autoComplete="off"
                      className={cn(inputCls, 'pr-10', errors.customer_phone && 'border-coral')}
                    />
                    <span className={cn(
                      'pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-mono tabular-nums',
                      form.customer_phone.length === 10 ? 'text-emerald' : 'text-ink-soft/50',
                    )}>
                      {form.customer_phone.length}/10
                    </span>
                  </div>
                  {errors.customer_phone && <p className="mt-1 text-[10px] text-coral">{errors.customer_phone}</p>}
                </FieldInput>
              </div>

              {/* ── Row 2: City — full width so quick-pick pills don't fight a neighbour ── */}
              <FieldInput label="City of Booking" required>
                <div className="mb-2 flex flex-wrap gap-1">
                  {QUICK_CITIES.map((c) => (
                    <button
                      key={c}
                      type="button"
                      onClick={() => pickCity(c)}
                      className={cn(
                        'flex items-center gap-1 rounded-md border px-2 py-1 text-[10px] font-semibold transition-all',
                        form.city === c
                          ? 'border-brand bg-brand text-brand-foreground'
                          : 'border-border bg-surface-2/60 text-ink-soft hover:border-brand/40 hover:text-ink',
                      )}
                    >
                      <Zap className="size-2.5" />
                      {c}
                    </button>
                  ))}
                </div>
                <select
                  value={form.city}
                  onChange={(e) => set('city', e.target.value)}
                  className={cn(selectCls, errors.city && 'border-coral')}
                >
                  <option value="">Other city…</option>
                  {CITIES.map((c) => <option key={c} value={c}>{c}</option>)}
                </select>
                {errors.city && <p className="mt-1 text-[10px] text-coral">{errors.city}</p>}
              </FieldInput>

              {/* ── Row 3: Event Date · Total · Advance — 3 uniform inputs ── */}
              <div className="grid gap-4 sm:grid-cols-3">
                <FieldInput label="Date of Event" required>
                  <input
                    type="date"
                    value={form.event_date}
                    min={form.order_date || undefined}
                    onChange={(e) => set('event_date', e.target.value)}
                    className={cn(inputCls, errors.event_date && 'border-coral')}
                  />
                  {errors.event_date
                    ? <p className="mt-1 text-[10px] text-coral">{errors.event_date}</p>
                    : form.order_date && (
                      <p className="mt-1 text-[10px] text-ink-soft">On or after order date</p>
                    )}
                </FieldInput>

                <FieldInput label="Total Amount (₹)" required>
                  <input
                    type="number"
                    placeholder="e.g. 5000"
                    min={0}
                    step="1"
                    value={form.total_amount}
                    onChange={(e) => set('total_amount', e.target.value)}
                    className={cn(inputCls, errors.total_amount && 'border-coral')}
                  />
                  {errors.total_amount
                    ? <p className="mt-1 text-[10px] text-coral">{errors.total_amount}</p>
                    : totalAmt > 0 && (
                      <p className="mt-1 text-[10px] text-ink-soft">₹{fmtINR(totalAmt)}</p>
                    )}
                </FieldInput>

                <FieldInput label="Advance Paid (₹)" required>
                  <input
                    type="number"
                    placeholder="0"
                    min={0}
                    step="1"
                    max={form.total_amount || undefined}
                    value={form.advance_paid}
                    onChange={(e) => set('advance_paid', e.target.value)}
                    className={cn(
                      inputCls,
                      (errors.advance_paid || advanceExceedsTotal) && 'border-coral',
                    )}
                  />
                  {errors.advance_paid ? (
                    <p className="mt-1 text-[10px] text-coral">{errors.advance_paid}</p>
                  ) : advanceExceedsTotal ? (
                    <p className="mt-1 text-[10px] text-coral">Cannot exceed ₹{fmtINR(totalAmt)}</p>
                  ) : advanceAmt > 0 && totalAmt > 0 ? (
                    <p className="mt-1 text-[10px] text-ink-soft">Pending: ₹{fmtINR(pendingAmt)}</p>
                  ) : null}
                </FieldInput>
              </div>

              {/* Amount summary strip */}
              {showAmountSummary && advanceAmt > 0 && !advanceExceedsTotal && (
                <div className="flex items-center gap-3 rounded-xl border border-border bg-surface-2/40 px-4 py-2.5">
                  <div className="flex-1 text-center">
                    <p className="text-[10px] font-medium text-ink-soft">Total</p>
                    <p className="text-sm font-bold text-ink">₹{fmtINR(totalAmt)}</p>
                  </div>
                  <div className="h-8 w-px bg-border" />
                  <div className="flex-1 text-center">
                    <p className="text-[10px] font-medium text-ink-soft">Advance</p>
                    <p className="text-sm font-bold text-emerald">₹{fmtINR(advanceAmt)}</p>
                  </div>
                  <div className="h-8 w-px bg-border" />
                  <div className="flex-1 text-center">
                    <p className="text-[10px] font-medium text-ink-soft">Pending</p>
                    <p className={cn('text-sm font-bold', pendingAmt > 0 ? 'text-amber-500' : 'text-emerald')}>
                      ₹{fmtINR(pendingAmt)}
                    </p>
                  </div>
                </div>
              )}

              {/* ── Row 4: Occasion · Website — both pill groups at the same height ── */}
              <div className="grid gap-4 sm:grid-cols-2">
                <FieldInput label="Occasion" required>
                  <select
                    value={form.occasion}
                    onChange={(e) => set('occasion', e.target.value)}
                    className={cn(selectCls, errors.occasion && 'border-coral')}
                  >
                    <option value="">Select occasion…</option>
                    {OCCASIONS.map((o) => <option key={o} value={o}>{o}</option>)}
                  </select>
                  {errors.occasion && <p className="mt-1 text-[10px] text-coral">{errors.occasion}</p>}
                </FieldInput>

                <div>
                  <PillGroup
                    label="Booking from Website"
                    options={WEBSITES}
                    value={form.website}
                    onChange={(v) => set('website', v)}
                    required
                    large
                  />
                  {errors.website && <p className="mt-1 text-[10px] text-coral">{errors.website}</p>}
                </div>
              </div>

              {/* ── Row 5: Booking Platform — full width, large icon pills ── */}
              <div>
                <PillGroup
                  label="Booking Platform"
                  options={PLATFORMS}
                  value={form.booking_platform}
                  onChange={(v) => set('booking_platform', v)}
                  required
                  large
                  icons={{
                    WhatsApp: MessageCircle,
                    Website:  Globe,
                    Others:   MoreHorizontal,
                  }}
                />
                {errors.booking_platform && <p className="mt-1 text-[10px] text-coral">{errors.booking_platform}</p>}
              </div>

              {/* API error */}
              {apiErr && (
                <div className="flex items-center gap-2 rounded-xl border border-coral/20 bg-coral/5 px-4 py-3">
                  <AlertCircle className="size-4 shrink-0 text-coral" />
                  <p className="text-xs text-coral">{apiErr}</p>
                </div>
              )}

              {/* Submit */}
              <button
                type="submit"
                disabled={saving || advanceExceedsTotal}
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-brand py-3 text-sm font-semibold text-brand-foreground shadow-sm hover:opacity-90 disabled:opacity-50 transition-opacity"
              >
                {saving
                  ? <><Loader2 className="size-4 animate-spin" /> Saving…</>
                  : <><Plus className="size-4" /> Save Booking</>}
              </button>

              <p className="text-center text-[10px] text-ink-soft">
                City, website, occasion &amp; platform are remembered between entries
              </p>
            </form>
          </div>
        </div>
      </main>
    </>
  )
}
