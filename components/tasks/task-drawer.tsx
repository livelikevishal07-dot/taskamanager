'use client'

import * as React from 'react'
import { Check, Repeat2, Save, Search, Trash2, X } from 'lucide-react'

import { Drawer } from '@/components/ui/drawer'
import { Avatar } from '@/components/ui/avatar'
import { cn } from '@/lib/utils'
import type { Company, Employee } from '@/lib/db/types'
import type { TaskWithDetails } from '@/lib/db/tasks'
import type { TaskTemplate } from '@/lib/db/task-templates'

// ── types ──────────────────────────────────────────────────────────────────

interface Draft {
  title: string
  description: string
  priority: string
  status: string
  deadline: string
  company_id: string
  employee_ids: string[]
}

interface TemplateFill {
  title: string
  description: string
  priority: string
  company_id: string
  employee_ids: string[]
}

interface Props {
  task?: TaskWithDetails | null
  companies: Company[]
  employees: Employee[]
  open: boolean
  onClose: () => void
  onSaved: (task: TaskWithDetails) => void
  onDeleted?: (id: string) => void
  defaultStatus?: string
  /** Pre-fill all fields from a routine template (only used when task is null) */
  templateFill?: TemplateFill | null
  /** List of routine templates to show in the in-form selector */
  templates?: TaskTemplate[]
}

// ── helpers ────────────────────────────────────────────────────────────────

async function request<T = unknown>(url: string, init?: RequestInit): Promise<T> {
  const res = await fetch(url, {
    ...init,
    headers: { 'Content-Type': 'application/json', ...(init?.headers ?? {}) },
  })
  const data = await res.json().catch(() => null)
  if (!res.ok) throw new Error(data?.error ?? 'Request failed')
  return data as T
}

function isoDateLocal(value: string) {
  if (!value) return ''
  return new Date(value).toISOString().slice(0, 16)
}

const PRIORITY_CONFIG = {
  low:    { label: 'Low',    dot: 'bg-ink-soft',  chip: 'border-ink-soft/30 bg-ink-soft/10 text-ink-muted' },
  medium: { label: 'Medium', dot: 'bg-sky',        chip: 'border-sky/30 bg-sky/10 text-sky' },
  high:   { label: 'High',   dot: 'bg-amber',      chip: 'border-amber/30 bg-amber/10 text-amber' },
  urgent: { label: 'Urgent', dot: 'bg-coral',      chip: 'border-coral/30 bg-coral/10 text-coral' },
}

const STATUS_CONFIG = {
  todo:        { label: 'To do',       dot: 'bg-ink-soft' },
  in_progress: { label: 'In progress', dot: 'bg-indigo'   },
  review:      { label: 'In review',   dot: 'bg-amber'    },
  done:        { label: 'Done',        dot: 'bg-emerald'  },
  blocked:     { label: 'Blocked',     dot: 'bg-coral'    },
}

const COLOR_DOT: Record<string, string> = {
  violet: 'bg-violet', sky: 'bg-sky', indigo: 'bg-indigo',
  coral: 'bg-coral', emerald: 'bg-emerald', amber: 'bg-amber',
}

// ── component ──────────────────────────────────────────────────────────────

