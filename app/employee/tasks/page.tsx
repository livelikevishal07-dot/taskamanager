'use client'

import * as React from 'react'
import {
  AlertCircle, CheckCircle2, Circle, Clock, Filter,
  Loader2, Plus, Search, SlidersHorizontal, Trash2,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { useEmployee } from '@/app/employee/context'
import { AvatarStack } from '@/components/ui/avatar'
import { EmployeeTopbar } from '@/components/employee-dashboard/topbar'
import { TaskDetailDrawer, type TaskDetail } from '@/components/employee-dashboard/task-detail-drawer'
import { TaskFormDrawer } from '@/components/employee-dashboard/task-form-drawer'
import { DailyTasksSection } from '@/components/employee-dashboard/daily-tasks'

// ── Types ─────────────────────────────────────────────────────────────────────

type Priority   = 'urgent' | 'high' | 'medium' | 'low'
type TaskStatus = 'todo' | 'in_progress' | 'review' | 'done' | 'blocked'

// ── Meta ──────────────────────────────────────────────────────────────────────

const PRIORITY_META: Record<Priority, { label: string; dot: string; chip: string }> = {
  urgent: { label: 'Urgent', dot: 'bg-coral',    chip: 'bg-coral/10 text-coral' },
  high:   { label: 'High',   dot: 'bg-amber',    chip: 'bg-amber/10 text-amber' },
  medium: { label: 'Medium', dot: 'bg-sky',       chip: 'bg-sky/10 text-sky' },
  low:    { label: 'Low',    dot: 'bg-ink-soft',  chip: 'bg-surface-2 text-ink-soft' },
}

const STATUS_META: Record<TaskStatus, { label: string; chip: string }> = {
  todo:        { label: 'To Do',       chip: 'bg-surface-2 text-ink-muted' },
  in_progress: { label: 'In Progress', chip: 'bg-brand/10 text-brand' },
  review:      { label: 'Review',      chip: 'bg-violet/10 text-violet' },
  done:        { label: 'Done',        chip: 'bg-emerald/10 text-emerald' },
  blocked:     { label: 'Blocked',     chip: 'bg-coral/10 text-coral' },
}

const STATUS_TABS = [
  { key: 'all',        label: 'All' },
  { key: 'todo',       label: 'To Do' },
  { key: 'in_progress',label: 'In Progress' },
  { key: 'review',     label: 'Review' },
  { key: 'blocked',    label: 'Blocked' },
  { key: 'done',       label: 'Done' },
] as const

type StatusTab = (typeof STATUS_TABS)[number]['key']

// ── Helpers ───────────────────────────────────────────────────────────────────

function deadlineLabel(deadline: string | null, status: TaskStatus) {
  if (!deadline || status === 'done') return null
  const diff = Math.ceil((new Date(deadline).getTime() - Date.now()) / 86_400_000)
  if (diff < 0)  return { text: `${Math.abs(diff)}d overdue`, cls: 'text-coral' }
  if (diff === 0) return { text: 'Due today',    cls: 'text-amber' }
  if (diff === 1) return { text: 'Due tomorrow', cls: 'text-amber' }
  return {
    text: `Due ${new Date(deadline).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}`,
    cls: 'text-ink-soft',
  }
}

// ── Stat card ─────────────────────────────────────────────────────────────────

const StatCard = React.memo(function StatCard({ label, value, sub, accent }: {
  label: string; value: string | number; sub: string; accent: string
}) {
  return (
    <div className="rounded-2xl border border-border bg-surface p-4 shadow-card">
      <p className="text-xs text-ink-soft">{label}</p>
      <p className={cn('mt-1 text-2xl font-bold tracking-tight', accent)}>{value}</p>
      <p className="mt-0.5 text-[11px] text-ink-soft">{sub}</p>
    </div>
  )
})

// ── Main page ─────────────────────────────────────────────────────────────────

export default function TasksPage() {
  const employee = useEmployee()

  // Data
  const [tasks,   setTasks]   = React.useState<TaskDetail[]>([])
  const [loading, setLoading] = React.useState(true)

  // Filters — search uses a debounced value to avoid fetching on every keystroke
  const [search,         setSearch]         = React.useState('')
  const [debouncedSearch,setDebouncedSearch] = React.useState('')
  const [statusTab,      setStatusTab]       = React.useState<StatusTab>('all')
  const [priority,       setPriority]        = React.useState<Priority | ''>('')
  const [showFilter,     setShowFilter]      = React.useState(false)

  // Drawers
  const [detailTask, setDetailTask] = React.useState<TaskDetail | null>(null)
  const [detailOpen, setDetailOpen] = React.useState(false)
  const [formTask,   setFormTask]   = React.useState<TaskDetail | null>(null)
  const [formOpen,   setFormOpen]   = React.useState(false)

  // ── Debounce search ────────────────────────────────────────────────────────
  React.useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search), 300)
    return () => clearTimeout(t)
  }, [search])

  // ── Fetch (driven by stable dependencies; debounced search prevents excess) ─
  const load = React.useCallback(async () => {
    if (!employee.id) { setLoading(false); return }
    setLoading(true)
    try {
      const params = new URLSearchParams({ employee_id: employee.id })
      if (statusTab !== 'all')    params.set('status',   statusTab)
      if (priority)               params.set('priority', priority)
      if (debouncedSearch.trim()) params.set('search',   debouncedSearch.trim())
      const r = await fetch(`/api/tasks?${params}`)
      const d: TaskDetail[] = await r.json()
      setTasks(Array.isArray(d) ? d : [])
    } catch { /* keep previous */ }
    finally { setLoading(false) }
  }, [employee.id, statusTab, priority, debouncedSearch])

  React.useEffect(() => { load() }, [load])

  // ── Optimistic toggle ─────────────────────────────────────────────────────
  const toggleDone = React.useCallback(async (task: TaskDetail, e: React.MouseEvent) => {
    e.stopPropagation()
    const next: TaskStatus = task.status === 'done' ? 'todo' : 'done'
    setTasks((p) => p.map((t) => t.id === task.id ? { ...t, status: next } : t))
    try {
      await fetch(`/api/tasks/${task.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: next }),
      })
    } catch {
      setTasks((p) => p.map((t) => t.id === task.id ? { ...t, status: task.status } : t))
    }
  }, [])

  // ── Delete ────────────────────────────────────────────────────────────────
  const deleteTask = React.useCallback(async (id: string, e: React.MouseEvent) => {
    e.stopPropagation()
    if (!confirm('Delete this task? This cannot be undone.')) return
    setTasks((p) => p.filter((t) => t.id !== id))
    try {
      await fetch(`/api/tasks/${id}`, { method: 'DELETE' })
    } catch { load() }
  }, [load])

  // ── Stats (memoised) ──────────────────────────────────────────────────────
  const stats = React.useMemo(() => {
    const now = new Date()
    const total   = tasks.length
    const inProg  = tasks.filter((t) => t.status === 'in_progress').length
    const done    = tasks.filter((t) => t.status === 'done').length
    const overdue = tasks.filter((t) =>
      t.status !== 'done' && t.deadline && new Date(t.deadline) < now
    ).length
    return { total, inProg, done, overdue }
  }, [tasks])

  // Display list: on 'all' tab hide done tasks; 'done' tab shows completed
  const displayTasks = React.useMemo(() => {
    if (statusTab === 'all') return tasks.filter((t) => t.status !== 'done')
    return tasks
  }, [tasks, statusTab])

  // ── Drawer handlers ───────────────────────────────────────────────────────
  const openDetail = React.useCallback((t: TaskDetail) => { setDetailTask(t); setDetailOpen(true) }, [])
  const openForm   = React.useCallback((t?: TaskDetail) => { setFormTask(t ?? null); setFormOpen(true) }, [])

  const onTaskUpdated = React.useCallback((t: TaskDetail) => {
    setDetailTask(t)
    setTasks((p) => p.map((x) => x.id === t.id ? t : x))
  }, [])

  const onSaved = React.useCallback((t: TaskDetail) => {
    setTasks((p) => {
      const idx = p.findIndex((x) => x.id === t.id)
      if (idx >= 0) {
        const next = [...p]; next[idx] = t; return next
      }
      return [t, ...p]
    })
  }, [])

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <>
      <EmployeeTopbar
        title="My Tasks"
        breadcrumb={[{ label: 'Home' }, { label: 'My Tasks' }]}
        subtitle={`${stats.total} task${stats.total !== 1 ? 's' : ''} assigned`}
      />

      <main className="space-y-5 px-4 py-4 sm:px-6 sm:py-6">
        {/* Daily recurring tasks */}
        <DailyTasksSection employeeId={employee.id} />

        {/* Stats row */}
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <StatCard label="Total"       value={stats.total}  sub="all assigned"      accent="text-ink" />
          <StatCard label="In Progress" value={stats.inProg} sub="actively working"  accent="text-brand" />
          <StatCard label="Completed"   value={stats.done}   sub="tasks done"        accent="text-emerald" />
          <StatCard label="Overdue"     value={stats.overdue} sub="past deadline"    accent={stats.overdue > 0 ? 'text-coral' : 'text-ink-muted'} />
        </div>

        {/* Toolbar */}
        <div className="flex flex-wrap items-center gap-3">
          {/* Search */}
          <div className="relative flex-1 min-w-0">
            <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-ink-soft" />
            <input
              type="text"
              placeholder="Search tasks…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="h-9 w-full rounded-xl border border-border bg-surface pl-9 pr-3 text-sm outline-none placeholder:text-ink-soft focus:border-brand/50 focus:ring-1 focus:ring-brand/20"
            />
          </div>

          {/* Priority filter */}
          <button
            type="button"
            onClick={() => setShowFilter((o) => !o)}
            className={cn(
              'inline-flex h-9 items-center gap-1.5 rounded-xl border border-border px-3 text-sm font-medium text-ink-muted hover:bg-surface-2',
              showFilter && 'border-brand/40 bg-brand/5 text-brand'
            )}
          >
            <SlidersHorizontal className="size-4" />
            Filters
            {priority && <span className="ml-1 size-1.5 rounded-full bg-brand" />}
          </button>

          {/* New task button */}
          <button
            type="button"
            onClick={() => openForm()}
            className="inline-flex h-9 items-center gap-1.5 rounded-xl bg-brand px-4 text-sm font-medium text-brand-foreground shadow-sm hover:opacity-90"
          >
            <Plus className="size-4" />
            New Task
          </button>
        </div>

        {/* Priority filter panel */}
        {showFilter && (
          <div className="flex flex-wrap items-center gap-2 rounded-xl border border-border bg-surface-2/40 px-4 py-3">
            <span className="text-xs font-semibold text-ink-soft">Priority:</span>
            {(['', 'urgent', 'high', 'medium', 'low'] as const).map((p) => (
              <button
                key={p}
                type="button"
                onClick={() => setPriority(p === '' ? '' : p)}
                className={cn(
                  'rounded-full border px-2.5 py-1 text-xs font-medium transition-all',
                  priority === p
                    ? 'border-brand/40 bg-brand/10 text-brand'
                    : 'border-border text-ink-muted hover:bg-surface-2'
                )}
              >
                {p === '' ? 'All' : PRIORITY_META[p].label}
              </button>
            ))}
          </div>
        )}

        {/* Status tabs */}
        <div className="flex gap-1 overflow-x-auto rounded-xl border border-border bg-surface-2/40 p-1">
          {STATUS_TABS.map((tab) => {
            const count = tab.key === 'all'
              ? tasks.filter((t) => t.status !== 'done').length
              : tasks.filter((t) => t.status === tab.key).length
            return (
              <button
                key={tab.key}
                type="button"
                onClick={() => setStatusTab(tab.key)}
                className={cn(
                  'flex shrink-0 items-center gap-1.5 rounded-lg px-3 py-2 text-xs font-medium transition-colors',
                  statusTab === tab.key
                    ? 'bg-surface text-ink shadow-sm'
                    : 'text-ink-soft hover:text-ink'
                )}
              >
                {tab.label}
                <span className={cn(
                  'rounded-full px-1.5 py-0.5 text-[10px] font-bold',
                  statusTab === tab.key ? 'bg-brand/10 text-brand' : 'bg-surface-2 text-ink-soft'
                )}>{count}</span>
              </button>
            )
          })}
        </div>

        {/* Task list */}
        <div className="overflow-hidden rounded-2xl border border-border bg-surface shadow-card">
          {loading ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="size-6 animate-spin text-brand" />
            </div>
          ) : displayTasks.length === 0 ? (
            <div className="py-20 text-center">
              <CheckCircle2 className="mx-auto mb-3 size-10 text-ink-soft/40" />
              <p className="text-sm font-medium text-ink-muted">
                {search || priority ? 'No tasks match your filters.' : statusTab === 'all' ? 'No active tasks — all caught up! 🎉' : 'No tasks here.'}
              </p>
              {!search && !priority && statusTab === 'all' && (
                <button
                  type="button"
                  onClick={() => openForm()}
                  className="mt-4 inline-flex items-center gap-1.5 rounded-xl bg-brand px-4 py-2 text-sm font-medium text-brand-foreground shadow-sm hover:opacity-90"
                >
                  <Plus className="size-4" /> Create your first task
                </button>
              )}
            </div>
          ) : (
            <ul className="divide-y divide-border">
              {displayTasks.map((task) => {
                const pm  = PRIORITY_META[task.priority]
                const sm  = STATUS_META[task.status]
                const dl  = deadlineLabel(task.deadline, task.status)
                const over = task.deadline && task.status !== 'done' && new Date(task.deadline) < new Date()
                const itemsDone  = task.items.filter((i) => i.completed).length
                const itemsTotal = task.items.length
                const subPct = itemsTotal > 0 ? Math.round((itemsDone / itemsTotal) * 100) : null

                const teammates = task.assignments
                  .filter((a) => a.employee_id !== employee.id && a.employee)
                  .map((a) => a.employee!.full_name)

                return (
                  <li
                    key={task.id}
                    className={cn(
                      'group flex items-start gap-3 px-5 py-4 transition-colors hover:bg-surface-2/50 cursor-pointer',
                      task.status === 'done' && 'opacity-60'
                    )}
                    onClick={() => openDetail(task)}
                  >
                    {/* Toggle done */}
                    <button
                      type="button"
                      onClick={(e) => toggleDone(task, e)}
                      className="mt-0.5 shrink-0"
                    >
                      {task.status === 'done'
                        ? <CheckCircle2 className="size-5 text-emerald" />
                        : over
                          ? <AlertCircle className="size-5 text-coral" />
                          : <Circle className="size-5 text-border hover:text-brand transition-colors" />}
                    </button>

                    {/* Content */}
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-start gap-2">
                        <p className={cn(
                          'flex-1 text-sm font-medium leading-snug',
                          task.status === 'done' ? 'line-through text-ink-soft' : 'text-ink'
                        )}>
                          {task.title}
                        </p>
                        {/* Priority */}
                        <span className={cn('inline-flex shrink-0 items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold', pm.chip)}>
                          <span className={cn('size-1.5 rounded-full', pm.dot)} />{pm.label}
                        </span>
                        {/* Status */}
                        <span className={cn('rounded-full px-2 py-0.5 text-[10px] font-semibold', sm.chip)}>
                          {sm.label}
                        </span>
                      </div>

                      {task.description && task.status !== 'done' && (
                        <p className="mt-0.5 line-clamp-1 text-xs text-ink-soft">{task.description}</p>
                      )}

                      {/* Sub-task progress */}
                      {subPct !== null && task.status !== 'done' && (
                        <div className="mt-2 flex items-center gap-2">
                          <div className="h-1 w-32 rounded-full bg-surface-2">
                            <div className="h-full rounded-full bg-brand" style={{ width: `${subPct}%` }} />
                          </div>
                          <span className="text-[10px] text-ink-soft">{itemsDone}/{itemsTotal} steps</span>
                        </div>
                      )}

                      <div className="mt-1.5 flex flex-wrap items-center gap-3">
                        {task.company && (
                          <span className="text-xs text-ink-soft">{task.company.name}</span>
                        )}
                        {dl && (
                          <span className={cn('flex items-center gap-0.5 text-xs', dl.cls)}>
                            <Clock className="size-3" />{dl.text}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Right: team + delete */}
                    <div className="flex shrink-0 items-center gap-2 mt-0.5">
                      {teammates.length > 0 && (
                        <AvatarStack names={teammates} max={3} size="sm" />
                      )}
                      <button
                        type="button"
                        onClick={(e) => deleteTask(task.id, e)}
                        className="hidden size-7 place-items-center rounded-lg text-ink-soft hover:bg-coral/10 hover:text-coral group-hover:grid"
                      >
                        <Trash2 className="size-3.5" />
                      </button>
                    </div>
                  </li>
                )
              })}
            </ul>
          )}
        </div>
      </main>

      {/* Drawers */}
      <TaskDetailDrawer
        task={detailTask}
        open={detailOpen}
        onClose={() => setDetailOpen(false)}
        onEdit={(t) => { setDetailOpen(false); openForm(t) }}
        onTaskUpdated={onTaskUpdated}
      />
      <TaskFormDrawer
        open={formOpen}
        task={formTask}
        onClose={() => setFormOpen(false)}
        onSaved={onSaved}
      />
    </>
  )
}
