'use client'

import * as React from 'react'
import {
  Calendar,
  Check,
  ChevronRight,
  Clock,
  Loader2,
  Pencil,
  Plus,
  Save,
  Trash2,
  X,
} from 'lucide-react'

import { Drawer } from '@/components/ui/drawer'
import { Avatar } from '@/components/ui/avatar'
import { cn } from '@/lib/utils'
import type { AttendanceStatus, AttendanceWithEmployee } from '@/lib/db/attendance'
import type { Employee } from '@/lib/db/types'

// ── Types ──────────────────────────────────────────────────────────────────

type Period = 'today' | 'week' | 'month' | 'quarter' | 'six_months'

interface Props {
  open: boolean
  onClose: () => void
  employee: Employee | null
  rows: AttendanceWithEmployee[]           // all rows for this employee
  onSaved: (row: AttendanceWithEmployee) => void
  onDeleted: (id: string) => void
}

// ── Constants ──────────────────────────────────────────────────────────────

export const STATUS_META: Record<AttendanceStatus, {
  label: string
  dot: string
  chip: string
  bg: string
  calBg: string
}> = {
  present:  { label: 'Present',  dot: 'bg-emerald', chip: 'bg-emerald/15 text-emerald', bg: 'bg-emerald/10', calBg: 'bg-emerald/20 border-emerald/40' },
  late:     { label: 'Late',     dot: 'bg-amber',   chip: 'bg-amber/15 text-amber',     bg: 'bg-amber/10',   calBg: 'bg-amber/20 border-amber/40' },
  absent:   { label: 'Absent',   dot: 'bg-coral',   chip: 'bg-coral/15 text-coral',     bg: 'bg-coral/10',   calBg: 'bg-coral/20 border-coral/40' },
  half_day: { label: 'Half Day', dot: 'bg-sky',     chip: 'bg-sky/15 text-sky',         bg: 'bg-sky/10',     calBg: 'bg-sky/20 border-sky/40' },
  leave:    { label: 'Leave',    dot: 'bg-violet',  chip: 'bg-violet/15 text-violet',   bg: 'bg-violet/10',  calBg: 'bg-violet/20 border-violet/40' },
  holiday:  { label: 'Holiday',  dot: 'bg-indigo',  chip: 'bg-indigo/15 text-indigo',   bg: 'bg-indigo/10',  calBg: 'bg-indigo/20 border-indigo/40' },
}

const PERIOD_LABELS: Record<Period, string> = {
  today: 'Today',
  week: 'This Week',
  month: 'This Month',
  quarter: 'Quarter',
  six_months: '6 Months',
}

// ── Helpers ────────────────────────────────────────────────────────────────

function isoToday() {
  return new Date().toISOString().slice(0, 10)
}

function isoDate(d: Date) {
  return d.toISOString().slice(0, 10)
}

function periodBounds(period: Period): { from: string; to: string } {
  const now = new Date()
  const today = isoToday()

  if (period === 'today') return { from: today, to: today }

  if (period === 'week') {
    const day = now.getDay() || 7
    const mon = new Date(now); mon.setDate(mon.getDate() - (day - 1))
    const sun = new Date(mon); sun.setDate(sun.getDate() + 6)
    return { from: isoDate(mon), to: isoDate(sun) }
  }

  if (period === 'month') {
    return {
      from: isoDate(new Date(now.getFullYear(), now.getMonth(), 1)),
      to: today,
    }
  }

  if (period === 'quarter') {
    const q = Math.floor(now.getMonth() / 3)
    return {
      from: isoDate(new Date(now.getFullYear(), q * 3, 1)),
      to: today,
    }
  }

  // six_months
  const from = new Date(now)
  from.setMonth(from.getMonth() - 6)
  return { from: isoDate(from), to: today }
}

function formatDate(iso: string) {
  return new Intl.DateTimeFormat(undefined, {
    weekday: 'short', day: 'numeric', month: 'short',
  }).format(new Date(`${iso}T12:00:00`))
}

