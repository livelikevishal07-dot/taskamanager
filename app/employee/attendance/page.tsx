'use client'

import * as React from 'react'
import {
  AlertCircle,
  CalendarDays,
  CheckCircle2,
  Clock,
  LogIn,
  LogOut,
  Loader2,
  TrendingUp,
  XCircle,
  CalendarOff,
  Umbrella,
  ChevronLeft,
  ChevronRight,
  CheckSquare,
  ArrowRight,
} from 'lucide-react'
import Link from 'next/link'
import { cn } from '@/lib/utils'
import { useEmployee } from '@/app/employee/context'
import { EmployeeTopbar } from '@/components/employee-dashboard/topbar'
import { deriveAttendanceMetrics } from '@/lib/metrics'

// ── Types ─────────────────────────────────────────────────────────────────────

type AttendanceStatus = 'present' | 'late' | 'absent' | 'half_day' | 'leave' | 'holiday'

interface AttendanceRow {
  id: string
  employee_id: string
  date: string
  login_at: string | null
  logout_at: string | null
  total_minutes: number | null
  status: AttendanceStatus
  notes: string | null
}

// ── Status meta ───────────────────────────────────────────────────────────────

const STATUS_META: Record<AttendanceStatus, {
  label: string
  chip: string
  dot: string
  calBg: string
  calText: string
  calBorder: string
}> = {
  present:  { label: 'Present',  chip: 'bg-emerald/10 text-emerald', dot: 'bg-emerald', calBg: 'bg-emerald/15', calText: 'text-emerald', calBorder: 'border-emerald/25' },
  late:     { label: 'Late',     chip: 'bg-amber/10 text-amber',     dot: 'bg-amber',   calBg: 'bg-amber/15',   calText: 'text-amber',   calBorder: 'border-amber/25' },
  absent:   { label: 'Absent',   chip: 'bg-coral/10 text-coral',     dot: 'bg-coral',   calBg: 'bg-coral/15',   calText: 'text-coral',   calBorder: 'border-coral/25' },
  half_day: { label: 'Half Day', chip: 'bg-sky/10 text-sky',         dot: 'bg-sky',     calBg: 'bg-sky/15',     calText: 'text-sky',     calBorder: 'border-sky/25' },
  leave:    { label: 'Leave',    chip: 'bg-violet/10 text-violet',   dot: 'bg-violet',  calBg: 'bg-violet/15',  calText: 'text-violet',  calBorder: 'border-violet/25' },
  holiday:  { label: 'Holiday',  chip: 'bg-indigo/10 text-indigo',   dot: 'bg-indigo',  calBg: 'bg-indigo/15',  calText: 'text-indigo',  calBorder: 'border-indigo/25' },
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function fmtTime(iso: string | null): string {
  if (!iso) return '—'
  return new Date(iso).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })
}

function fmtMinutes(m: number | null): string {
  if (!m) return '—'
  const h = Math.floor(m / 60)
  const min = m % 60
  return min > 0 ? `${h}h ${min}m` : `${h}h`
}

function fmtDate(iso: string): string {
  return new Date(iso + 'T00:00:00').toLocaleDateString('en-GB', {
    weekday: 'short', day: 'numeric', month: 'short',
  })
}

function isoToday(): string {
  return new Date().toISOString().slice(0, 10)
}

function monthRange(year: number, month: number): { from: string; to: string } {
  const from = `${year}-${String(month + 1).padStart(2, '0')}-01`
  const last = new Date(year, month + 1, 0).getDate()
  const to   = `${year}-${String(month + 1).padStart(2, '0')}-${last}`
  return { from, to }
}

// ── Period helpers ────────────────────────────────────────────────────────────

type Period = 'week' | 'month' | '3months' | 'year'

