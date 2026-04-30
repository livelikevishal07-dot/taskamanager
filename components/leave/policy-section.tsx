'use client'

import * as React from 'react'
import {
  AlertTriangle, Check, Info, Loader2, Pencil, Trash2, X,
} from 'lucide-react'
import { cn } from '@/lib/utils'

// ── Types ─────────────────────────────────────────────────────────────────────

type LeaveType   = 'casual' | 'sick' | 'annual' | 'maternity' | 'paternity' | 'unpaid' | 'other'
type AccrualType = 'fixed' | 'monthly'

interface LeavePolicy {
  id:              string
  leave_type:      LeaveType
  accrual_type:    AccrualType
  days_per_period: number
  max_carryover:   number
  updated_at:      string
}

// ── Meta ──────────────────────────────────────────────────────────────────────

const TYPE_META: Record<LeaveType, { label: string; dot: string; chip: string; description: string }> = {
  sick:      { label: 'Sick Leave',      dot: 'bg-coral',    chip: 'bg-coral/10 text-coral',     description: 'For illness or medical appointments' },
  casual:    { label: 'Casual Leave',    dot: 'bg-sky',      chip: 'bg-sky/10 text-sky',          description: 'For personal errands and casual absences' },
  annual:    { label: 'Annual Leave',    dot: 'bg-emerald',  chip: 'bg-emerald/10 text-emerald',  description: 'Planned vacation and personal time off' },
  maternity: { label: 'Maternity Leave', dot: 'bg-violet',   chip: 'bg-violet/10 text-violet',    description: 'For employees expecting a child' },
  paternity: { label: 'Paternity Leave', dot: 'bg-indigo',   chip: 'bg-indigo/10 text-indigo',    description: 'For new fathers after childbirth or adoption' },
  unpaid:    { label: 'Unpaid Leave',    dot: 'bg-amber',    chip: 'bg-amber/10 text-amber',      description: 'Leave without pay for extended absences' },
  other:     { label: 'Other Leave',     dot: 'bg-ink-soft', chip: 'bg-surface-2 text-ink-muted', description: 'Miscellaneous leave types' },
}

const LEAVE_ORDER: LeaveType[] = ['sick','casual','annual','maternity','paternity','unpaid','other']

// ── Helpers ───────────────────────────────────────────────────────────────────

function effectiveDays(accrualType: AccrualType, daysPerPeriod: number): number {
  if (accrualType === 'monthly') {
    const monthsElapsed = new Date().getMonth() + 1
    return Math.round(monthsElapsed * daysPerPeriod * 10) / 10
  }
  return daysPerPeriod
}

function fmtUpdated(iso: string): string {
  return new Date(iso).toLocaleDateString('en-GB', {
    day: 'numeric', month: 'short', year: 'numeric',
  })
}

// ── Policy Row ────────────────────────────────────────────────────────────────

interface RowProps {
  policy:    LeavePolicy
  onSaved:   (updated: LeavePolicy) => void
  onDeleted: (leave_type: LeaveType) => void
}

