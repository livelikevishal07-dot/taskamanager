'use client'

import * as React from 'react'
import { X, Trash2, Search } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { RecurringTaskBase as RecurringTask } from '@/lib/recurring-tasks-shared'
import type { Company, Employee } from '@/lib/db/types'

const PRIORITIES = ['low', 'medium', 'high', 'urgent'] as const
type Priority = (typeof PRIORITIES)[number]

const PRIORITY_STYLE: Record<Priority, string> = {
  low:    'border-border text-ink-muted data-[active=true]:border-ink-soft data-[active=true]:bg-ink-soft/10 data-[active=true]:text-ink',
  medium: 'border-border text-ink-muted data-[active=true]:border-brand/50 data-[active=true]:bg-brand/10 data-[active=true]:text-brand',
  high:   'border-border text-ink-muted data-[active=true]:border-amber/50 data-[active=true]:bg-amber/10 data-[active=true]:text-amber',
  urgent: 'border-border text-ink-muted data-[active=true]:border-coral/50 data-[active=true]:bg-coral/10 data-[active=true]:text-coral',
}

const WEEKDAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']

interface Draft {
  title: string
  description: string
  priority: Priority
  recurrence: 'daily' | 'weekdays' | 'weekly'
  active_weekday: number
  company_id: string
  employee_ids: string[]
}

function blankDraft(): Draft {
  return {
    title: '',
    description: '',
    priority: 'medium',
    recurrence: 'daily',
    active_weekday: 1, // Monday
    company_id: '',
    employee_ids: [],
  }
}

function taskToDraft(task: RecurringTask): Draft {
  return {
    title: task.title,
    description: task.description ?? '',
    priority: task.priority,
    recurrence: task.recurrence,
    active_weekday: task.active_weekday ?? 1,
    company_id: task.company_id ?? '',
    employee_ids: task.assignments.map((a) => a.employee_id),
  }
}

interface Props {
  open: boolean
  onClose: () => void
  task: RecurringTask | null
  companies: Company[]
  employees: Employee[]
  onSaved: (task: RecurringTask) => void
  onDeleted: (id: string) => void
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return <p className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-ink-soft">{children}</p>
}

