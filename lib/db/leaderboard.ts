import 'server-only'
import { db } from './supabase'

// ── Types ──────────────────────────────────────────────────────────────────────

export type LeaderboardPeriod = 'weekly' | 'monthly'

export interface LeaderboardEntry {
  employee_id: string
  full_name: string
  avatar_url: string | null
  role: string | null
  department: string | null
  // raw metrics (displayed in detail rows)
  attendancePct: number     // 0-100
  deadlineHitRate: number   // 0-100
  tasksDone: number         // absolute count in period
  recurringDone: number     // absolute count in period
  // composite
  score: number             // 0-100
  rank: number              // 1-based
}

// ── Helpers ────────────────────────────────────────────────────────────────────

function getPeriodDates(period: LeaderboardPeriod): { start: string; end: string } {
  const now = new Date()
  const end = now.toISOString().slice(0, 10) // YYYY-MM-DD

  if (period === 'weekly') {
    const d = new Date(now)
    d.setDate(d.getDate() - 6)
    return { start: d.toISOString().slice(0, 10), end }
  }

  // monthly = current calendar month
  const start = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-01`
  return { start, end }
}

// ── Main query ─────────────────────────────────────────────────────────────────

export async function getLeaderboard(
  period: LeaderboardPeriod
): Promise<LeaderboardEntry[]> {
  const { start, end } = getPeriodDates(period)

  // 1. All active/on-leave employees
  const { data: employees, error: eErr } = await db()
    .from('employees')
    .select('id, full_name, avatar_url, role:roles(name), department:departments(name)')
    .in('status', ['active', 'on_leave'])
    .order('full_name', { ascending: true })

  if (eErr) throw eErr
  if (!employees || employees.length === 0) return []

  const ids = (employees as { id: string }[]).map((e) => e.id)

  // 2. Parallel data fetch
  const [attRes, taskRes, recRes] = await Promise.all([
    // Attendance sessions in period
    db()
      .from('attendance_sessions')
      .select('employee_id, status')
      .in('employee_id', ids)
      .gte('date', start)
      .lte('date', end),

    // Completed task assignments in period (with task deadline for on-time check)
    db()
      .from('task_assignments')
      .select('employee_id, completed_at, task:tasks(deadline)')
      .in('employee_id', ids)
      .eq('status', 'done')
      .not('completed_at', 'is', null)
      .gte('completed_at', `${start}T00:00:00Z`)
      .lte('completed_at', `${end}T23:59:59Z`),

    // Recurring completions in period
    db()
      .from('recurring_task_completions')
      .select('employee_id')
      .in('employee_id', ids)
      .gte('date', start)
      .lte('date', end),
  ])

  // ── Build per-employee accumulator maps ─────────────────────────────────────

  type AttAcc  = { present: number; late: number; eligible: number }
  type TaskAcc = { done: number; onTime: number; withDeadline: number }

  const attMap  = new Map<string, AttAcc>()
  const taskMap = new Map<string, TaskAcc>()
  const recMap  = new Map<string, number>()

  for (const e of employees as { id: string }[]) {
    attMap.set(e.id,  { present: 0, late: 0, eligible: 0 })
    taskMap.set(e.id, { done: 0, onTime: 0, withDeadline: 0 })
    recMap.set(e.id,  0)
  }

  for (const r of attRes.data ?? []) {
    const m = attMap.get(r.employee_id)
    if (!m) continue
    if (r.status === 'present') { m.present++; m.eligible++ }
    else if (r.status === 'late')   { m.late++;    m.eligible++ }
    else if (r.status === 'absent') {              m.eligible++ }
    // leave / holiday → not counted as an eligible working day
  }

  for (const r of taskRes.data ?? []) {
    const m = taskMap.get(r.employee_id)
    if (!m) continue
    m.done++
    const taskRow  = (r.task as unknown as { deadline: string | null } | { deadline: string | null }[] | null)
    const deadline = Array.isArray(taskRow) ? taskRow[0]?.deadline ?? null : taskRow?.deadline ?? null
    if (deadline) {
      m.withDeadline++
      if (r.completed_at && new Date(r.completed_at) <= new Date(deadline)) m.onTime++
    }
  }

  for (const r of recRes.data ?? []) {
    recMap.set(r.employee_id, (recMap.get(r.employee_id) ?? 0) + 1)
  }

  // ── Compute raw metrics ─────────────────────────────────────────────────────

  const raw = (employees as { id: string }[]).map((emp) => {
    const att = attMap.get(emp.id)!
    const tk  = taskMap.get(emp.id)!
    const rec = recMap.get(emp.id) ?? 0

    // Attendance: present=100%, late=70%, absent=0%
    const attendancePct = att.eligible === 0
      ? 0
      : Math.min(100, Math.round(((att.present + att.late * 0.7) / att.eligible) * 100))

    // Deadline hit rate: if no deadlined tasks completed, give neutral/perfect score
    const deadlineHitRate = tk.withDeadline === 0
      ? (tk.done === 0 ? 50 : 100) // no tasks = neutral; tasks without deadlines = perfect
      : Math.round((tk.onTime / tk.withDeadline) * 100)

    return { id: emp.id, attendancePct, deadlineHitRate, tasksDone: tk.done, recurringDone: rec }
  })

  // ── Normalize productivity metrics (tasks + recurring) relative to group max

  const maxTasks = Math.max(...raw.map((r) => r.tasksDone), 1)
  const maxRec   = Math.max(...raw.map((r) => r.recurringDone), 1)

  // ── Composite score ─────────────────────────────────────────────────────────
  // Weights: attendance 40% | deadline hit rate 25% | tasks done 20% | recurring 15%

  const scored = raw.map((r) => ({
    ...r,
    score: Math.round(
      r.attendancePct                        * 0.40 +
      r.deadlineHitRate                      * 0.25 +
      (r.tasksDone    / maxTasks) * 100      * 0.20 +
      (r.recurringDone / maxRec)  * 100      * 0.15
    ),
  }))

  // Sort descending
  scored.sort((a, b) => b.score - a.score || a.id.localeCompare(b.id))

  const empById = new Map<string, Record<string, unknown>>(
    (employees as Record<string, unknown>[]).map((e) => [e.id as string, e])
  )

  return scored.map((s, idx): LeaderboardEntry => {
    const e = empById.get(s.id)!
    return {
      employee_id:     s.id,
      full_name:       e.full_name as string,
      avatar_url:      (e.avatar_url as string | null) ?? null,
      role:            (e.role as { name: string } | null)?.name ?? null,
      department:      (e.department as { name: string } | null)?.name ?? null,
      attendancePct:   s.attendancePct,
      deadlineHitRate: s.deadlineHitRate,
      tasksDone:       s.tasksDone,
      recurringDone:   s.recurringDone,
      score:           s.score,
      rank:            idx + 1,
    }
  })
}
