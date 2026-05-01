'use client'

import * as React from 'react'
import {
  Calendar,
  Clock,
  Download,
  FileText,
  Loader2,
  Printer,
  Search,
  Users,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import type { Employee } from '@/lib/db/types'

// ── Types ──────────────────────────────────────────────────────────────────────

type ReportTab = 'punch-in' | 'daywise' | 'working-hours' | 'leave'

interface AttRow {
  id: string
  employee_id: string
  date: string
  login_at: string | null
  logout_at: string | null
  total_minutes: number | null
  status: string
  employee: EmpMini | null
}

interface LeaveRow {
  id: string
  employee_id: string
  type: string
  from_date: string
  to_date: string
  days: number
  status: string
  reason: string | null
  employee: EmpMini | null
}

interface EmpMini {
  id: string
  full_name: string
  department?: { name: string } | null
  role?: { name: string } | null
}

// ── Helpers ────────────────────────────────────────────────────────────────────

function todayISO() {
  return new Date().toISOString().slice(0, 10)
}

function firstOfMonthISO() {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-01`
}

function fmtTime(iso: string | null): string {
  if (!iso) return '—'
  return new Date(iso).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true })
}

function fmtMins(mins: number | null): string {
  if (!mins || mins <= 0) return '—'
  const h = Math.floor(mins / 60)
  const m = mins % 60
  return h > 0 ? (m > 0 ? `${h}h ${m}m` : `${h}h`) : `${m}m`
}

function fmtDate(iso: string): string {
  return new Date(`${iso}T12:00:00`).toLocaleDateString('en-IN', {
    day: 'numeric', month: 'short', year: 'numeric',
  })
}

function fmtDateShort(iso: string): string {
  return new Date(`${iso}T12:00:00`).toLocaleDateString('en-IN', {
    day: '2-digit', month: 'short',
  })
}

function getDatesInRange(from: string, to: string): string[] {
  const dates: string[] = []
  const end = new Date(`${to}T12:00:00`)
  for (let d = new Date(`${from}T12:00:00`); d <= end; d.setDate(d.getDate() + 1)) {
    dates.push(d.toISOString().slice(0, 10))
  }
  return dates
}

function downloadCSV(content: string, filename: string) {
  const blob = new Blob(['﻿' + content], { type: 'text/csv;charset=utf-8;' })
  const url  = URL.createObjectURL(blob)
  const a    = document.createElement('a')
  a.href = url; a.download = filename; a.click()
  URL.revokeObjectURL(url)
}

// ── Status / type meta ─────────────────────────────────────────────────────────

const STATUS: Record<string, { abbr: string; label: string; cls: string }> = {
  present:  { abbr: 'P',  label: 'Present',  cls: 'bg-emerald/15 text-emerald' },
  late:     { abbr: 'L',  label: 'Late',      cls: 'bg-amber/15 text-amber' },
  absent:   { abbr: 'A',  label: 'Absent',    cls: 'bg-coral/15 text-coral' },
  half_day: { abbr: 'HD', label: 'Half Day',  cls: 'bg-orange-100 text-orange-600 dark:bg-orange-900/30 dark:text-orange-400' },
  leave:    { abbr: 'LE', label: 'On Leave',  cls: 'bg-sky/15 text-sky' },
  holiday:  { abbr: 'H',  label: 'Holiday',   cls: 'bg-violet/15 text-violet' },
}

const LEAVE_TYPE: Record<string, { label: string; cls: string }> = {
  casual:    { label: 'Casual',    cls: 'bg-sky/15 text-sky' },
  sick:      { label: 'Sick',      cls: 'bg-coral/15 text-coral' },
  annual:    { label: 'Annual',    cls: 'bg-emerald/15 text-emerald' },
  maternity: { label: 'Maternity', cls: 'bg-violet/15 text-violet' },
  paternity: { label: 'Paternity', cls: 'bg-indigo/15 text-indigo' },
  unpaid:    { label: 'Unpaid',    cls: 'bg-amber/15 text-amber' },
  emergency: { label: 'Emergency', cls: 'bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400' },
  other:     { label: 'Other',     cls: 'bg-surface-2 text-ink-muted' },
}

const LEAVE_STATUS: Record<string, { label: string; cls: string }> = {
  pending:   { label: 'Pending',   cls: 'bg-amber/15 text-amber' },
  approved:  { label: 'Approved',  cls: 'bg-emerald/15 text-emerald' },
  rejected:  { label: 'Rejected',  cls: 'bg-coral/15 text-coral' },
  cancelled: { label: 'Cancelled', cls: 'bg-surface-2 text-ink-muted' },
}

// ── Shared styles ──────────────────────────────────────────────────────────────

const inputCls = 'h-9 rounded-xl border border-border bg-surface px-3 text-sm text-ink focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/20'
const selectCls = inputCls + ' appearance-none cursor-pointer pr-8'

// ── Tab config ─────────────────────────────────────────────────────────────────

const TABS: { id: ReportTab; label: string; icon: React.ElementType; desc: string }[] = [
  { id: 'punch-in',      label: 'Daily Punch In',   icon: Clock,    desc: 'First & last punch for each employee on a given day' },
  { id: 'daywise',       label: 'Day Wise Master',   icon: Calendar, desc: 'Attendance status grid across a date range' },
  { id: 'working-hours', label: 'Working Hours',     icon: Users,    desc: 'Total hours worked per employee over a period' },
  { id: 'leave',         label: 'Leave Taken',       icon: FileText, desc: 'All leave requests within a selected date range' },
]

// ── Root component ─────────────────────────────────────────────────────────────

export function ReportsPage({ employees }: { employees: Employee[] }) {
  const [tab, setTab] = React.useState<ReportTab>('punch-in')

  return (
    <div className="space-y-5">
      {/* Report selector cards */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {TABS.map((t) => {
          const Icon   = t.icon
          const active = tab === t.id
          return (
            <button
              key={t.id}
              type="button"
              onClick={() => setTab(t.id)}
              className={cn(
                'flex flex-col items-start gap-2 rounded-2xl border p-4 text-left transition-all',
                active ? 'border-brand bg-brand/5 shadow-sm' : 'border-border bg-surface hover:bg-surface-2',
              )}
            >
              <div className={cn(
                'grid size-9 place-items-center rounded-xl',
                active ? 'bg-brand text-brand-foreground' : 'bg-surface-2 text-ink-soft',
              )}>
                <Icon className="size-4" />
              </div>
              <p className={cn('text-sm font-semibold leading-tight', active ? 'text-brand' : 'text-ink')}>
                {t.label}
              </p>
              <p className="text-[11px] leading-snug text-ink-soft">{t.desc}</p>
            </button>
          )
        })}
      </div>

      {/* Active report panel */}
      {tab === 'punch-in'      && <PunchInReport      employees={employees} />}
      {tab === 'daywise'       && <DaywiseReport       employees={employees} />}
      {tab === 'working-hours' && <WorkingHoursReport  employees={employees} />}
      {tab === 'leave'         && <LeaveReport         employees={employees} />}
    </div>
  )
}

// ── Shared UI atoms ────────────────────────────────────────────────────────────

function ReportCard({
  title, children, onCSV, csvDisabled,
}: {
  title: string
  children: React.ReactNode
  onCSV?: () => void
  csvDisabled?: boolean
}) {
  return (
    <div className="overflow-hidden rounded-2xl border border-border bg-surface shadow-card">
      <div className="flex items-center justify-between border-b border-border px-5 py-4">
        <p className="text-sm font-semibold text-ink">{title}</p>
        <div className="flex items-center gap-2">
          {onCSV && (
            <button
              type="button"
              onClick={onCSV}
              disabled={csvDisabled}
              className="inline-flex h-8 items-center gap-1.5 rounded-xl border border-border px-3 text-xs font-medium text-ink-muted hover:bg-surface-2 disabled:opacity-40"
            >
              <Download className="size-3.5" /> Export CSV
            </button>
          )}
          <button
            type="button"
            onClick={() => window.print()}
            className="inline-flex h-8 items-center gap-1.5 rounded-xl border border-border px-3 text-xs font-medium text-ink-muted hover:bg-surface-2"
          >
            <Printer className="size-3.5" /> Print
          </button>
        </div>
      </div>
      {children}
    </div>
  )
}

function FilterBar({
  children, onRun, loading,
}: {
  children: React.ReactNode
  onRun: () => void
  loading?: boolean
}) {
  return (
    <div className="flex flex-wrap items-end gap-3 border-b border-border bg-surface-2/40 px-5 py-4">
      {children}
      <button
        type="button"
        onClick={onRun}
        disabled={loading}
        className="inline-flex h-9 items-center gap-1.5 rounded-xl bg-brand px-4 text-sm font-medium text-brand-foreground shadow-sm hover:opacity-90 disabled:opacity-60"
      >
        {loading
          ? <><Loader2 className="size-4 animate-spin" /> Loading…</>
          : <><Search className="size-4" /> Run Report</>}
      </button>
    </div>
  )
}

function FilterField({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="mb-1 block text-[11px] font-semibold uppercase tracking-wider text-ink-muted">
        {label}
      </label>
      {children}
    </div>
  )
}

function LoadingState() {
  return (
    <div className="flex items-center justify-center py-16">
      <Loader2 className="size-6 animate-spin text-ink-soft" />
    </div>
  )
}

function EmptyState({ text }: { text: string }) {
  return (
    <div className="flex flex-col items-center justify-center gap-2 py-14">
      <FileText className="size-10 text-ink-soft/25" />
      <p className="text-sm text-ink-soft">{text}</p>
    </div>
  )
}

function Th({ children, right, center }: { children: React.ReactNode; right?: boolean; center?: boolean }) {
  return (
    <th className={cn(
      'px-4 py-3 text-[11px] font-semibold uppercase tracking-wider text-ink-muted',
      right ? 'text-right' : center ? 'text-center' : 'text-left',
    )}>
      {children}
    </th>
  )
}

function TableFooter({ text }: { text: string }) {
  return (
    <div className="border-t border-border px-5 py-3 text-xs text-ink-soft">{text}</div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// 1. Daily Punch In Report
// ─────────────────────────────────────────────────────────────────────────────

function PunchInReport({ employees }: { employees: Employee[] }) {
  const [date,      setDate]      = React.useState(todayISO())
  const [empFilter, setEmpFilter] = React.useState('')
  const [rows,      setRows]      = React.useState<AttRow[] | null>(null)
  const [loading,   setLoading]   = React.useState(false)

  const run = React.useCallback(async () => {
    setLoading(true)
    try {
      const r = await fetch(`/api/reports?type=punch-in&date=${date}`)
      const d = await r.json()
      setRows(Array.isArray(d) ? d : [])
    } catch { setRows([]) }
    finally  { setLoading(false) }
  }, [date])

  React.useEffect(() => { run() }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const filtered = React.useMemo(() => {
    if (!rows) return []
    return empFilter ? rows.filter(r => r.employee_id === empFilter) : rows
  }, [rows, empFilter])

  function exportCSV() {
    if (!filtered.length) return
    const header = ['#', 'Employee', 'Department', 'Role', 'Punch In', 'Punch Out', 'Total Hours', 'Status']
    const lines  = filtered.map((r, i) => [
      i + 1,
      r.employee?.full_name ?? '',
      r.employee?.department?.name ?? '',
      r.employee?.role?.name ?? '',
      r.login_at  ? new Date(r.login_at).toLocaleTimeString('en-IN')  : '',
      r.logout_at ? new Date(r.logout_at).toLocaleTimeString('en-IN') : '',
      fmtMins(r.total_minutes),
      STATUS[r.status]?.label ?? r.status,
    ])
    downloadCSV(
      [header, ...lines].map(l => l.map(v => `"${v}"`).join(',')).join('\n'),
      `punch-in-${date}.csv`,
    )
  }

  return (
    <ReportCard
      title={`Daily Punch In Report — ${fmtDate(date)}`}
      onCSV={exportCSV}
      csvDisabled={!filtered.length}
    >
      <FilterBar onRun={run} loading={loading}>
        <FilterField label="Date">
          <input
            type="date"
            value={date}
            max={todayISO()}
            onChange={e => setDate(e.target.value)}
            className={inputCls}
          />
        </FilterField>
        <FilterField label="Employee">
          <select
            value={empFilter}
            onChange={e => setEmpFilter(e.target.value)}
            className={cn(selectCls, 'min-w-[180px]')}
          >
            <option value="">All Employees</option>
            {employees.map(e => <option key={e.id} value={e.id}>{e.full_name}</option>)}
          </select>
        </FilterField>
      </FilterBar>

      {loading ? <LoadingState /> : rows === null ? (
        <EmptyState text="Select a date and run the report." />
      ) : filtered.length === 0 ? (
        <EmptyState text="No attendance records found for this date." />
      ) : (
        <>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-surface-2/60">
                  <Th>#</Th>
                  <Th>Employee</Th>
                  <Th>Department</Th>
                  <Th>Role</Th>
                  <Th>Punch In</Th>
                  <Th>Punch Out</Th>
                  <Th right>Total Hours</Th>
                  <Th>Status</Th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filtered.map((row, i) => {
                  const sm = STATUS[row.status]
                  return (
                    <tr key={row.id} className="hover:bg-surface-2/40 transition-colors">
                      <td className="px-4 py-3 text-xs text-ink-soft">{i + 1}</td>
                      <td className="px-4 py-3 font-medium text-ink">{row.employee?.full_name ?? '—'}</td>
                      <td className="px-4 py-3 text-ink-muted">{row.employee?.department?.name ?? '—'}</td>
                      <td className="px-4 py-3 text-ink-muted">{row.employee?.role?.name ?? '—'}</td>
                      <td className="px-4 py-3 font-mono text-sm tabular-nums text-ink">
                        {fmtTime(row.login_at)}
                      </td>
                      <td className="px-4 py-3 font-mono text-sm tabular-nums text-ink">
                        {fmtTime(row.logout_at)}
                      </td>
                      <td className="px-4 py-3 text-right font-mono text-sm tabular-nums text-ink">
                        {fmtMins(row.total_minutes)}
                      </td>
                      <td className="px-4 py-3">
                        {sm && (
                          <span className={cn('inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold', sm.cls)}>
                            {sm.label}
                          </span>
                        )}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
          <TableFooter text={`${filtered.length} record${filtered.length !== 1 ? 's' : ''}`} />
        </>
      )}
    </ReportCard>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// 2. Employee Day Wise Master
// ─────────────────────────────────────────────────────────────────────────────

function DaywiseReport({ employees }: { employees: Employee[] }) {
  const [from,    setFrom]    = React.useState(firstOfMonthISO())
  const [to,      setTo]      = React.useState(todayISO())
  const [rows,    setRows]    = React.useState<AttRow[] | null>(null)
  const [loading, setLoading] = React.useState(false)

  const run = React.useCallback(async () => {
    setLoading(true)
    try {
      const r = await fetch(`/api/reports?type=daywise&from=${from}&to=${to}`)
      const d = await r.json()
      setRows(Array.isArray(d) ? d : [])
    } catch { setRows([]) }
    finally  { setLoading(false) }
  }, [from, to])

  // Build pivot: empId → date → status
  const { dates, pivot } = React.useMemo(() => {
    if (!rows) return { dates: [] as string[], pivot: new Map<string, Map<string, string>>() }
    const dates = getDatesInRange(from, to)
    const pivot = new Map<string, Map<string, string>>()
    for (const row of rows) {
      if (!pivot.has(row.employee_id)) pivot.set(row.employee_id, new Map())
      pivot.get(row.employee_id)!.set(row.date, row.status)
    }
    return { dates, pivot }
  }, [rows, from, to])

  function exportCSV() {
    if (!rows) return
    const dateLabels = dates.map(d => fmtDateShort(d))
    const header = ['Employee', 'Department', ...dateLabels, 'Present', 'Absent', 'Late', 'On Leave']
    const lines  = employees.map(emp => {
      const ed = pivot.get(emp.id)
      const statusOf = (d: string) => ed?.get(d) ?? ''
      const statuses = dates.map(d => STATUS[statusOf(d)]?.abbr ?? '—')
      const present  = dates.filter(d => ['present', 'late', 'half_day'].includes(statusOf(d))).length
      const absent   = dates.filter(d => statusOf(d) === 'absent').length
      const late     = dates.filter(d => statusOf(d) === 'late').length
      const leave    = dates.filter(d => statusOf(d) === 'leave').length
      return [emp.full_name, emp.department?.name ?? '', ...statuses, present, absent, late, leave]
    })
    downloadCSV(
      [header, ...lines].map(l => l.map(v => `"${v}"`).join(',')).join('\n'),
      `daywise-master-${from}-to-${to}.csv`,
    )
  }

  return (
    <ReportCard
      title={`Employee Day Wise Master — ${fmtDate(from)} to ${fmtDate(to)}`}
      onCSV={exportCSV}
      csvDisabled={!rows?.length}
    >
      <FilterBar onRun={run} loading={loading}>
        <FilterField label="From">
          <input type="date" value={from} max={to}
            onChange={e => setFrom(e.target.value)} className={inputCls} />
        </FilterField>
        <FilterField label="To">
          <input type="date" value={to} min={from} max={todayISO()}
            onChange={e => setTo(e.target.value)} className={inputCls} />
        </FilterField>
      </FilterBar>

      {/* Legend */}
      {rows !== null && (
        <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 border-b border-border bg-surface-2/30 px-5 py-2.5">
          {Object.entries(STATUS).map(([, m]) => (
            <span key={m.abbr} className="flex items-center gap-1.5 text-[11px]">
              <span className={cn('inline-flex size-5 items-center justify-center rounded text-[9px] font-bold', m.cls)}>
                {m.abbr}
              </span>
              <span className="text-ink-soft">{m.label}</span>
            </span>
          ))}
          <span className="flex items-center gap-1.5 text-[11px]">
            <span className="inline-flex size-5 items-center justify-center rounded bg-surface-2 text-[9px] text-ink-soft/50">—</span>
            <span className="text-ink-soft">No Record</span>
          </span>
        </div>
      )}

      {loading ? <LoadingState /> : rows === null ? (
        <EmptyState text="Select a date range and run the report." />
      ) : employees.length === 0 ? (
        <EmptyState text="No employees found." />
      ) : (
        <>
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-surface-2/60">
                  {/* Sticky employee column */}
                  <th className="sticky left-0 z-10 min-w-[160px] bg-surface-2/90 px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-ink-muted backdrop-blur">
                    Employee
                  </th>
                  <th className="min-w-[110px] px-3 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-ink-muted">
                    Dept
                  </th>
                  {dates.map(d => (
                    <th key={d} className="min-w-[44px] px-1 py-2 text-center">
                      <div className="text-[10px] font-bold text-ink-muted">
                        {new Date(`${d}T12:00:00`).toLocaleDateString('en-IN', { day: '2-digit' })}
                      </div>
                      <div className="text-[9px] uppercase tracking-wider text-ink-soft">
                        {new Date(`${d}T12:00:00`).toLocaleDateString('en-IN', { weekday: 'short' })}
                      </div>
                    </th>
                  ))}
                  {/* Summary cols */}
                  <th className="min-w-[40px] px-2 py-3 text-center text-[11px] font-bold uppercase tracking-wider text-emerald">P</th>
                  <th className="min-w-[40px] px-2 py-3 text-center text-[11px] font-bold uppercase tracking-wider text-coral">A</th>
                  <th className="min-w-[40px] px-2 py-3 text-center text-[11px] font-bold uppercase tracking-wider text-amber">L</th>
                  <th className="min-w-[40px] px-2 py-3 text-center text-[11px] font-bold uppercase tracking-wider text-sky">LE</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {employees.map(emp => {
                  const ed      = pivot.get(emp.id)
                  const sOf     = (d: string) => ed?.get(d) ?? ''
                  const present = dates.filter(d => ['present', 'late', 'half_day'].includes(sOf(d))).length
                  const absent  = dates.filter(d => sOf(d) === 'absent').length
                  const late    = dates.filter(d => sOf(d) === 'late').length
                  const leave   = dates.filter(d => sOf(d) === 'leave').length

                  return (
                    <tr key={emp.id} className="hover:bg-surface-2/30 transition-colors">
                      <td className="sticky left-0 z-10 bg-surface px-4 py-2.5 font-medium text-ink backdrop-blur">
                        {emp.full_name}
                      </td>
                      <td className="px-3 py-2.5 text-xs text-ink-muted">
                        {emp.department?.name ?? '—'}
                      </td>
                      {dates.map(d => {
                        const st = sOf(d)
                        const sm = STATUS[st]
                        return (
                          <td key={d} className="px-1 py-2.5 text-center">
                            {sm ? (
                              <span className={cn(
                                'inline-flex size-6 items-center justify-center rounded text-[9px] font-bold',
                                sm.cls,
                              )}>
                                {sm.abbr}
                              </span>
                            ) : (
                              <span className="inline-flex size-6 items-center justify-center rounded bg-surface-2/60 text-[10px] text-ink-soft/30">
                                —
                              </span>
                            )}
                          </td>
                        )
                      })}
                      <td className="px-2 py-2.5 text-center text-sm font-bold text-emerald">{present || '—'}</td>
                      <td className="px-2 py-2.5 text-center text-sm font-bold text-coral">{absent || '—'}</td>
                      <td className="px-2 py-2.5 text-center text-sm font-bold text-amber">{late || '—'}</td>
                      <td className="px-2 py-2.5 text-center text-sm font-bold text-sky">{leave || '—'}</td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
          <TableFooter text={`${employees.length} employees · ${dates.length} days in range`} />
        </>
      )}
    </ReportCard>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// 3. Working Hours Report
// ─────────────────────────────────────────────────────────────────────────────

function WorkingHoursReport({ employees }: { employees: Employee[] }) {
  const [from,    setFrom]    = React.useState(firstOfMonthISO())
  const [to,      setTo]      = React.useState(todayISO())
  const [rows,    setRows]    = React.useState<AttRow[] | null>(null)
  const [loading, setLoading] = React.useState(false)

  const run = React.useCallback(async () => {
    setLoading(true)
    try {
      const r = await fetch(`/api/reports?type=working-hours&from=${from}&to=${to}`)
      const d = await r.json()
      setRows(Array.isArray(d) ? d : [])
    } catch { setRows([]) }
    finally  { setLoading(false) }
  }, [from, to])

  // Aggregate per employee — keep employee order from DB
  const summary = React.useMemo(() => {
    if (!rows) return []
    const map = new Map<string, {
      emp: EmpMini | null
      totalMins: number
      present: number
      late: number
      halfDay: number
      absent: number
      leave: number
    }>()

    // Seed with all known employees (so 0-record employees still appear)
    for (const emp of employees) {
      map.set(emp.id, { emp: null, totalMins: 0, present: 0, late: 0, halfDay: 0, absent: 0, leave: 0 })
    }

    for (const row of rows) {
      if (!map.has(row.employee_id)) {
        map.set(row.employee_id, { emp: row.employee, totalMins: 0, present: 0, late: 0, halfDay: 0, absent: 0, leave: 0 })
      }
      const e = map.get(row.employee_id)!
      if (!e.emp) e.emp = row.employee
      e.totalMins += row.total_minutes ?? 0
      if (row.status === 'present')  e.present++
      if (row.status === 'late')   { e.late++;    e.present++ }
      if (row.status === 'half_day') { e.halfDay++; e.present++ }
      if (row.status === 'absent')   e.absent++
      if (row.status === 'leave')    e.leave++
    }

    // Re-attach employee info from the employees prop for seeded entries
    const empById = new Map(employees.map(e => [e.id, e]))
    return Array.from(map.entries()).map(([id, v]) => {
      const empInfo = empById.get(id)
      return {
        ...v,
        emp: v.emp ?? (empInfo
          ? { id: empInfo.id, full_name: empInfo.full_name, department: empInfo.department, role: empInfo.role }
          : null),
      }
    })
  }, [rows, employees])

  function exportCSV() {
    if (!summary.length) return
    const header = ['#', 'Employee', 'Department', 'Role', 'Present Days', 'Late', 'Half Day', 'Absent', 'On Leave', 'Total Hours', 'Avg Hours/Day']
    const lines  = summary.map((s, i) => {
      const avgMins = s.present > 0 ? Math.round(s.totalMins / s.present) : 0
      return [
        i + 1,
        s.emp?.full_name ?? '',
        s.emp?.department?.name ?? '',
        s.emp?.role?.name ?? '',
        s.present,
        s.late,
        s.halfDay,
        s.absent,
        s.leave,
        fmtMins(s.totalMins),
        avgMins > 0 ? fmtMins(avgMins) : '—',
      ]
    })
    downloadCSV(
      [header, ...lines].map(l => l.map(v => `"${v}"`).join(',')).join('\n'),
      `working-hours-${from}-to-${to}.csv`,
    )
  }

  return (
    <ReportCard
      title={`Working Hours Report — ${fmtDate(from)} to ${fmtDate(to)}`}
      onCSV={exportCSV}
      csvDisabled={!summary.length}
    >
      <FilterBar onRun={run} loading={loading}>
        <FilterField label="From">
          <input type="date" value={from} max={to}
            onChange={e => setFrom(e.target.value)} className={inputCls} />
        </FilterField>
        <FilterField label="To">
          <input type="date" value={to} min={from} max={todayISO()}
            onChange={e => setTo(e.target.value)} className={inputCls} />
        </FilterField>
      </FilterBar>

      {loading ? <LoadingState /> : rows === null ? (
        <EmptyState text="Select a date range and run the report." />
      ) : summary.length === 0 ? (
        <EmptyState text="No attendance records found for this period." />
      ) : (
        <>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-surface-2/60">
                  <Th>#</Th>
                  <Th>Employee</Th>
                  <Th>Department</Th>
                  <Th center>Present</Th>
                  <Th center>Late</Th>
                  <Th center>Half Day</Th>
                  <Th center>Absent</Th>
                  <Th center>On Leave</Th>
                  <Th right>Total Hours</Th>
                  <Th right>Avg / Day</Th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {summary.map((s, i) => {
                  const avgMins = s.present > 0 ? Math.round(s.totalMins / s.present) : 0
                  return (
                    <tr key={s.emp?.id ?? i} className="hover:bg-surface-2/40 transition-colors">
                      <td className="px-4 py-3 text-xs text-ink-soft">{i + 1}</td>
                      <td className="px-4 py-3 font-medium text-ink">{s.emp?.full_name ?? '—'}</td>
                      <td className="px-4 py-3 text-ink-muted">{s.emp?.department?.name ?? '—'}</td>
                      <td className="px-4 py-3 text-center font-semibold text-emerald">{s.present || '—'}</td>
                      <td className="px-4 py-3 text-center font-semibold text-amber">{s.late || '—'}</td>
                      <td className="px-4 py-3 text-center font-semibold text-orange-500">{s.halfDay || '—'}</td>
                      <td className="px-4 py-3 text-center font-semibold text-coral">{s.absent || '—'}</td>
                      <td className="px-4 py-3 text-center font-semibold text-sky">{s.leave || '—'}</td>
                      <td className="px-4 py-3 text-right font-mono tabular-nums text-ink">
                        {fmtMins(s.totalMins)}
                      </td>
                      <td className="px-4 py-3 text-right font-mono tabular-nums text-ink-muted">
                        {avgMins > 0 ? fmtMins(avgMins) : '—'}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
          <TableFooter text={`${summary.length} employees`} />
        </>
      )}
    </ReportCard>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// 4. Leave Taken Report
// ─────────────────────────────────────────────────────────────────────────────

const LEAVE_TYPES   = ['casual', 'sick', 'annual', 'maternity', 'paternity', 'unpaid', 'emergency', 'other']
const LEAVE_STATUSES = ['pending', 'approved', 'rejected', 'cancelled']

function LeaveReport({ employees }: { employees: Employee[] }) {
  const [from,       setFrom]       = React.useState(firstOfMonthISO())
  const [to,         setTo]         = React.useState(todayISO())
  const [leaveType,  setLeaveType]  = React.useState('')
  const [status,     setStatus]     = React.useState('')
  const [empFilter,  setEmpFilter]  = React.useState('')
  const [rows,       setRows]       = React.useState<LeaveRow[] | null>(null)
  const [loading,    setLoading]    = React.useState(false)

  const run = React.useCallback(async () => {
    setLoading(true)
    try {
      const p = new URLSearchParams({ type: 'leave', from, to })
      if (leaveType) p.set('leave_type', leaveType)
      if (status)    p.set('status',     status)
      const r = await fetch(`/api/reports?${p}`)
      const d = await r.json()
      setRows(Array.isArray(d) ? d : [])
    } catch { setRows([]) }
    finally  { setLoading(false) }
  }, [from, to, leaveType, status])

  const filtered = React.useMemo(() => {
    if (!rows) return []
    return empFilter ? rows.filter(r => r.employee_id === empFilter) : rows
  }, [rows, empFilter])

  const totalDays    = filtered.reduce((s, r) => s + (r.days ?? 0), 0)
  const approvedCnt  = filtered.filter(r => r.status === 'approved').length
  const pendingCnt   = filtered.filter(r => r.status === 'pending').length

  function exportCSV() {
    if (!filtered.length) return
    const header = ['#', 'Employee', 'Department', 'Leave Type', 'From', 'To', 'Days', 'Status', 'Reason']
    const lines  = filtered.map((r, i) => [
      i + 1,
      r.employee?.full_name ?? '',
      r.employee?.department?.name ?? '',
      LEAVE_TYPE[r.type]?.label ?? r.type,
      fmtDate(r.from_date),
      fmtDate(r.to_date),
      r.days,
      LEAVE_STATUS[r.status]?.label ?? r.status,
      r.reason ?? '',
    ])
    downloadCSV(
      [header, ...lines].map(l => l.map(v => `"${v}"`).join(',')).join('\n'),
      `leave-report-${from}-to-${to}.csv`,
    )
  }

  return (
    <ReportCard
      title={`Leave Taken Report — ${fmtDate(from)} to ${fmtDate(to)}`}
      onCSV={exportCSV}
      csvDisabled={!filtered.length}
    >
      <FilterBar onRun={run} loading={loading}>
        <FilterField label="From">
          <input type="date" value={from} max={to}
            onChange={e => setFrom(e.target.value)} className={inputCls} />
        </FilterField>
        <FilterField label="To">
          <input type="date" value={to} min={from}
            onChange={e => setTo(e.target.value)} className={inputCls} />
        </FilterField>
        <FilterField label="Leave Type">
          <select value={leaveType} onChange={e => setLeaveType(e.target.value)}
            className={cn(selectCls, 'min-w-[140px]')}>
            <option value="">All Types</option>
            {LEAVE_TYPES.map(t => (
              <option key={t} value={t}>{LEAVE_TYPE[t]?.label ?? t}</option>
            ))}
          </select>
        </FilterField>
        <FilterField label="Status">
          <select value={status} onChange={e => setStatus(e.target.value)}
            className={cn(selectCls, 'min-w-[130px]')}>
            <option value="">All Statuses</option>
            {LEAVE_STATUSES.map(s => (
              <option key={s} value={s}>{LEAVE_STATUS[s]?.label ?? s}</option>
            ))}
          </select>
        </FilterField>
        <FilterField label="Employee">
          <select value={empFilter} onChange={e => setEmpFilter(e.target.value)}
            className={cn(selectCls, 'min-w-[170px]')}>
            <option value="">All Employees</option>
            {employees.map(e => <option key={e.id} value={e.id}>{e.full_name}</option>)}
          </select>
        </FilterField>
      </FilterBar>

      {loading ? <LoadingState /> : rows === null ? (
        <EmptyState text="Select a date range and run the report." />
      ) : filtered.length === 0 ? (
        <EmptyState text="No leave records found for the selected filters." />
      ) : (
        <>
          {/* Summary strip */}
          <div className="grid grid-cols-4 gap-px border-b border-border bg-border">
            {[
              { label: 'Total Requests', value: filtered.length,  color: 'text-ink' },
              { label: 'Total Days',     value: totalDays,        color: 'text-brand' },
              { label: 'Approved',       value: approvedCnt,      color: 'text-emerald' },
              { label: 'Pending',        value: pendingCnt,       color: 'text-amber' },
            ].map(({ label, value, color }) => (
              <div key={label} className="bg-surface-2/30 px-5 py-3 text-center">
                <p className={cn('text-xl font-bold tabular-nums', color)}>{value}</p>
                <p className="text-[11px] text-ink-soft">{label}</p>
              </div>
            ))}
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-surface-2/60">
                  <Th>#</Th>
                  <Th>Employee</Th>
                  <Th>Department</Th>
                  <Th>Type</Th>
                  <Th>From</Th>
                  <Th>To</Th>
                  <Th center>Days</Th>
                  <Th>Status</Th>
                  <Th>Reason</Th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filtered.map((row, i) => {
                  const tm = LEAVE_TYPE[row.type]
                  const sm = LEAVE_STATUS[row.status]
                  return (
                    <tr key={row.id} className="hover:bg-surface-2/40 transition-colors">
                      <td className="px-4 py-3 text-xs text-ink-soft">{i + 1}</td>
                      <td className="px-4 py-3 font-medium text-ink">{row.employee?.full_name ?? '—'}</td>
                      <td className="px-4 py-3 text-ink-muted">{row.employee?.department?.name ?? '—'}</td>
                      <td className="px-4 py-3">
                        {tm && (
                          <span className={cn('inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold', tm.cls)}>
                            {tm.label}
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-ink">{fmtDate(row.from_date)}</td>
                      <td className="px-4 py-3 text-ink">{fmtDate(row.to_date)}</td>
                      <td className="px-4 py-3 text-center font-semibold text-ink">{row.days}</td>
                      <td className="px-4 py-3">
                        {sm && (
                          <span className={cn('inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold', sm.cls)}>
                            {sm.label}
                          </span>
                        )}
                      </td>
                      <td className="max-w-[200px] px-4 py-3">
                        <p className="truncate text-xs text-ink-muted">{row.reason || '—'}</p>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
          <TableFooter
            text={`${filtered.length} request${filtered.length !== 1 ? 's' : ''} · ${totalDays} total day${totalDays !== 1 ? 's' : ''}`}
          />
        </>
      )}
    </ReportCard>
  )
}