function periodRange(p: Period): { from: string; to: string; label: string } {
  const now = new Date()
  const today = isoToday()

  if (p === 'week') {
    const day = now.getDay() || 7          // Mon=1…Sun=7
    const mon = new Date(now)
    mon.setDate(now.getDate() - (day - 1))
    return { from: mon.toISOString().slice(0, 10), to: today, label: 'This Week' }
  }
  if (p === 'month') {
    return { from: `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-01`, to: today, label: 'This Month' }
  }
  if (p === '3months') {
    const d = new Date(now); d.setMonth(d.getMonth() - 2); d.setDate(1)
    return { from: d.toISOString().slice(0, 10), to: today, label: 'Last 3 Months' }
  }
  // year
  return { from: `${now.getFullYear()}-01-01`, to: today, label: 'This Year' }
}

// ── Calendar cell (memoised — renders up to 42 times per parent update) ───────

const CalCell = React.memo(function CalCell({
  day, date, row, isToday, isFuture, isWeekend,
}: {
  day: number | null
  date: string | null
  row: AttendanceRow | null
  isToday: boolean
  isFuture: boolean
  isWeekend: boolean
}) {
  if (day === null) {
    return <div />
  }

  const meta = row ? STATUS_META[row.status] : null

  return (
    <div
      title={row ? `${STATUS_META[row.status].label}${row.login_at ? ' · In ' + fmtTime(row.login_at) : ''}${row.logout_at ? ' · Out ' + fmtTime(row.logout_at) : ''}` : undefined}
      className={cn(
        'relative flex flex-col items-center justify-center rounded-xl border py-2 text-center transition-colors',
        isWeekend && !row ? 'border-border bg-surface-2/40 text-ink-soft/50' : '',
        isFuture && !row ? 'border-border bg-transparent text-ink-soft/30' : '',
        !row && !isWeekend && !isFuture ? 'border-border bg-surface-2/20 text-ink-soft' : '',
        meta ? `${meta.calBg} ${meta.calBorder} border` : '',
        isToday ? 'ring-2 ring-brand ring-offset-1 ring-offset-surface' : '',
      )}
    >
      <span className={cn(
        'text-xs font-semibold',
        meta ? meta.calText : '',
        isToday && !meta ? 'text-brand' : '',
      )}>
        {day}
      </span>
      {meta && (
        <span className={cn('mt-0.5 size-1.5 rounded-full', meta.dot)} />
      )}
      {isToday && !meta && (
        <span className="mt-0.5 size-1.5 rounded-full bg-brand animate-pulse" />
      )}
    </div>
  )
})

// ── Stat card (memoised — renders 7× per parent update) ──────────────────────

const ACCENT_MAP: Record<string, string> = {
  brand:   'bg-brand/15 text-brand',
  emerald: 'bg-emerald/15 text-emerald',
  amber:   'bg-amber/15 text-amber',
  coral:   'bg-coral/15 text-coral',
  sky:     'bg-sky/15 text-sky',
  violet:  'bg-violet/15 text-violet',
  indigo:  'bg-indigo/15 text-indigo',
}

const StatCard = React.memo(function StatCard({
  value, label, sub, icon: Icon, accent, loading,
}: {
  value: string | number
  label: string
  sub: string
  icon: React.ElementType
  accent: string
  loading?: boolean
}) {
  return (
    <div className="rounded-2xl border border-border bg-surface p-4 shadow-card">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="text-xs text-ink-muted">{label}</p>
          {loading ? (
            <div className="mt-1.5 h-7 w-12 animate-pulse rounded bg-surface-2" />
          ) : (
            <p className="mt-1 text-xl font-bold tracking-tight">{value}</p>
          )}
        </div>
        <span className={cn('grid size-8 shrink-0 place-items-center rounded-xl', ACCENT_MAP[accent])}>
          <Icon className="size-4" />
        </span>
      </div>
      {loading ? (
        <div className="mt-2 h-3 w-16 animate-pulse rounded bg-surface-2" />
      ) : (
        <p className="mt-2 text-[11px] text-ink-soft">{sub}</p>
      )}
    </div>
  )
})

