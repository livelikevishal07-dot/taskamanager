// Shared types and pure helpers — safe to import from both server and client code.

export type RecurrenceType = 'daily' | 'weekdays' | 'weekly'

export interface RecurringTaskBase {
  id: string
  title: string
  description: string | null
  priority: 'low' | 'medium' | 'high' | 'urgent'
  recurrence: RecurrenceType
  active_weekday: number | null
  company_id: string | null
  created_by: string | null
  is_active: boolean
  created_at: string
  updated_at: string
  company: { id: string; name: string; color: string } | null
  assignments: Array<{
    employee_id: string
    employee: { id: string; full_name: string } | null
  }>
}

export interface RecurringTaskForEmployee extends RecurringTaskBase {
  completed_today: boolean
}

const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']

/**
 * Return today as `YYYY-MM-DD` in **local time** (not UTC).
 *
 * Why this exists: `new Date().toISOString().slice(0,10)` gives the UTC date,
 * which can disagree with the user's local date around midnight. Since
 * `isActiveToday` below uses `getDay()` (local), the "date" we store in
 * `recurring_task_completions` must also be local — otherwise a completion
 * gets logged under a date the user doesn't think of as "today" and won't
 * show as checked on next load.
 */
export function todayLocalIso(): string {
  const d = new Date()
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

export function recurrenceLabel(task: Pick<RecurringTaskBase, 'recurrence' | 'active_weekday'>): string {
  if (task.recurrence === 'daily') return 'Every day'
  if (task.recurrence === 'weekdays') return 'Mon – Fri'
  if (task.recurrence === 'weekly' && task.active_weekday != null) {
    return `Every ${DAYS[task.active_weekday]}`
  }
  return 'Weekly'
}

export function isActiveToday(task: Pick<RecurringTaskBase, 'recurrence' | 'active_weekday'>): boolean {
  const day = new Date().getDay()
  if (task.recurrence === 'daily') return true
  if (task.recurrence === 'weekdays') return day >= 1 && day <= 5
  if (task.recurrence === 'weekly') return task.active_weekday === day
  return false
}