function formatTime(ts: string | null) {
  if (!ts) return '—'
  return new Intl.DateTimeFormat(undefined, { hour: '2-digit', minute: '2-digit' }).format(new Date(ts))
}

function minutesToHours(mins: number | null) {
  if (mins == null) return '—'
  const h = Math.floor(mins / 60)
  const m = mins % 60
  return m === 0 ? `${h}h` : `${h}h ${m}m`
}

function timeShort(t: string | null) {
  return t ? t.slice(0, 5) : '--:--'
}

function toTimeInput(ts: string | null) {
  if (!ts) return ''
  return new Date(ts).toTimeString().slice(0, 5)
}

function toIsoDateTime(date: string, time: string) {
  if (!time) return null
  return new Date(`${date}T${time}:00`).toISOString()
}

function buildCalendarDays(year: number, month: number): Array<string | null> {
  const first = new Date(year, month, 1)
  const last = new Date(year, month + 1, 0)
  const startDow = (first.getDay() + 6) % 7 // Mon = 0
  const days: Array<string | null> = []
  for (let i = 0; i < startDow; i++) days.push(null)
  for (let d = 1; d <= last.getDate(); d++) {
    days.push(isoDate(new Date(year, month, d)))
  }
  return days
}

// ── Stats derivation ────────────────────────────────────────────────────────

function deriveStats(rows: AttendanceWithEmployee[]) {
  let present = 0, late = 0, absent = 0, half_day = 0, leave = 0, holiday = 0, totalMins = 0, workedDays = 0
  for (const r of rows) {
    if (r.status === 'present') present++
    else if (r.status === 'late') late++
    else if (r.status === 'absent') absent++
    else if (r.status === 'half_day') half_day++
    else if (r.status === 'leave') leave++
    else if (r.status === 'holiday') holiday++
    if (r.total_minutes) { totalMins += r.total_minutes; workedDays++ }
  }
  const eligible = rows.length - holiday
  const pct = eligible === 0 ? 0 : Math.round(((present + late + half_day) / eligible) * 100)
  const avgH = workedDays === 0 ? 0 : Math.round((totalMins / workedDays / 60) * 10) / 10
  return { present, late, absent, half_day, leave, holiday, pct, avgH }
}

// ── Component ──────────────────────────────────────────────────────────────

