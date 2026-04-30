'use client'

import * as React from 'react'
import { Check, Loader2, Search, UserPlus, X } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Avatar } from '@/components/ui/avatar'
import { useEmployee } from '@/app/employee/context'
import type { TaskDetail } from './task-detail-drawer'

// ── Types ─────────────────────────────────────────────────────────────────────

type Priority   = 'urgent' | 'high' | 'medium' | 'low'
type TaskStatus = 'todo' | 'in_progress' | 'review' | 'done' | 'blocked'

interface EmployeeLite { id: string; full_name: string; role?: { name: string } | null }

// ── Meta ──────────────────────────────────────────────────────────────────────

const PRIORITIES: { value: Priority; label: string; chip: string; dot: string }[] = [
  { value: 'urgent', label: 'Urgent', chip: 'bg-coral/10 text-coral border-coral/20',     dot: 'bg-coral' },
  { value: 'high',   label: 'High',   chip: 'bg-amber/10 text-amber border-amber/20',     dot: 'bg-amber' },
  { value: 'medium', label: 'Medium', chip: 'bg-sky/10 text-sky border-sky/20',           dot: 'bg-sky' },
  { value: 'low',    label: 'Low',    chip: 'bg-surface-2 text-ink-muted border-border',  dot: 'bg-ink-soft' },
]

const STATUSES: { value: TaskStatus; label: string }[] = [
  { value: 'todo',        label: 'To Do' },
  { value: 'in_progress', label: 'In Progress' },
  { value: 'review',      label: 'Review' },
  { value: 'done',        label: 'Done' },
  { value: 'blocked',     label: 'Blocked' },
]

// ── Props ─────────────────────────────────────────────────────────────────────

interface Props {
  open: boolean
  task?: TaskDetail | null          // null = create mode
  onClose: () => void
  onSaved: (task: TaskDetail) => void
}

// ── Component ─────────────────────────────────────────────────────────────────