// ── Main page ─────────────────────────────────────────────────────────────────

export default function AttendancePage() {
  const employee = useEmployee()

  const now = React.useRef(new Date()).current

  // Calendar navigation
  const [calYear,  setCalYear]  = React.useState(now.getFullYear())
  const [calMonth, setCalMonth] = React.useState(now.getMonth()) // 0-indexed

  // Period filter for stats + log
  const [period, setPeriod] = React.useState<Period>('month')

  // Data
  const [allRows,    setAllRows]    = React.useState<AttendanceRow[]>([])   // period stats + log
  const [calRows,    setCalRows]    = React.useState<AttendanceRow[]>([])   // calendar (month)
  const [todayTasks, setTodayTasks] = React.useState<number>(0)
  const [loading,    setLoading]    = React.useState(true)
  const [calLoading, setCalLoading] = React.useState(true)

  // ── Check if the period range already covers the calendar month ────────────
  // When they match (default state: period='month', calendar=current month)
  // we avoid a second identical fetch and share the data.
  const calCoversCurrentMonth = React.useMemo(() => {
    return (
      period === 'month' &&
      calYear  === now.getFullYear() &&
      calMonth === now.getMonth()
    )
  }, [period, calYear, calMonth, now])

  // ── Fetch period stats + log ───────────────────────────────────────────────
  React.useEffect(() => {
    if (!employee.id) { setLoading(false); return }
    const { from, to } = periodRange(period)
    setLoading(true)

    // When the calendar is showing the same month as the period, reuse the
    // result for the calendar too — halves the round-trip count on initial load.
    if (calCoversCurrentMonth) setCalLoading(true)

    fetch(`/api/attendance?employee_id=${employee.id}&from=${from}&to=${to}`)
      .then((r) => r.json())
      .then((d: AttendanceRow[]) => {
        const rows = Array.isArray(d) ? d : []
        setAllRows(rows)
        if (calCoversCurrentMonth) {
          setCalRows(rows)
          setCalLoading(false)
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [employee.id, period, calCoversCurrentMonth])

  // ── Fetch calendar data (only when it differs from the period range) ───────
  React.useEffect(() => {
    if (!employee.id || calCoversCurrentMonth) return
    const { from, to } = monthRange(calYear, calMonth)
    setCalLoading(true)
    fetch(`/api/attendance?employee_id=${employee.id}&from=${from}&to=${to}`)
      .then((r) => r.json())
      .then((d: AttendanceRow[]) => setCalRows(Array.isArray(d) ? d : []))
      .catch(() => {})
      .finally(() => setCalLoading(false))
  }, [employee.id, calYear, calMonth, calCoversCurrentMonth])

  // ── Fetch today's task count (parallel, independent) ──────────────────────
  React.useEffect(() => {
    if (!employee.id) return
    fetch(`/api/tasks?employee_id=${employee.id}&status=in_progress`)
      .then((r) => r.json())
      .then((d) => setTodayTasks(Array.isArray(d) ? d.length : 0))
      .catch(() => {})
  }, [employee.id])

  // ── Derive stats ──────────────────────────────────────────────────────────
  const metrics = React.useMemo(() => deriveAttendanceMetrics(allRows), [allRows])
  const { present, late, absent, leave, holiday, attendancePercent: attPct, avgHours } = metrics
  const halfDay   = React.useMemo(() => allRows.filter((r) => r.status === 'half_day').length, [allRows])
  const totalHours = React.useMemo(() =>
    Math.round((allRows.reduce((s, r) => s + (r.total_minutes ?? 0), 0) / 60) * 10) / 10,
  [allRows])

  const todayStr = isoToday()
  const todayRow = React.useMemo(
    () => allRows.find((r) => r.date === todayStr) ?? null,
    [allRows, todayStr],
  )

  // ── Calendar grid ─────────────────────────────────────────────────────────
  const calRowMap = React.useMemo(() => {
    const m: Record<string, AttendanceRow> = {}
    calRows.forEach((r) => { m[r.date] = r })
    return m
  }, [calRows])

  const calDays = React.useMemo(() => {
    const daysInMonth = new Date(calYear, calMonth + 1, 0).getDate()
    const firstDow    = new Date(calYear, calMonth, 1).getDay() // 0=Sun
    const startOffset = firstDow === 0 ? 6 : firstDow - 1      // Mon-indexed

    const cells: Array<{ day: number | null; date: string | null; weekend: boolean }> = []
    for (let i = 0; i < startOffset; i++) cells.push({ day: null, date: null, weekend: false })
    for (let d = 1; d <= daysInMonth; d++) {
      const date = `${calYear}-${String(calMonth + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`
      const dow  = new Date(date + 'T00:00:00').getDay()
      cells.push({ day: d, date, weekend: dow === 0 || dow === 6 })
    }
    return cells
  }, [calYear, calMonth])

  // ── Calendar month summary stats ─────────────────────────────────────────
  const calSummary = React.useMemo(() => {
    if (calRows.length === 0) return null
    const calPresent = calRows.filter((r) => r.status === 'present').length
    const calLate    = calRows.filter((r) => r.status === 'late').length
    const calAbsent  = calRows.filter((r) => r.status === 'absent').length
    const calHoliday = calRows.filter((r) => r.status === 'holiday').length
    const calElig    = calRows.length - calHoliday
    const calPct     = calElig === 0 ? 0 : Math.round(((calPresent + calLate) / calElig) * 100)
    return { calPresent, calLate, calAbsent, calPct }
  }, [calRows])

  // ── Calendar navigation ───────────────────────────────────────────────────
  const prevMonth = React.useCallback(() => {
    if (calMonth === 0) { setCalYear((y) => y - 1); setCalMonth(11) }
    else setCalMonth((m) => m - 1)
  }, [calMonth])

  const nextMonth = React.useCallback(() => {
    const isCurrentMonth = calYear === now.getFullYear() && calMonth === now.getMonth()
    if (isCurrentMonth) return
    if (calMonth === 11) { setCalYear((y) => y + 1); setCalMonth(0) }
    else setCalMonth((m) => m + 1)
  }, [calYear, calMonth, now])

  const isCurrentMonth = calYear === now.getFullYear() && calMonth === now.getMonth()
  const { label: periodLabel } = periodRange(period)
  const todayMeta = todayRow ? STATUS_META[todayRow.status] : null

  const MONTH_NAMES = ['January','February','March','April','May','June',
    'July','August','September','October','November','December']

  return (
    <>
      <EmployeeTopbar
        title="My Attendance"
        breadcrumb={[{ label: 'Home' }, { label: 'Attendance' }]}
        subtitle="Read-only view · Contact admin to make corrections"
      />

      <main className="space-y-5 px-4 py-4 sm:px-6 sm:py-6">

        {/* ── Today's status card ── */}
        <div className="overflow-hidden rounded-2xl border border-border bg-surface shadow-card">
          <div className="flex flex-wrap items-center gap-4 px-4 py-4 sm:gap-6 sm:px-6 sm:py-5">
            {/* Date */}
            <div className="shrink-0">
              <p className="text-xs font-semibold uppercase tracking-wider text-ink-soft">Today</p>
              <p className="mt-0.5 text-base font-bold">
                {now.toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long' })}
              </p>
            </div>

            <div className="h-10 w-px bg-border" />

            {/* Status */}
            {todayRow ? (
              <span className={cn('inline-flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-semibold', todayMeta!.chip, 'border-current/20')}>
                <span className={cn('size-2 rounded-full', todayMeta!.dot)} />
                {todayMeta!.label}
              </span>
            ) : (
              <span className="inline-flex items-center gap-2 rounded-full border border-amber/20 bg-amber/10 px-4 py-2 text-sm font-semibold text-amber">
                <span className="size-2 rounded-full bg-amber animate-pulse" />
                Not marked yet
              </span>
            )}

            {/* Check-in / check-out */}
            {todayRow && (
              <div className="flex items-center gap-4">
                <InfoPill icon={LogIn}  label="Check-in"  value={fmtTime(todayRow.login_at)}    color="text-emerald" />
                <InfoPill icon={LogOut} label="Check-out" value={fmtTime(todayRow.logout_at)}   color="text-coral" />
                <InfoPill icon={Clock}  label="Hours"     value={fmtMinutes(todayRow.total_minutes)} color="text-brand" />
              </div>
            )}

            {/* Note */}
            {todayRow?.notes && (
              <p className="text-xs text-ink-soft italic">&quot;{todayRow.notes}&quot;</p>
            )}

            {/* Read-only notice */}
            <div className="ml-auto flex items-center gap-2 rounded-xl border border-amber/20 bg-amber/5 px-3 py-2">
              <AlertCircle className="size-4 shrink-0 text-amber" />
              <p className="text-xs text-ink-muted">
                Attendance is marked by your admin.{' '}
                <span className="font-medium text-ink">Contact HR to report discrepancies.</span>
              </p>
            </div>
          </div>

          {/* Today's tasks mini-strip */}
          <div className="border-t border-border bg-surface-2/30 px-4 py-3 sm:px-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <CheckSquare className="size-4 text-brand" />
                <span className="text-sm text-ink-muted">
                  <span className="font-semibold text-ink">{todayTasks}</span> task{todayTasks !== 1 ? 's' : ''} in progress today
                </span>
              </div>
              <Link
                href="/employee/tasks"
                className="inline-flex items-center gap-1 text-xs font-medium text-brand hover:underline"
              >
                View my tasks <ArrowRight className="size-3" />
              </Link>
            </div>
          </div>
        </div>

        {/* ── Period selector + Stats ── */}
        <div className="space-y-4">
          {/* Period tabs */}
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-ink-soft">Period:</span>
            <div className="flex gap-1 rounded-xl border border-border bg-surface-2/40 p-1">
              {([
                { key: 'week',    label: 'This Week' },
                { key: 'month',   label: 'This Month' },
                { key: '3months', label: '3 Months' },
                { key: 'year',    label: 'This Year' },
              ] as { key: Period; label: string }[]).map((p) => (
                <button
                  key={p.key}
                  type="button"
                  onClick={() => setPeriod(p.key)}
                  className={cn(
                    'rounded-lg px-3 py-1.5 text-xs font-medium transition-colors',
                    period === p.key ? 'bg-surface text-ink shadow-sm' : 'text-ink-soft hover:text-ink'
                  )}
                >
                  {p.label}
                </button>
              ))}
            </div>
            {loading && <Loader2 className="size-3.5 animate-spin text-ink-soft" />}
          </div>

          {/* Stat cards */}
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-7">
            <StatCard value={`${attPct}%`}    label="Attendance"  sub={`${periodLabel}`}          icon={TrendingUp}   accent="brand"   loading={loading} />
            <StatCard value={present}          label="Present"     sub={`${present} days`}          icon={CheckCircle2} accent="emerald" loading={loading} />
            <StatCard value={late}             label="Late"        sub={`${late} days`}             icon={Clock}        accent="amber"   loading={loading} />
            <StatCard value={absent}           label="Absent"      sub={`${absent} days`}           icon={XCircle}      accent="coral"   loading={loading} />
            <StatCard value={halfDay}          label="Half Day"    sub={`${halfDay} days`}          icon={CalendarDays} accent="sky"     loading={loading} />
            <StatCard value={`${totalHours}h`} label="Total Hrs"  sub={`avg ${avgHours}h/day`}     icon={Clock}        accent="violet"  loading={loading} />
            <StatCard value={leave}            label="Leave"       sub={`${holiday} holidays`}      icon={Umbrella}     accent="indigo"  loading={loading} />
          </div>
        </div>

        <div className="grid gap-5 lg:grid-cols-[1fr_340px]">

          {/* ── Log table ── */}
          <div className="overflow-hidden rounded-2xl border border-border bg-surface shadow-card">
            <header className="border-b border-border px-5 py-4">
              <h2 className="text-base font-semibold">Attendance Log</h2>
              <p className="text-xs text-ink-soft">{periodLabel} · {allRows.length} record{allRows.length !== 1 ? 's' : ''}</p>
            </header>

            {loading ? (
              <div className="flex items-center justify-center py-16">
                <Loader2 className="size-5 animate-spin text-brand" />
              </div>
            ) : allRows.length === 0 ? (
              <div className="py-16 text-center">
                <CalendarOff className="mx-auto mb-3 size-10 text-ink-soft/30" />
                <p className="text-sm text-ink-soft">No records found for this period.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border bg-surface-2 text-xs uppercase tracking-wide text-ink-soft">
                      <Th>Date</Th>
                      <Th>Check In</Th>
                      <Th>Check Out</Th>
                      <Th>Hours</Th>
                      <Th>Status</Th>
                      <Th>Notes</Th>
                    </tr>
                  </thead>
                  <tbody>
                    {allRows.map((row) => {
                      const m = STATUS_META[row.status]
                      const isRowToday = row.date === todayStr
                      return (
                        <tr
                          key={row.id}
                          className={cn(
                            'border-b border-border last:border-0 transition-colors hover:bg-surface-2/40',
                            isRowToday && 'bg-brand/5'
                          )}
                        >
                          <Td>
                            <p className={cn('font-medium tabular-nums', isRowToday && 'text-brand')}>
                              {fmtDate(row.date)}
                            </p>
                            {isRowToday && <p className="text-[10px] text-brand">Today</p>}
                          </Td>
                          <Td>
                            {row.login_at ? (
                              <span className="flex items-center gap-1.5 text-ink-muted">
                                <LogIn className="size-3.5 text-emerald" />
                                {fmtTime(row.login_at)}
                              </span>
                            ) : row.status === 'present' || row.status === 'late' || row.status === 'half_day' ? (
                              <span className="text-xs text-ink-soft">Ongoing</span>
                            ) : (
                              <span className="text-ink-soft">—</span>
                            )}
                          </Td>
                          <Td>
                            {row.logout_at ? (
                              <span className="flex items-center gap-1.5 text-ink-muted">
                                <LogOut className="size-3.5 text-coral" />
                                {fmtTime(row.logout_at)}
                              </span>
                            ) : (
                              <span className="text-ink-soft">—</span>
                            )}
                          </Td>
                          <Td>
                            <span className={cn('font-medium tabular-nums', row.total_minutes ? 'text-ink' : 'text-ink-soft')}>
                              {fmtMinutes(row.total_minutes)}
                            </span>
                          </Td>
                          <Td>
                            <span className={cn('inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium', m.chip)}>
                              <span className={cn('size-1.5 rounded-full', m.dot)} />
                              {m.label}
                            </span>
                          </Td>
                          <Td>
                            {row.notes ? (
                              <span className="text-xs italic text-ink-soft">{row.notes}</span>
                            ) : (
                              <span className="text-ink-soft">—</span>
                            )}
                          </Td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* ── Monthly calendar ── */}
          <div className="overflow-hidden rounded-2xl border border-border bg-surface shadow-card">
            <header className="flex items-center justify-between border-b border-border px-5 py-4">
              <button
                type="button"
                onClick={prevMonth}
                className="grid size-7 place-items-center rounded-lg border border-border text-ink-soft hover:bg-surface-2 hover:text-ink"
              >
                <ChevronLeft className="size-4" />
              </button>
              <div className="text-center">
                <p className="text-sm font-semibold">{MONTH_NAMES[calMonth]}</p>
                <p className="text-xs text-ink-soft">{calYear}</p>
              </div>
              <button
                type="button"
                onClick={nextMonth}
                disabled={isCurrentMonth}
                className="grid size-7 place-items-center rounded-lg border border-border text-ink-soft hover:bg-surface-2 hover:text-ink disabled:opacity-30"
              >
                <ChevronRight className="size-4" />
              </button>
            </header>

            <div className="p-3">
              {/* Day labels */}
              <div className="mb-1 grid grid-cols-7 gap-1">
                {['Mo','Tu','We','Th','Fr','Sa','Su'].map((d) => (
                  <div key={d} className="py-1 text-center text-[10px] font-semibold uppercase tracking-wide text-ink-soft">
                    {d}
                  </div>
                ))}
              </div>

              {/* Calendar cells */}
              {calLoading ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="size-4 animate-spin text-brand" />
                </div>
              ) : (
                <div className="grid grid-cols-7 gap-1">
                  {calDays.map((cell, i) => (
                    <CalCell
                      key={i}
                      day={cell.day}
                      date={cell.date}
                      row={cell.date ? (calRowMap[cell.date] ?? null) : null}
                      isToday={cell.date === todayStr}
                      isFuture={Boolean(cell.date && cell.date > todayStr)}
                      isWeekend={cell.weekend}
                    />
                  ))}
                </div>
              )}

              {/* Legend */}
              <div className="mt-3 border-t border-border pt-3">
                <div className="flex flex-wrap gap-x-3 gap-y-1.5">
                  {(Object.entries(STATUS_META) as [AttendanceStatus, typeof STATUS_META[AttendanceStatus]][]).map(([key, m]) => (
                    <span key={key} className="inline-flex items-center gap-1 text-[10px] text-ink-soft">
                      <span className={cn('size-2 rounded-full', m.dot)} />
                      {m.label}
                    </span>
                  ))}
                </div>
              </div>

              {/* Month summary */}
              {!calLoading && calSummary && (
                <div className="mt-3 border-t border-border pt-3 space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-ink-soft">Monthly attendance</span>
                    <span className={cn('font-bold', calSummary.calPct >= 90 ? 'text-emerald' : calSummary.calPct >= 75 ? 'text-amber' : 'text-coral')}>
                      {calSummary.calPct}%
                    </span>
                  </div>
                  <div className="h-2 rounded-full bg-surface-2">
                    <div
                      className={cn('h-full rounded-full', calSummary.calPct >= 90 ? 'bg-emerald' : calSummary.calPct >= 75 ? 'bg-amber' : 'bg-coral')}
                      style={{ width: `${calSummary.calPct}%` }}
                    />
                  </div>
                  <div className="grid grid-cols-3 gap-1.5 text-center">
                    {[
                      { label: 'Present', value: calSummary.calPresent, color: 'text-emerald' },
                      { label: 'Late',    value: calSummary.calLate,    color: 'text-amber' },
                      { label: 'Absent',  value: calSummary.calAbsent,  color: 'text-coral' },
                    ].map((s) => (
                      <div key={s.label} className="rounded-lg border border-border bg-surface-2/40 py-1.5">
                        <p className={cn('text-base font-bold', s.color)}>{s.value}</p>
                        <p className="text-[10px] text-ink-soft">{s.label}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
    </>
  )
}

// ── Sub-components ────────────────────────────────────────────────────────────

function InfoPill({ icon: Icon, label, value, color }: {
  icon: React.ElementType; label: string; value: string; color: string
}) {
  return (
    <div className="text-center">
      <div className={cn('flex items-center gap-1 text-xs font-medium', color)}>
        <Icon className="size-3.5" />
        {value}
      </div>
      <p className="text-[10px] text-ink-soft">{label}</p>
    </div>
  )
}

function Th({ children }: { children: React.ReactNode }) {
  return <th className="px-4 py-3 text-left font-medium">{children}</th>
}
function Td({ children }: { children: React.ReactNode }) {
  return <td className="px-4 py-3 align-middle">{children}</td>
}
