'use client'

import * as React from 'react'
import { Building, Pencil, Plus, Trash2, X } from 'lucide-react'

import { COLOR_OPTIONS, COLOR_TONE, type AccentColor as DepartmentColor } from '@/lib/colors'
import type { Department } from '@/lib/db/types'
import { cn } from '@/lib/utils'

type Draft = {
  name: string
  description: string
  lead_name: string
  color: DepartmentColor
}

const emptyDraft: Draft = {
  name: '',
  description: '',
  lead_name: '',
  color: 'violet',
}

export function DepartmentsPanel() {
  const [items, setItems] = React.useState<Department[]>([])
  const [draft, setDraft] = React.useState<Draft>(emptyDraft)
  const [editing, setEditing] = React.useState<Department | null>(null)
  const [formOpen, setFormOpen] = React.useState(false)
  const [loading, setLoading] = React.useState(true)
  const [saving, setSaving] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)

  const load = React.useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      setItems(await request<Department[]>('/api/departments'))
    } catch (err) {
      setError(messageFrom(err))
    } finally {
      setLoading(false)
    }
  }, [])

  React.useEffect(() => {
    void load()
  }, [load])

  function openCreate() {
    setEditing(null)
    setDraft(emptyDraft)
    setFormOpen(true)
  }

  function openEdit(dept: Department) {
    setEditing(dept)
    setDraft({
      name: dept.name,
      description: dept.description ?? '',
      lead_name: dept.lead_name ?? '',
      color: colorOrDefault(dept.color),
    })
    setFormOpen(true)
  }

  async function save(e: React.FormEvent) {
    e.preventDefault()
    if (!draft.name.trim()) return
    setSaving(true)
    setError(null)
    try {
      const payload = {
        name: draft.name.trim(),
        description: draft.description.trim() || null,
        lead_name: draft.lead_name.trim() || null,
        color: draft.color,
      }
      const saved = editing
        ? await request<Department>(`/api/departments/${editing.id}`, {
            method: 'PATCH',
            body: JSON.stringify(payload),
          })
        : await request<Department>('/api/departments', {
            method: 'POST',
            body: JSON.stringify(payload),
          })

      setItems((prev) =>
        editing
          ? prev.map((item) => (item.id === saved.id ? saved : item))
          : [...prev, saved].sort((a, b) => a.name.localeCompare(b.name))
      )
      setFormOpen(false)
      setEditing(null)
      setDraft(emptyDraft)
    } catch (err) {
      setError(messageFrom(err))
    } finally {
      setSaving(false)
    }
  }

  async function remove(dept: Department) {
    if (!window.confirm(`Delete ${dept.name}? Employees in this department will be unassigned.`)) {
      return
    }
    setError(null)
    try {
      await request(`/api/departments/${dept.id}`, { method: 'DELETE' })
      setItems((prev) => prev.filter((item) => item.id !== dept.id))
      if (editing?.id === dept.id) {
        setEditing(null)
        setFormOpen(false)
      }
    } catch (err) {
      setError(messageFrom(err))
    }
  }

  return (
    <section className="rounded-2xl border border-border bg-surface p-6 shadow-card">
      <header className="mb-5 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold">Departments</h2>
          <p className="mt-1 text-sm text-ink-muted">
            Group employees by function for filtering, reporting, and profiles.
          </p>
        </div>
        <button
          type="button"
          onClick={() => (formOpen ? setFormOpen(false) : openCreate())}
          className="inline-flex h-10 items-center gap-1.5 rounded-xl bg-brand px-4 text-sm font-medium text-brand-foreground shadow-sm hover:opacity-90"
        >
          {formOpen ? <X className="size-4" /> : <Plus className="size-4" />}
          {formOpen ? 'Cancel' : 'Add department'}
        </button>
      </header>

      {error && <Notice tone="danger">{error}</Notice>}

      {formOpen && (
        <form
          onSubmit={save}
          className="mb-5 rounded-xl border border-border bg-surface-2/50 p-5"
        >
          <div className="mb-4 flex items-center gap-2">
            <Building className="size-4 text-ink-soft" />
            <h3 className="text-sm font-semibold">
              {editing ? 'Edit department' : 'New department'}
            </h3>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Name *">
              <Input
                value={draft.name}
                onChange={(e) => setDraft((d) => ({ ...d, name: e.target.value }))}
                placeholder="e.g. Customer Success"
              />
            </Field>
            <Field label="Lead">
              <Input
                value={draft.lead_name}
                onChange={(e) =>
                  setDraft((d) => ({ ...d, lead_name: e.target.value }))
                }
                placeholder="e.g. Ralph Edwards"
              />
            </Field>
            <Field label="Description" className="sm:col-span-2">
              <textarea
                value={draft.description}
                onChange={(e) =>
                  setDraft((d) => ({ ...d, description: e.target.value }))
                }
                rows={2}
                placeholder="What does this department do?"
                className="w-full rounded-lg border border-border bg-surface p-3 text-sm focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/20"
              />
            </Field>
            <ColorField
              value={draft.color}
              onChange={(color) => setDraft((d) => ({ ...d, color }))}
            />
          </div>

          <div className="mt-5 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={() => setFormOpen(false)}
              className="inline-flex h-10 items-center rounded-xl border border-border bg-surface px-4 text-sm font-medium text-ink-muted hover:bg-surface-2"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="inline-flex h-10 items-center gap-1.5 rounded-xl bg-brand px-4 text-sm font-medium text-brand-foreground shadow-sm hover:opacity-90 disabled:opacity-60"
            >
              <Plus className="size-4" />
              {saving ? 'Saving...' : editing ? 'Save department' : 'Add department'}
            </button>
          </div>
        </form>
      )}

      {loading ? (
        <Notice>Loading departments...</Notice>
      ) : items.length === 0 ? (
        <Notice>No departments yet.</Notice>
      ) : (
        <ul className="space-y-3">
          {items.map((dept) => (
            <DepartmentRow
              key={dept.id}
              dept={dept}
              onEdit={() => openEdit(dept)}
              onDelete={() => void remove(dept)}
            />
          ))}
        </ul>
      )}
    </section>
  )
}

