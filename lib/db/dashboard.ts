import 'server-only'
import { db } from './supabase'

// ── Types ─────────────────────────────────────────────────────────────────────

export interface DashboardSnapshot {
  range: { from: string; to: string }
  generatedAt: string

  employeeStats: {
    total: number
    active: number
    onLeave: number
    inactive: number
  }

  taskStats: {
    total: number
    todo: number
    inProgress: number
    done: number
    overdue: number
    completedThisWeek: number
    completedToday: number
  }

  attendanceToday: {
    date: string
    present: number
    late: number
    absent: number
    leave: number
    notMarked: number
  }

  attendanceTrend: { date: string; present: number; late: number; absent: number; leave: number }[]
  taskTrend:       { date: string; created: number; completed: number }[]

  leaveStats: {
    pending: number
    approved: number
    rejected: number
  }
  pendingLeaves: {
    id: string
    employee_name: string
    type: string
    from_date: string
    to_date: string
    days: number
    created_at: string
  }[]

  bookingStats: {
    monthCount:    number
    monthRevenue:  number
    monthAdvance:  number
    monthPending:  number
    todayCount:    number
    todayRevenue:  number
  }

  departmentBreakdown: {
    name: string
    color: string | null
    total: number
    active: number
    onLeave: number
  }[]

  topPerformers: {
    id: string
    name: string
    department: string | null
    completed: number
    avatar_url: string | null
  }[]

  activity: {
    id: string
    kind: 'task' | 'leave' | 'booking' | 'announcement' | 'attendance'
    title: string
    subtitle: string | null
    actor: string | null
    when: string
    href?: string | null
  }[]

  upcomingHolidays: {
    id: string
    name: string
    date: string
    type: string | null
  }[]

