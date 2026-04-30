'use client'

import * as React from 'react'
import { Check, Save, Search, Trash2, X } from 'lucide-react'

import { Drawer } from '@/components/ui/drawer'
import { Avatar } from '@/components/ui/avatar'
import { cn } from '@/lib/utils'
import type { Company, Employee } from '@/lib/db/types'
import type { TaskTemplate } from '@/lib/db/task-templates'

// ── types ──────────────────────────────────────────────────────────────────

interface Draft {
  title: string
  description: string
  priority: string
  company_id: string
  employee_ids: string[]
}

interface Props {
  template?: TaskTemplate | null
  companies: Company[]
  employees: Employee[]
  open: boolean
  onClose: () => void
  onSaved: (template: TaskTemplate) => void
  onDeleted?: (id: string) => void
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

const PRIORITY_CONFIG = {
  low:    { label: 'Low',    dot: 'bg-ink-soft',  chip: 'border-ink-soft/30 bg-ink-soft/10 text-ink-muted' },
  medium: { label: 'Medium', dot: 'bg-sky',        chip: 'border-sky/30 bg-sky/10 text-sky' },
  high:   { label: 'High',   dot: 'bg-amber',      chip: 'border-amber/30 bg-amber/10 text-amber' },
  urgent: { label: 'Urgent', dot: 'bg-coral',      chip: 'border-coral/30 bg-coral/10 text-coral' },
}

// ── component ──────────────────────────────────────────────────────────────

export function TemplateDrawer({
  template,
  companies,
  employees,
  open,
  onClose,
  onSaved,
  onDeleted,
}: Props) {
  const isEdit = !!template

  function buildDraft(): Draft {
    return {
      title: template?.title ?? '',
      description: template?.description ?? '',
      priority: template?.priority ?? 'medium',
      company_id: template?.company_id ?? '',
      employee_ids: template?.employee_assignments?.map((a) => a.employee_id) ?? [],
    }
  }

  const [draft, setDraft] = React.useState<Draft>(buildDraft)
  const [saving, setSaving] = React.useState(false)
  const [deleting, setDeleting] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)
  const [empSearch, setEmpSearch] = React.useState('')

  React.useEffect(() => {
    if (open) {
      setDraft(buildDraft())
      setError(null)
      setEmpSearch('')
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, template])

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
    return employees.filter(
      (e) =>
        e.full_name.toLowerCase().includes(q) ||
        (e.role?.name ?? '').toLowerCase().includes(q) ||
        (e.department?.name ?? '').toLowerCase().includes(q)
    )
  }, [employees, empSearch])

  const selectedEmployees = employees.filter((e) => draft.employee_ids.includes(e.id))

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
        company_id: draft.company_id || null,
        employee_ids: draft.employee_ids,
      }

      const saved = isEdit
        ? await request<TaskTemplate>(`/api/task-templates/${template!.id}`, {
            method: 'PATCH',
            body: JSON.stringify(payload),
          })
        : await request<TaskTemplate>('/api/task-templates', {
            method: 'POST',
            body: JSON.stringify(payload),
          })

      onSaved(saved)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong')
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete() {
    if (!template) return
    if (!window.confirm(`Delete template "${template.title}"? This cannot be undone.`)) return
    setDeleting(true)
    setError(null)
    try {
      await request(`/api/task-templates/${template.id}`, { method: 'DELETE' })
      onDeleted?.(template.id)
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
          {deleting ? 'Deleting…' : 'Delete'}
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
          form="template-form"
          disabled={saving || !draft.title.trim()}
          className="inline-flex h-10 items-center gap-1.5 rounded-xl bg-brand px-4 text-sm font-medium text-brand-foreground shadow-sm hover:opacity-90 disabled:opacity-60"
        >
          <Save className="size-4" />
          {saving ? 'Saving…' : isEdit ? 'Save changes' : 'Create template'}
        </button>
      </div>
    </div>
  )

  return (
    <Drawer
      open={open}
      onClose={onClose}
      title={isEdit ? 'Edit template' : 'New routine template'}
      description={
        isEdit
          ? 'Update this routine task template.'
          : 'Define a reusable task recipe. You can run it anytime to instantly create a task.'
      }
      size="lg"
      footer={footer}
    >
      <form id="template-form" onSubmit={handleSubmit} className="space-y-6">

        {error && (
          <div className="rounded-xl border border-coral/30 bg-coral/10 px-4 py-3 text-sm text-coral">
            {error}
          </div>
        )}

        {/* ── Title ── */}
        <Field label="Template name" required>
          <input
            type="text"
            value={draft.title}
            onChange={(e) => set('title', e.target.value)}
            placeholder="e.g. Daily Instagram story"
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
            placeholder="What does this task involve? Any standard checklist or context…"
            className="w-full resize-none rounded-xl border border-border bg-surface px-3 py-2.5 text-sm focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/20"
          />
        </Field>

        {/* ── Priority ── */}
        <Field label="Default priority">
          <div className="flex flex-wrap gap-2">
            {(Object.entries(PRIORITY_CONFIG) as [string, typeof PRIORITY_CONFIG[keyof typeof PRIORITY_CONFIG]][]).map(
              ([key, cfg]) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => set('priority', key)}
                  className={cn(
                    'inline-flex h-8 items-center gap-1.5 rounded-lg border px-3 text-xs font-semibold transition-colors',
                    draft.priority === key
                      ? cfg.chip
                      : 'border-border bg-surface text-ink-muted hover:bg-surface-2'
                  )}
                >
                  <span className={cn('size-1.5 rounded-full', cfg.dot)} />
                  {cfg.label}
                </button>
              )
            )}
          </div>
        </Field>

        {/* ── Company ── */}
        <Field label="Default company">
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

        {/* ── Assignees ── */}
        <Field
          label={`Default assignees${draft.employee_ids.length > 0 ? ` (${draft.employee_ids.length} selected)` : ''}`}
        >
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
                      selected ? 'border-brand bg-brand text-white' : 'border-border bg-surface'
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
