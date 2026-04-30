'use client'

import * as React from 'react'
import { CalendarCheck, CalendarOff, CheckSquare, Clock, TrendingUp } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useEmployee } from '@/app/employee/context'

// ── Types ─────────────────────────────────────────────────────────────────────

interface TaskStats {
  total: number
  inProgress: number
  todo: number
  done: number
  overdue: number
  dueToday: number
}

interface LeaveBalance {
  leave_type: string
  total_days: number
  used_days: number
  remaining: number
}

interface AttRow {
  total_minutes: number | null
  status: string
  date: string
}

// ── Helpers ───────────────────────────────────────────────────────────────────

const ACCENT: Record<string, string> = {
  brand:   'bg-brand/15 text-brand',
  emerald: 'bg-emerald/15 text-emerald',
  amber:   'bg-amber/15 text-amber',
  violet:  'bg-violet/15 text-violet',
  sky:     'bg-sky/15 text-sky',
  coral:   'bg-coral/15 text-coral',
}

function fmtMinutes(m: number): string {
  const h   = Math.floor(m / 60)
  const min = m % 60
  if (h === 0) return `${min}m`
  return min > 0 ? `${h}h ${min}m` : `${h}h`
}

/** Returns Mon–Sun ISO dates for the current week */
function getWeekRange(): { start: string; end: string } {
  const now = new Date()
  const day = now.getDay()
  const diffToMon = day === 0 ? -6 : 1 - day
  const mon = new Date(now)
  mon.setDate(now.getDate() + diffToMon)
  const sun = new Date(mon)
  sun.setDate(mon.getDate() + 6)
  return {
    start: mon.toISOString().slice(0, 10),
    end:   sun.toISOString().slice(0, 10),
  }
}

// ── Stat card ─────────────────────────────────────────────────────────────────

function StatCard({
  label,
  value,
  sub,
  icon: Icon,
  accent,
  loading,
}: {
  label: string
  value: string
  sub: string
  icon: React.ElementType
  accent: string
  loading?: boolean
}) {
  return (
    <div className="rounded-2xl border border-border bg-surface p-5 shadow-card">
      <div className="flex items-start justify-between">
        <div className="min-w-0">
          <p className="text-sm text-ink-muted">{label}</p>
          {loading ? (
            <div className="mt-2 h-8 w-16 animate-pulse rounded-lg bg-surface-2" />
          ) : (
            <p className="mt-2 text-2xl font-semibold tracking-tight tabular-nums">{value}</p>
          )}
        </div>
        <span className={cn('grid size-10 shrink-0 place-items-center rounded-xl', ACCENT[accent])}>
          <Icon className="size-5" />
        </span>
      </div>
      {loading ? (
        <div className="mt-3 h-3 w-28 animate-pulse rounded bg-surface-2" />
      ) : (
        <p className="mt-3 text-xs text-ink-muted">{sub}</p>
      )}
    </div>
  )
}

// ── Component ─────────────────────────────────────────────────────────────────

export function QuickStats() {
  const employee = useEmployee()

  const [taskStats,    setTaskStats]    = React.useState<TaskStats | null>(null)
  const [leaveBalance, setLeaveBalance] = React.useState<LeaveBalance[] | null>(null)
  const [weekMins,     setWeekMins]     = React.useState<number | null>(null)
  const [weekDays,     setWeekDays]     = React.useState<number>(0)
  const [loadingTasks, setLoadingTasks] = React.useState(true)
  const [loadingLeave, setLoadingLeave] = React.useState(true)
  const [loadingWeek,  setLoadingWeek]  = React.useState(true)

  // 1. Task stats
  React.useEffect(() => {
    if (!employee.id) { setLoadingTasks(false); return }
    fetch(`/api/tasks?employee_id=${employee.id}&stats=1`)
      .then((r) => r.json())
      .then((d) => setTaskStats(d))
      .catch(() => {})
      .finally(() => setLoadingTasks(false))
  }, [employee.id])

  // 2. Leave balances
  React.useEffect(() => {
    if (!employee.id) { setLoadingLeave(false); return }
    fetch(`/api/leave-entitlements?employee_id=${employee.id}`)
      .then((r) => r.json())
      .then((d) => setLeaveBalance(Array.isArray(d) ? d : null))
      .catch(() => {})
      .finally(() => setLoadingLeave(false))
  }, [employee.id])

  // 3. This-week attendance (hours + days worked)
  React.useEffect(() => {
    if (!employee.id) { setLoadingWeek(false); return }
    const { start, end } = getWeekRange()
    fetch(`/api/attendance?employee_id=${employee.id}&from=${start}&to=${end}`)
      .then((r) => r.json())
      .then((data: AttRow[]) => {
        const arr = Array.isArray(data) ? data : []
        const mins = arr.reduce((s, r) => s + (r.total_minutes ?? 0), 0)
        const days = arr.filter((r) => ['present', 'late', 'half_day'].includes(r.status)).length
        setWeekMins(mins)
        setWeekDays(days)
      })
      .catch(() => {})
      .finally(() => setLoadingWeek(false))
  }, [employee.id])

  // ── Derived values ─────────────────────────────────────────────────────────

  const active      = taskStats ? taskStats.inProgress + taskStats.todo : 0
  const totalLeaveLeft = leaveBalance
    ? leaveBalance.reduce((s, b) => s + b.remaining, 0)
    : 0
  const totalLeaveTotal = leaveBalance
    ? leaveBalance.reduce((s, b) => s + b.total_days, 0)
    : 0
  const totalLeaveUsed = leaveBalance
    ? leaveBalance.reduce((s, b) => s + b.used_days, 0)
    : 0

  const cards = [
    {
      label:   'Active Tasks',
      value:   loadingTasks ? '—' : String(active),
      sub:     taskStats
        ? `${taskStats.inProgress} in progress · ${taskStats.todo} to do`
        : 'Loading…',
      icon:    CheckSquare,
      accent:  'brand',
      loading: loadingTasks,
    },
    {
      label:   'Completed',
      value:   loadingTasks ? '—' : String(taskStats?.done ?? 0),
      sub:     taskStats ? `${taskStats.total} total assigned` : 'Loading…',
      icon:    CalendarCheck,
      accent:  'emerald',
      loading: loadingTasks,
    },
    {
      label:   'Due Today',
      value:   loadingTasks ? '—' : String(taskStats?.dueToday ?? 0),
      sub:     taskStats?.overdue
        ? `${taskStats.overdue} overdue`
        : taskStats ? 'On track' : 'Loading…',
      icon:    Clock,
      accent:  taskStats?.overdue ? 'coral' : 'amber',
      loading: loadingTasks,
    },
    {
      label:   'Leave Balance',
      value:   loadingLeave ? '—' : `${totalLeaveLeft}d`,
      sub:     leaveBalance
        ? `${totalLeaveUsed} used · ${totalLeaveTotal} total`
        : 'Loading…',
      icon:    CalendarOff,
      accent:  'violet',
      loading: loadingLeave,
    },
    {
      label:   'This Week',
      value:   loadingWeek ? '—' : weekMins ? fmtMinutes(weekMins) : '0h',
      sub:     loadingWeek ? 'Loading…' : `${weekDays} day${weekDays !== 1 ? 's' : ''} worked`,
      icon:    TrendingUp,
      accent:  'sky',
      loading: loadingWeek,
    },
  ]

  return (
    <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
      {cards.map((s) => (
        <StatCard key={s.label} {...s} />
      ))}
    </div>
  )
}
