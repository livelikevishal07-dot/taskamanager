import 'server-only'

import { db } from './supabase'
import {
  type RecurringTaskBase,
  type RecurringTaskForEmployee,
  isActiveToday,
} from '@/lib/recurring-tasks-shared'

const RECURRING_SELECT =
  '*, company:companies(id, name, color), assignments:recurring_task_assignments(employee_id, employee:employees(id, full_name))'

// ── Admin: list all ───────────────────────────────────────────────────────────

export async function listRecurringTasks(): Promise<RecurringTaskBase[]> {
  const { data, error } = await db()
    .from('recurring_tasks')
    .select(RECURRING_SELECT)
    .order('created_at', { ascending: false })
  if (error) throw error
  return (data ?? []) as unknown as RecurringTaskBase[]
}

// ── Employee: list active tasks for today with completion status ───────────────

export async function listRecurringTasksForEmployee(
  employeeId: string,
  date: string // YYYY-MM-DD
): Promise<RecurringTaskForEmployee[]> {
  const { data: assignments, error: aErr } = await db()
    .from('recurring_task_assignments')
    .select(`recurring_task_id, task:recurring_tasks(${RECURRING_SELECT})`)
    .eq('employee_id', employeeId)
  if (aErr) throw aErr

  const tasks = ((assignments ?? []) as unknown as Array<{ task: RecurringTaskBase | null }>)
    .map((a) => a.task)
    .filter((t): t is RecurringTaskBase => t !== null && t.is_active && isActiveToday(t))

  if (tasks.length === 0) return []

  const { data: completions, error: cErr } = await db()
    .from('recurring_task_completions')
    .select('recurring_task_id')
    .eq('employee_id', employeeId)
    .eq('date', date)
  if (cErr) throw cErr

  const doneSet = new Set((completions ?? []).map((c: { recurring_task_id: string }) => c.recurring_task_id))

  return tasks.map((t) => ({ ...t, completed_today: doneSet.has(t.id) }))
}

// ── Create ────────────────────────────────────────────────────────────────────

export async function createRecurringTask(input: {
  title: string
  description?: string | null
  priority?: string
  recurrence?: string
  active_weekday?: number | null
  company_id?: string | null
  created_by?: string | null
  employee_ids?: string[]
}): Promise<RecurringTaskBase> {
  const { employee_ids, ...taskInput } = input

  const { data, error } = await db()
    .from('recurring_tasks')
    .insert(taskInput)
    .select('id')
    .single()
  if (error) throw error

  const taskId = (data as { id: string }).id

  if (employee_ids && employee_ids.length > 0) {
    const { error: aErr } = await db()
      .from('recurring_task_assignments')
      .insert(employee_ids.map((eid) => ({ recurring_task_id: taskId, employee_id: eid })))
    if (aErr) throw aErr
  }

  const { data: full, error: fErr } = await db()
    .from('recurring_tasks')
    .select(RECURRING_SELECT)
    .eq('id', taskId)
    .single()
  if (fErr) throw fErr
  return full as unknown as RecurringTaskBase
}

// ── Update ────────────────────────────────────────────────────────────────────

export async function updateRecurringTask(
  id: string,
  input: Partial<{
    title: string
    description: string | null
    priority: string
    recurrence: string
    active_weekday: number | null
    company_id: string | null
    is_active: boolean
    employee_ids: string[]
  }>
): Promise<RecurringTaskBase> {
  const { employee_ids, ...taskInput } = input

  if (Object.keys(taskInput).length > 0) {
    const { error } = await db().from('recurring_tasks').update(taskInput).eq('id', id)
    if (error) throw error
  }

  if (employee_ids !== undefined) {
    const { data: current } = await db()
      .from('recurring_task_assignments')
      .select('employee_id')
      .eq('recurring_task_id', id)
    const currentIds = (current ?? []).map((r: { employee_id: string }) => r.employee_id)

    const toAdd = employee_ids.filter((eid) => !currentIds.includes(eid))
    if (toAdd.length > 0) {
      await db()
        .from('recurring_task_assignments')
        .insert(toAdd.map((eid) => ({ recurring_task_id: id, employee_id: eid })))
    }

    const toRemove = currentIds.filter((eid) => !employee_ids.includes(eid))
    if (toRemove.length > 0) {
      await db()
        .from('recurring_task_assignments')
        .delete()
        .eq('recurring_task_id', id)
        .in('employee_id', toRemove)
    }
  }

  const { data: full, error: fErr } = await db()
    .from('recurring_tasks')
    .select(RECURRING_SELECT)
    .eq('id', id)
    .single()
  if (fErr) throw fErr
  return full as unknown as RecurringTaskBase
}

// ── Delete ────────────────────────────────────────────────────────────────────

export async function deleteRecurringTask(id: string): Promise<void> {
  const { error } = await db().from('recurring_tasks').delete().eq('id', id)
  if (error) throw error
}

// ── Mark done / unmark ────────────────────────────────────────────────────────

export async function markRecurringTaskDone(
  recurringTaskId: string,
  employeeId: string,
  date: string
): Promise<void> {
  const { error } = await db()
    .from('recurring_task_completions')
    .upsert(
      { recurring_task_id: recurringTaskId, employee_id: employeeId, date },
      { onConflict: 'recurring_task_id,employee_id,date' }
    )
  if (error) throw error
}

export async function unmarkRecurringTaskDone(
  recurringTaskId: string,
  employeeId: string,
  date: string
): Promise<void> {
  const { error } = await db()
    .from('recurring_task_completions')
    .delete()
    .eq('recurring_task_id', recurringTaskId)
    .eq('employee_id', employeeId)
    .eq('date', date)
  if (error) throw error
}

// ── Completions for metrics & admin views ──────────────────────────────────

export interface RecurringCompletionRow {
  id: string
  recurring_task_id: string
  employee_id: string
  date: string // YYYY-MM-DD
  completed_at: string
  task: {
    id: string
    title: string
    priority: 'low' | 'medium' | 'high' | 'urgent'
    company: { id: string; name: string; color: string } | null
  } | null
}

/**
 * All recurring-task completions for an employee since a given date.
 * Feeds the admin profile streak / "completed this month" metrics so the
 * employee's daily routine work is visible alongside regular task completions.
 */
export async function listRecurringCompletionsForEmployee(
  employeeId: string,
  sinceDate: string // YYYY-MM-DD inclusive
): Promise<RecurringCompletionRow[]> {
  const { data, error } = await db()
    .from('recurring_task_completions')
    .select(
      'id, recurring_task_id, employee_id, date, completed_at, task:recurring_tasks(id, title, priority, company:companies(id, name, color))'
    )
    .eq('employee_id', employeeId)
    .gte('date', sinceDate)
    .order('date', { ascending: false })
  if (error) throw error
  return (data ?? []) as unknown as RecurringCompletionRow[]
}

/**
 * Per-task completion stats for a given date — used by the admin routine
 * page to show "X/Y assignees done today" on each recurring task card.
 */
export async function listRecurringCompletionsForDate(
  date: string
): Promise<Array<{ recurring_task_id: string; employee_id: string }>> {
  const { data, error } = await db()
    .from('recurring_task_completions')
    .select('recurring_task_id, employee_id')
    .eq('date', date)
  if (error) throw error
  return (data ?? []) as Array<{
    recurring_task_id: string
    employee_id: string
  }>
}
