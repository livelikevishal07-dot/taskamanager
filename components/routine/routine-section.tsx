'use client'

import * as React from 'react'
import { Plus, CheckCircle2, RefreshCw } from 'lucide-react'

import { TemplateCard } from './template-card'
import { TemplateDrawer } from './template-drawer'
import { RecurringTaskCard } from './recurring-task-card'
import { RecurringTaskDrawer } from './recurring-task-drawer'
import { TaskDrawer } from '@/components/tasks/task-drawer'
import type { TaskTemplate } from '@/lib/db/task-templates'
import type { RecurringTaskBase as RecurringTask } from '@/lib/recurring-tasks-shared'
import type { TaskWithDetails } from '@/lib/db/tasks'
import type { Company, Employee } from '@/lib/db/types'

interface Props {
  initialTemplates: TaskTemplate[]
  initialRecurringTasks: RecurringTask[]
  companies: Company[]
  employees: Employee[]
  /**
   * Map of `recurring_task_id` → array of `employee_id` who completed it today.
   * Used to render "X/Y done today" badges on each card.
   */
  todayCompletions?: Record<string, string[]>
}

export function RoutineSection({
  initialTemplates,
  initialRecurringTasks,
  companies,
  employees,
  todayCompletions = {},
}: Props) {
  const [templates, setTemplates] = React.useState<TaskTemplate[]>(initialTemplates)

  // Template CRUD drawer
  const [tplDrawerOpen, setTplDrawerOpen] = React.useState(false)
  const [editingTemplate, setEditingTemplate] = React.useState<TaskTemplate | null>(null)

  // Task creation drawer (run template)
  const [taskDrawerOpen, setTaskDrawerOpen] = React.useState(false)
  const [activeTemplate, setActiveTemplate] = React.useState<TaskTemplate | null>(null)

  // Recurring tasks
  const [recurringTasks, setRecurringTasks] = React.useState<RecurringTask[]>(initialRecurringTasks)
  const [recurringDrawerOpen, setRecurringDrawerOpen] = React.useState(false)
  const [editingRecurring, setEditingRecurring] = React.useState<RecurringTask | null>(null)
  const [togglingId, setTogglingId] = React.useState<string | null>(null)

  // Success flash
  const [successMsg, setSuccessMsg] = React.useState('')

  // ── template CRUD handlers ──────────────────────────────────────────────

  function openNew() {
    setEditingTemplate(null)
    setTplDrawerOpen(true)
  }

  function openEdit(t: TaskTemplate) {
    setEditingTemplate(t)
    setTplDrawerOpen(true)
  }

  function handleTemplateSaved(saved: TaskTemplate) {
    setTemplates((prev) => {
      const exists = prev.some((t) => t.id === saved.id)
      if (exists) return prev.map((t) => (t.id === saved.id ? saved : t))
      return [saved, ...prev]
    })
    setTplDrawerOpen(false)
  }

  function handleTemplateDeleted(id: string) {
    setTemplates((prev) => prev.filter((t) => t.id !== id))
    setTplDrawerOpen(false)
  }

  // ── run-task handler ───────────────────────────────────────────────────

  function openRunTask(t: TaskTemplate) {
    setActiveTemplate(t)
    setTaskDrawerOpen(true)
  }

  function handleTaskCreated(task: TaskWithDetails) {
    setTaskDrawerOpen(false)
    setActiveTemplate(null)
    setSuccessMsg(`Task "${task.title}" created!`)
    setTimeout(() => setSuccessMsg(''), 4000)
  }

  // ── recurring task handlers ────────────────────────────────────────────

  function openNewRecurring() {
    setEditingRecurring(null)
    setRecurringDrawerOpen(true)
  }

  function openEditRecurring(t: RecurringTask) {
    setEditingRecurring(t)
    setRecurringDrawerOpen(true)
  }

  function handleRecurringSaved(saved: RecurringTask) {
    setRecurringTasks((prev) => {
      const exists = prev.some((t) => t.id === saved.id)
      if (exists) return prev.map((t) => (t.id === saved.id ? saved : t))
      return [saved, ...prev]
    })
    setRecurringDrawerOpen(false)
  }

  function handleRecurringDeleted(id: string) {
    setRecurringTasks((prev) => prev.filter((t) => t.id !== id))
    setRecurringDrawerOpen(false)
  }

  async function handleToggleActive(task: RecurringTask) {
    setTogglingId(task.id)
    try {
      const res = await fetch(`/api/recurring-tasks/${task.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ is_active: !task.is_active }),
      })
      if (res.ok) {
        const updated: RecurringTask = await res.json()
        setRecurringTasks((prev) => prev.map((t) => (t.id === updated.id ? updated : t)))
      }
    } finally {
      setTogglingId(null)
    }
  }

  // Build template-fill for TaskDrawer
  const templateFill = activeTemplate
    ? {
        title: activeTemplate.title,
        description: activeTemplate.description ?? '',
        priority: activeTemplate.priority,
        company_id: activeTemplate.company_id ?? '',
        employee_ids: activeTemplate.employee_assignments.map((a) => a.employee_id),
      }
    : undefined

  return (
    <div className="space-y-10">

      {/* ── Templates section ── */}
      <div className="space-y-5">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold">Routine templates</h2>
            <p className="text-sm text-ink-muted">
              {templates.length} template{templates.length !== 1 ? 's' : ''} · Click{' '}
              <span className="font-medium text-ink">Run task</span> to instantly create a task from a template
            </p>
          </div>
          <button
            type="button"
            onClick={openNew}
            className="inline-flex h-10 items-center gap-2 rounded-xl bg-brand px-4 text-sm font-medium text-brand-foreground shadow-sm hover:opacity-90"
          >
            <Plus className="size-4" />
            New template
          </button>
        </div>

        {successMsg && (
          <div className="flex items-center gap-2 rounded-xl border border-emerald/30 bg-emerald/10 px-4 py-3 text-sm font-medium text-emerald">
            <CheckCircle2 className="size-4 shrink-0" />
            {successMsg}
          </div>
        )}

        {templates.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-border bg-surface py-12 text-center">
            <div className="mb-4 grid size-14 place-items-center rounded-2xl bg-surface-2">
              <Plus className="size-6 text-ink-soft" />
            </div>
            <p className="mb-1 text-base font-semibold">No routine templates yet</p>
            <p className="mb-5 text-sm text-ink-muted max-w-xs">
              Create templates for tasks you repeat — social media posts, reports, client calls, etc.
            </p>
            <button
              type="button"
              onClick={openNew}
              className="inline-flex h-9 items-center gap-2 rounded-xl bg-brand px-4 text-sm font-medium text-brand-foreground shadow-sm hover:opacity-90"
            >
              <Plus className="size-4" />
              New template
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
            {templates.map((t) => (
              <TemplateCard key={t.id} template={t} onRun={() => openRunTask(t)} onEdit={() => openEdit(t)} />
            ))}
          </div>
        )}
      </div>

      {/* ── Recurring tasks section ── */}
      <div className="space-y-5">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold">Recurring tasks</h2>
            <p className="text-sm text-ink-muted">
              {recurringTasks.filter((t) => t.is_active).length} active · Auto-assigned to employees every day until revoked
            </p>
          </div>
          <button
            type="button"
            onClick={openNewRecurring}
            className="inline-flex h-10 items-center gap-2 rounded-xl bg-brand px-4 text-sm font-medium text-brand-foreground shadow-sm hover:opacity-90"
          >
            <Plus className="size-4" />
            New recurring task
          </button>
        </div>

        {recurringTasks.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-border bg-surface py-12 text-center">
            <div className="mb-4 grid size-14 place-items-center rounded-2xl bg-surface-2">
              <RefreshCw className="size-6 text-ink-soft" />
            </div>
            <p className="mb-1 text-base font-semibold">No recurring tasks yet</p>
            <p className="mb-5 text-sm text-ink-muted max-w-xs">
              Recurring tasks auto-appear for your employees daily — social media posts, opening checklists, reports, etc.
            </p>
            <button
              type="button"
              onClick={openNewRecurring}
              className="inline-flex h-9 items-center gap-2 rounded-xl bg-brand px-4 text-sm font-medium text-brand-foreground shadow-sm hover:opacity-90"
            >
              <Plus className="size-4" />
              New recurring task
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
            {recurringTasks.map((t) => (
              <RecurringTaskCard
                key={t.id}
                task={t}
                onEdit={() => openEditRecurring(t)}
                onToggleActive={() => handleToggleActive(t)}
                toggling={togglingId === t.id}
                completedAssigneeIds={todayCompletions[t.id] ?? []}
              />
            ))}
          </div>
        )}
      </div>

      {/* ── Drawers ── */}
      <TemplateDrawer
        open={tplDrawerOpen}
        onClose={() => setTplDrawerOpen(false)}
        template={editingTemplate}
        companies={companies}
        employees={employees}
        onSaved={handleTemplateSaved}
        onDeleted={handleTemplateDeleted}
      />

      <TaskDrawer
        open={taskDrawerOpen}
        onClose={() => { setTaskDrawerOpen(false); setActiveTemplate(null) }}
        task={null}
        companies={companies}
        employees={employees}
        defaultStatus="todo"
        templateFill={templateFill}
        onSaved={handleTaskCreated}
      />

      <RecurringTaskDrawer
        open={recurringDrawerOpen}
        onClose={() => setRecurringDrawerOpen(false)}
        task={editingRecurring}
        companies={companies}
        employees={employees}
        onSaved={handleRecurringSaved}
        onDeleted={handleRecurringDeleted}
      />
    </div>
  )
}