export function RecurringTaskDrawer({ open, onClose, task, companies, employees, onSaved, onDeleted }: Props) {
  const isEdit = task !== null
  const [draft, setDraft] = React.useState<Draft>(blankDraft)
  const [saving, setSaving] = React.useState(false)
  const [deleting, setDeleting] = React.useState(false)
  const [error, setError] = React.useState('')
  const [empSearch, setEmpSearch] = React.useState('')

  React.useEffect(() => {
    if (open) {
      setDraft(task ? taskToDraft(task) : blankDraft())
      setError('')
      setEmpSearch('')
    }
  }, [open, task])

  function set<K extends keyof Draft>(key: K, val: Draft[K]) {
    setDraft((d) => ({ ...d, [key]: val }))
  }

  function toggleEmployee(id: string) {
    setDraft((d) => ({
      ...d,
      employee_ids: d.employee_ids.includes(id)
        ? d.employee_ids.filter((e) => e !== id)
        : [...d.employee_ids, id],
    }))
  }

  const filteredEmployees = employees.filter((e) => {
    const q = empSearch.toLowerCase()
    return (
      e.full_name.toLowerCase().includes(q) ||
      (typeof e.role === 'string' ? e.role : (e.role as { name?: string })?.name ?? '').toLowerCase().includes(q) ||
      (typeof e.department === 'string' ? e.department : (e.department as { name?: string })?.name ?? '').toLowerCase().includes(q)
    )
  })

  async function handleSave() {
    if (!draft.title.trim()) { setError('Title is required'); return }
    setSaving(true); setError('')
    try {
      const payload = {
        title: draft.title.trim(),
        description: draft.description.trim() || null,
        priority: draft.priority,
        recurrence: draft.recurrence,
        active_weekday: draft.recurrence === 'weekly' ? draft.active_weekday : null,
        company_id: draft.company_id || null,
        employee_ids: draft.employee_ids,
      }
      const url  = isEdit ? `/api/recurring-tasks/${task!.id}` : '/api/recurring-tasks'
      const method = isEdit ? 'PATCH' : 'POST'
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      if (!res.ok) { setError(await res.text()); return }
      onSaved(await res.json())
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Something went wrong')
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete() {
    if (!task || !confirm('Delete this recurring task permanently?')) return
    setDeleting(true)
    try {
      await fetch(`/api/recurring-tasks/${task.id}`, { method: 'DELETE' })
      onDeleted(task.id)
    } finally {
      setDeleting(false)
    }
  }

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <aside className="relative ml-auto flex h-full w-full max-w-md flex-col bg-surface shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-border px-6 py-4">
          <h2 className="text-base font-semibold">{isEdit ? 'Edit recurring task' : 'New recurring task'}</h2>
          <button type="button" onClick={onClose} className="grid size-8 place-items-center rounded-lg hover:bg-surface-2">
            <X className="size-4" />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-6">

          {/* Title */}
          <div>
            <SectionTitle>Title</SectionTitle>
            <input
              type="text"
              placeholder="e.g. Social media post"
              value={draft.title}
              onChange={(e) => set('title', e.target.value)}
              className="h-10 w-full rounded-xl border border-border bg-surface-2/40 px-3 text-sm outline-none placeholder:text-ink-soft focus:border-brand/50 focus:ring-1 focus:ring-brand/20"
            />
          </div>

          {/* Description */}
          <div>
            <SectionTitle>Description</SectionTitle>
            <textarea
              rows={3}
              placeholder="Optional details…"
              value={draft.description}
              onChange={(e) => set('description', e.target.value)}
              className="w-full resize-none rounded-xl border border-border bg-surface-2/40 px-3 py-2.5 text-sm outline-none placeholder:text-ink-soft focus:border-brand/50 focus:ring-1 focus:ring-brand/20"
            />
          </div>

          {/* Priority */}
          <div>
            <SectionTitle>Priority</SectionTitle>
            <div className="flex gap-2">
              {PRIORITIES.map((p) => (
                <button
                  key={p}
                  type="button"
                  data-active={draft.priority === p}
                  onClick={() => set('priority', p)}
                  className={cn('flex-1 rounded-lg border py-1.5 text-xs font-semibold capitalize transition-all', PRIORITY_STYLE[p])}
                >
                  {p}
                </button>
              ))}
            </div>
          </div>

          {/* Recurrence */}
          <div>
            <SectionTitle>Repeats</SectionTitle>
            <div className="flex gap-2">
              {(['daily', 'weekdays', 'weekly'] as const).map((r) => (
                <button
                  key={r}
                  type="button"
                  onClick={() => set('recurrence', r)}
                  className={cn(
                    'flex-1 rounded-lg border py-1.5 text-xs font-semibold transition-all',
                    draft.recurrence === r
                      ? 'border-brand/50 bg-brand/10 text-brand'
                      : 'border-border text-ink-muted hover:border-brand/30'
                  )}
                >
                  {r === 'daily' ? 'Daily' : r === 'weekdays' ? 'Weekdays' : 'Weekly'}
                </button>
              ))}
            </div>

            {draft.recurrence === 'weekly' && (
              <div className="mt-3">
                <p className="mb-1.5 text-xs text-ink-soft">On which day?</p>
                <div className="flex flex-wrap gap-1.5">
                  {WEEKDAYS.map((day, idx) => (
                    <button
                      key={day}
                      type="button"
                      onClick={() => set('active_weekday', idx)}
                      className={cn(
                        'rounded-lg border px-2.5 py-1 text-xs font-medium transition-all',
                        draft.active_weekday === idx
                          ? 'border-brand/50 bg-brand/10 text-brand'
                          : 'border-border text-ink-muted hover:border-brand/30'
                      )}
                    >
                      {day.slice(0, 3)}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Company */}
          {companies.length > 0 && (
            <div>
              <SectionTitle>Company</SectionTitle>
              <select
                value={draft.company_id}
                onChange={(e) => set('company_id', e.target.value)}
                className="h-10 w-full rounded-xl border border-border bg-surface-2/40 px-3 text-sm outline-none focus:border-brand/50 focus:ring-1 focus:ring-brand/20"
              >
                <option value="">No company</option>
                {companies.map((c) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>
          )}

          {/* Assignees */}
          <div>
            <SectionTitle>Assign to employees</SectionTitle>

            {/* Selected chips */}
            {draft.employee_ids.length > 0 && (
              <div className="mb-2 flex flex-wrap gap-1.5">
                {draft.employee_ids.map((eid) => {
                  const emp = employees.find((e) => e.id === eid)
                  if (!emp) return null
                  return (
                    <span key={eid} className="inline-flex items-center gap-1 rounded-full bg-brand/10 px-2 py-0.5 text-xs font-medium text-brand">
                      {emp.full_name}
                      <button type="button" onClick={() => toggleEmployee(eid)} className="ml-0.5">
                        <X className="size-3" />
                      </button>
                    </span>
                  )
                })}
              </div>
            )}

            {/* Search */}
            <div className="relative mb-2">
              <Search className="absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-ink-soft" />
              <input
                type="text"
                placeholder="Search employees…"
                value={empSearch}
                onChange={(e) => setEmpSearch(e.target.value)}
                className="h-8 w-full rounded-lg border border-border bg-surface-2/40 pl-7 pr-3 text-xs outline-none placeholder:text-ink-soft focus:border-brand/50"
              />
            </div>

            <ul className="max-h-48 space-y-0.5 overflow-y-auto rounded-xl border border-border">
              {filteredEmployees.map((emp) => {
                const selected = draft.employee_ids.includes(emp.id)
                const roleName = typeof emp.role === 'string' ? emp.role : (emp.role as { name?: string })?.name ?? ''
                const deptName = typeof emp.department === 'string' ? emp.department : (emp.department as { name?: string })?.name ?? ''
                return (
                  <li key={emp.id}>
                    <label className={cn(
                      'flex cursor-pointer items-center gap-3 px-3 py-2 text-sm transition-colors',
                      selected ? 'bg-brand/5' : 'hover:bg-surface-2'
                    )}>
                      <input
                        type="checkbox"
                        checked={selected}
                        onChange={() => toggleEmployee(emp.id)}
                        className="accent-brand"
                      />
                      <span className="flex-1 min-w-0">
                        <span className="block truncate font-medium">{emp.full_name}</span>
                        <span className="block truncate text-[11px] text-ink-soft">
                          {roleName || deptName || 'Employee'}
                        </span>
                      </span>
                    </label>
                  </li>
                )
              })}
              {filteredEmployees.length === 0 && (
                <li className="px-3 py-4 text-center text-xs text-ink-soft">No employees found</li>
              )}
            </ul>
          </div>
        </div>

        {/* Footer */}
        <div className="border-t border-border px-6 py-4 flex items-center gap-3">
          {isEdit && (
            <button
              type="button"
              onClick={handleDelete}
              disabled={deleting}
              className="mr-auto inline-flex items-center gap-1.5 rounded-lg border border-coral/30 px-3 py-2 text-sm font-medium text-coral hover:bg-coral/10 disabled:opacity-50"
            >
              <Trash2 className="size-3.5" />
              {deleting ? 'Deleting…' : 'Delete'}
            </button>
          )}
          {error && <p className="flex-1 text-xs text-coral">{error}</p>}
          <button type="button" onClick={onClose} className="rounded-lg border border-border px-4 py-2 text-sm font-medium text-ink-muted hover:bg-surface-2">
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={saving}
            className="rounded-lg bg-brand px-4 py-2 text-sm font-medium text-brand-foreground shadow-sm hover:opacity-90 disabled:opacity-50"
          >
            {saving ? 'Saving…' : isEdit ? 'Save changes' : 'Create'}
          </button>
        </div>
      </aside>
    </div>
  )
}