function PolicyRow({ policy, onSaved, onDeleted }: RowProps) {
  const meta = TYPE_META[policy.leave_type]

  const [editing,        setEditing]        = React.useState(false)
  const [confirmDelete,  setConfirmDelete]  = React.useState(false)
  const [accrualType,    setAccrualType]    = React.useState<AccrualType>(policy.accrual_type)
  const [daysPerPeriod,  setDaysPerPeriod]  = React.useState(String(policy.days_per_period))
  const [maxCarryover,   setMaxCarryover]   = React.useState(String(policy.max_carryover))
  const [saving,         setSaving]         = React.useState(false)
  const [deleting,       setDeleting]       = React.useState(false)
  const [error,          setError]          = React.useState<string | null>(null)

  function reset() {
    setAccrualType(policy.accrual_type)
    setDaysPerPeriod(String(policy.days_per_period))
    setMaxCarryover(String(policy.max_carryover))
    setError(null)
    setEditing(false)
    setConfirmDelete(false)
  }

  async function save() {
    const dpn = parseFloat(daysPerPeriod)
    const mco = parseInt(maxCarryover, 10)
    if (isNaN(dpn) || dpn < 0 || dpn > 365) { setError('Days must be 0–365'); return }
    if (isNaN(mco) || mco < 0)               { setError('Carryover must be ≥ 0'); return }

    setSaving(true); setError(null)
    try {
      const r = await fetch('/api/leave-policy', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          leave_type:      policy.leave_type,
          accrual_type:    accrualType,
          days_per_period: dpn,
          max_carryover:   mco,
        }),
      })
      if (!r.ok) {
        const d = await r.json().catch(() => ({}))
        throw new Error(d.error ?? 'Failed to save')
      }
      onSaved(await r.json())
      setEditing(false)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed')
    } finally {
      setSaving(false)
    }
  }

  async function doDelete() {
    setDeleting(true); setError(null)
    try {
      const r = await fetch(`/api/leave-policy/${policy.leave_type}`, { method: 'DELETE' })
      if (!r.ok) {
        const d = await r.json().catch(() => ({}))
        throw new Error(d.error ?? 'Failed to delete')
      }
      onDeleted(policy.leave_type)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to delete')
      setDeleting(false)
      setConfirmDelete(false)
    }
  }

  const effective = effectiveDays(
    editing ? accrualType : policy.accrual_type,
    editing ? (parseFloat(daysPerPeriod) || 0) : policy.days_per_period,
  )

  return (
    <div className={cn(
      'overflow-hidden rounded-2xl border transition-colors',
      confirmDelete
        ? 'border-coral/30 bg-coral/[0.02]'
        : editing
          ? 'border-brand/30 bg-brand/[0.02]'
          : 'border-border bg-surface',
    )}>

      {/* ── Top row: label + action buttons ── */}
      <div className="flex items-start justify-between gap-3 px-5 pt-4">
        <div className="flex items-center gap-3">
          <span className={cn('mt-0.5 size-2.5 shrink-0 rounded-full', meta.dot)} />
          <div>
            <p className="text-sm font-semibold text-ink">{meta.label}</p>
            <p className="text-[11px] text-ink-soft">{meta.description}</p>
          </div>
        </div>

        <div className="flex shrink-0 items-center gap-1.5">
          {editing ? (
            <>
              <button
                type="button"
                onClick={save}
                disabled={saving}
                className="inline-flex h-8 items-center gap-1.5 rounded-xl bg-brand px-3 text-xs font-semibold text-brand-foreground shadow-sm hover:opacity-90 disabled:opacity-50"
              >
                {saving ? <Loader2 className="size-3 animate-spin" /> : <Check className="size-3" />}
                Save
              </button>
              <button
                type="button"
                onClick={reset}
                className="grid size-8 place-items-center rounded-xl border border-border text-ink-soft hover:bg-surface-2"
                title="Discard changes"
              >
                <X className="size-3.5" />
              </button>
            </>
          ) : confirmDelete ? (
            /* confirm state — handled in the footer, just show cancel here */
            <button
              type="button"
              onClick={() => setConfirmDelete(false)}
              className="grid size-8 place-items-center rounded-xl border border-border text-ink-soft hover:bg-surface-2"
              title="Cancel delete"
            >
              <X className="size-3.5" />
            </button>
          ) : (
            <>
              <button
                type="button"
                onClick={() => setEditing(true)}
                className="grid size-8 place-items-center rounded-xl border border-border text-ink-soft hover:bg-surface-2 hover:text-ink"
                title="Edit policy"
              >
                <Pencil className="size-3.5" />
              </button>
              <button
                type="button"
                onClick={() => setConfirmDelete(true)}
                className="grid size-8 place-items-center rounded-xl border border-border text-ink-soft hover:border-coral/30 hover:bg-coral/10 hover:text-coral"
                title="Delete policy"
              >
                <Trash2 className="size-3.5" />
              </button>
            </>
          )}
        </div>
      </div>

      {/* ── Fields (hidden during delete confirm) ── */}
      {!confirmDelete && (
        <div className="grid gap-4 px-5 pb-4 pt-3 sm:grid-cols-3">

          {/* Accrual type */}
          <div>
            <p className="mb-1.5 text-[10px] font-semibold uppercase tracking-wider text-ink-muted">Accrual Type</p>
            {editing ? (
              <div className="flex gap-1.5">
                {(['fixed', 'monthly'] as AccrualType[]).map((at) => (
                  <button
                    key={at}
                    type="button"
                    onClick={() => setAccrualType(at)}
                    className={cn(
                      'flex-1 rounded-xl border py-2 text-xs font-semibold capitalize transition-all',
                      accrualType === at
                        ? 'border-brand/30 bg-brand/10 text-brand shadow-sm'
                        : 'border-border text-ink-soft hover:bg-surface-2',
                    )}
                  >
                    {at}
                  </button>
                ))}
              </div>
            ) : (
              <span className={cn(
                'inline-flex items-center rounded-xl border px-3 py-1.5 text-xs font-semibold capitalize',
                policy.accrual_type === 'monthly'
                  ? 'border-brand/20 bg-brand/10 text-brand'
                  : 'border-border bg-surface-2 text-ink-muted',
              )}>
                {policy.accrual_type}
              </span>
            )}
          </div>

          {/* Days per period */}
          <div>
            <p className="mb-1.5 text-[10px] font-semibold uppercase tracking-wider text-ink-muted">
              {(editing ? accrualType : policy.accrual_type) === 'monthly' ? 'Days / Month' : 'Days / Year'}
            </p>
            {editing ? (
              <input
                type="number"
                min={0}
                max={365}
                step={0.5}
                value={daysPerPeriod}
                onChange={(e) => setDaysPerPeriod(e.target.value)}
                className="h-9 w-full rounded-xl border border-border bg-surface px-3 text-sm font-semibold focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/20"
              />
            ) : (
              <p className="text-xl font-bold text-ink">
                {policy.days_per_period}
                <span className="ml-1 text-xs font-medium text-ink-soft">days</span>
              </p>
            )}
          </div>

          {/* Effective days / Max carryover */}
          <div>
            {editing ? (
              <>
                <p className="mb-1.5 text-[10px] font-semibold uppercase tracking-wider text-ink-muted">Max Carryover (days)</p>
                <input
                  type="number"
                  min={0}
                  max={365}
                  step={1}
                  value={maxCarryover}
                  onChange={(e) => setMaxCarryover(e.target.value)}
                  className="h-9 w-full rounded-xl border border-border bg-surface px-3 text-sm font-semibold focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/20"
                />
              </>
            ) : (
              <>
                <p className="mb-1.5 text-[10px] font-semibold uppercase tracking-wider text-ink-muted">Effective This Year</p>
                <p className="text-xl font-bold text-ink">
                  {effective}
                  <span className="ml-1 text-xs font-medium text-ink-soft">
                    {policy.accrual_type === 'monthly' ? 'accrued so far' : 'days'}
                  </span>
                </p>
              </>
            )}
          </div>
        </div>
      )}

      {/* ── Footer: error / hint / delete confirm ── */}
      <div className={cn(
        'border-t px-5 py-2.5',
        confirmDelete ? 'border-coral/20' : 'border-border/60',
      )}>
        {confirmDelete ? (
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2 text-xs text-coral">
              <AlertTriangle className="size-3.5 shrink-0" />
              <span>Remove <strong>{meta.label}</strong> policy? Employees won't see this leave type until re-added.</span>
            </div>
            <div className="flex shrink-0 gap-2">
              <button
                type="button"
                onClick={() => setConfirmDelete(false)}
                className="rounded-xl border border-border px-3 py-1.5 text-xs font-medium text-ink-muted hover:bg-surface-2"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={doDelete}
                disabled={deleting}
                className="inline-flex items-center gap-1.5 rounded-xl bg-coral px-3 py-1.5 text-xs font-semibold text-white hover:opacity-90 disabled:opacity-50"
              >
                {deleting ? <Loader2 className="size-3 animate-spin" /> : <Trash2 className="size-3" />}
                Delete
              </button>
            </div>
          </div>
        ) : error ? (
          <p className="text-xs text-coral">{error}</p>
        ) : editing ? (
          <div className="flex items-center gap-1.5 text-[11px] text-ink-soft">
            <Info className="size-3" />
            {accrualType === 'monthly'
              ? `${parseFloat(daysPerPeriod) || 0} day/month → ${effectiveDays('monthly', parseFloat(daysPerPeriod) || 0)} days accrued so far (month ${new Date().getMonth() + 1})`
              : `Flat ${parseFloat(daysPerPeriod) || 0} days granted at start of year`}
          </div>
        ) : (
          <p className="text-[11px] text-ink-soft">
            Last updated · {fmtUpdated(policy.updated_at)}
            {policy.max_carryover > 0 && ` · up to ${policy.max_carryover}d carryover`}
          </p>
        )}
      </div>
    </div>
  )
}

