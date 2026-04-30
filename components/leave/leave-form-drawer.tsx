'use client'

import * as React from 'react'
import { Loader2, Save, Trash2 } from 'lucide-react'

import { Drawer } from '@/components/ui/drawer'
import { cn } from '@/lib/utils'
import type { LeaveRequestWithEmployee, LeaveType, LeaveStatus } from '@/lib/db/leave-requests'
import type { Employee } from '@/lib/db/types'
import { LEAVE_TYPE_META } from './leave-detail-drawer'

// ── Helpers ────────────────────────────────────────────────────────────────

function isoToday() {
  return new Date().toISOString().slice(0, 10)
}

function countWorkingDays(from: string, to: string): number {
  if (!from || !to) return 0
  const start = new Date(`${from}T12:00:00`)
  const end = new Date(`${to}T12:00:00`)
  if (end < start) return 0
  let count = 0
  const cur = new Date(start)
  while (cur <= end) {
    const day = cur.getDay()
    if (day !== 0 && day !== 6) count++
    cur.setDate(cur.getDate() + 1)
  }
  return count || 1
}

// ── Types ──────────────────────────────────────────────────────────────────

interface Draft {
  employee_id: string
  type: LeaveType
  from_date: string
  to_date: string
  reason: string
}

interface Props {
  open: boolean
  onClose: () => void
  request?: LeaveRequestWithEmployee | null
  employees: Employee[]
  onSaved: (req: LeaveRequestWithEmployee) => void
  onDeleted?: (id: string) => void
  defaultEmployeeId?: string
}

// ── Component ──────────────────────────────────────────────────────────────

