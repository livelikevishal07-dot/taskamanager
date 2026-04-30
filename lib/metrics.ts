// Pure derivation utilities — safe to import from both server components
// (which read DB rows) and client components (which fetch JSON via API).
//
// `lib/db/*` re-exports these so existing call sites keep working.

// ── Attendance ──────────────────────────────────────────────────────────────

export type AttendanceStatusLike =
  | 'present'
  | 'late'
  | 'absent'
  | 'half_day'
  | 'leave'
  | 'holiday'

export interface AttendanceLikeRow {
  status: AttendanceStatusLike
  total_minutes: number | null
}

export interface AttendanceMetrics {
  total: number
  present: number
  late: number
  absent: number
  leave: number
  holiday: number
  attendancePercent: number
  avgHours: number
}

export function deriveAttendanceMetrics(
  rows: AttendanceLikeRow[]
): AttendanceMetrics {
  const total = rows.length
  let present = 0
  let late = 0
  let absent = 0
  let leave = 0
  let holiday = 0
  let minutes = 0
  let withMinutes = 0

  for (const r of rows) {
    if (r.status === 'present') present++
    else if (r.status === 'late') late++
    else if (r.status === 'absent') absent++
    else if (r.status === 'leave') leave++
    else if (r.status === 'holiday') holiday++

    if (r.total_minutes != null) {
      minutes += r.total_minutes
      withMinutes++
    }
  }

  const eligible = total - holiday
  const attendancePercent =
    eligible === 0 ? 0 : Math.round(((present + late) / eligible) * 100)
  const avgHours =
    withMinutes === 0 ? 0 : Math.round((minutes / withMinutes / 60) * 10) / 10

  return {
    total,
    present,
    late,
    absent,
    leave,
    holiday,
    attendancePercent,
    avgHours,
  }
}

// ── Tasks ───────────────────────────────────────────────────────────────────

export type AssignmentStatusLike =
  | 'not_started'
  | 'in_progress'
  | 'done'
  | 'blocked'

export type TaskStatusLike =
  | 'todo'
  | 'in_progress'
  | 'review'
  | 'done'
  | 'blocked'

export interface AssignmentLikeRow {
  status: AssignmentStatusLike
  completed_at: string | null
  hours_logged: number | null | undefined
  task: {
    deadline: string | null
  }
}

export interface EmployeeTaskMetrics {
  total: number
  inProgress: number
  todo: number
  done: number
  doneThisQuarter: number
  doneThisMonth: number
  hoursThisMonth: number
  /** Percent of completed tasks finished on/before deadline. */
  deadlineHitRate: number
}

export function deriveTaskMetrics(
  rows: AssignmentLikeRow[]
): EmployeeTaskMetrics {
  const now = new Date()
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1)
  const quarter = Math.floor(now.getMonth() / 3)
  const quarterStart = new Date(now.getFullYear(), quarter * 3, 1)

  let inProgress = 0
  let todo = 0
  let done = 0
  let doneThisMonth = 0
  let doneThisQuarter = 0
  let hoursThisMonth = 0
  let onTime = 0
  let totalCompleted = 0

  for (const a of rows) {
    if (a.status === 'in_progress') inProgress++
    else if (a.status === 'not_started') todo++
    else if (a.status === 'done') done++

    if (a.completed_at) {
      const c = new Date(a.completed_at)
      if (c >= monthStart) {
        doneThisMonth++
        hoursThisMonth += Number(a.hours_logged ?? 0)
      }
      if (c >= quarterStart) doneThisQuarter++
      totalCompleted++
      if (a.task.deadline && c <= new Date(a.task.deadline)) onTime++
    }
  }

  return {
    total: rows.length,
    inProgress,
    todo,
    done,
    doneThisMonth,
    doneThisQuarter,
    hoursThisMonth: Math.round(hoursThisMonth * 10) / 10,
    deadlineHitRate:
      totalCompleted === 0 ? 0 : Math.round((onTime / totalCompleted) * 100),
  }
}

// ── Status mapping (canonical) ──────────────────────────────────────────────

/**
 * Mirror `tasks.status` → `task_assignments.status`.
 *
 * The two enums differ because admin-side `'review'` doesn't exist on the
 * per-employee assignment row. We treat 'review' as 'in_progress' from the
 * employee's perspective (their work is still considered active).
 *
 * Use this in any code path that mutates `tasks.status` so the assignment
 * mirror never drifts.
 */
export function mapTaskStatusToAssignmentStatus(
  taskStatus: TaskStatusLike
): AssignmentStatusLike {
  switch (taskStatus) {
    case 'todo':
      return 'not_started'
    case 'in_progress':
      return 'in_progress'
    case 'review':
      return 'in_progress'
    case 'done':
      return 'done'
    case 'blocked':
      return 'blocked'
  }
}