export function TaskDrawer({
  task,
  companies,
  employees,
  open,
  onClose,
  onSaved,
  onDeleted,
  defaultStatus,
  templateFill,
  templates,
}: Props) {
  const isEdit = !!task

  function buildDraft(): Draft {
    if (task) {
      return {
        title: task.title,
        description: task.description ?? '',
        priority: task.priority,
        status: task.status,
        deadline: task.deadline ? isoDateLocal(task.deadline) : '',
        company_id: task.company_id ?? '',
        employee_ids: task.assignments?.map((a) => a.employee_id) ?? [],
      }
    }
    if (templateFill) {
      return {
        title: templateFill.title,
        description: templateFill.description,
        priority: templateFill.priority,
        status: defaultStatus ?? 'todo',
        deadline: '',
        company_id: templateFill.company_id,
        employee_ids: templateFill.employee_ids,
      }
    }
    return {
      title: '',
      description: '',
      priority: 'medium',
      status: defaultStatus ?? 'todo',
      deadline: '',
      company_id: '',
      employee_ids: [],
    }
  }

  const [draft, setDraft] = React.useState<Draft>(buildDraft)
  const [saving, setSaving] = React.useState(false)
  const [deleting, setDeleting] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)
  const [empSearch, setEmpSearch] = React.useState('')
  const [selectedTemplateId, setSelectedTemplateId] = React.useState('')

  React.useEffect(() => {
    if (open) {
      setDraft(buildDraft())
      setError(null)
      setEmpSearch('')
      setSelectedTemplateId('')
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, task, defaultStatus, templateFill])

  function applyTemplate(templateId: string) {
    setSelectedTemplateId(templateId)
    if (!templateId) return
    const tpl = templates?.find((t) => t.id === templateId)
    if (!tpl) return
    setDraft((prev) => ({
      ...prev,
      title: tpl.title,
      description: tpl.description ?? '',
      priority: tpl.priority,
      company_id: tpl.company_id ?? '',
      employee_ids: tpl.employee_assignments.map((a) => a.employee_id),
    }))
  }

  function set<K extends keyof Draft>(key: K, value: Draft[K]) {
    setDraft((prev) => ({ ...prev, [key]: value }))
  }

  function toggleEmployee(id: string) {
    setDraft((prev) => ({
      ...prev,
      employee_ids: prev.employee_ids.includes(id)
        ? prev.employee_ids.filter((e) => e !== id)
        : [...prev.employee_ids, id],
    }))
  }

  const filteredEmployees = React.useMemo(() => {
    const q = empSearch.trim().toLowerCase()
    if (!q) return employees
    return employees.filter((e) =>
      e.full_name.toLowerCase().includes(q) ||
      (e.role?.name ?? '').toLowerCase().includes(q) ||
      (e.department?.name ?? '').toLowerCase().includes(q)
    )
  }, [employees, empSearch])

  const selectedEmployees = employees.filter((e) =>
    draft.employee_ids.includes(e.id)
  )

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!draft.title.trim()) return
    setSaving(true)
    setError(null)
    try {
      const payload = {
        title: draft.title.trim(),
        description: draft.description.trim() || null,
        priority: draft.priority,
        status: draft.status,
        deadline: draft.deadline ? new Date(draft.deadline).toISOString() : null,
        company_id: draft.company_id || null,
        employee_ids: draft.employee_ids,
      }

      const saved = isEdit
        ? await request<TaskWithDetails>(`/api/tasks/${task!.id}`, {
            method: 'PATCH',
            body: JSON.stringify(payload),
          })
        : await request<TaskWithDetails>('/api/tasks', {
            method: 'POST',
            body: JSON.stringify(payload),
          })

      onSaved(saved)
      if (!isEdit) setDraft({ title: '', description: '', priority: 'medium', status: defaultStatus ?? 'todo', deadline: '', company_id: '', employee_ids: [] })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong')
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete() {
    if (!task) return
    if (!window.confirm(`Delete "${task.title}"? This cannot be undone.`)) return
    setDeleting(true)
    setError(null)
    try {
      await request(`/api/tasks/${task.id}`, { method: 'DELETE' })
      onDeleted?.(task.id)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong')
    } finally {
      setDeleting(false)
    }
  }

  const footer = (
    <div className="flex w-full items-center justify-between">
      {isEdit ? (
        <button
          type="button"
          onClick={handleDelete}
          disabled={deleting}
          className="inline-flex h-10 items-center gap-1.5 rounded-xl border border-coral/30 px-4 text-sm font-medium text-coral hover:bg-coral/10 disabled:opacity-60"
        >
          <Trash2 className="size-4" />
          {deleting ? 'Deleting…' : 'Delete task'}
        </button>
      ) : <div />}
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={onClose}
          className="inline-flex h-10 items-center rounded-xl border border-border px-4 text-sm font-medium text-ink-muted hover:bg-surface-2"
        >
          Cancel
        </button>
        <button
          type="submit"
          form="task-form"
          disabled={saving || !draft.title.trim()}
          className="inline-flex h-10 items-center gap-1.5 rounded-xl bg-brand px-4 text-sm font-medium text-brand-foreground shadow-sm hover:opacity-90 disabled:opacity-60"
        >
          <Save className="size-4" />
          {saving ? 'Saving…' : isEdit ? 'Save changes' : 'Create task'}
        </button>
      </div>
    </div>
  )

  return (
    <Drawer
      open={open}
      onClose={onClose}
      title={isEdit ? 'Edit task' : 'New task'}
      description={isEdit ? 'Update task details and assignees.' : 'Fill in the details and assign to team members.'}
      size="lg"
      footer={footer}
    >
      <form id="task-form" onSubmit={handleSubmit} className="space-y-6">

        {error && (
          <div className="rounded-xl border border-coral/30 bg-coral/10 px-4 py-3 text-sm text-coral">
            {error}
          </div>
        )}

        {/* ── Routine template selector (create mode only) ── */}
        {!isEdit && templates && templates.length > 0 && (
          <div className="rounded-xl border border-brand/20 bg-brand/5 p-3.5 space-y-2.5">
            <div className="flex items-center gap-2">
              <Repeat2 className="size-3.5 text-brand" />
              <span className="text-xs font-semibold text-brand">Use routine template</span>
              <span className="ml-auto text-[10px] text-ink-soft">optional</span>
            </div>

            <div className="flex items-center gap-2">
              <select
                value={selectedTemplateId}
                onChange={(e) => applyTemplate(e.target.value)}
                className="h-9 flex-1 rounded-xl border border-border bg-surface px-3 text-sm focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/20"
              >
                <option value="">Select a template…</option>
                {templates.map((t) => (
                  <option key={t.id} value={t.id}>{t.title}</option>
                ))}
              </select>
              {selectedTemplateId && (
                <button
                  type="button"
                  onClick={() => setSelectedTemplateId('')}
                  className="grid size-8 shrink-0 place-items-center rounded-lg border border-border bg-surface text-ink-soft hover:text-coral hover:border-coral/30 hover:bg-coral/10 transition-colors"
                  aria-label="Clear template"
                >
                  <X className="size-3.5" />
                </button>
              )}
            </div>

            {selectedTemplateId && (() => {
              const tpl = templates.find((t) => t.id === selectedTemplateId)
              return tpl?.description ? (
                <p className="text-xs text-ink-muted leading-relaxed px-0.5">
                  {tpl.description}
                </p>
              ) : null
            })()}
          </div>
        )}

        {/* ── Title ── */}
        <Field label="Task title" required>
          <input
            type="text"
            value={draft.title}
            onChange={(e) => set('title', e.target.value)}
            placeholder="e.g. Vendor coordination — Bansal event"
            required
            autoFocus
            className="h-10 w-full rounded-xl border border-border bg-surface px-3 text-sm focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/20"
          />
        </Field>

        {/* ── Description ── */}
        <Field label="Description">
          <textarea
            value={draft.description}
            onChange={(e) => set('description', e.target.value)}
            rows={3}
            placeholder="Details, context, acceptance criteria…"
            className="w-full resize-none rounded-xl border border-border bg-surface px-3 py-2.5 text-sm focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/20"
          />
        </Field>

        {/* ── Priority + Status ── */}
        <div className="grid grid-cols-2 gap-4">
          <Field label="Priority">
            <div className="flex flex-wrap gap-2">
              {(Object.entries(PRIORITY_CONFIG) as [string, typeof PRIORITY_CONFIG[keyof typeof PRIORITY_CONFIG]][]).map(([key, cfg]) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => set('priority', key)}
                  className={cn(
                    'inline-flex h-8 items-center gap-1.5 rounded-lg border px-3 text-xs font-semibold transition-colors',
                    draft.priority === key ? cfg.chip : 'border-border bg-surface text-ink-muted hover:bg-surface-2'
                  )}
                >
                  <span className={cn('size-1.5 rounded-full', cfg.dot)} />
                  {cfg.label}
                </button>
              ))}
            </div>
          </Field>

          <Field label="Status">
            <div className="flex flex-wrap gap-2">
              {(Object.entries(STATUS_CONFIG) as [string, typeof STATUS_CONFIG[keyof typeof STATUS_CONFIG]][]).map(([key, cfg]) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => set('status', key)}
                  className={cn(
                    'inline-flex h-8 items-center gap-1.5 rounded-lg border px-3 text-xs font-semibold transition-colors',
                    draft.status === key
                      ? 'border-brand bg-brand/10 text-brand'
                      : 'border-border bg-surface text-ink-muted hover:bg-surface-2'
                  )}
                >
                  <span className={cn('size-1.5 rounded-full', cfg.dot)} />
                  {cfg.label}
                </button>
              ))}
            </div>
          </Field>
        </div>

        {/* ── Deadline + Company ── */}
        <div className="grid grid-cols-2 gap-4">
          <Field label="Deadline">
            <input
              type="datetime-local"
              value={draft.deadline}
              onChange={(e) => set('deadline', e.target.value)}
              className="h-10 w-full rounded-xl border border-border bg-surface px-3 text-sm focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/20"
            />
          </Field>
          <Field label="Company">
            <select
              value={draft.company_id}
              onChange={(e) => set('company_id', e.target.value)}
              className="h-10 w-full rounded-xl border border-border bg-surface px-3 text-sm focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/20"
            >
              <option value="">No company</option>
              {companies.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </Field>
        </div>

        {/* ── Assignees ── */}
        <Field label={`Assign employees${draft.employee_ids.length > 0 ? ` (${draft.employee_ids.length} selected)` : ''}`}>
          {/* Selected chips */}
          {selectedEmployees.length > 0 && (
            <div className="mb-3 flex flex-wrap gap-2">
              {selectedEmployees.map((emp) => (
                <span
                  key={emp.id}
                  className="inline-flex items-center gap-1.5 rounded-full border border-border bg-surface-2 py-1 pl-1 pr-2 text-xs font-medium"
                >
                  <Avatar name={emp.full_name} size="sm" className="size-5 text-[10px]" />
                  {emp.full_name}
                  <button
                    type="button"
                    onClick={() => toggleEmployee(emp.id)}
                    className="ml-0.5 text-ink-soft hover:text-coral"
                    aria-label={`Remove ${emp.full_name}`}
                  >
                    <X className="size-3" />
                  </button>
                </span>
              ))}
            </div>
          )}

          {/* Search */}
          <div className="relative mb-2">
            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-ink-soft" />
            <input
              type="text"
              value={empSearch}
              onChange={(e) => setEmpSearch(e.target.value)}
              placeholder="Search employees…"
              className="h-9 w-full rounded-xl border border-border bg-surface pl-9 pr-3 text-sm focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/20"
            />
          </div>

          {/* Employee list */}
          <div className="max-h-52 space-y-1 overflow-y-auto rounded-xl border border-border bg-surface p-1">
            {filteredEmployees.length === 0 && (
              <p className="px-3 py-4 text-center text-sm text-ink-muted">No employees found</p>
            )}
            {filteredEmployees.map((emp) => {
              const selected = draft.employee_ids.includes(emp.id)
              return (
                <button
                  key={emp.id}
                  type="button"
                  onClick={() => toggleEmployee(emp.id)}
                  className={cn(
                    'flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left transition-colors',
                    selected ? 'bg-brand/8 text-ink' : 'hover:bg-surface-2'
                  )}
                >
                  <Avatar name={emp.full_name} size="sm" className="size-7 shrink-0" />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">{emp.full_name}</p>
                    <p className="truncate text-xs text-ink-muted">
                      {[emp.role?.name, emp.department?.name].filter(Boolean).join(' · ')}
                    </p>
                  </div>
                  <span
                    className={cn(
                      'ml-auto grid size-5 shrink-0 place-items-center rounded-md border transition-colors',
                      selected
                        ? 'border-brand bg-brand text-white'
                        : 'border-border bg-surface'
                    )}
                  >
                    {selected && <Check className="size-3" strokeWidth={3} />}
                  </span>
                </button>
              )
            })}
          </div>
        </Field>

      </form>
    </Drawer>
  )
}

// ── Field helper ───────────────────────────────────────────────────────────

function Field({
  label,
  required,
  children,
}: {
  label: string
  required?: boolean
  children: React.ReactNode
}) {
  return (
    <div>
      <p className="mb-2 text-sm font-medium text-ink">
        {label}
        {required && <span className="ml-0.5 text-coral">*</span>}
      </p>
      {children}
    </div>
  )
}
