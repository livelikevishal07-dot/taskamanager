'use client'

import * as React from 'react'
import {
  Activity,
  AlertTriangle,
  CalendarCheck,
  CalendarDays,
  Check,
  ChevronDown,
  ChevronRight,
  Clock,
  Download,
  Loader2,
  Plus,
  Save,
  Search,
  UserCheck,
  UserX,
  X,
} from 'lucide-react'

import { Avatar } from '@/components/ui/avatar'
import { EmployeeDetailDrawer, STATUS_META } from './employee-detail-drawer'
import { cn } from '@/lib/utils'
import type { AttendanceStatus, AttendanceWithEmployee } from '@/lib/db/attendance'
import type { Employee } from '@/lib/db/types'

// ── Types ──────────────────────────────────────────────────────────────────

interface Props {
  employees: Employee[]
  initialRows: AttendanceWithEmployee[]
}

type PeriodKey = 'today' | 'week' | 'month' | 'quarter' | 'six_months'

// ── Helpers ────────────────────────────────────────────────────────────────

function isoToday() {
  return new Date().toISOString().slice(0, 10)
}

function isoDate(d: Date) {
  return d.toISOString().slice(0, 10)
}

function periodBounds(period: PeriodKey): { from: string; to: string } {
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
    return { from: isoDate(new Date(now.getFullYear(), now.getMonth(), 1)), to: today }
  }
  if (period === 'quarter') {
    const q = Math.floor(now.getMonth() / 3)
    return { from: isoDate(new Date(now.getFullYear(), q * 3, 1)), to: today }
  }
  const from = new Date(now); from.setMonth(from.getMonth() - 6)
  return { from: isoDate(from), to: today }
}

function minutesToHours(mins: number | null) {
  if (mins == null) return '—'
  return `${Math.round((mins / 60) * 10) / 10}h`
}

function timeShort(t: string | null) {
  return t ? t.slice(0, 5) : '--:--'
}

function toIsoDateTime(date: string, time: string) {
  if (!time) return null
  return new Date(`${date}T${time}:00`).toISOString()
}

function minutesLate(loginAt: string | null, scheduledStart: string | null): number | null {
  if (!loginAt || !scheduledStart) return null
  const login = new Date(loginAt)
  // Build scheduled time using the login date so DST is handled correctly
  const datePart = login.toISOString().slice(0, 10)
  const scheduled = new Date(`${datePart}T${scheduledStart.slice(0, 5)}:00`)
  const diff = Math.round((login.getTime() - scheduled.getTime()) / 60000)
  return diff > 0 ? diff : 0
}

