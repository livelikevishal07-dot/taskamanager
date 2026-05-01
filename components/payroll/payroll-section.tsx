'use client'

import * as React from 'react'
import {
  FileText, RefreshCw, Check, Pencil, Trash2,
  ChevronDown, Download, X, AlertCircle, Eye
} from 'lucide-react'
import { cn } from '@/lib/utils'
import type { Employee, Payslip } from '@/lib/db/types'
import { PayslipTemplate } from './payslip-template'

// ── Constants ─────────────────────────────────────────────────────────────────

const MONTHS = [
  '', 'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
]

function fmt(n: number): string {
  return new Intl.NumberFormat('en-IN', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(n)
}

function monthOptions() {
  const opts = []
  const now = new Date()
  for (let i = 0; i < 12; i++) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
    opts.push({ label: `${MONTHS[d.getMonth() + 1]} ${d.getFullYear()}`, month: d.getMonth() + 1, year: d.getFullYear() })
  }
  return opts
}

// ── Main component ────────────────────────────────────────────────────────────

interface Props {
  employees: Employee[]
}

export function PayrollSection({ employees }: Props) {
  const options = React.useMemo(() => monthOptions(), [])
  const [selectedOption, setSelectedOption] = React.useState(0) // index into options[]
  const [payslips, setPayslips] = React.useState<Payslip[]>([])
  const [loading, setLoading] = React.useState(false)
  const [generating, setGenerating] = React.useState<string | null>(null) // employee_id
  const [error, setError] = React.useState<string | null>(null)
  const [editSlip, setEditSlip] = React.useState<Payslip | null>(null)
  const [previewSlip, setPreviewSlip] = React.useState<Payslip | null>(null)

  const { month, year } = options[selectedOption]

  // Fetch payslips whenever month/year changes
  React.useEffect(() => {
    fetchPayslips()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [month, year])

  async function fetchPayslips() {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch(`/api/payroll?month=${month}&year=${year}`)
      if (!res.ok) throw new Error(await res.text())
      setPayslips(await res.json())
    } catch (e) {
      setError(String(e))
    } finally {
      setLoading(false)
    }
  }

  async function generateOne(employee: Employee) {
    if (!employee.monthly_salary) {
      alert(`${employee.full_name} has no salary set. Please update their profile first.`)
      return
    }
    setGenerating(employee.id)
    setError(null)
    try {
      const res = await fetch('/api/payroll', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ employee_id: employee.id, month, year }),
      })
      if (!res.ok) throw new Error(await res.text())
      const slip: Payslip = await res.json()
      setPayslips((prev) => {
        const exists = prev.some((p) => p.id === slip.id)
        return exists ? prev.map((p) => p.id === slip.id ? slip : p) : [slip, ...prev]
      })
    } catch (e) {
      setError(String(e))
    } finally {
      setGenerating(null)
    }
  }

  async function generateAll() {
    const active = employees.filter((e) => e.status === 'active' && e.monthly_salary)
    if (!active.length) {
      alert('No active employees with salary set.')
      return
    }
    for (const emp of active) {
      await generateOne(emp)
    }
  }

  async function publishAll() {
    const drafts = payslips.filter((p) => p.status === 'draft')
    if (!drafts.length) return
    for (const slip of drafts) {
      await fetch(`/api/payroll/${slip.id}`, {
        method: 'PATCH',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ status: 'published' }),
      })
    }
    // Refresh list
    await fetchPayslips()
  }

  async function deleteSlip(id: string) {
    if (!confirm('Delete this payslip? This cannot be undone.')) return
    await fetch(`/api/payroll/${id}`, { method: 'DELETE' })
    setPayslips((prev) => prev.filter((p) => p.id !== id))
  }

  async function publishSlip(slip: Payslip) {
    const res = await fetch(`/api/payroll/${slip.id}`, {
      method: 'PATCH',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ status: slip.status === 'published' ? 'draft' : 'published' }),
    })
    const updated: Payslip = await res.json()
    setPayslips((prev) => prev.map((p) => p.id === updated.id ? updated : p))
  }

  // Build a map: employee_id → payslip
  const slipMap = React.useMemo(() => {
    const m = new Map<string, Payslip>()
    for (const p of payslips) m.set(p.employee_id, p)
    return m
  }, [payslips])

  const activeEmployees = employees.filter((e) => e.status === 'active')

  return (
    <div className="space-y-5">
      {/* Header bar */}
      <div className="flex flex-wrap items-center gap-3">
        {/* Month picker */}
        <div className="relative">
          <select
            value={selectedOption}
            onChange={(e) => setSelectedOption(Number(e.target.value))}
            className="h-10 rounded-xl border border-border bg-surface pl-3 pr-8 text-sm font-medium text-ink focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/20"
          >
            {options.map((o, i) => (
              <option key={i} value={i}>{o.label}</option>
            ))}
          </select>
          <ChevronDown className="pointer-events-none absolute right-2 top-1/2 size-4 -translate-y-1/2 text-ink-muted" />
        </div>

        <button
          type="button"
          onClick={generateAll}
          className="inline-flex h-10 items-center gap-2 rounded-xl bg-brand px-4 text-sm font-medium text-brand-foreground shadow-sm hover:opacity-90"
        >
          <RefreshCw className="size-4" />
          Generate All
        </button>

        {payslips.some((p) => p.status === 'draft') && (
          <button
            type="button"
            onClick={publishAll}
            className="inline-flex h-10 items-center gap-2 rounded-xl bg-emerald/90 px-4 text-sm font-medium text-white shadow-sm hover:bg-emerald"
          >
            <Check className="size-4" />
            Publish All ({payslips.filter((p) => p.status === 'draft').length})
          </button>
        )}

        <button
          type="button"
          onClick={fetchPayslips}
          disabled={loading}
          className="inline-flex h-10 items-center gap-2 rounded-xl border border-border bg-surface px-4 text-sm font-medium text-ink-muted hover:bg-surface-2 disabled:opacity-50"
        >
          <RefreshCw className={cn('size-4', loading && 'animate-spin')} />
          Refresh
        </button>

        <div className="ml-auto flex items-center gap-3 text-sm">
          <span className="text-ink-soft">{payslips.length}/{activeEmployees.length} generated</span>
          {payslips.filter(p => p.status === 'published').length > 0 && (
            <span className="inline-flex items-center gap-1 rounded-full bg-emerald/10 px-2.5 py-0.5 text-xs font-medium text-emerald">
              <Check className="size-3" />
              {payslips.filter(p => p.status === 'published').length} published
            </span>
          )}
          {payslips.filter(p => p.status === 'draft').length > 0 && (
            <span className="inline-flex items-center rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-medium text-amber-700">
              {payslips.filter(p => p.status === 'draft').length} draft
            </span>
          )}
        </div>
      </div>

      {/* Workflow hint */}
      {payslips.some((p) => p.status === 'draft') && !error && (
        <div className="flex items-center gap-2 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
          <AlertCircle className="size-4 shrink-0 text-amber-500" />
          <span>
            <strong>Draft payslips are not visible to employees.</strong>{' '}
            Review each payslip, then click <strong>Publish All</strong> above (or the ✓ button per row) to make them visible in the employee portal.
          </span>
        </div>
      )}

      {error && (
        <div className="flex items-center gap-2 rounded-xl border border-coral/30 bg-coral/10 px-4 py-3 text-sm text-coral">
          <AlertCircle className="size-4 shrink-0" />
          {error}
        </div>
      )}

      {/* Table */}
      <div className="overflow-hidden rounded-2xl border border-border bg-surface shadow-sm">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border bg-surface-2/60">
              <th className="px-4 py-3 text-left font-semibold text-ink-muted">Employee</th>
              <th className="px-4 py-3 text-left font-semibold text-ink-muted">Monthly CTC</th>
              <th className="px-4 py-3 text-left font-semibold text-ink-muted">Days</th>
              <th className="px-4 py-3 text-left font-semibold text-ink-muted">Deduction</th>
              <th className="px-4 py-3 text-left font-semibold text-ink-muted">Net Pay</th>
              <th className="px-4 py-3 text-left font-semibold text-ink-muted">Status</th>
              <th className="px-4 py-3 text-right font-semibold text-ink-muted">Actions</th>
            </tr>
          </thead>
          <tbody>
            {activeEmployees.map((emp) => {
              const slip = slipMap.get(emp.id)
              const isGenerating = generating === emp.id
              return (
                <tr key={emp.id} className="border-b border-border last:border-0 hover:bg-surface-2/40">
                  <td className="px-4 py-3">
                    <p className="font-medium">{emp.full_name}</p>
                    <p className="text-xs text-ink-soft">{emp.department?.name ?? '—'}</p>
                  </td>
                  <td className="px-4 py-3 text-ink-soft">
                    {emp.monthly_salary ? `₹${fmt(emp.monthly_salary)}` : <span className="text-amber-500">Not set</span>}
                  </td>
                  <td className="px-4 py-3">
                    {slip ? (
                      <span className="text-xs">
                        <span className="text-emerald-600 font-medium">{slip.present_days}P</span>
                        {' · '}
                        <span className="text-blue-600 font-medium">{slip.paid_leave_days}L</span>
                        {' · '}
                        <span className="text-coral font-medium">{slip.absent_days}A</span>
                      </span>
                    ) : <span className="text-ink-soft">—</span>}
                  </td>
                  <td className="px-4 py-3">
                    {slip ? (
                      <span className="text-coral">
                        {slip.deduction > 0 ? `−₹${fmt(slip.deduction)}` : '—'}
                      </span>
                    ) : <span className="text-ink-soft">—</span>}
                  </td>
                  <td className="px-4 py-3 font-semibold">
                    {slip ? (
                      <span className="text-emerald-600">
                        ₹{fmt(slip.override_net_salary ?? slip.net_salary)}
                      </span>
                    ) : <span className="text-ink-soft">—</span>}
                  </td>
                  <td className="px-4 py-3">
                    {slip ? (
                      <span className={cn(
                        'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium',
                        slip.status === 'published'
                          ? 'bg-emerald/15 text-emerald'
                          : 'bg-amber-100 text-amber-700'
                      )}>
                        {slip.status === 'published' ? 'Published' : 'Draft'}
                      </span>
                    ) : (
                      <span className="text-xs text-ink-soft">Not generated</span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-1.5">
                      {!slip ? (
                        <button
                          type="button"
                          onClick={() => generateOne(emp)}
                          disabled={isGenerating || !emp.monthly_salary}
                          title="Generate payslip"
                          className="inline-flex h-8 items-center gap-1.5 rounded-lg bg-brand/10 px-3 text-xs font-medium text-brand hover:bg-brand/20 disabled:opacity-40"
                        >
                          {isGenerating
                            ? <span className="size-3.5 animate-spin rounded-full border-2 border-brand border-t-transparent" />
                            : <RefreshCw className="size-3.5" />
                          }
                          Generate
                        </button>
                      ) : (
                        <>
                          <button
                            type="button"
                            onClick={() => setPreviewSlip(slip)}
                            title="Preview payslip"
                            className="grid size-8 place-items-center rounded-lg border border-border text-ink-muted hover:bg-surface-2 hover:text-ink"
                          >
                            <Eye className="size-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => setEditSlip(slip)}
                            title="Edit payslip"
                            className="grid size-8 place-items-center rounded-lg border border-border text-ink-muted hover:bg-surface-2 hover:text-ink"
                          >
                            <Pencil className="size-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => publishSlip(slip)}
                            title={slip.status === 'published' ? 'Unpublish' : 'Publish'}
                            className={cn(
                              'grid size-8 place-items-center rounded-lg border text-xs',
                              slip.status === 'published'
                                ? 'border-emerald/30 bg-emerald/10 text-emerald hover:bg-emerald/20'
                                : 'border-border text-ink-muted hover:bg-surface-2 hover:text-emerald'
                            )}
                          >
                            <Check className="size-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => deleteSlip(slip.id)}
                            title="Delete payslip"
                            className="grid size-8 place-items-center rounded-lg border border-border text-ink-muted hover:border-coral/30 hover:bg-coral/10 hover:text-coral"
                          >
                            <Trash2 className="size-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => generateOne(emp)}
                            disabled={isGenerating}
                            title="Re-generate"
                            className="grid size-8 place-items-center rounded-lg border border-border text-ink-muted hover:bg-surface-2 hover:text-brand disabled:opacity-40"
                          >
                            {isGenerating
                              ? <span className="size-3.5 animate-spin rounded-full border-2 border-brand border-t-transparent" />
                              : <RefreshCw className="size-3.5" />
                            }
                          </button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              )
            })}
            {activeEmployees.length === 0 && (
              <tr>
                <td colSpan={7} className="px-4 py-12 text-center text-ink-soft">
                  No active employees found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Edit modal */}
      {editSlip && (
        <EditPayslipModal
          payslip={editSlip}
          onClose={() => setEditSlip(null)}
          onSaved={(updated) => {
            setPayslips((prev) => prev.map((p) => p.id === updated.id ? updated : p))
            setEditSlip(null)
          }}
        />
      )}

      {/* Preview modal */}
      {previewSlip && (
        <PreviewModal
          payslip={previewSlip}
          onClose={() => setPreviewSlip(null)}
        />
      )}
    </div>
  )
}

// ── Edit modal ────────────────────────────────────────────────────────────────

function EditPayslipModal({
  payslip,
  onClose,
  onSaved,
}: {
  payslip: Payslip
  onClose: () => void
  onSaved: (p: Payslip) => void
}) {
  const [presentDays,   setPresentDays]   = React.useState(String(payslip.present_days))
  const [absentDays,    setAbsentDays]    = React.useState(String(payslip.absent_days))
  const [paidLeave,     setPaidLeave]     = React.useState(String(payslip.paid_leave_days))
  const [overrideNet,   setOverrideNet]   = React.useState(
    payslip.override_net_salary != null ? String(payslip.override_net_salary) : ''
  )
  const [adminNote,     setAdminNote]     = React.useState(payslip.admin_note ?? '')
  const [saving,        setSaving]        = React.useState(false)
  const [error,         setError]         = React.useState<string | null>(null)

  async function save() {
    setSaving(true)
    setError(null)
    try {
      const body: Record<string, unknown> = {
        present_days:    Number(presentDays),
        absent_days:     Number(absentDays),
        paid_leave_days: Number(paidLeave),
        admin_note:      adminNote.trim() || null,
        override_net_salary: overrideNet.trim() ? Number(overrideNet) : null,
      }
      const res = await fetch(`/api/payroll/${payslip.id}`, {
        method: 'PATCH',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(body),
      })
      if (!res.ok) throw new Error(await res.text())
      onSaved(await res.json())
    } catch (e) {
      setError(String(e))
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-md rounded-2xl border border-border bg-surface shadow-xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-border px-5 py-4">
          <div>
            <h3 className="font-semibold">Edit Payslip</h3>
            <p className="text-xs text-ink-soft">
              {payslip.employee?.full_name} · {MONTHS[payslip.month]} {payslip.year}
            </p>
          </div>
          <button type="button" onClick={onClose} className="grid size-8 place-items-center rounded-lg text-ink-soft hover:bg-surface-2">
            <X className="size-4" />
          </button>
        </div>

        {/* Body */}
        <div className="space-y-4 p-5">
          {error && (
            <div className="rounded-lg border border-coral/30 bg-coral/10 px-3 py-2 text-sm text-coral">{error}</div>
          )}

          <div className="grid grid-cols-3 gap-3">
            <Field label="Present Days">
              <NumberInput value={presentDays} onChange={setPresentDays} min={0} max={payslip.total_working_days} />
            </Field>
            <Field label="Paid Leave">
              <NumberInput value={paidLeave} onChange={setPaidLeave} min={0} max={payslip.total_working_days} />
            </Field>
            <Field label="Absent Days">
              <NumberInput value={absentDays} onChange={setAbsentDays} min={0} max={payslip.total_working_days} />
            </Field>
          </div>

          <div className="rounded-lg bg-surface-2/60 px-4 py-3 text-xs text-ink-soft">
            Per day rate: ₹{payslip.per_day_salary.toFixed(2)} ·
            Deduction = {absentDays || 0} × ₹{payslip.per_day_salary.toFixed(2)} = ₹{(Number(absentDays) * payslip.per_day_salary).toFixed(2)}
          </div>

          <Field label="Override Net Pay (₹) — leave blank to use calculated">
            <input
              type="number"
              min={0}
              step={0.01}
              value={overrideNet}
              onChange={(e) => setOverrideNet(e.target.value)}
              placeholder={`Calculated: ₹${payslip.net_salary.toFixed(2)}`}
              className="h-10 w-full rounded-lg border border-border bg-surface px-3 text-sm focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/20"
            />
          </Field>

          <Field label="Admin Note (optional)">
            <textarea
              rows={2}
              value={adminNote}
              onChange={(e) => setAdminNote(e.target.value)}
              placeholder="e.g. Performance bonus included"
              className="w-full rounded-lg border border-border bg-surface p-3 text-sm focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/20"
            />
          </Field>
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-2 border-t border-border px-5 py-4">
          <button type="button" onClick={onClose} className="inline-flex h-10 items-center rounded-xl border border-border px-4 text-sm text-ink-muted hover:bg-surface-2">
            Cancel
          </button>
          <button
            type="button"
            onClick={save}
            disabled={saving}
            className="inline-flex h-10 items-center gap-2 rounded-xl bg-brand px-4 text-sm font-medium text-brand-foreground hover:opacity-90 disabled:opacity-60"
          >
            {saving && <span className="size-4 animate-spin rounded-full border-2 border-white border-t-transparent" />}
            Save Changes
          </button>
        </div>
      </div>
    </div>
  )
}

// ── Preview modal ─────────────────────────────────────────────────────────────

function PreviewModal({ payslip, onClose }: { payslip: Payslip; onClose: () => void }) {
  function handlePrint() {
    window.print()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 print:p-0">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm print:hidden" onClick={onClose} />
      <div className="relative flex h-full max-h-[90vh] w-full max-w-3xl flex-col overflow-hidden rounded-2xl border border-border bg-white shadow-xl print:max-h-none print:max-w-none print:rounded-none print:border-0 print:shadow-none">
        {/* Print toolbar */}
        <div className="flex items-center justify-between border-b border-gray-200 bg-gray-50 px-5 py-3 print:hidden">
          <p className="text-sm font-medium text-gray-700">
            Payslip Preview — {payslip.employee?.full_name}
          </p>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handlePrint}
              className="inline-flex h-9 items-center gap-2 rounded-lg bg-violet-600 px-4 text-sm font-medium text-white hover:bg-violet-700"
            >
              <Download className="size-4" />
              Print / Download PDF
            </button>
            <button
              type="button"
              onClick={onClose}
              className="grid size-9 place-items-center rounded-lg border border-gray-200 text-gray-500 hover:bg-gray-100"
            >
              <X className="size-4" />
            </button>
          </div>
        </div>
        {/* Payslip content */}
        <div className="flex-1 overflow-y-auto bg-gray-100 p-4 print:overflow-visible print:bg-white print:p-0">
          <PayslipTemplate payslip={payslip} />
        </div>
      </div>
    </div>
  )
}

// ── Mini helpers ──────────────────────────────────────────────────────────────

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1 block text-xs font-medium text-ink-muted">{label}</span>
      {children}
    </label>
  )
}

function NumberInput({
  value, onChange, min, max,
}: { value: string; onChange: (v: string) => void; min?: number; max?: number }) {
  return (
    <input
      type="number"
      min={min}
      max={max}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="h-10 w-full rounded-lg border border-border bg-surface px-3 text-sm focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/20"
    />
  )
}