// ── Main Component ────────────────────────────────────────────────────────────

interface Props {
  initialPolicies: LeavePolicy[]
}

export function PolicySection({ initialPolicies }: Props) {
  const [policies, setPolicies] = React.useState<LeavePolicy[]>(initialPolicies)

  function onSaved(updated: LeavePolicy) {
    setPolicies((prev) =>
      prev.map((p) => p.leave_type === updated.leave_type ? updated : p),
    )
  }

  function onDeleted(leave_type: LeaveType) {
    setPolicies((prev) => prev.filter((p) => p.leave_type !== leave_type))
  }

  const ordered = LEAVE_ORDER
    .map((lt) => policies.find((p) => p.leave_type === lt))
    .filter(Boolean) as LeavePolicy[]

  return (
    <div className="space-y-5">
      {/* Info banner */}
      <div className="flex items-start gap-3 rounded-2xl border border-brand/20 bg-brand/[0.04] px-5 py-3.5">
        <Info className="mt-0.5 size-4 shrink-0 text-brand" />
        <div>
          <p className="text-sm font-semibold text-ink">Leave Policy Configuration</p>
          <p className="text-xs text-ink-soft">
            Changes apply globally to all employees immediately.{' '}
            <span className="font-medium text-ink">Fixed</span> grants a flat number of days at the start of each year.{' '}
            <span className="font-medium text-ink">Monthly</span> accrues the configured days every month (e.g. 1 day/month = 12 days by year-end).
            Deleting a policy hides it from employee balances until it's re-added via a save.
          </p>
        </div>
      </div>

      {/* Policy cards */}
      {ordered.length === 0 ? (
        <div className="flex flex-col items-center gap-3 rounded-2xl border border-dashed border-border py-16 text-center">
          <p className="text-sm font-medium text-ink">No policies configured</p>
          <p className="text-xs text-ink-soft">All leave policies have been removed. Edit a leave request to re-trigger a policy entry.</p>
        </div>
      ) : (
        <div className="grid gap-3 lg:grid-cols-2">
          {ordered.map((policy) => (
            <PolicyRow
              key={policy.leave_type}
              policy={policy}
              onSaved={onSaved}
              onDeleted={onDeleted}
            />
          ))}
        </div>
      )}
    </div>
  )
}