function exportCsv(rows: AttendanceWithEmployee[]) {
  const headers = ['Employee', 'Date', 'Login', 'Logout', 'Hours', 'Status', 'Notes']
  const lines = rows.map((r) => {
    const fmt = (ts: string | null) =>
      ts ? new Intl.DateTimeFormat(undefined, { hour: '2-digit', minute: '2-digit' }).format(new Date(ts)) : ''
    return [
      r.employee?.full_name ?? '',
      r.date,
      fmt(r.login_at),
      fmt(r.logout_at),
      minutesToHours(r.total_minutes),
      STATUS_META[r.status].label,
      r.notes ?? '',
    ].map((v) => `"${String(v).replace(/"/g, '""')}"`).join(',')
  })
  const blob = new Blob([[headers.join(','), ...lines].join('\n')], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a'); a.href = url; a.download = `attendance-${isoToday()}.csv`; a.click()
  URL.revokeObjectURL(url)
}

// ── Main Component ─────────────────────────────────────────────────────────

export function AttendanceSection({ employees, initialRows }: Props) {
  const [rows, setRows] = React.useState<AttendanceWithEmployee[]>(initialRows)
  const [period, setPeriod] = React.useState<PeriodKey>('month')
  const [search, setSearch] = React.useState('')
  const [statusFilter, setStatusFilter] = React.useState<'all' | AttendanceStatus>('all')

  // Employee detail drawer
  const [selectedEmployee, setSelectedEmployee] = React.useState<Employee | null>(null)
  const [detailOpen, setDetailOpen] = React.useState(false)

  // Bulk mark modal
  const [bulkOpen, setBulkOpen] = React.useState(false)

  const bounds = React.useMemo(() => periodBounds(period), [period])
  const today = isoToday()

  // Derive per-employee data
  const employeeData = React.useMemo(() => {
    const todayRow = new Map<string, AttendanceWithEmployee>()
    const periodRows = new Map<string, AttendanceWithEmployee[]>()

    for (const r of rows) {
      if (r.date === today) todayRow.set(r.employee_id, r)
      if (r.date >= bounds.from && r.date <= bounds.to) {
        const arr = periodRows.get(r.employee_id) ?? []
        arr.push(r)
        periodRows.set(r.employee_id, arr)
      }
    }

    return employees.map((emp) => {
      const today_row = todayRow.get(emp.id) ?? null
      const p_rows = periodRows.get(emp.id) ?? []
      let present = 0, late = 0, absent = 0, half_day = 0, leave = 0, holiday = 0, mins = 0
      for (const r of p_rows) {
        if (r.status === 'present') present++
        else if (r.status === 'late') late++
        else if (r.status === 'absent') absent++
        else if (r.status === 'half_day') half_day++
        else if (r.status === 'leave') leave++
        else if (r.status === 'holiday') holiday++
        mins += r.total_minutes ?? 0
      }
      const eligible = p_rows.length - holiday
      const pct = eligible === 0 ? null : Math.round(((present + late + half_day) / eligible) * 100)
      return { emp, today_row, pct, present, late, absent, half_day, leave, totalMins: mins, periodRowCount: p_rows.length }
    })
  }, [employees, rows, bounds, today])

  // Overall stats (today)
  const todayStats = React.useMemo(() => {
    const todayRows = rows.filter((r) => r.date === today)
    const byEmp = new Map(todayRows.map((r) => [r.employee_id, r]))
    const present = [...byEmp.values()].filter((r) => r.status === 'present').length
    const late = [...byEmp.values()].filter((r) => r.status === 'late').length
    const absent = [...byEmp.values()].filter((r) => r.status === 'absent').length
    const half_day = [...byEmp.values()].filter((r) => r.status === 'half_day').length
    const leave = [...byEmp.values()].filter((r) => r.status === 'leave').length
    const notMarked = employees.length - byEmp.size
    const totalWorking = present + late + half_day
    const pct = employees.length === 0 ? 0 : Math.round((totalWorking / employees.length) * 100)
    return { present, late, absent, half_day, leave, notMarked, pct }
  }, [rows, employees, today])

  // Filter employees by search + status
  const filteredData = React.useMemo(() => {
    const q = search.trim().toLowerCase()
    return employeeData.filter((item) => {
      if (q) {
        const hay = [
          item.emp.full_name,
          (item.emp.role as { name?: string } | null)?.name ?? '',
          (item.emp.department as { name?: string } | null)?.name ?? '',
        ].join(' ').toLowerCase()
        if (!hay.includes(q)) return false
      }
      if (statusFilter !== 'all') {
        if (item.today_row?.status !== statusFilter) return false
      }
      return true
    })
  }, [employeeData, search, statusFilter])

  function openDetail(emp: Employee) {
    setSelectedEmployee(emp)
    setDetailOpen(true)
  }

  function handleSaved(saved: AttendanceWithEmployee) {
    setRows((prev) => {
      const without = prev.filter(
        (r) => r.id !== saved.id && !(r.employee_id === saved.employee_id && r.date === saved.date)
      )
      return [saved, ...without]
    })
  }

  function handleDeleted(id: string) {
    setRows((prev) => prev.filter((r) => r.id !== id))
  }

  const selectedEmployeeRows = React.useMemo(() => {
    if (!selectedEmployee) return []
    return rows.filter((r) => r.employee_id === selectedEmployee.id)
  }, [rows, selectedEmployee])

  const PERIODS: { key: PeriodKey; label: string }[] = [
    { key: 'today', label: 'Today' },
    { key: 'week', label: 'Week' },
    { key: 'month', label: 'Month' },
    { key: 'quarter', label: 'Quarter' },
    { key: 'six_months', label: '6 Months' },
  ]

  return (
    <div className="space-y-5">

      {/* ── Today's snapshot stats ── */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-6">
        <StatCard label="Present today" value={todayStats.present} hint={`${todayStats.pct}% attendance`} icon={UserCheck} accent="emerald" />
        <StatCard label="Late" value={todayStats.late} hint="Late check-ins today" icon={Clock} accent="amber" />
        <StatCard label="Absent" value={todayStats.absent} hint="Marked absent today" icon={UserX} accent="coral" />
        <StatCard label="Half Day" value={todayStats.half_day} hint="Half-day attendance" icon={CalendarDays} accent="sky" />
        <StatCard label="On Leave" value={todayStats.leave} hint="On planned leave" icon={CalendarCheck} accent="violet" />
        <StatCard label="Not Marked" value={todayStats.notMarked} hint="Attendance pending" icon={Activity} accent="indigo" />
      </div>

      {/* ── Late Entry Panel ── */}
      <LateEntryPanel rows={rows} today={today} onFilterLate={() => setStatusFilter('late')} />

      {/* ── Toolbar ── */}
      <div className="rounded-2xl border border-border bg-surface p-3 shadow-card">
        <div className="flex flex-wrap items-center gap-2">
          {/* Search */}
          <div className="relative min-w-[200px] flex-1">
            <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-ink-soft" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search employees…"
              className="h-10 w-full rounded-xl border border-transparent bg-surface-2 pl-9 pr-4 text-sm placeholder:text-ink-soft focus:border-brand focus:bg-surface focus:outline-none focus:ring-2 focus:ring-brand/20"
            />
          </div>

          {/* Status filter */}
          <div className="relative">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as 'all' | AttendanceStatus)}
              className="h-10 appearance-none rounded-xl border border-border bg-surface pl-3 pr-9 text-sm font-medium text-ink hover:bg-surface-2 focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/20"
            >
              <option value="all">All statuses</option>
              {(Object.entries(STATUS_META) as [AttendanceStatus, typeof STATUS_META[AttendanceStatus]][]).map(([key, meta]) => (
                <option key={key} value={key}>{meta.label}</option>
              ))}
            </select>
            <ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 size-4 -translate-y-1/2 text-ink-soft" />
          </div>

          {/* Period tabs */}
          <div className="flex h-10 items-center rounded-xl border border-border bg-surface p-1 gap-0.5">
            {PERIODS.map(({ key, label }) => (
              <button
                key={key}
                type="button"
                onClick={() => setPeriod(key)}
                className={cn(
                  'h-8 rounded-lg px-3 text-sm font-medium transition-colors',
                  period === key ? 'bg-brand text-brand-foreground shadow-sm' : 'text-ink-muted hover:text-ink'
                )}
              >
                {label}
              </button>
            ))}
          </div>

          {/* Actions */}
          <div className="ml-auto flex items-center gap-2">
            <button
              type="button"
              onClick={() => exportCsv(rows)}
              className="inline-flex h-10 items-center gap-1.5 rounded-xl border border-border px-3 text-sm font-medium text-ink-muted hover:bg-surface-2"
            >
              <Download className="size-4" />
              <span className="hidden sm:inline">Export</span>
            </button>
            <button
              type="button"
              onClick={() => setBulkOpen(true)}
              className="inline-flex h-10 items-center gap-1.5 rounded-xl bg-brand px-4 text-sm font-medium text-brand-foreground shadow-sm hover:opacity-90"
            >
              <Plus className="size-4" />
              Mark Attendance
            </button>
          </div>
        </div>
      </div>

      {/* ── Employee cards grid ── */}
      <div>
        <div className="mb-3 flex items-center justify-between">
          <p className="text-sm text-ink-muted">
            {filteredData.length} employee{filteredData.length !== 1 ? 's' : ''}
            {period !== 'today' && <span className="ml-1 text-ink-soft">· Stats for {PERIODS.find(p => p.key === period)?.label.toLowerCase()}</span>}
          </p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {filteredData.map((item) => (
            <EmployeeCard
              key={item.emp.id}
              item={item}
              period={period}
              onClick={() => openDetail(item.emp)}
              onSaved={handleSaved}
              employees={employees}
            />
          ))}
        </div>

        {filteredData.length === 0 && (
          <div className="rounded-2xl border border-dashed border-border py-16 text-center text-sm text-ink-soft">
            No employees match your filters.
          </div>
        )}
      </div>

      {/* ── Employee Detail Drawer ── */}
      <EmployeeDetailDrawer
        open={detailOpen}
        onClose={() => { setDetailOpen(false); setSelectedEmployee(null) }}
        employee={selectedEmployee}
        rows={selectedEmployeeRows}
        onSaved={handleSaved}
        onDeleted={handleDeleted}
      />

      {/* ── Bulk Mark Modal ── */}
      {bulkOpen && (
        <BulkMarkModal
          employees={employees}
          rows={rows}
          onClose={() => setBulkOpen(false)}
          onSaved={(saved) => {
            setRows((prev) => {
              let next = [...prev]
              for (const s of saved) {
                next = next.filter((r) => r.id !== s.id && !(r.employee_id === s.employee_id && r.date === s.date))
                next.push(s)
              }
              return next
            })
            setBulkOpen(false)
          }}
        />
      )}
    </div>
  )
}

