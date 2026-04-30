'use client'

import * as React from 'react'

import { TaskStats } from './task-stats'
import { TasksToolbar, type TaskFilters } from './tasks-toolbar'
import { TasksTable } from './tasks-table'
import { TaskDrawer } from './task-drawer'
import { TaskDetailDrawer } from './task-detail-drawer'
import type { TaskWithDetails, TaskStats as TaskStatsType } from '@/lib/db/tasks'
import type { Company, Employee } from '@/lib/db/types'
import type { TaskTemplate } from '@/lib/db/task-templates'

interface Props {
  initialTasks: TaskWithDetails[]
  stats: TaskStatsType
  companies: Company[]
  employees: Employee[]
  templates: TaskTemplate[]
}

export function TasksSection({ initialTasks, stats, companies, employees, templates }: Props) {
  const [tasks, setTasks] = React.useState<TaskWithDetails[]>(initialTasks)
  const [liveStats, setLiveStats] = React.useState<TaskStatsType>(stats)
  const [filters, setFilters] = React.useState<TaskFilters>({
    query: '',
    company_id: '',
    priority: '',
    status: '',
    employee_id: '',
  })
  const [showActive, setShowActive] = React.useState(true)

  // Edit drawer state
  const [drawerOpen, setDrawerOpen] = React.useState(false)
  const [editTask, setEditTask] = React.useState<TaskWithDetails | null>(null)
  const [defaultStatus, setDefaultStatus] = React.useState<string>('todo')

  // Detail drawer state
  const [detailOpen, setDetailOpen] = React.useState(false)
  const [detailTask, setDetailTask] = React.useState<TaskWithDetails | null>(null)

  // Client-side filtering
  const filtered = React.useMemo(() => {
    const q = filters.query.trim().toLowerCase()
    return tasks.filter((t) => {
      // Active-only filter (hides done only) — unless the status filter is set manually
      if (showActive && !filters.status) {
        if (t.status === 'done') return false
      }
      if (filters.company_id && t.company_id !== filters.company_id) return false
      if (filters.priority && t.priority !== filters.priority) return false
      if (filters.status && t.status !== filters.status) return false
      if (filters.employee_id) {
        const has = t.assignments.some((a) => a.employee_id === filters.employee_id)
        if (!has) return false
      }
      if (q) {
        const hay = [
          t.title,
          t.description ?? '',
          t.company?.name ?? '',
          ...t.assignments.map((a) => a.employee?.full_name ?? ''),
        ]
          .join(' ')
          .toLowerCase()
        if (!hay.includes(q)) return false
      }
      return true
    })
  }, [tasks, filters, showActive])

  function openCreate(status?: string) {
    setDetailOpen(false)
    setEditTask(null)
    setDefaultStatus(status ?? 'todo')
    setDrawerOpen(true)
  }

  function openEdit(task: TaskWithDetails) {
    setDetailOpen(false)
    setEditTask(task)
    setDrawerOpen(true)
  }

  function openDetail(task: TaskWithDetails) {
    setDetailTask(task)
    setDetailOpen(true)
  }

  function handleSaved(saved: TaskWithDetails) {
    setTasks((prev) => {
      const without = prev.filter((t) => t.id !== saved.id)
      return [saved, ...without]
    })
    // If the detail drawer is open for this task, keep it in sync
    if (detailTask?.id === saved.id) {
      setDetailTask(saved)
    }
    recomputeStats()
    setDrawerOpen(false)
  }

  function handleDeleted(id: string) {
    setTasks((prev) => prev.filter((t) => t.id !== id))
    if (detailTask?.id === id) {
      setDetailOpen(false)
      setDetailTask(null)
    }
    recomputeStats()
    setDrawerOpen(false)
  }

  function handleDetailUpdated(updated: TaskWithDetails) {
    setTasks((prev) =>
      prev.map((t) => (t.id === updated.id ? updated : t))
    )
    setDetailTask(updated)
    recomputeStats()
  }

  function recomputeStats() {
    setTimeout(() => {
      setTasks((current) => {
        const todayIso = new Date().toISOString().slice(0, 10)
        const nowIso = new Date().toISOString()
        setLiveStats({
          total: current.length,
          inProgress: current.filter((t) => t.status === 'in_progress').length,
          completedToday: current.filter(
            (t) => t.completed_at && t.completed_at.slice(0, 10) === todayIso
          ).length,
          overdue: current.filter(
            (t) => t.status !== 'done' && t.deadline && t.deadline < nowIso
          ).length,
        })
        return current
      })
    }, 0)
  }

  async function handleDelete(task: TaskWithDetails) {
    if (!window.confirm(`Delete "${task.title}"? This cannot be undone.`)) return
    try {
      await fetch(`/api/tasks/${task.id}`, { method: 'DELETE' })
      handleDeleted(task.id)
    } catch {
      // silently fail — user can retry via drawer
    }
  }

  return (
    <div className="space-y-4">
      <TaskStats stats={liveStats} />

      <TasksToolbar
        companies={companies}
        employees={employees}
        tasks={tasks}
        filters={filters}
        onFiltersChange={setFilters}
        onNew={() => openCreate()}
        showActive={showActive}
        onToggleActive={() => setShowActive((v) => !v)}
      />

      <TasksTable
        tasks={filtered}
        onView={openDetail}
        onEdit={openEdit}
        onDelete={handleDelete}
      />

      <TaskDrawer
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        task={editTask}
        companies={companies}
        employees={employees}
        defaultStatus={defaultStatus}
        templates={templates}
        onSaved={handleSaved}
        onDeleted={handleDeleted}
      />

      <TaskDetailDrawer
        open={detailOpen}
        onClose={() => setDetailOpen(false)}
        task={detailTask}
        onUpdated={handleDetailUpdated}
        onEdit={(task) => openEdit(task)}
      />
    </div>
  )
}