export function LeaveFormDrawer({ open, onClose, request, employees, onSaved, onDeleted, defaultEmployeeId }: Props) {
  const isEdit = !!request

  const [draft, setDraft] = React.useState<Draft>({
    employee_id: request?.employee_id ?? defaultEmployeeId ?? employees[0]?.id ?? '',
    type: request?.type ?? 'casual',
    from_date: request?.from_date ?? isoToday(),
    to_date: request?.to_date ?? isoToday(),
    reason: request?.reason ?? '',
  })
  const [saving, setSaving] = React.useState(false)
  const [deleting, setDeleting] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)

  // Sync when request changes
  React.useEffect(() => {
    setDraft({
      employee_id: request?.employee_id ?? defaultEmployeeId ?? employees[0]?.id ?? '',
      type: request?.type ?? 'casual',
      from_date: request?.from_date ?? isoToday(),
      to_date: request?.to_date ?? isoToday(),
      reason: request?.reason ?? '',
    })
    setError(null)
  }, [request, open])

  function set<K extends keyof Draft>(key: K, value: Draft[K]) {
    setDraft((p) => {
      const next = { ...p, [key]: value }
      // Auto-adjust to_date if it goes before from_date
      if (key === 'from_date' && next.to_date < value) next.to_date = value as string
      return next
    })
  }

  const days = countWorkingDays(draft.from_date, draft.to_date)

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    if (!draft.employee_id || !draft.from_date || !draft.to_date) return
    setSaving(true); setError(null)
    try {
      const payload = {
        employee_id: draft.employee_id,
        type: draft.type,
        from_date: draft.from_date,
        to_date: draft.to_date,
        days,
        reason: draft.reason.trim() || null,
      }
      const url = isEdit ? `/api/leave-requests/${request!.id}` : '/api/leave-requests'
      const method = isEdit ? 'PATCH' : 'POST'
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data?.error ?? 'Failed to save')
      onSaved(data as LeaveRequestWithEmployee)
      onClose()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong')
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete() {
    if (!request || !onDeleted) return
    if (!window.confirm('Delete this leave request? This cannot be undone.')) return
    setDeleting(true)
    try {
      const res = await fetch(`/api/leave-requests/${request.id}`, { method: 'DELETE' })
      if (!res.ok) throw new Error('Failed')
      onDeleted(request.id)
      onClose()
    } catch {
      // silently ignore
    } finally {
      setDeleting(false)
    }
  }

  const footer = (
    <div className="flex w-full items-center justify-between">
      {isEdit && onDeleted ? (
        <button type="button" onClick={handleDelete} disabled={deleting}
          className="inline-flex h-10 items-center gap-1.5 rounded-xl border border-coral/30 px-3 text-sm font-medium text-coral hover:bg-coral/10 disabled:opacity-60"
        >
          <Trash2 className="size-4" />
          {deleting ? 'Deleting…' : 'Delete'}
        </button>
      ) : <span />}
      <div className="flex gap-2">
        <button type="button" onClick={onClose}
          className="inline-flex h-10 items-center rounded-xl border border-border px-4 text-sm font-medium text-ink-muted hover:bg-surface-2"
        >
          Cancel
        </button>
        <button type="submit" form="leave-form" disabled={saving || days === 0}
          className="inline-flex h-10 items-center gap-1.5 rounded-xl bg-brand px-4 text-sm font-medium text-brand-foreground shadow-sm hover:opacity-90 disabled:opacity-60"
        >
          {saving ? <Loader2 className="size-4 animate-spin" /> : <Save className="size-4" />}
          {saving ? 'Saving…' : isEdit ? 'Save changes' : 'Submit request'}
        </button>
      </div>
    </div>
  )

  return (
    <Drawer
      open={open}
      onClose={onClose}
      title={isEdit ? 'Edit Leave Request' : 'New Leave Request'}
      description={isEdit ? 'Update details for this leave request' : 'Submit a new leave request for an employee'}
      size="md"
      footer={footer}
    >
      <form id="leave-form" onSubmit={handleSave} className="space-y-5">

        {/* Employee */}
        <Field label="Employee">
          <select value={draft.employee_id} disabled={isEdit}
            onChange={(e) => set('employee_id', e.target.value)}
            className="h-10 w-full rounded-xl border border-border bg-surface px-3 text-sm focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/20 disabled:opacity-60"
          >
            <option value="">Select employee…</option>
            {employees.map((emp) => (
              <option key={emp.id} value={emp.id}>{emp.full_name}</option>
            ))}
          </select>
        </Field>

        {/* Leave type — visual chips */}
        <Field label="Leave Type">
          <div className="flex flex-wrap gap-2">
            {(Object.entries(LEAVE_TYPE_META) as [LeaveType, typeof LEAVE_TYPE_META[LeaveType]][]).map(([key, meta]) => (
              <button
                key={key}
                type="button"
                onClick={() => set('type', key)}
                className={cn(
                  'inline-flex h-9 items-center gap-1.5 rounded-xl border px-3 text-sm font-medium transition-colors',
                  draft.type === key
                    ? `${meta.chip} border-transparent`
                    : 'border-border text-ink-muted hover:bg-surface-2'
                )}
              >
                <span className={cn('size-2 rounded-full', meta.dot)} />
                {meta.label}
              </button>
            ))}
          </div>
        </Field>

        {/* Dates */}
        <div className="grid grid-cols-2 gap-3">
          <Field label="From date">
            <input type="date" value={draft.from_date} max={draft.to_date}
              onChange={(e) => set('from_date', e.target.value)}
              className="h-10 w-full rounded-xl border border-border bg-surface px-3 text-sm focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/20"
            />
          </Field>
          <Field label="To date">
            <input type="date" value={draft.to_date} min={draft.from_date}
              onChange={(e) => set('to_date', e.target.value)}
              className="h-10 w-full rounded-xl border border-border bg-surface px-3 text-sm focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/20"
            />
          </Field>
        </div>

        {/* Duration indicator */}
        <div className={cn(
          'rounded-xl px-4 py-3 text-sm font-medium',
          days > 0 ? 'bg-brand/10 text-brand' : 'bg-surface-2 text-ink-soft'
        )}>
          {days > 0
            ? `📅 ${days} working day${days !== 1 ? 's' : ''}`
            : 'Select valid date range'}
        </div>

        {/* Reason */}
        <Field label="Reason (optional)">
          <textarea
            value={draft.reason}
            onChange={(e) => set('reason', e.target.value)}
            rows={4}
            placeholder="Explain the reason for this leave request…"
            className="w-full resize-none rounded-xl border border-border bg-surface px-3 py-2.5 text-sm placeholder:text-ink-soft focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/20"
          />
        </Field>

        {error && (
          <p className="rounded-xl bg-coral/10 px-4 py-3 text-sm text-coral">{error}</p>
        )}
      </form>
    </Drawer>
  )
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="mb-1.5 block text-sm font-medium text-ink-muted">{label}</label>
      {children}
    </div>
  )
}