  recentAnnouncements: {
    id: string
    title: string
    body: string
    created_at: string
    author: string | null
  }[]
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function localISO(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}
function startOfMonthISO() {
  const d = new Date()
  return localISO(new Date(d.getFullYear(), d.getMonth(), 1))
}
function endOfMonthISO() {
  const d = new Date()
  return localISO(new Date(d.getFullYear(), d.getMonth() + 1, 0))
}
function daysAgoISO(n: number) {
  const d = new Date()
  d.setDate(d.getDate() - n)
  return localISO(d)
}
function num(v: unknown): number {
  if (typeof v === 'number') return v
  if (v == null) return 0
  const n = Number(v)
  return Number.isFinite(n) ? n : 0
}

// ── Snapshot ─────────────────────────────────────────────────────────────────

export async function getDashboardSnapshot(): Promise<DashboardSnapshot> {
  const today    = localISO(new Date())
  const monthStart = startOfMonthISO()
  const monthEnd   = endOfMonthISO()
  const trendStart = daysAgoISO(13)         // last 14 days
  const weekStart  = daysAgoISO(6)          // last 7 days

  const supa = db()

  // Run all queries in parallel — single network round-trip wave
  const [
    employeesQ,
    tasksQ,
    assignmentsQ,
    attendanceTodayQ,
    attendanceTrendQ,
    taskCreatedQ,
    taskDoneTrendQ,
    leaveAllQ,
    pendingLeavesQ,
    bookingsMonthQ,
    departmentsQ,
    holidaysQ,
    announcementsQ,
    recentTasksQ,
    recentLeavesQ,
    recentBookingsQ,
  ] = await Promise.all([
    // Employees with department for grouping
    supa.from('employees')
      .select('id, full_name, status, avatar_url, department:departments(id, name, color)'),

    // All tasks with status, deadline, completed_at
    supa.from('tasks')
      .select('id, title, status, deadline, completed_at, created_at, priority'),

    // Assignments for top performers + completion attribution
    supa.from('task_assignments')
      .select('employee_id, task:tasks(status, completed_at)'),

    // Today's attendance
    supa.from('attendance_sessions')
      .select('status, employee_id')
      .eq('date', today),

    // 14-day attendance trend
    supa.from('attendance_sessions')
      .select('date, status')
      .gte('date', trendStart)
      .lte('date', today),

    // Tasks created in trend window
    supa.from('tasks')
      .select('created_at')
      .gte('created_at', trendStart),

    // Tasks completed in trend window
    supa.from('tasks')
      .select('completed_at')
      .gte('completed_at', trendStart)
      .not('completed_at', 'is', null),

    // All leave for stats counts
    supa.from('leave_requests')
      .select('status'),

    // Pending leave requests with employee
    supa.from('leave_requests')
      .select('id, type, from_date, to_date, days, created_at, employee:employees(full_name)')
      .eq('status', 'pending')
      .order('created_at', { ascending: false })
      .limit(8),

    // Month bookings
    supa.from('bookings')
      .select('order_date, total_amount, advance_paid, customer_name, employee:employees(full_name)')
      .gte('order_date', monthStart)
      .lte('order_date', monthEnd)
      .order('created_at', { ascending: false }),

    // Departments
    supa.from('departments').select('id, name, color').order('name'),

    // Upcoming holidays in next 60 days
    supa.from('company_holidays')
      .select('id, name, date, type')
      .gte('date', today)
      .order('date', { ascending: true })
      .limit(6),

    // Recent announcements (no FK to employees, so author is just from text)
    supa.from('announcements')
      .select('id, title, body, created_at')
      .order('created_at', { ascending: false })
      .limit(3),

    // Activity feed sources
    supa.from('tasks')
      .select('id, title, status, completed_at, created_at, priority')
      .order('created_at', { ascending: false })
      .limit(5),

    supa.from('leave_requests')
      .select('id, type, status, from_date, to_date, created_at, employee:employees(full_name)')
      .order('created_at', { ascending: false })
      .limit(5),

    supa.from('bookings')
      .select('id, customer_name, total_amount, created_at, employee:employees(full_name)')
      .order('created_at', { ascending: false })
      .limit(5),
  ])

  // ── Process employees ───────────────────────────────────────────────────────
  const employees = (employeesQ.data ?? []) as unknown as Array<{
    id: string; full_name: string; status: string; avatar_url: string | null
    department: { id: string; name: string; color: string | null } | null
  }>

  const employeeStats = {
    total:    employees.length,
    active:   employees.filter(e => e.status === 'active').length,
    onLeave:  employees.filter(e => e.status === 'on_leave').length,
    inactive: employees.filter(e => e.status === 'inactive').length,
  }

  // ── Process tasks ───────────────────────────────────────────────────────────
  const tasks = (tasksQ.data ?? []) as Array<{
    id: string; title: string; status: string
    deadline: string | null; completed_at: string | null; created_at: string; priority: string
  }>
  const nowISO = new Date().toISOString()

  const taskStats = {
    total:      tasks.length,
    todo:       tasks.filter(t => t.status === 'todo').length,
    inProgress: tasks.filter(t => t.status === 'in_progress').length,
    done:       tasks.filter(t => t.status === 'done').length,
    overdue:    tasks.filter(t => t.status !== 'done' && t.deadline && t.deadline < nowISO).length,
    completedToday: tasks.filter(t => t.completed_at && t.completed_at.slice(0, 10) === today).length,
    completedThisWeek: tasks.filter(t => t.completed_at && t.completed_at.slice(0, 10) >= weekStart).length,
  }

  // ── Today's attendance ──────────────────────────────────────────────────────
  const todayAtt = (attendanceTodayQ.data ?? []) as Array<{ status: string }>
  const present  = todayAtt.filter(a => a.status === 'present').length
  const late     = todayAtt.filter(a => a.status === 'late').length
  const absent   = todayAtt.filter(a => a.status === 'absent').length
  const leave    = todayAtt.filter(a => a.status === 'leave').length
  const notMarked = Math.max(0, employeeStats.active - (present + late + absent + leave))

  // ── 14-day attendance trend ─────────────────────────────────────────────────
  const trendDays: string[] = []
  for (let i = 13; i >= 0; i--) trendDays.push(daysAgoISO(i))
  const attTrendRows = (attendanceTrendQ.data ?? []) as Array<{ date: string; status: string }>
  const attendanceTrend = trendDays.map(d => {
    const day = attTrendRows.filter(r => r.date === d)
    return {
      date: d,
      present: day.filter(r => r.status === 'present').length,
      late:    day.filter(r => r.status === 'late').length,
      absent:  day.filter(r => r.status === 'absent').length,
      leave:   day.filter(r => r.status === 'leave').length,
    }
  })

  // ── 14-day task trend ───────────────────────────────────────────────────────
  const created = (taskCreatedQ.data ?? []) as Array<{ created_at: string }>
  const completed = (taskDoneTrendQ.data ?? []) as Array<{ completed_at: string | null }>
  const taskTrend = trendDays.map(d => ({
    date: d,
    created:   created.filter(c   => c.created_at.slice(0, 10) === d).length,
    completed: completed.filter(c => c.completed_at?.slice(0, 10) === d).length,
  }))

  // ── Leave stats ────────────────────────────────────────────────────────────
  const allLeave = (leaveAllQ.data ?? []) as Array<{ status: string }>
  const leaveStats = {
    pending:  allLeave.filter(l => l.status === 'pending').length,
    approved: allLeave.filter(l => l.status === 'approved').length,
    rejected: allLeave.filter(l => l.status === 'rejected').length,
  }

  const pending = (pendingLeavesQ.data ?? []) as any[]
  const pendingLeaves = pending.map(l => ({
    id: l.id,
    employee_name: l.employee?.full_name ?? 'Unknown',
    type: l.type,
    from_date: l.from_date,
    to_date:   l.to_date,
    days:      l.days,
    created_at: l.created_at,
  }))

  // ── Bookings ────────────────────────────────────────────────────────────────
  const bookings = (bookingsMonthQ.data ?? []) as unknown as Array<{
    order_date: string
    total_amount: unknown
    advance_paid: unknown
    customer_name: string
    employee: { full_name: string } | null
  }>
  const monthRevenue = bookings.reduce((s, b) => s + num(b.total_amount), 0)
  const monthAdvance = bookings.reduce((s, b) => s + num(b.advance_paid), 0)
  const todayBookings = bookings.filter(b => b.order_date === today)
  const bookingStats = {
    monthCount:   bookings.length,
    monthRevenue,
    monthAdvance,
    monthPending: monthRevenue - monthAdvance,
    todayCount:   todayBookings.length,
    todayRevenue: todayBookings.reduce((s, b) => s + num(b.total_amount), 0),
  }

  // ── Department breakdown ────────────────────────────────────────────────────
  const departments = (departmentsQ.data ?? []) as Array<{ id: string; name: string; color: string | null }>
  const departmentBreakdown = departments.map(d => {
    const inDept = employees.filter(e => e.department?.id === d.id)
    return {
      name: d.name,
      color: d.color,
      total:    inDept.length,
      active:   inDept.filter(e => e.status === 'active').length,
      onLeave:  inDept.filter(e => e.status === 'on_leave').length,
    }
  })

  // ── Top performers (by completed-task assignments in last 30 days) ─────────
  const assignments = (assignmentsQ.data ?? []) as unknown as Array<{
    employee_id: string
    task: { status: string; completed_at: string | null } | null
  }>
  const last30 = daysAgoISO(30)
  const completionMap = new Map<string, number>()
  assignments.forEach(a => {
    if (a.task?.status === 'done' && a.task.completed_at && a.task.completed_at.slice(0, 10) >= last30) {
      completionMap.set(a.employee_id, (completionMap.get(a.employee_id) ?? 0) + 1)
    }
  })
  const topPerformers = employees
    .map(e => ({
      id: e.id,
      name: e.full_name,
      department: e.department?.name ?? null,
      completed: completionMap.get(e.id) ?? 0,
      avatar_url: e.avatar_url,
    }))
    .filter(e => e.completed > 0)
    .sort((a, b) => b.completed - a.completed)
    .slice(0, 5)

  // ── Activity feed ──────────────────────────────────────────────────────────
  type Activity = DashboardSnapshot['activity'][number]
  const activity: Activity[] = []

  for (const t of (recentTasksQ.data ?? []) as any[]) {
    activity.push({
      id: `task-${t.id}`,
      kind: 'task',
      title: t.completed_at ? `Completed: ${t.title}` : `Created: ${t.title}`,
      subtitle: `Priority ${t.priority}`,
      actor: null,
      when: t.completed_at ?? t.created_at,
      href: `/cms/tasks`,
    })
  }
  for (const l of (recentLeavesQ.data ?? []) as any[]) {
    activity.push({
      id: `leave-${l.id}`,
      kind: 'leave',
      title: `${l.employee?.full_name ?? 'Someone'} requested ${l.type} leave`,
      subtitle: `${l.from_date} → ${l.to_date} · ${l.status}`,
      actor: l.employee?.full_name ?? null,
      when: l.created_at,
      href: `/cms/leave`,
    })
  }
  for (const b of (recentBookingsQ.data ?? []) as any[]) {
    activity.push({
      id: `booking-${b.id}`,
      kind: 'booking',
      title: `${b.employee?.full_name ?? 'Someone'} added booking for ${b.customer_name}`,
      subtitle: `₹${new Intl.NumberFormat('en-IN').format(num(b.total_amount))}`,
      actor: b.employee?.full_name ?? null,
      when: b.created_at,
      href: `/cms/bookings/list`,
    })
  }
  activity.sort((a, b) => (a.when < b.when ? 1 : -1))

  // ── Upcoming holidays ──────────────────────────────────────────────────────
  const upcomingHolidays = ((holidaysQ.data ?? []) as any[]).map(h => ({
    id: h.id, name: h.name, date: h.date, type: h.type,
  }))

  // ── Announcements ──────────────────────────────────────────────────────────
  const recentAnnouncements = ((announcementsQ.data ?? []) as any[]).map(a => ({
    id: a.id,
    title: a.title,
    body: a.body,
    created_at: a.created_at,
    author: null,
  }))

  return {
    range: { from: monthStart, to: monthEnd },
    generatedAt: new Date().toISOString(),
    employeeStats,
    taskStats,
    attendanceToday: {
      date: today, present, late, absent, leave, notMarked,
    },
    attendanceTrend,
    taskTrend,
    leaveStats,
    pendingLeaves,
    bookingStats,
    departmentBreakdown,
    topPerformers,
    activity: activity.slice(0, 12),
    upcomingHolidays,
    recentAnnouncements,
  }
}