export function TaskFormDrawer({ open, task, onClose, onSaved }: Props) {
  const employee = useEmployee()
  const isEdit   = Boolean(task)

  // ── Form state ────────────────────────────────────────────────────────────
  const [title,    setTitle]    = React.useState('')
  const [desc,     setDesc]     = React.useState('')
  const [priority, setPriority] = React.useState<Priority>('medium')
  const [status,   setStatus]   = React.useState<TaskStatus>('todo')
  const [deadline, setDeadline] = React.useState('')

  // Assignees
  const [allEmployees, setAllEmployees] = React.useState<EmployeeLite[]>([])
  const [assigneeIds,  setAssigneeIds]  = React.useState<string[]>([])
  const [empSearch,    setEmpSearch]    = React.useState('')
  const [empLoading,   setEmpLoading]   = React.useState(false)
  const [showPicker,   setShowPicker]   = React.useState(false)

  const [saving, setSaving]   = React.useState(false)
  const [error,  setError]    = React.useState<string | null>(null)

  // Populate form when opening
  React.useEffect(() => {
    if (!open) return
    if (task) {
      setTitle(task.title)
      setDesc(task.description ?? '')
      setPriority(task.priority)
      setStatus(task.status)
      setDeadline(task.deadline ? task.deadline.slice(0, 10) : '')
      setAssigneeIds(task.assignments.map((a) => a.employee_id))
    } else {
      setTitle('')
      setDesc('')
      setPriority('medium')
      setStatus('todo')
      setDeadline('')
      // Auto-assign current employee on create
      setAssigneeIds(employee.id ? [employee.id] : [])
    }
    setError(null)
    setEmpSearch('')
    setShowPicker(false)
  }, [open, task, employee.id])

  // Load employees for assignee picker
  React.useEffect(() => {
    if (!open) return
    setEmpLoading(true)
    fetch('/api/employees?limit=100')
      .then((r) => r.json())
      .then((d) => {
        const rows: EmployeeLite[] = Array.isArray(d) ? d : (d?.rows ?? [])
        setAllEmployees(rows)
      })
      .catch(() => {})
      .finally(() => setEmpLoading(false))
  }, [open])

  // ── Submit ────────────────────────────────────────────────────────────────
  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!title.trim()) { setError('Title is required'); return }
    setSaving(true)
    setError(null)
    try {
      const payload = {
        title: title.trim(),
        description: desc.trim() || null,
        priority,
        status,
        deadline: deadline ? new Date(deadline).toISOString() : null,
        employee_ids: assigneeIds,
      }

      const url    = isEdit ? `/api/tasks/${task!.id}` : '/api/tasks'
      const method = isEdit ? 'PATCH' : 'POST'

      const r = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      if (!r.ok) {
        const err = await r.json().catch(() => ({}))
        throw new Error(err?.error ?? 'Something went wrong')
      }
      const saved: TaskDetail = await r.json()
      onSaved(saved)
      onClose()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save task')
    } finally {
      setSaving(false)
    }
  }

  function toggleAssignee(id: string) {
    setAssigneeIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    )
  }

  const filteredEmployees = allEmployees.filter((e) =>
    e.full_name.toLowerCase().includes(empSearch.toLowerCase())
  )

  const assignedEmployees = allEmployees.filter((e) => assigneeIds.includes(e.id))

  if (!open) return null

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-40 bg-black/30 backdrop-blur-[2px]"
        onClick={onClose}
      />

      {/* Drawer */}
      <aside className="fixed inset-y-0 right-0 z-50 flex w-full flex-col border-l border-border bg-surface shadow-2xl sm:max-w-lg">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-border px-6 py-4">
          <h2 className="text-base font-semibold">{isEdit ? 'Edit Task' : 'New Task'}</h2>
          <button
            type="button"
            onClick={onClose}
            className="grid size-8 place-items-center rounded-lg text-ink-soft hover:bg-surface-2"
          >
            <X className="size-4" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="flex flex-1 flex-col overflow-y-auto">
          <div className="space-y-5 p-4 sm:p-6">

            {/* Title */}
            <Field label="Title" required>
              <input
                type="text"
                placeholder="What needs to be done?"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="input-base"
                autoFocus
              />
            </Field>

            {/* Description */}
            <Field label="Description">
              <textarea
                rows={3}
                placeholder="Optional details…"
                value={desc}
                onChange={(e) => setDesc(e.target.value)}
                className="input-base resize-none"
              />
            </Field>

            {/* Priority */}
            <Field label="Priority">
              <div className="flex flex-wrap gap-2">
                {PRIORITIES.map((p) => (
                  <button
                    key={p.value}
                    type="button"
                    onClick={() => setPriority(p.value)}
                    className={cn(
                      'inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-semibold transition-all',
                      p.chip,
                      priority === p.value ? 'ring-2 ring-brand/40 shadow-sm' : 'opacity-60 hover:opacity-100'
                    )}
                  >
                    <span className={cn('size-1.5 rounded-full', p.dot)} />
                    {p.label}
                    {priority === p.value && <Check className="size-3" />}
                  </button>
                ))}
              </div>
            </Field>

            {/* Status + Deadline row */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Field label="Status">
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value as TaskStatus)}
                  className="input-base"
                >
                  {STATUSES.map((s) => (
                    <option key={s.value} value={s.value}>{s.label}</option>
                  ))}
                </select>
              </Field>
              <Field label="Deadline">
                <input
                  type="date"
                  value={deadline}
                  onChange={(e) => setDeadline(e.target.value)}
                  className="input-base"
                />
              </Field>
            </div>

            {/* Assignees */}
            <Field label="Team Members">
              {/* Selected chips */}
              {assignedEmployees.length > 0 && (
                <div className="mb-2 flex flex-wrap gap-1.5">
                  {assignedEmployees.map((e) => (
                    <span
                      key={e.id}
                      className="inline-flex items-center gap-1.5 rounded-full border border-border bg-surface-2/60 pl-1 pr-2 py-1 text-xs font-medium"
                    >
                      <Avatar name={e.full_name} size="sm" />
                      {e.full_name.split(' ')[0]}
                      {e.id !== employee.id && (
                        <button
                          type="button"
                          onClick={() => toggleAssignee(e.id)}
                          className="ml-0.5 grid size-4 place-items-center rounded-full text-ink-soft hover:bg-surface-2 hover:text-coral"
                        >
                          <X className="size-2.5" />
                        </button>
                      )}
                    </span>
                  ))}
                </div>
              )}

              {/* Toggle picker */}
              <button
                type="button"
                onClick={() => setShowPicker((o) => !o)}
                className="inline-flex items-center gap-1.5 rounded-lg border border-dashed border-border px-3 py-2 text-xs font-medium text-ink-soft hover:border-brand/40 hover:text-brand"
              >
                <UserPlus className="size-3.5" />
                {showPicker ? 'Hide' : 'Add'} team members
              </button>

              {/* Employee picker */}
              {showPicker && (
                <div className="mt-2 overflow-hidden rounded-xl border border-border bg-surface-2/40">
                  <div className="flex items-center gap-2 border-b border-border px-3 py-2">
                    <Search className="size-3.5 shrink-0 text-ink-soft" />
                    <input
                      type="text"
                      placeholder="Search employees…"
                      value={empSearch}
                      onChange={(e) => setEmpSearch(e.target.value)}
                      className="flex-1 bg-transparent text-sm outline-none placeholder:text-ink-soft"
                    />
                  </div>
                  <ul className="max-h-48 overflow-y-auto">
                    {empLoading && (
                      <li className="flex justify-center py-4">
                        <Loader2 className="size-4 animate-spin text-ink-soft" />
                      </li>
                    )}
                    {!empLoading && filteredEmployees.map((e) => {
                      const selected = assigneeIds.includes(e.id)
                      const isMe = e.id === employee.id
                      return (
                        <li key={e.id}>
                          <button
                            type="button"
                            onClick={() => !isMe && toggleAssignee(e.id)}
                            disabled={isMe}
                            className={cn(
                              'flex w-full items-center gap-2.5 px-3 py-2.5 text-left text-sm hover:bg-surface-2/60',
                              selected && 'bg-brand/5',
                              isMe && 'cursor-default'
                            )}
                          >
                            <Avatar name={e.full_name} size="sm" />
                            <div className="min-w-0 flex-1">
                              <p className="text-xs font-medium leading-tight">{e.full_name}</p>
                              {e.role?.name && (
                                <p className="text-[10px] text-ink-soft">{e.role.name}</p>
                              )}
                            </div>
                            {selected && <Check className="size-3.5 shrink-0 text-brand" />}
                            {isMe && <span className="text-[10px] text-ink-soft">You</span>}
                          </button>
                        </li>
                      )
                    })}
                    {!empLoading && filteredEmployees.length === 0 && (
                      <li className="py-4 text-center text-xs text-ink-soft">No employees found</li>
                    )}
                  </ul>
                </div>
              )}
            </Field>

            {/* Error */}
            {error && (
              <div className="rounded-xl border border-coral/20 bg-coral/5 px-4 py-3 text-sm text-coral">
                {error}
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="border-t border-border px-4 pb-4 pt-3 sm:px-6 sm:pb-6">
            <div className="flex gap-3">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 rounded-xl border border-border py-2.5 text-sm font-medium text-ink-muted hover:bg-surface-2"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={saving || !title.trim()}
                className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-brand py-2.5 text-sm font-medium text-brand-foreground shadow-sm hover:opacity-90 disabled:opacity-50"
              >
                {saving && <Loader2 className="size-4 animate-spin" />}
                {isEdit ? 'Save Changes' : 'Create Task'}
              </button>
            </div>
          </div>
        </form>
      </aside>

      <style jsx>{`
        .input-base {
          display: block;
          width: 100%;
          height: 2.5rem;
          border-radius: 0.75rem;
          border: 1px solid hsl(var(--border));
          background: hsl(var(--surface-2) / 0.5);
          padding: 0 0.75rem;
          font-size: 0.875rem;
          outline: none;
          color: hsl(var(--ink));
        }
        .input-base:focus {
          border-color: hsl(var(--brand) / 0.5);
          box-shadow: 0 0 0 3px hsl(var(--brand) / 0.12);
        }
        textarea.input-base { height: auto; padding-top: 0.5rem; padding-bottom: 0.5rem; }
      `}</style>
    </>
  )
}

// ── Field wrapper ─────────────────────────────────────────────────────────────

function Field({ label, required, children }: { label: string; required?: boolean; children: React.ReactNode }) {
  return (
    <div>
      <label className="mb-1.5 block text-xs font-semibold text-ink-muted">
        {label}{required && <span className="ml-0.5 text-coral">*</span>}
      </label>
      {children}
    </div>
  )
}