export function EmployeeDetailDrawer({ open, onClose, employee, rows, onSaved, onDeleted }: Props) {
  const [period, setPeriod] = React.useState<Period>('month')
  const [calMonth, setCalMonth] = React.useState(() => {
    const now = new Date()
    return { year: now.getFullYear(), month: now.getMonth() }
  })

  // Mark form state
  const [markOpen, setMarkOpen] = React.useState(false)
  const [editRow, setEditRow] = React.useState<AttendanceWithEmployee | null>(null)
  const [draft, setDraft] = React.useState({ date: isoToday(), status: 'present' as AttendanceStatus, login_time: '09:00', logout_time: '18:00', notes: '' })
  const [saving, setSaving] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)

  // Reset period when employee changes
  React.useEffect(() => {
    if (open) {
      setPeriod('month')
      setMarkOpen(false)
      setEditRow(null)
      setError(null)
    }
  }, [open, employee?.id])

  if (!employee) return null

  const bounds = periodBounds(period)

  // Filter rows for selected period
  const periodRows = rows
    .filter((r) => r.date >= bounds.from && r.date <= bounds.to)
    .sort((a, b) => b.date.localeCompare(a.date))

  const stats = deriveStats(periodRows)

  // Map date → row for calendar
  const byDate = new Map<string, AttendanceWithEmployee>()
  for (const r of rows) byDate.set(r.date, r)

  const calDays = buildCalendarDays(calMonth.year, calMonth.month)

  function openEdit(row: AttendanceWithEmployee) {
    setEditRow(row)
    setDraft({
      date: row.date,
      status: row.status,
      login_time: toTimeInput(row.login_at),
      logout_time: toTimeInput(row.logout_at),
      notes: row.notes ?? '',
    })
    setMarkOpen(true)
  }

  function openCreate(date?: string) {
    setEditRow(null)
    setDraft({
      date: date ?? isoToday(),
      status: 'present',
      login_time: timeShort(employee?.working_hours_start ?? null),
      logout_time: timeShort(employee?.working_hours_end ?? null),
      notes: '',
    })
    setMarkOpen(true)
  }

  const noWorkStatus = (s: AttendanceStatus) =>
    s === 'absent' || s === 'leave' || s === 'holiday'

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    if (!draft.date) return
    setSaving(true); setError(null)
    try {
      const payload = {
        employee_id: employee!.id,
        date: draft.date,
        login_at: noWorkStatus(draft.status) ? null : toIsoDateTime(draft.date, draft.login_time),
        logout_at: noWorkStatus(draft.status) ? null : toIsoDateTime(draft.date, draft.logout_time),
        status: draft.status,
        notes: draft.notes.trim() || null,
      }
      const url = editRow ? `/api/attendance/${editRow.id}` : '/api/attendance'
      const method = editRow ? 'PATCH' : 'POST'
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data?.error ?? 'Failed to save')
      onSaved(data as AttendanceWithEmployee)
      setMarkOpen(false); setEditRow(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong')
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete(row: AttendanceWithEmployee) {
    if (!window.confirm(`Delete attendance for ${formatDate(row.date)}?`)) return
    try {
      const res = await fetch(`/api/attendance/${row.id}`, { method: 'DELETE' })
      if (!res.ok) throw new Error('Failed to delete')
      onDeleted(row.id)
    } catch {
      // silently ignore
    }
  }

  const prevMonth = () => {
    setCalMonth((p) => {
      const m = p.month === 0 ? 11 : p.month - 1
      const y = p.month === 0 ? p.year - 1 : p.year
      return { year: y, month: m }
    })
  }
  const nextMonth = () => {
    setCalMonth((p) => {
      const m = p.month === 11 ? 0 : p.month + 1
      const y = p.month === 11 ? p.year + 1 : p.year
      return { year: y, month: m }
    })
  }

  const monthLabel = new Intl.DateTimeFormat(undefined, { month: 'long', year: 'numeric' })
    .format(new Date(calMonth.year, calMonth.month, 1))

  const footer = (
    <div className="flex w-full items-center justify-between">
      <button type="button" onClick={onClose} className="inline-flex h-10 items-center rounded-xl border border-border px-4 text-sm font-medium text-ink-muted hover:bg-surface-2">
        Close
      </button>
      <button type="button" onClick={() => openCreate()} className="inline-flex h-10 items-center gap-1.5 rounded-xl bg-brand px-4 text-sm font-medium text-brand-foreground shadow-sm hover:opacity-90">
        <Plus className="size-4" />
        Mark Attendance
      </button>
    </div>
  )

  return (
    <Drawer open={open} onClose={onClose} title={employee.full_name} size="lg" footer={footer}
      description={(employee.role as { name?: string } | null)?.name ?? undefined}
    >
      <div className="space-y-6">

        {/* ── Employee header info ── */}
        <div className="flex items-center gap-4 rounded-2xl border border-border bg-surface-2/40 p-4">
          <Avatar name={employee.full_name} size="lg" className="size-14 text-lg shrink-0" />
          <div className="min-w-0 flex-1">
            <p className="text-base font-semibold">{employee.full_name}</p>
            <p className="text-sm text-ink-muted">
              {(employee.department as { name?: string } | null)?.name ?? 'No department'}
              {(employee.role as { name?: string } | null)?.name ? ` · ${(employee.role as { name?: string }).name}` : ''}
            </p>
            {employee.working_hours_start && employee.working_hours_end && (
              <p className="mt-1 flex items-center gap-1 text-xs text-ink-soft">
                <Clock className="size-3" />
                {timeShort(employee.working_hours_start)} – {timeShort(employee.working_hours_end)}
              </p>
            )}
          </div>
        </div>

        {/* ── Period tabs ── */}
        <div className="flex rounded-xl border border-border bg-surface-2/40 p-1 gap-1">
          {(Object.keys(PERIOD_LABELS) as Period[]).map((p) => (
            <button
              key={p}
              type="button"
              onClick={() => setPeriod(p)}
              className={cn(
                'flex-1 rounded-lg py-1.5 text-xs font-semibold transition-colors',
                period === p
                  ? 'bg-brand text-brand-foreground shadow-sm'
                  : 'text-ink-muted hover:text-ink'
              )}
            >
              {PERIOD_LABELS[p]}
            </button>
          ))}
        </div>

        {/* ── Period stats ── */}
        <div className="grid grid-cols-3 gap-2 sm:grid-cols-6">
          {[
            { label: 'Present', value: stats.present, color: 'text-emerald' },
            { label: 'Late', value: stats.late, color: 'text-amber' },
            { label: 'Absent', value: stats.absent, color: 'text-coral' },
            { label: 'Half Day', value: stats.half_day, color: 'text-sky' },
            { label: 'Leave', value: stats.leave, color: 'text-violet' },
            { label: 'Rate', value: `${stats.pct}%`, color: 'text-brand' },
          ].map((item) => (
            <div key={item.label} className="rounded-xl border border-border bg-surface p-2.5 text-center">
              <p className={cn('text-lg font-bold', item.color)}>{item.value}</p>
              <p className="text-[10px] text-ink-soft">{item.label}</p>
            </div>
          ))}
        </div>

        {/* ── Attendance progress bar ── */}
        <div>
          <div className="mb-1 flex items-center justify-between text-xs">
            <span className="text-ink-muted">Attendance rate</span>
            <span className="font-semibold text-brand">{stats.pct}%</span>
          </div>
          <div className="h-2 w-full rounded-full bg-surface-2">
            <div
              className={cn('h-full rounded-full transition-all duration-500',
                stats.pct >= 90 ? 'bg-emerald' : stats.pct >= 75 ? 'bg-amber' : 'bg-coral'
              )}
              style={{ width: `${stats.pct}%` }}
            />
          </div>
          {stats.avgH > 0 && (
            <p className="mt-1 text-xs text-ink-soft">Avg. {stats.avgH}h/day worked</p>
          )}
        </div>

        {/* ── Calendar ── */}
        <div>
          <div className="mb-3 flex items-center justify-between">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-ink-soft">Calendar</h3>
            <div className="flex items-center gap-2">
              <button type="button" onClick={prevMonth} className="grid size-7 place-items-center rounded-lg border border-border text-ink-muted hover:bg-surface-2">
                <ChevronRight className="size-3.5 rotate-180" />
              </button>
              <span className="min-w-[120px] text-center text-sm font-medium">{monthLabel}</span>
              <button type="button" onClick={nextMonth} className="grid size-7 place-items-center rounded-lg border border-border text-ink-muted hover:bg-surface-2">
                <ChevronRight className="size-3.5" />
              </button>
            </div>
          </div>

          {/* Day headers */}
          <div className="mb-1 grid grid-cols-7 gap-1 text-center">
            {['M','T','W','T','F','S','S'].map((d, i) => (
              <div key={i} className="text-[10px] font-semibold uppercase text-ink-soft py-1">{d}</div>
            ))}
          </div>

          {/* Calendar cells */}
          <div className="grid grid-cols-7 gap-1">
            {calDays.map((day, idx) => {
              if (!day) return <div key={idx} />
              const row = byDate.get(day)
              const meta = row ? STATUS_META[row.status] : null
              const isToday = day === isoToday()
              return (
                <button
                  key={day}
                  type="button"
                  onClick={() => row ? openEdit(row) : openCreate(day)}
                  title={row ? `${STATUS_META[row.status].label}${row.login_at ? ` · ${formatTime(row.login_at)}` : ''}` : 'Click to mark'}
                  className={cn(
                    'relative flex aspect-square items-center justify-center rounded-lg border text-xs font-medium transition-colors hover:ring-2 hover:ring-brand/30',
                    meta ? meta.calBg : 'border-dashed border-border bg-transparent text-ink-soft hover:bg-surface-2',
                    isToday && !meta && 'border-brand/40 font-bold text-brand',
                  )}
                >
                  {day.slice(8)}
                  {isToday && (
                    <span className="absolute bottom-0.5 left-1/2 size-1 -translate-x-1/2 rounded-full bg-brand" />
                  )}
                </button>
              )
            })}
          </div>

          {/* Legend */}
          <div className="mt-3 flex flex-wrap gap-3">
            {(Object.entries(STATUS_META) as [AttendanceStatus, typeof STATUS_META[AttendanceStatus]][]).map(([key, meta]) => (
              <span key={key} className="inline-flex items-center gap-1 text-[10px] text-ink-soft">
                <span className={cn('size-2 rounded-sm', meta.dot)} />
                {meta.label}
              </span>
            ))}
          </div>
        </div>

        {/* ── Mark / Edit form ── */}
        {markOpen && (
          <form onSubmit={handleSave} className="rounded-2xl border border-brand/20 bg-brand/5 p-4 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-brand">
                {editRow ? 'Edit Attendance' : 'Mark Attendance'}
              </h3>
              <button type="button" onClick={() => { setMarkOpen(false); setEditRow(null) }} className="grid size-7 place-items-center rounded-lg text-ink-soft hover:bg-surface-2">
                <X className="size-4" />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <FormField label="Date">
                <input type="date" value={draft.date} max={isoToday()}
                  onChange={(e) => setDraft((p) => ({ ...p, date: e.target.value }))}
                  className="h-9 w-full rounded-xl border border-border bg-surface px-3 text-sm focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/20"
                />
              </FormField>
              <FormField label="Status">
                <select value={draft.status}
                  onChange={(e) => setDraft((p) => ({ ...p, status: e.target.value as AttendanceStatus }))}
                  className="h-9 w-full rounded-xl border border-border bg-surface px-3 text-sm focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/20"
                >
                  {(Object.entries(STATUS_META) as [AttendanceStatus, typeof STATUS_META[AttendanceStatus]][]).map(([key, meta]) => (
                    <option key={key} value={key}>{meta.label}</option>
                  ))}
                </select>
              </FormField>
              <FormField label="Login time">
                <input type="time" value={draft.login_time} disabled={noWorkStatus(draft.status)}
                  onChange={(e) => setDraft((p) => ({ ...p, login_time: e.target.value }))}
                  className="h-9 w-full rounded-xl border border-border bg-surface px-3 text-sm focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/20 disabled:opacity-40"
                />
              </FormField>
              <FormField label="Logout time">
                <input type="time" value={draft.logout_time} disabled={noWorkStatus(draft.status)}
                  onChange={(e) => setDraft((p) => ({ ...p, logout_time: e.target.value }))}
                  className="h-9 w-full rounded-xl border border-border bg-surface px-3 text-sm focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/20 disabled:opacity-40"
                />
              </FormField>
            </div>

            <FormField label="Notes (optional)">
              <input type="text" value={draft.notes} placeholder="e.g. Worked from home, doctor visit…"
                onChange={(e) => setDraft((p) => ({ ...p, notes: e.target.value }))}
                className="h-9 w-full rounded-xl border border-border bg-surface px-3 text-sm focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/20"
              />
            </FormField>

            {error && <p className="text-xs text-coral">{error}</p>}

            <div className="flex items-center justify-between">
              {editRow && (
                <button type="button" onClick={() => handleDelete(editRow)}
                  className="inline-flex h-9 items-center gap-1.5 rounded-xl border border-coral/30 px-3 text-sm font-medium text-coral hover:bg-coral/10"
                >
                  <Trash2 className="size-3.5" />
                  Delete
                </button>
              )}
              <button type="submit" disabled={saving}
                className="ml-auto inline-flex h-9 items-center gap-1.5 rounded-xl bg-brand px-4 text-sm font-medium text-brand-foreground shadow-sm hover:opacity-90 disabled:opacity-60"
              >
                {saving ? <Loader2 className="size-3.5 animate-spin" /> : <Save className="size-3.5" />}
                {saving ? 'Saving…' : 'Save'}
              </button>
            </div>
          </form>
        )}

        {/* ── Attendance log ── */}
        <div>
          <div className="mb-3 flex items-center justify-between">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-ink-soft">
              Attendance Log <span className="ml-1 normal-case font-normal">({periodRows.length} records)</span>
            </h3>
          </div>

          {periodRows.length === 0 ? (
            <div className="rounded-xl border border-dashed border-border py-8 text-center text-sm text-ink-soft">
              No records for this period.
              <button type="button" onClick={() => openCreate()} className="ml-2 text-brand hover:underline">
                Add one
              </button>
            </div>
          ) : (
            <div className="space-y-1.5">
              {periodRows.map((row) => {
                const meta = STATUS_META[row.status]
                return (
                  <div
                    key={row.id}
                    className="group flex items-center gap-3 rounded-xl border border-border bg-surface px-4 py-2.5 hover:border-brand/30 hover:bg-surface-2/40"
                  >
                    {/* Date */}
                    <div className="w-28 shrink-0">
                      <p className="text-sm font-medium text-ink">{formatDate(row.date)}</p>
                    </div>

                    {/* Times */}
                    <div className="flex flex-1 items-center gap-4 text-sm text-ink-muted">
                      <span className="flex items-center gap-1 text-xs">
                        <Clock className="size-3 text-ink-soft" />
                        {formatTime(row.login_at)}
                      </span>
                      {row.logout_at && (
                        <>
                          <span className="text-ink-soft">→</span>
                          <span className="text-xs">{formatTime(row.logout_at)}</span>
                        </>
                      )}
                      {row.total_minutes != null && (
                        <span className="text-xs font-medium text-ink-muted">
                          {minutesToHours(row.total_minutes)}
                        </span>
                      )}
                    </div>

                    {/* Status */}
                    <span className={cn('inline-flex shrink-0 items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-semibold', meta.chip)}>
                      <span className={cn('size-1.5 rounded-full', meta.dot)} />
                      {meta.label}
                    </span>

                    {/* Notes */}
                    {row.notes && (
                      <span className="max-w-[100px] truncate text-xs text-ink-soft" title={row.notes}>
                        {row.notes}
                      </span>
                    )}

                    {/* Actions */}
                    <div className="ml-auto flex items-center gap-1 opacity-0 transition-opacity group-hover:opacity-100">
                      <button type="button" onClick={() => openEdit(row)} aria-label="Edit"
                        className="grid size-7 place-items-center rounded-lg text-ink-soft hover:bg-surface hover:text-brand"
                      >
                        <Pencil className="size-3.5" />
                      </button>
                      <button type="button" onClick={() => handleDelete(row)} aria-label="Delete"
                        className="grid size-7 place-items-center rounded-lg text-ink-soft hover:bg-coral/10 hover:text-coral"
                      >
                        <Trash2 className="size-3.5" />
                      </button>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>

      </div>
    </Drawer>
  )
}

// ── Helper components ──────────────────────────────────────────────────────

function FormField({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="mb-1 block text-xs font-medium text-ink-muted">{label}</label>
      {children}
    </div>
  )
}

// Re-exports for parent
export { Check, Calendar }