// ── Late Entry Panel ───────────────────────────────────────────────────────

function LateEntryPanel({
  rows,
  today,
  onFilterLate,
}: {
  rows: AttendanceWithEmployee[]
  today: string
  onFilterLate: () => void
}) {
  const [expanded, setExpanded] = React.useState(true)

  const lateRows = React.useMemo(() => {
    const seen = new Map<string, AttendanceWithEmployee>()
    for (const r of rows) {
      if (r.date === today && r.status === 'late') seen.set(r.employee_id, r)
    }
    return [...seen.values()].sort((a, b) => {
      const ma = minutesLate(a.login_at, a.employee?.working_hours_start ?? null) ?? 0
      const mb = minutesLate(b.login_at, b.employee?.working_hours_start ?? null) ?? 0
      return mb - ma // most-late first
    })
  }, [rows, today])

  if (lateRows.length === 0) return null

  return (
    <div className="rounded-2xl border border-amber/30 bg-amber/5 shadow-card overflow-hidden">
      {/* Header */}
      <button
        type="button"
        onClick={() => setExpanded((v) => !v)}
        className="flex w-full items-center gap-3 px-5 py-3.5 text-left hover:bg-amber/10 transition-colors"
      >
        <span className="grid size-8 shrink-0 place-items-center rounded-xl bg-amber/20 text-amber">
          <AlertTriangle className="size-4" />
        </span>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-ink">
            Late entries today
            <span className="ml-2 inline-flex items-center rounded-full bg-amber/20 px-2 py-0.5 text-xs font-bold text-amber">
              {lateRows.length}
            </span>
          </p>
          <p className="text-xs text-ink-muted">
            {lateRows.length} employee{lateRows.length !== 1 ? 's' : ''} checked in after their scheduled start time
          </p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); onFilterLate() }}
            className="inline-flex h-7 items-center gap-1 rounded-lg border border-amber/30 bg-amber/10 px-2.5 text-xs font-medium text-amber hover:bg-amber/20"
          >
            View in grid
          </button>
          {expanded
            ? <ChevronDown className="size-4 text-ink-soft" />
            : <ChevronRight className="size-4 text-ink-soft" />
          }
        </div>
      </button>

      {/* Table */}
      {expanded && (
        <div className="border-t border-amber/20 overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-amber/10 bg-amber/5 text-xs uppercase tracking-wide text-ink-soft">
                <th className="px-5 py-2.5 text-left font-medium">Employee</th>
                <th className="px-5 py-2.5 text-left font-medium">Department</th>
                <th className="px-5 py-2.5 text-left font-medium">Scheduled</th>
                <th className="px-5 py-2.5 text-left font-medium">Clocked in</th>
                <th className="px-5 py-2.5 text-left font-medium">Minutes late</th>
                <th className="px-5 py-2.5 text-left font-medium">Hours worked</th>
              </tr>
            </thead>
            <tbody>
              {lateRows.map((r) => {
                const emp = r.employee
                const mins = minutesLate(r.login_at, emp?.working_hours_start ?? null)
                const fmtTime = (ts: string | null) =>
                  ts
                    ? new Intl.DateTimeFormat(undefined, { hour: '2-digit', minute: '2-digit' }).format(new Date(ts))
                    : '—'
                return (
                  <tr key={r.id} className="border-b border-amber/10 last:border-0 hover:bg-amber/5 transition-colors">
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-2.5">
                        <Avatar name={emp?.full_name ?? '?'} size="sm" />
                        <div className="min-w-0">
                          <p className="truncate text-sm font-medium">{emp?.full_name ?? '—'}</p>
                          <p className="text-xs text-ink-soft">{(emp?.role as { name?: string } | null)?.name ?? '—'}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-3 text-sm text-ink-muted">
                      {(emp?.department as { name?: string } | null)?.name ?? '—'}
                    </td>
                    <td className="px-5 py-3 text-sm text-ink-muted">
                      {emp?.working_hours_start ? emp.working_hours_start.slice(0, 5) : '—'}
                    </td>
                    <td className="px-5 py-3">
                      <span className="text-sm font-medium text-amber">{fmtTime(r.login_at)}</span>
                    </td>
                    <td className="px-5 py-3">
                      {mins != null ? (
                        <span className={cn(
                          'inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold',
                          mins >= 60 ? 'bg-coral/15 text-coral' : mins >= 30 ? 'bg-amber/20 text-amber' : 'bg-amber/10 text-amber'
                        )}>
                          <Clock className="size-3" />
                          {mins >= 60
                            ? `${Math.floor(mins / 60)}h ${mins % 60}m`
                            : `${mins}m`}
                        </span>
                      ) : (
                        <span className="text-xs text-ink-soft">—</span>
                      )}
                    </td>
                    <td className="px-5 py-3 text-sm text-ink-muted">
                      {minutesToHours(r.total_minutes)}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}

// ── Employee Card ──────────────────────────────────────────────────────────

interface CardItem {
  emp: Employee
  today_row: AttendanceWithEmployee | null
  pct: number | null
  present: number
  late: number
  absent: number
  half_day: number
  leave: number
  totalMins: number
  periodRowCount: number
}

function EmployeeCard({
  item,
  period,
  onClick,
  onSaved,
  employees,
}: {
  item: CardItem
  period: PeriodKey
  onClick: () => void
  onSaved: (row: AttendanceWithEmployee) => void
  employees: Employee[]
}) {
  const { emp, today_row, pct, present, late, absent, half_day, leave } = item
  const [quickOpen, setQuickOpen] = React.useState(false)
  const [quickStatus, setQuickStatus] = React.useState<AttendanceStatus>('present')
  const [quickSaving, setQuickSaving] = React.useState(false)
  const dropdownRef = React.useRef<HTMLDivElement>(null)

  // Close dropdown on outside click
  React.useEffect(() => {
    if (!quickOpen) return
    const handler = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setQuickOpen(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [quickOpen])

  const today_status = today_row?.status ?? null
  const meta = today_status ? STATUS_META[today_status] : null

  async function quickMark(status: AttendanceStatus) {
    setQuickSaving(true)
    try {
      const today = new Date().toISOString().slice(0, 10)
      const noWork = status === 'absent' || status === 'leave' || status === 'holiday'
      const login_at = noWork ? null : toIsoDateTime(today, timeShort(emp.working_hours_start) || '09:00')
      const logout_at = noWork ? null : toIsoDateTime(today, timeShort(emp.working_hours_end) || '18:00')

      const url = today_row ? `/api/attendance/${today_row.id}` : '/api/attendance'
      const method = today_row ? 'PATCH' : 'POST'
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ employee_id: emp.id, date: today, status, login_at, logout_at }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data?.error ?? 'Failed')
      onSaved(data as AttendanceWithEmployee)
    } catch {
      // silently fail
    } finally {
      setQuickSaving(false)
      setQuickOpen(false)
    }
  }

  return (
    <div
      onClick={onClick}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => e.key === 'Enter' && onClick()}
      className="group cursor-pointer rounded-2xl border border-border bg-surface p-4 shadow-card transition-colors hover:border-brand/30 hover:bg-surface-2/30 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand"
    >
      {/* Header row */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <Avatar name={emp.full_name} size="md" className="shrink-0" />
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold text-ink">{emp.full_name}</p>
            <p className="truncate text-xs text-ink-soft">
              {(emp.department as { name?: string } | null)?.name ?? '—'}
              {(emp.role as { name?: string } | null)?.name ? ` · ${(emp.role as { name?: string }).name}` : ''}
            </p>
          </div>
        </div>

        {/* Today's status badge or "Not marked" */}
        {meta ? (
          <span className={cn('shrink-0 inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-semibold', meta.chip)}>
            <span className={cn('size-1.5 rounded-full', meta.dot)} />
            {meta.label}
          </span>
        ) : (
          <span className="shrink-0 inline-flex items-center gap-1 rounded-full border border-dashed border-border px-2 py-0.5 text-[11px] text-ink-soft">
            Not marked
          </span>
        )}
      </div>

      {/* Working hours */}
      {emp.working_hours_start && emp.working_hours_end && (
        <p className="mt-2 flex items-center gap-1 text-xs text-ink-soft">
          <Clock className="size-3" />
          {timeShort(emp.working_hours_start)} – {timeShort(emp.working_hours_end)}
          {today_row?.login_at && (
            <span className="ml-2 font-medium text-emerald">
              In: {new Intl.DateTimeFormat(undefined, { hour: '2-digit', minute: '2-digit' }).format(new Date(today_row.login_at))}
            </span>
          )}
        </p>
      )}

      {/* Period stats (hidden for today view) */}
      {period !== 'today' && item.periodRowCount > 0 && (
        <div className="mt-3">
          {/* Attendance bar */}
          <div className="mb-1 flex items-center justify-between text-xs">
            <span className="text-ink-soft">Attendance</span>
            <span className={cn('font-semibold',
              pct == null ? 'text-ink-soft'
                : pct >= 90 ? 'text-emerald'
                : pct >= 75 ? 'text-amber'
                : 'text-coral'
            )}>
              {pct != null ? `${pct}%` : '—'}
            </span>
          </div>
          <div className="h-1.5 w-full rounded-full bg-surface-2">
            <div
              className={cn('h-full rounded-full transition-all',
                pct == null ? 'bg-surface-2'
                  : pct >= 90 ? 'bg-emerald'
                  : pct >= 75 ? 'bg-amber'
                  : 'bg-coral'
              )}
              style={{ width: pct != null ? `${pct}%` : '0%' }}
            />
          </div>

          {/* Mini metrics */}
          <div className="mt-2 flex gap-2 text-xs">
            <MiniPill label="P" value={present} color="text-emerald" />
            <MiniPill label="L" value={late} color="text-amber" />
            <MiniPill label="A" value={absent} color="text-coral" />
            <MiniPill label="½" value={half_day} color="text-sky" />
            {leave > 0 && <MiniPill label="Lv" value={leave} color="text-violet" />}
          </div>
        </div>
      )}

      {/* Quick mark button */}
      <div
        className="mt-3 flex items-center justify-between border-t border-border pt-3"
        onClick={(e) => e.stopPropagation()}
      >
        <p className="text-xs text-ink-soft">
          {today_row?.total_minutes != null
            ? `${minutesToHours(today_row.total_minutes)} worked today`
            : 'Click card to view history'}
        </p>
        <div ref={dropdownRef} className="relative">
          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); setQuickOpen((v) => !v) }}
            className="inline-flex h-7 items-center gap-1 rounded-lg border border-border bg-surface px-2.5 text-xs font-medium text-ink-muted hover:border-brand/30 hover:bg-surface-2 hover:text-brand"
          >
            {quickSaving ? <Loader2 className="size-3 animate-spin" /> : <Plus className="size-3" />}
            Mark
          </button>

          {quickOpen && (
            <div className="absolute right-0 top-full z-20 mt-1 w-36 rounded-xl border border-border bg-surface py-1 shadow-pop">
              {(Object.entries(STATUS_META) as [AttendanceStatus, typeof STATUS_META[AttendanceStatus]][]).map(([key, m]) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => quickMark(key)}
                  className={cn(
                    'flex w-full items-center gap-2 px-3 py-2 text-xs hover:bg-surface-2',
                    today_row?.status === key ? 'font-semibold text-brand' : 'text-ink-muted'
                  )}
                >
                  <span className={cn('size-2 rounded-full', m.dot)} />
                  {m.label}
                  {today_row?.status === key && <Check className="ml-auto size-3 text-brand" />}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

// ── Bulk Mark Modal ────────────────────────────────────────────────────────

function BulkMarkModal({
  employees,
  rows,
  onClose,
  onSaved,
}: {
  employees: Employee[]
  rows: AttendanceWithEmployee[]
  onClose: () => void
  onSaved: (saved: AttendanceWithEmployee[]) => void
}) {
  const today = isoToday()
  const [date, setDate] = React.useState(today)
  const [saving, setSaving] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)

  // Build initial status map: if a row already exists for the date, pre-fill
  const [statuses, setStatuses] = React.useState<Record<string, AttendanceStatus>>(() => {
    const byEmpDate = new Map<string, AttendanceStatus>()
    for (const r of rows) {
      if (r.date === today) byEmpDate.set(r.employee_id, r.status)
    }
    const map: Record<string, AttendanceStatus> = {}
    for (const emp of employees) map[emp.id] = byEmpDate.get(emp.id) ?? 'present'
    return map
  })

  // When date changes, re-check existing rows
  React.useEffect(() => {
    const byEmpDate = new Map<string, AttendanceStatus>()
    for (const r of rows) {
      if (r.date === date) byEmpDate.set(r.employee_id, r.status)
    }
    setStatuses((prev) => {
      const next: Record<string, AttendanceStatus> = {}
      for (const emp of employees) {
        next[emp.id] = byEmpDate.get(emp.id) ?? prev[emp.id] ?? 'present'
      }
      return next
    })
  }, [date, rows, employees])

  function setAll(status: AttendanceStatus) {
    setStatuses((prev) => {
      const next = { ...prev }
      for (const k of Object.keys(next)) next[k] = status
      return next
    })
  }

  async function handleSave() {
    setSaving(true); setError(null)
    try {
      const records = employees.map((emp) => {
        const status = statuses[emp.id] ?? 'present'
        const noWork = status === 'absent' || status === 'leave' || status === 'holiday'
        return {
          employee_id: emp.id,
          date,
          status,
          login_at: noWork ? null : toIsoDateTime(date, timeShort(emp.working_hours_start) || '09:00'),
          logout_at: noWork ? null : toIsoDateTime(date, timeShort(emp.working_hours_end) || '18:00'),
        }
      })
      const res = await fetch('/api/attendance/bulk', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ records }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data?.error ?? 'Failed to save')
      onSaved(data as AttendanceWithEmployee[])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-ink/40 backdrop-blur-sm" onClick={onClose} />

      <div className="relative z-10 w-full max-w-2xl rounded-2xl border border-border bg-surface shadow-pop">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-border px-6 py-4">
          <div>
            <h2 className="text-base font-semibold">Mark Attendance</h2>
            <p className="text-sm text-ink-muted">Set status for all employees at once</p>
          </div>
          <button type="button" onClick={onClose} className="grid size-9 place-items-center rounded-lg text-ink-muted hover:bg-surface-2">
            <X className="size-4" />
          </button>
        </div>

        {/* Controls */}
        <div className="border-b border-border px-6 py-3">
          <div className="flex flex-wrap items-center gap-3">
            <div>
              <label className="mb-1 block text-xs font-medium text-ink-muted">Date</label>
              <input type="date" value={date} max={today}
                onChange={(e) => setDate(e.target.value)}
                className="h-9 rounded-xl border border-border bg-surface px-3 text-sm focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/20"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-ink-muted">Mark all as</label>
              <div className="flex gap-1.5">
                {(['present', 'absent', 'half_day', 'leave', 'holiday'] as AttendanceStatus[]).map((s) => {
                  const meta = STATUS_META[s]
                  return (
                    <button key={s} type="button" onClick={() => setAll(s)}
                      className={cn('inline-flex h-9 items-center gap-1.5 rounded-xl border px-3 text-xs font-medium transition-colors', meta.chip, 'border-transparent hover:opacity-80')}
                    >
                      {meta.label}
                    </button>
                  )
                })}
              </div>
            </div>
          </div>
        </div>

        {/* Employee list */}
        <div className="max-h-[50vh] overflow-y-auto px-6 py-3">
          <div className="space-y-1.5">
            {employees.map((emp) => {
              const status = statuses[emp.id] ?? 'present'
              const meta = STATUS_META[status]
              return (
                <div key={emp.id} className="flex items-center gap-3 rounded-xl border border-border bg-surface-2/30 px-4 py-2.5">
                  <Avatar name={emp.full_name} size="sm" className="shrink-0" />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">{emp.full_name}</p>
                    <p className="text-xs text-ink-soft">
                      {(emp.role as { name?: string } | null)?.name ?? '—'}
                      {emp.working_hours_start ? ` · ${timeShort(emp.working_hours_start)}–${timeShort(emp.working_hours_end)}` : ''}
                    </p>
                  </div>
                  <div className="flex gap-1">
                    {(Object.entries(STATUS_META) as [AttendanceStatus, typeof STATUS_META[AttendanceStatus]][]).map(([key, m]) => (
                      <button
                        key={key}
                        type="button"
                        title={m.label}
                        onClick={() => setStatuses((p) => ({ ...p, [emp.id]: key }))}
                        className={cn(
                          'grid size-8 place-items-center rounded-lg border text-xs font-semibold transition-colors',
                          status === key
                            ? `${m.chip} border-transparent`
                            : 'border-border text-ink-soft hover:bg-surface-2'
                        )}
                      >
                        {key === 'present' ? 'P' : key === 'late' ? 'L' : key === 'absent' ? 'A' : key === 'half_day' ? '½' : key === 'leave' ? 'Lv' : 'H'}
                      </button>
                    ))}
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between border-t border-border px-6 py-4">
          {error && <p className="text-sm text-coral">{error}</p>}
          <div className="ml-auto flex gap-2">
            <button type="button" onClick={onClose} className="inline-flex h-10 items-center rounded-xl border border-border px-4 text-sm font-medium text-ink-muted hover:bg-surface-2">
              Cancel
            </button>
            <button type="button" onClick={handleSave} disabled={saving}
              className="inline-flex h-10 items-center gap-1.5 rounded-xl bg-brand px-4 text-sm font-medium text-brand-foreground shadow-sm hover:opacity-90 disabled:opacity-60"
            >
              {saving ? <Loader2 className="size-4 animate-spin" /> : <Save className="size-4" />}
              {saving ? 'Saving…' : `Save ${employees.length} records`}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

// ── Mini helpers ───────────────────────────────────────────────────────────

function StatCard({
  label, value, hint, icon: Icon, accent,
}: {
  label: string; value: string | number; hint: string
  icon: React.ElementType
  accent: 'emerald' | 'amber' | 'coral' | 'sky' | 'violet' | 'indigo'
}) {
  const tone: Record<string, string> = {
    emerald: 'bg-emerald/15 text-emerald',
    amber: 'bg-amber/15 text-amber',
    coral: 'bg-coral/15 text-coral',
    sky: 'bg-sky/15 text-sky',
    violet: 'bg-violet/15 text-violet',
    indigo: 'bg-indigo/15 text-indigo',
  }
  return (
    <div className="rounded-2xl border border-border bg-surface p-4 shadow-card">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs text-ink-muted">{label}</p>
          <p className="mt-1.5 text-2xl font-semibold tracking-tight">{value}</p>
        </div>
        <span className={cn('grid size-9 place-items-center rounded-xl', tone[accent])}>
          <Icon className="size-4.5" />
        </span>
      </div>
      <p className="mt-2 text-xs text-ink-soft">{hint}</p>
    </div>
  )
}

function MiniPill({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <span className="inline-flex items-center gap-1 rounded-md bg-surface-2 px-1.5 py-0.5">
      <span className={cn('font-semibold', color)}>{value}</span>
      <span className="text-ink-soft">{label}</span>
    </span>
  )
}