function DepartmentRow({
  dept,
  onEdit,
  onDelete,
}: {
  dept: Department
  onEdit: () => void
  onDelete: () => void
}) {
  const tone = COLOR_TONE[colorOrDefault(dept.color)]
  return (
    <li className="group flex items-center gap-4 rounded-xl border border-border bg-surface-2/40 p-4">
      <span
        className={cn(
          'grid size-12 shrink-0 place-items-center rounded-xl font-bold text-white',
          tone.bg
        )}
      >
        {dept.name[0]?.toUpperCase()}
      </span>

      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <h3 className="font-semibold">{dept.name}</h3>
          {dept.lead_name && (
            <span
              className={cn(
                'inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide',
                tone.chip
              )}
            >
              Lead: {dept.lead_name}
            </span>
          )}
        </div>
        <p className="mt-0.5 text-sm text-ink-muted">
          {dept.description || 'No description'}
        </p>
        <p className="mt-1 text-xs text-ink-soft">
          Added {formatDate(dept.created_at)}
        </p>
      </div>

      <div className="flex items-center gap-1 opacity-0 transition-opacity group-hover:opacity-100">
        <IconBtn label="Edit" onClick={onEdit}>
          <Pencil className="size-4" />
        </IconBtn>
        <IconBtn label="Delete" tone="danger" onClick={onDelete}>
          <Trash2 className="size-4" />
        </IconBtn>
      </div>
    </li>
  )
}

function ColorField({
  value,
  onChange,
}: {
  value: DepartmentColor
  onChange: (value: DepartmentColor) => void
}) {
  return (
    <Field label="Color" className="sm:col-span-2">
      <div className="flex flex-wrap gap-2">
        {COLOR_OPTIONS.map((color) => {
          const tone = COLOR_TONE[color]
          return (
            <button
              key={color}
              type="button"
              onClick={() => onChange(color)}
              aria-label={color}
              className={cn(
                'size-9 rounded-lg ring-2 transition',
                tone.bg,
                value === color ? 'ring-ink' : 'ring-transparent hover:ring-border'
              )}
            />
          )
        })}
      </div>
    </Field>
  )
}

function Field({
  label,
  children,
  className,
}: {
  label: string
  children: React.ReactNode
  className?: string
}) {
  return (
    <label className={cn('block', className)}>
      <span className="mb-1 block text-xs font-medium text-ink-muted">{label}</span>
      {children}
    </label>
  )
}

function Input(props: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      {...props}
      className="h-10 w-full rounded-lg border border-border bg-surface px-3 text-sm focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/20"
    />
  )
}

function IconBtn({
  children,
  label,
  tone,
  onClick,
}: {
  children: React.ReactNode
  label: string
  tone?: 'danger'
  onClick: () => void
}) {
  return (
    <button
      type="button"
      aria-label={label}
      onClick={onClick}
      className={cn(
        'grid size-8 place-items-center rounded-lg text-ink-muted hover:bg-surface hover:text-ink',
        tone === 'danger' && 'hover:bg-coral/10 hover:text-coral'
      )}
    >
      {children}
    </button>
  )
}

function Notice({
  children,
  tone,
}: {
  children: React.ReactNode
  tone?: 'danger'
}) {
  return (
    <div
      className={cn(
        'mb-4 rounded-xl border border-border bg-surface-2/60 px-4 py-3 text-sm text-ink-muted',
        tone === 'danger' && 'border-coral/30 bg-coral/10 text-coral'
      )}
    >
      {children}
    </div>
  )
}

async function request<T = unknown>(url: string, init?: RequestInit): Promise<T> {
  const res = await fetch(url, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      ...(init?.headers ?? {}),
    },
  })
  const data = await res.json().catch(() => null)
  if (!res.ok) throw new Error(data?.error ?? 'Request failed')
  return data as T
}

function messageFrom(err: unknown) {
  return err instanceof Error ? err.message : 'Something went wrong'
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat(undefined, {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(new Date(value))
}

function colorOrDefault(value: string): DepartmentColor {
  return COLOR_OPTIONS.includes(value as DepartmentColor)
    ? (value as DepartmentColor)
    : 'violet'
}
