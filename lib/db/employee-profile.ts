import 'server-only'

import { getEmployee } from './employees'
import {
  deriveTaskMetrics,
  listAssignmentsByEmployee,
  type AssignmentRow,
  type EmployeeTaskMetrics,
} from './tasks'
import {
  deriveAttendanceMetrics,
  listAttendanceForEmployee,
  type AttendanceMetrics,
  type AttendanceRow,
} from './attendance'
import {
  listRecurringCompletionsForEmployee,
  type RecurringCompletionRow,
} from './recurring-tasks'
import type { Employee } from './types'

// ── Streak ─────────────────────────────────────────────────────────────────

export interface DayTaskCount {
  date: string // YYYY-MM-DD
  count: number
}

export interface TaskStreak {
  currentStreak: number
  last7: DayTaskCount[]
}

/**
 * Streak counts ANY completion on a given day — both regular task assignments
 * and recurring (daily/routine) task completions. Otherwise the streak would
 * miss the routine work that fills most of the employee's actual day.
 */
function computeTaskStreak(
  assignments: AssignmentRow[],
  recurringCompletions: RecurringCompletionRow[]
): TaskStreak {
  const now = new Date()

  // Build last 7 days array (oldest → newest)
  const last7: DayTaskCount[] = []
  for (let i = 6; i >= 0; i--) {
    const d = new Date(now)
    d.setDate(d.getDate() - i)
    last7.push({ date: d.toISOString().slice(0, 10), count: 0 })
  }

  // Count completions per calendar day from BOTH sources
  const byDay = new Map<string, number>()

  for (const a of assignments) {
    if (!a.completed_at) continue
    const day = a.completed_at.slice(0, 10)
    byDay.set(day, (byDay.get(day) ?? 0) + 1)
  }
  for (const c of recurringCompletions) {
    // c.date is already YYYY-MM-DD
    byDay.set(c.date, (byDay.get(c.date) ?? 0) + 1)
  }

  for (const d of last7) {
    d.count = byDay.get(d.date) ?? 0
  }

  // Current streak: consecutive days (back from today) with ≥1 completion
  let streak = 0
  let offset = 0
  while (true) {
    const d = new Date(now)
    d.setDate(d.getDate() - offset)
    const key = d.toISOString().slice(0, 10)
    if ((byDay.get(key) ?? 0) > 0) {
      streak++
      offset++
    } else {
      break
    }
  }

  return { currentStreak: streak, last7 }
}

// ── Monthly attendance ──────────────────────────────────────────────────────

export interface MonthlyAttendance {
  present: number
  late: number
  absent: number
  monthAttendancePercent: number
  workingDaysTracked: number
}

function computeMonthlyAttendance(attendance: AttendanceRow[]): MonthlyAttendance {
  const now = new Date()
  const monthStart = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-01`
  const thisMonth = attendance.filter((r) => r.date >= monthStart)

  let present = 0
  let late = 0
  let absent = 0
  for (const r of thisMonth) {
    if (r.status === 'present') present++
    else if (r.status === 'late') late++
    else if (r.status === 'absent') absent++
  }

  const eligible = thisMonth.filter((r) => r.status !== 'holiday').length
  const monthAttendancePercent =
    eligible === 0 ? 0 : Math.round(((present + late) / eligible) * 100)

  return {
    present,
    late,
    absent,
    monthAttendancePercent,
    workingDaysTracked: eligible,
  }
}

// ── Combined task metrics (assignments + recurring completions) ────────────

export interface CombinedTaskMetrics extends EmployeeTaskMetrics {
  /** Recurring (daily/routine) completions for this calendar month. */
  recurringDoneThisMonth: number
  /** Recurring completions for this calendar quarter. */
  recurringDoneThisQuarter: number
  /** assignments doneThisMonth + recurringDoneThisMonth */
  totalDoneThisMonth: number
  /** assignments doneThisQuarter + recurringDoneThisQuarter */
  totalDoneThisQuarter: number
  /** Total recurring completions in the fetched window. */
  recurringDoneTotal: number
}

function deriveCombinedTaskMetrics(
  assignments: AssignmentRow[],
  recurringCompletions: RecurringCompletionRow[]
): CombinedTaskMetrics {
  const base = deriveTaskMetrics(assignments)

  const now = new Date()
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1)
  const quarter = Math.floor(now.getMonth() / 3)
  const quarterStart = new Date(now.getFullYear(), quarter * 3, 1)

  let recurringDoneThisMonth = 0
  let recurringDoneThisQuarter = 0
  for (const c of recurringCompletions) {
    // c.date is YYYY-MM-DD; compare as dates
    const [y, m, d] = c.date.split('-').map(Number)
    const date = new Date(y, m - 1, d)
    if (date >= monthStart) recurringDoneThisMonth++
    if (date >= quarterStart) recurringDoneThisQuarter++
  }

  return {
    ...base,
    recurringDoneThisMonth,
    recurringDoneThisQuarter,
    recurringDoneTotal: recurringCompletions.length,
    totalDoneThisMonth: base.doneThisMonth + recurringDoneThisMonth,
    totalDoneThisQuarter: base.doneThisQuarter + recurringDoneThisQuarter,
  }
}

// ── Profile ─────────────────────────────────────────────────────────────────

export interface EmployeeProfile {
  employee: Employee
  assignments: AssignmentRow[]
  /** Combined assignment + recurring metrics. */
  taskMetrics: CombinedTaskMetrics
  attendance: AttendanceRow[]
  attendanceMetrics: AttendanceMetrics
  taskStreak: TaskStreak
  monthlyAttendance: MonthlyAttendance
  todayAttendance: AttendanceRow | null
  /** Recurring completions for the last ~6 months — feeds streak + trend. */
  recurringCompletions: RecurringCompletionRow[]
}

export async function getEmployeeProfile(
  id: string
): Promise<EmployeeProfile | null> {
  const employee = await getEmployee(id)
  if (!employee) return null

  // Fetch enough history to power the 6-month completion trend, the 7-day
  // streak, and "this month / this quarter" rollups.
  const sinceDate = new Date()
  sinceDate.setMonth(sinceDate.getMonth() - 6)
  const sinceIso = sinceDate.toISOString().slice(0, 10)

  const [assignments, attendance, recurringCompletions] = await Promise.all([
    listAssignmentsByEmployee(id),
    listAttendanceForEmployee(id, 60),
    listRecurringCompletionsForEmployee(id, sinceIso),
  ])

  const todayStr = new Date().toISOString().slice(0, 10)
  const todayAttendance = attendance.find((r) => r.date === todayStr) ?? null

  return {
    employee,
    assignments,
    taskMetrics: deriveCombinedTaskMetrics(assignments, recurringCompletions),
    attendance,
    attendanceMetrics: deriveAttendanceMetrics(attendance),
    taskStreak: computeTaskStreak(assignments, recurringCompletions),
    monthlyAttendance: computeMonthlyAttendance(attendance),
    todayAttendance,
    recurringCompletions,
  }
}
