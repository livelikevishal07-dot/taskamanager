'use client'

import * as React from 'react'
import {
  AlertCircle, AlertTriangle, Baby, Briefcase, Calendar, CalendarOff, Check,
  ChevronRight, Clock, FileText, Heart, Home,
  Loader2, PlusCircle, RefreshCcw, Stethoscope, Syringe,
  Umbrella, X, XCircle, Info, MessageSquare,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { useEmployee } from '@/app/employee/context'
import { EmployeeTopbar } from '@/components/employee-dashboard/topbar'

// ── Types ─────────────────────────────────────────────────────────────────────

type LeaveType   = 'casual' | 'sick' | 'annual' | 'maternity' | 'paternity' | 'unpaid' | 'other' | 'emergency'
type LeaveStatus = 'pending' | 'approved' | 'rejected' | 'cancelled'

interface LeaveRequest {
  id: string
  employee_id: string
  type: LeaveType
  from_date: string
  to_date: string
  days: number
  reason: string | null
  status: LeaveStatus
  admin_note: string | null
  reviewed_by: string | null
  reviewed_at: string | null
  created_at: string
}

interface LeaveBalance {
  leave_type:   LeaveType
  total_days:   number
  used_days:    number
  pending_days: number
  remaining:    number
  accrual_type: 'fixed' | 'monthly'
}

// ── Style meta ────────────────────────────────────────────────────────────────

const TYPE_STYLE: Record<LeaveType, { label: string; chip: string; bar: string }> = {
  casual:    { label: 'Casual',    chip: 'bg-sky/10 text-sky',          bar: 'bg-sky'      },
  sick:      { label: 'Sick',      chip: 'bg-coral/10 text-coral',      bar: 'bg-coral'    },
  annual:    { label: 'Annual',    chip: 'bg-emerald/10 text-emerald',  bar: 'bg-emerald'  },
  maternity: { label: 'Maternity', chip: 'bg-violet/10 text-violet',    bar: 'bg-violet'   },
  paternity: { label: 'Paternity', chip: 'bg-indigo/10 text-indigo',    bar: 'bg-indigo'   },
  unpaid:    { label: 'Unpaid',    chip: 'bg-amber/10 text-amber',      bar: 'bg-amber'    },
  other:     { label: 'Other',     chip: 'bg-surface-2 text-ink-muted', bar: 'bg-ink-soft' },
  emergency: { label: 'Emergency', chip: 'bg-red-100 text-red-600',     bar: 'bg-red-500'  },
}

const STATUS_META: Record<LeaveStatus, { label: string; chip: string; dot: string; icon: React.ElementType }> = {
  pending:   { label: 'Pending',   chip: 'bg-amber/10 text-amber',      dot: 'bg-amber',       icon: Clock   },
  approved:  { label: 'Approved',  chip: 'bg-emerald/10 text-emerald',  dot: 'bg-emerald',     icon: Check   },
  rejected:  { label: 'Rejected',  chip: 'bg-coral/10 text-coral',      dot: 'bg-coral',       icon: XCircle },
  cancelled: { label: 'Cancelled', chip: 'bg-surface-2 text-ink-soft',  dot: 'bg-ink-soft/40', icon: X       },
}

// ── Reason templates ──────────────────────────────────────────────────────────

interface ReasonTemplate {
  id: string
  label: string
  sublabel: string
  icon: React.ElementType
  iconBg: string
  iconColor: string
  suggestedType: LeaveType
  prefillReason: string
  alwaysShow?: boolean
}

// Emergency is always shown first, regardless of configured policies
const EMERGENCY_TEMPLATE: ReasonTemplate = {
  id: 'emergency',
  label: 'Emergency Leave',
  sublabel: 'Urgent unforeseen situation — salary will be deducted for these days',
  icon: AlertTriangle,
  iconBg: 'bg-red-50',
  iconColor: 'text-red-500',
  suggestedType: 'emergency',
  prefillReason: 'Emergency leave',
  alwaysShow: true,
}

const POLICY_TEMPLATES: ReasonTemplate[] = [
  { id: 'sick',        label: 'Sick / Illness',           sublabel: 'Not feeling well, fever, flu or recovery',        icon: Syringe,    iconBg: 'bg-coral/10',   iconColor: 'text-coral',   suggestedType: 'sick',      prefillReason: 'Sick leave due to illness'           },
  { id: 'medical',     label: 'Medical Appointment',      sublabel: 'Doctor, dentist or specialist visit',              icon: Stethoscope,iconBg: 'bg-sky/10',     iconColor: 'text-sky',     suggestedType: 'sick',      prefillReason: 'Medical / doctor appointment'        },
  { id: 'vacation',    label: 'Annual Leave / Vacation',  sublabel: 'Holiday, travel or personal time off',             icon: Umbrella,   iconBg: 'bg-emerald/10', iconColor: 'text-emerald', suggestedType: 'annual',    prefillReason: 'Annual leave / Vacation'             },
  { id: 'family',      label: 'Family Emergency',         sublabel: 'Urgent family matter requiring presence',          icon: Heart,      iconBg: 'bg-violet/10',  iconColor: 'text-violet',  suggestedType: 'casual',    prefillReason: 'Family emergency'                    },
  { id: 'bereavement', label: 'Bereavement',              sublabel: 'Loss of a family member or close relative',        icon: CalendarOff,iconBg: 'bg-indigo/10',  iconColor: 'text-indigo',  suggestedType: 'casual',    prefillReason: 'Bereavement — loss of family member' },
  { id: 'maternity',   label: 'Maternity Leave',          sublabel: 'Pre- or post-natal leave for mothers',             icon: Baby,       iconBg: 'bg-pink/10',    iconColor: 'text-violet',  suggestedType: 'maternity', prefillReason: 'Maternity leave'                     },
  { id: 'paternity',   label: 'Paternity Leave',          sublabel: 'Leave following birth of child for fathers',       icon: Baby,       iconBg: 'bg-indigo/10',  iconColor: 'text-indigo',  suggestedType: 'paternity', prefillReason: 'Paternity leave'                     },
  { id: 'personal',    label: 'Personal / Home Affairs',  sublabel: 'Personal errands, legal matters or home issues',   icon: Home,       iconBg: 'bg-amber/10',   iconColor: 'text-amber',   suggestedType: 'casual',    prefillReason: 'Personal / home affairs'             },
  { id: 'study',       label: 'Study / Exam Leave',       sublabel: 'Exam, certification or professional development',  icon: Briefcase,  iconBg: 'bg-sky/10',     iconColor: 'text-sky',     suggestedType: 'casual',    prefillReason: 'Study / exam leave'                  },
  { id: 'other',       label: 'Other Reason',             sublabel: 'Please describe your reason in the details field', icon: FileText,   iconBg: 'bg-surface-2',  iconColor: 'text-ink-soft',suggestedType: 'other',     prefillReason: ''                                    },
]

// ── Helpers ───────────────────────────────────────────────────────────────────

function countWorkingDays(from: string, to: string): number {
  if (!from || !to) return 0
  const start = new Date(from + 'T00:00:00')
  const end   = new Date(to   + 'T00:00:00')
  if (end < start) return 0
  let count = 0; const cur = new Date(start)
  while (cur <= end) { const d = cur.getDay(); if (d !== 0 && d !== 6) count++; cur.setDate(cur.getDate() + 1) }
  return Math.max(count, 1)
}

function fmtDate(iso: string) {
  return new Date(iso + 'T00:00:00').toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
}

function fmtDateRange(from: string, to: string) {
  return from === to ? fmtDate(from) : `${fmtDate(from)} – ${fmtDate(to)}`
}

function timeAgo(iso: string) {
  const diff = Math.floor((Date.now() - new Date(iso).getTime()) / 1000)
  if (diff < 60)    return 'just now'
  if (diff < 3600)  return `${Math.floor(diff / 60)}m ago`
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`
  const days = Math.floor(diff / 86400)
  return days < 30 ? `${days}d ago` : fmtDate(iso.slice(0, 10))
}

// ── Apply Form ────────────────────────────────────────────────────────────────

type FormStep = 'reason' | 'details' | 'confirm'

interface FormState {
  template: ReasonTemplate | null
  type: LeaveType
  fromDate: string
  toDate: string
  details: string
}

function ApplyForm({
  employeeId,
  activePolicies,
  onSubmitted,
  onClose,
}: {
  employeeId:      string
  activePolicies:  LeaveBalance[]
  onSubmitted:     (req: LeaveRequest) => void
  onClose:         () => void
}) {
  const activeTypeSet = new Set(activePolicies.map((p) => p.leave_type))

  // Emergency is always first; then policy-based templates
  const policyTemplates = POLICY_TEMPLATES.filter((t) => activeTypeSet.has(t.suggestedType))
  const templates = [EMERGENCY_TEMPLATE, ...policyTemplates]

  const defaultType = activePolicies[0]?.leave_type ?? 'emergency'

  const [step, setStep] = React.useState<FormStep>('reason')
  const [form, setForm] = React.useState<FormState>({
    template: null, type: defaultType, fromDate: '', toDate: '', details: '',
  })
  const [saving, setSaving] = React.useState(false)
  const [error,  setError]  = React.useState<string | null>(null)

  const workingDays = countWorkingDays(form.fromDate, form.toDate)
  const today       = new Date().toISOString().slice(0, 10)
  const isEmergency = form.type === 'emergency'

  function selectTemplate(t: ReasonTemplate) {
    const type = t.suggestedType === 'emergency'
      ? 'emergency'
      : activeTypeSet.has(t.suggestedType)
        ? t.suggestedType
        : (activePolicies[0]?.leave_type ?? 'emergency')
    setForm((f) => ({ ...f, template: t, type, details: t.prefillReason }))
    setStep('details')
  }

  function handleDateChange(field: 'fromDate' | 'toDate', val: string) {
    setForm((f) => {
      const next = { ...f, [field]: val }
      if (field === 'fromDate' && next.toDate && next.toDate < val) next.toDate = val
      return next
    })
  }

  async function submit() {
    if (!form.fromDate || !form.toDate) { setError('Please select leave dates'); return }
    if (!form.details.trim()) { setError('Please provide a reason / details'); return }
    setSaving(true); setError(null)
    try {
      const r = await fetch('/api/leave-requests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          employee_id: employeeId,
          type: form.type,
          from_date: form.fromDate,
          to_date: form.toDate,
          days: workingDays,
          reason: form.details.trim(),
        }),
      })
      if (!r.ok) { const e = await r.json().catch(() => ({})); throw new Error(e?.error ?? 'Failed to submit') }
      onSubmitted(await r.json())
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Something went wrong')
    } finally { setSaving(false) }
  }

  return (
    <>
      <div className="fixed inset-0 z-40 bg-black/40 backdrop-blur-[2px]" onClick={onClose} />
      <aside className="fixed inset-y-0 right-0 z-50 flex w-full flex-col border-l border-border bg-surface shadow-2xl sm:max-w-xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-border px-6 py-4">
          <div>
            <h2 className="text-base font-semibold">Apply for Leave</h2>
            <p className="text-xs text-ink-soft">
              {step === 'reason' ? 'Step 1 of 3 — Choose reason' : step === 'details' ? 'Step 2 of 3 — Dates & details' : 'Step 3 of 3 — Review & submit'}
            </p>
          </div>
          <button type="button" onClick={onClose} className="grid size-8 place-items-center rounded-lg text-ink-soft hover:bg-surface-2">
            <X className="size-4" />
          </button>
        </div>

        {/* Progress bar */}
        <div className="h-1 bg-surface-2">
          <div className={cn('h-full transition-all', isEmergency ? 'bg-red-500' : 'bg-brand')}
            style={{ width: step === 'reason' ? '33%' : step === 'details' ? '66%' : '100%' }} />
        </div>

        <div className="flex-1 overflow-y-auto">

          {/* Step 1: Choose reason */}
          {step === 'reason' && (
            <div className="space-y-3 p-6">
              <p className="mb-2 text-sm text-ink-muted">Select the reason that best describes your leave request.</p>

              {/* Emergency — always first, distinct styling */}
              <button
                type="button"
                onClick={() => selectTemplate(EMERGENCY_TEMPLATE)}
                className="group flex w-full items-center gap-4 rounded-2xl border border-red-200 bg-red-50/60 px-4 py-3.5 text-left transition-all hover:border-red-300 hover:bg-red-50 dark:border-red-900/40 dark:bg-red-950/20"
              >
                <span className="grid size-11 shrink-0 place-items-center rounded-xl bg-red-100 dark:bg-red-900/30">
                  <AlertTriangle className="size-5 text-red-500" />
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-semibold text-red-700 dark:text-red-400">Emergency Leave</p>
                    <span className="rounded-full bg-red-100 px-2 py-px text-[10px] font-bold uppercase tracking-wider text-red-600 dark:bg-red-900/40 dark:text-red-400">
                      Salary Deductible
                    </span>
                  </div>
                  <p className="text-xs text-red-600/70 dark:text-red-400/60">Urgent unforeseen situation — salary deducted for these days</p>
                </div>
                <ChevronRight className="size-4 shrink-0 text-red-400/50 group-hover:text-red-500" />
              </button>

              {/* Policy-based leaves */}
              {policyTemplates.length > 0 && (
                <>
                  <div className="flex items-center gap-3 py-1">
                    <div className="h-px flex-1 bg-border" />
                    <span className="text-[10px] font-semibold uppercase tracking-wider text-ink-soft">Configured Leave Types</span>
                    <div className="h-px flex-1 bg-border" />
                  </div>
                  {policyTemplates.map((t) => (
                    <button key={t.id} type="button" onClick={() => selectTemplate(t)}
                      className="group flex w-full items-center gap-4 rounded-2xl border border-border bg-surface-2/30 px-4 py-3.5 text-left transition-all hover:border-brand/30 hover:bg-brand/5 hover:shadow-sm">
                      <span className={cn('grid size-11 shrink-0 place-items-center rounded-xl', t.iconBg)}>
                        <t.icon className={cn('size-5', t.iconColor)} />
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-semibold">{t.label}</p>
                        <p className="text-xs text-ink-soft">{t.sublabel}</p>
                      </div>
                      <ChevronRight className="size-4 shrink-0 text-ink-soft/50 group-hover:text-brand" />
                    </button>
                  ))}
                </>
              )}

              {policyTemplates.length === 0 && (
                <div className="flex items-start gap-3 rounded-xl border border-brand/20 bg-brand/5 px-4 py-3">
                  <Info className="mt-0.5 size-4 shrink-0 text-brand" />
                  <p className="text-xs text-ink-muted">
                    No leave types are currently configured by your admin. You can still apply for <strong>Emergency Leave</strong> which will be deducted from your salary.
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Step 2: Details */}
          {step === 'details' && form.template && (
            <div className="space-y-5 p-6">
              {/* Selected reason chip */}
              <div className={cn(
                'flex items-center gap-3 rounded-xl border px-4 py-3',
                isEmergency ? 'border-red-200 bg-red-50/50 dark:border-red-900/40 dark:bg-red-950/20' : 'border-border bg-surface-2/40'
              )}>
                <span className={cn('grid size-9 shrink-0 place-items-center rounded-xl', form.template.iconBg)}>
                  <form.template.icon className={cn('size-4', form.template.iconColor)} />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold">{form.template.label}</p>
                  <p className="text-xs text-ink-soft">{form.template.sublabel}</p>
                </div>
                <button type="button" onClick={() => setStep('reason')} className="text-xs font-medium text-brand hover:underline">Change</button>
              </div>

              {/* Emergency warning */}
              {isEmergency && (
                <div className="flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3 dark:border-red-900/40 dark:bg-red-950/20">
                  <AlertTriangle className="mt-0.5 size-4 shrink-0 text-red-500" />
                  <div>
                    <p className="text-sm font-semibold text-red-700 dark:text-red-400">Salary Deductible</p>
                    <p className="mt-0.5 text-xs text-red-600/80 dark:text-red-400/70">
                      Emergency leave days will be deducted from your salary in the payslip for this month. Your admin will review and approve the request.
                    </p>
                  </div>
                </div>
              )}

              {/* Leave type selector — only if non-emergency and policies exist */}
              {!isEmergency && activePolicies.length > 0 && (
                <div>
                  <label className="mb-1.5 block text-xs font-semibold text-ink-muted">
                    Leave Type <span className="font-normal text-ink-soft">(auto-selected based on reason)</span>
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {activePolicies.map(({ leave_type: key }) => {
                      const m = TYPE_STYLE[key]
                      return (
                        <button key={key} type="button" onClick={() => setForm((f) => ({ ...f, type: key }))}
                          className={cn('rounded-full border px-3 py-1 text-xs font-semibold transition-all', m.chip,
                            form.type === key ? 'ring-2 ring-brand/40 shadow-sm border-current/30' : 'border-transparent opacity-60 hover:opacity-100'
                          )}>
                          {form.type === key && <span className="mr-1">✓</span>}
                          {m.label}
                        </button>
                      )
                    })}
                  </div>
                </div>
              )}

              {/* Date range */}
              <div>
                <label className="mb-1.5 block text-xs font-semibold text-ink-muted">Leave Dates</label>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <p className="mb-1 text-[10px] uppercase tracking-wide text-ink-soft">From</p>
                    <input type="date" min={today} value={form.fromDate}
                      onChange={(e) => handleDateChange('fromDate', e.target.value)}
                      className="h-10 w-full rounded-xl border border-border bg-surface-2/50 px-3 text-sm outline-none focus:border-brand/50 focus:ring-1 focus:ring-brand/20" />
                  </div>
                  <div>
                    <p className="mb-1 text-[10px] uppercase tracking-wide text-ink-soft">To</p>
                    <input type="date" min={form.fromDate || today} value={form.toDate}
                      onChange={(e) => handleDateChange('toDate', e.target.value)}
                      className="h-10 w-full rounded-xl border border-border bg-surface-2/50 px-3 text-sm outline-none focus:border-brand/50 focus:ring-1 focus:ring-brand/20" />
                  </div>
                </div>
                {form.fromDate && form.toDate && (
                  <div className={cn('mt-2 flex items-center gap-2 rounded-lg border px-3 py-2',
                    isEmergency ? 'border-red-200 bg-red-50/50' : 'border-brand/20 bg-brand/5'
                  )}>
                    <Calendar className={cn('size-3.5', isEmergency ? 'text-red-500' : 'text-brand')} />
                    <p className="text-xs text-ink-muted">
                      <span className={cn('font-semibold', isEmergency ? 'text-red-600' : 'text-brand')}>
                        {workingDays} working day{workingDays !== 1 ? 's' : ''}
                      </span>
                      {' '}({fmtDateRange(form.fromDate, form.toDate)}) — weekends excluded
                    </p>
                  </div>
                )}
              </div>

              {/* Details */}
              <div>
                <label className="mb-1.5 block text-xs font-semibold text-ink-muted">Reason / Details <span className="text-coral">*</span></label>
                <textarea rows={5} value={form.details} onChange={(e) => setForm((f) => ({ ...f, details: e.target.value }))}
                  placeholder="Provide clear details about your leave request…"
                  className="w-full resize-none rounded-xl border border-border bg-surface-2/50 px-4 py-3 text-sm leading-relaxed outline-none placeholder:text-ink-soft/70 focus:border-brand/50 focus:ring-1 focus:ring-brand/20" />
                <p className="mt-1 text-right text-[10px] text-ink-soft">{form.details.length}/2000</p>
              </div>

              <div className="flex items-start gap-3 rounded-xl border border-amber/20 bg-amber/5 px-4 py-3">
                <Info className="mt-0.5 size-4 shrink-0 text-amber" />
                <p className="text-xs leading-relaxed text-ink-muted">
                  Leave requests are reviewed by your admin. You will be notified once the status is updated.
                </p>
              </div>
            </div>
          )}

          {/* Step 3: Confirm */}
          {step === 'confirm' && form.template && (
            <div className="space-y-4 p-6">
              <div className="overflow-hidden rounded-2xl border border-border bg-surface-2/30">
                <div className="border-b border-border bg-surface-2/40 px-5 py-4">
                  <p className="text-xs font-semibold uppercase tracking-wider text-ink-soft">Review your request</p>
                </div>
                <div className="divide-y divide-border">
                  <ReviewRow label="Reason">
                    <div className="flex items-center gap-2">
                      <span className={cn('grid size-6 place-items-center rounded-lg', form.template.iconBg)}>
                        <form.template.icon className={cn('size-3.5', form.template.iconColor)} />
                      </span>
                      <span className="text-sm font-medium">{form.template.label}</span>
                    </div>
                  </ReviewRow>
                  <ReviewRow label="Leave Type">
                    <span className={cn('rounded-full px-2.5 py-0.5 text-xs font-semibold', TYPE_STYLE[form.type].chip)}>
                      {TYPE_STYLE[form.type].label}
                    </span>
                  </ReviewRow>
                  <ReviewRow label="Duration">
                    <div>
                      <p className={cn('text-sm font-semibold', isEmergency ? 'text-red-600' : 'text-brand')}>
                        {workingDays} working day{workingDays !== 1 ? 's' : ''}
                      </p>
                      <p className="text-xs text-ink-soft">{fmtDateRange(form.fromDate, form.toDate)}</p>
                    </div>
                  </ReviewRow>
                  <ReviewRow label="Details">
                    <p className="max-w-xs text-sm leading-relaxed text-ink-muted">{form.details || '—'}</p>
                  </ReviewRow>
                </div>
              </div>

              {isEmergency && (
                <div className="flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3 dark:border-red-900/40 dark:bg-red-950/20">
                  <AlertTriangle className="mt-0.5 size-4 shrink-0 text-red-500" />
                  <p className="text-xs text-red-600/80 dark:text-red-400/70">
                    <strong>Salary deduction:</strong> {workingDays} day{workingDays !== 1 ? 's' : ''} of emergency leave will be deducted from your payslip once approved.
                  </p>
                </div>
              )}

              {!isEmergency && (
                <div className="flex items-start gap-3 rounded-xl border border-emerald/20 bg-emerald/5 px-4 py-3">
                  <Check className="mt-0.5 size-4 shrink-0 text-emerald" />
                  <p className="text-xs text-ink-muted">Once submitted, the request will be sent to your admin for review.</p>
                </div>
              )}

              {error && (
                <div className="flex items-start gap-3 rounded-xl border border-coral/20 bg-coral/5 px-4 py-3">
                  <AlertCircle className="mt-0.5 size-4 shrink-0 text-coral" />
                  <p className="text-sm text-coral">{error}</p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="border-t border-border p-6 pt-4">
          {step === 'reason' && (
            <button type="button" onClick={onClose} className="w-full rounded-xl border border-border py-2.5 text-sm font-medium text-ink-muted hover:bg-surface-2">Cancel</button>
          )}
          {step === 'details' && (
            <div className="flex gap-3">
              <button type="button" onClick={() => setStep('reason')} className="flex-1 rounded-xl border border-border py-2.5 text-sm font-medium text-ink-muted hover:bg-surface-2">← Back</button>
              <button type="button" disabled={!form.fromDate || !form.toDate || !form.details.trim()}
                onClick={() => { setError(null); setStep('confirm') }}
                className={cn('flex-1 rounded-xl py-2.5 text-sm font-medium text-white shadow-sm hover:opacity-90 disabled:opacity-40',
                  isEmergency ? 'bg-red-500' : 'bg-brand'
                )}>Review →</button>
            </div>
          )}
          {step === 'confirm' && (
            <div className="flex gap-3">
              <button type="button" onClick={() => setStep('details')} className="flex-1 rounded-xl border border-border py-2.5 text-sm font-medium text-ink-muted hover:bg-surface-2">← Edit</button>
              <button type="button" disabled={saving} onClick={submit}
                className={cn('flex flex-1 items-center justify-center gap-2 rounded-xl py-2.5 text-sm font-medium text-white shadow-sm hover:opacity-90 disabled:opacity-50',
                  isEmergency ? 'bg-red-500' : 'bg-brand'
                )}>
                {saving && <Loader2 className="size-4 animate-spin" />}
                Submit Request
              </button>
            </div>
          )}
        </div>
      </aside>
    </>
  )
}

// ── Request detail drawer ─────────────────────────────────────────────────────

function RequestDetail({ req, onClose, onCancelled }: { req: LeaveRequest; onClose: () => void; onCancelled: (id: string) => void }) {
  const [cancelling,  setCancelling]  = React.useState(false)
  const [error,       setError]       = React.useState<string | null>(null)
  const [localStatus, setLocalStatus] = React.useState<LeaveStatus>(req.status)

  async function cancel() {
    if (!confirm('Cancel this leave request? This cannot be undone.')) return
    setCancelling(true); setError(null)
    try {
      const r = await fetch(`/api/leave-requests/${req.id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ status: 'cancelled' }) })
      if (!r.ok) throw new Error('Failed to cancel')
      setLocalStatus('cancelled'); onCancelled(req.id)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to cancel')
    } finally { setCancelling(false) }
  }

  const sm         = STATUS_META[localStatus]
  const ts         = TYPE_STYLE[req.type] ?? TYPE_STYLE.other
  const StatusIcon = sm.icon
  const isEmergency = req.type === 'emergency'

  return (
    <>
      <div className="fixed inset-0 z-40 bg-black/40 backdrop-blur-[2px]" onClick={onClose} />
      <aside className="fixed inset-y-0 right-0 z-50 flex w-full flex-col border-l border-border bg-surface shadow-2xl sm:max-w-lg">
        <div className="flex items-center justify-between border-b border-border px-6 py-4">
          <div className="flex items-center gap-3">
            <span className={cn('inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold', sm.chip)}>
              <StatusIcon className="size-3" />{sm.label}
            </span>
            <span className={cn('rounded-full px-2.5 py-1 text-xs font-semibold', ts.chip)}>{ts.label}</span>
            {isEmergency && (
              <span className="rounded-full bg-red-100 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-red-600">
                Salary Deductible
              </span>
            )}
          </div>
          <button type="button" onClick={onClose} className="grid size-8 place-items-center rounded-lg text-ink-soft hover:bg-surface-2"><X className="size-4" /></button>
        </div>

        <div className="flex-1 space-y-5 overflow-y-auto p-6">
          <div className={cn('rounded-2xl border px-5 py-4 text-center', isEmergency ? 'border-red-200 bg-red-50/50' : 'border-border bg-surface-2/40')}>
            <p className={cn('text-3xl font-bold tracking-tight', isEmergency ? 'text-red-600' : 'text-brand')}>{req.days}</p>
            <p className="text-sm text-ink-muted">working day{req.days !== 1 ? 's' : ''}</p>
            <p className="mt-1 text-xs text-ink-soft">{fmtDateRange(req.from_date, req.to_date)}</p>
          </div>

          <div className="space-y-3">
            <DetailRow label="Leave Type"><span className={cn('rounded-full px-2.5 py-0.5 text-xs font-semibold', ts.chip)}>{ts.label}</span></DetailRow>
            <DetailRow label="From Date"><span className="text-sm font-medium">{fmtDate(req.from_date)}</span></DetailRow>
            <DetailRow label="To Date"><span className="text-sm font-medium">{fmtDate(req.to_date)}</span></DetailRow>
            <DetailRow label="Submitted"><span className="text-sm text-ink-muted">{timeAgo(req.created_at)}</span></DetailRow>
          </div>

          {isEmergency && (
            <div className="flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3 dark:border-red-900/40 dark:bg-red-950/20">
              <AlertTriangle className="mt-0.5 size-4 shrink-0 text-red-500" />
              <p className="text-xs text-red-600/80 dark:text-red-400/70">
                Emergency leave is unpaid. If approved, these days will be deducted from your salary in this month's payslip.
              </p>
            </div>
          )}

          {req.reason && (
            <div>
              <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-ink-soft">Your Reason</p>
              <div className="rounded-xl border border-border bg-surface-2/30 px-4 py-3">
                <p className="text-sm leading-relaxed text-ink-muted">{req.reason}</p>
              </div>
            </div>
          )}

          {(req.admin_note || req.reviewed_by || localStatus === 'approved' || localStatus === 'rejected') && (
            <div>
              <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-ink-soft">Admin Response</p>
              <div className={cn('space-y-2 rounded-xl border px-4 py-3', localStatus === 'approved' ? 'border-emerald/20 bg-emerald/5' : 'border-coral/20 bg-coral/5')}>
                <div className="flex items-center gap-2">
                  <MessageSquare className={cn('size-4', localStatus === 'approved' ? 'text-emerald' : 'text-coral')} />
                  <span className={cn('text-xs font-semibold', localStatus === 'approved' ? 'text-emerald' : 'text-coral')}>
                    {localStatus === 'approved' ? 'Approved' : 'Rejected'}
                    {req.reviewed_by ? ` by ${req.reviewed_by}` : ''}
                    {req.reviewed_at ? ` · ${timeAgo(req.reviewed_at)}` : ''}
                  </span>
                </div>
                {req.admin_note && <p className="text-sm leading-relaxed text-ink-muted">{req.admin_note}</p>}
              </div>
            </div>
          )}

          {localStatus === 'pending' && (
            <div className="flex items-start gap-3 rounded-xl border border-amber/20 bg-amber/5 px-4 py-3">
              <Clock className="mt-0.5 size-4 shrink-0 text-amber" />
              <p className="text-xs text-ink-muted">Your request is pending review. You can cancel it if your plans change.</p>
            </div>
          )}

          {error && (
            <div className="flex items-start gap-3 rounded-xl border border-coral/20 bg-coral/5 px-4 py-3">
              <AlertCircle className="mt-0.5 size-4 shrink-0 text-coral" />
              <p className="text-sm text-coral">{error}</p>
            </div>
          )}
        </div>

        {localStatus === 'pending' && (
          <div className="border-t border-border p-6 pt-4">
            <button type="button" onClick={cancel} disabled={cancelling}
              className="flex w-full items-center justify-center gap-2 rounded-xl border border-coral/30 bg-coral/5 py-2.5 text-sm font-medium text-coral hover:bg-coral/10 disabled:opacity-50">
              {cancelling ? <Loader2 className="size-4 animate-spin" /> : <XCircle className="size-4" />}
              Cancel Request
            </button>
          </div>
        )}
      </aside>
    </>
  )
}

// ── Main Page ─────────────────────────────────────────────────────────────────

export default function LeavePage() {
  const employee = useEmployee()

  const [requests,     setRequests]     = React.useState<LeaveRequest[]>([])
  const [policies,     setPolicies]     = React.useState<LeaveBalance[]>([])
  const [loading,      setLoading]      = React.useState(true)
  const [applying,     setApplying]     = React.useState(false)
  const [selected,     setSelected]     = React.useState<LeaveRequest | null>(null)
  const [statusFilter, setStatusFilter] = React.useState<LeaveStatus | 'all'>('all')
  const [successMsg,   setSuccessMsg]   = React.useState<string | null>(null)

  const load = React.useCallback(async () => {
    if (!employee.id) { setLoading(false); return }
    setLoading(true)
    try {
      const [rRes, pRes] = await Promise.all([
        fetch(`/api/leave-requests?employee_id=${employee.id}`),
        fetch(`/api/leave-entitlements?employee_id=${employee.id}`),
      ])
      const [rData, pData] = await Promise.all([rRes.json(), pRes.json()])

      const pArr      = Array.isArray(pData) ? pData as LeaveBalance[] : []
      const activeSet = new Set(pArr.map((p) => p.leave_type))
      setPolicies(pArr)

      // Show all requests; include emergency even if no policy
      const allRequests = Array.isArray(rData) ? rData as LeaveRequest[] : []
      setRequests(allRequests.filter((r) => r.type === 'emergency' || activeSet.has(r.type) || activeSet.size === 0))
    } catch {
      // Keep existing state; will show empty
    } finally {
      setLoading(false)
    }
  }, [employee.id])

  React.useEffect(() => { load() }, [load])

  // Derived stats
  const totalUsed = policies.reduce((s, p) => s + p.used_days, 0)
  const totalLeft = policies.reduce((s, p) => s + p.remaining, 0)

  const thisYear          = new Date().getFullYear().toString()
  const thisYearRequests  = requests.filter((r) => r.from_date.startsWith(thisYear))
  const pending           = requests.filter((r) => r.status === 'pending').length
  const approved          = thisYearRequests.filter((r) => r.status === 'approved').length
  const emergencyPending  = requests.filter((r) => r.type === 'emergency' && r.status === 'pending').length

  const visible = requests.filter((r) => statusFilter === 'all' || r.status === statusFilter)

  function onSubmitted(req: LeaveRequest) {
    setRequests((p) => [req, ...p])
    setApplying(false)
    const ts = TYPE_STYLE[req.type]
    setSuccessMsg(`Your ${ts.label} leave request for ${req.days} day${req.days !== 1 ? 's' : ''} has been submitted for review.`)
    setTimeout(() => setSuccessMsg(null), 6000)
    load()
  }

  function onCancelled(id: string) {
    setRequests((p) => p.map((r) => r.id === id ? { ...r, status: 'cancelled' } : r))
    setSelected(null)
    load()
  }

  return (
    <>
      <EmployeeTopbar
        title="My Leave"
        breadcrumb={[{ label: 'Home' }, { label: 'Leave' }]}
        subtitle={
          policies.length > 0
            ? `${totalUsed} days used · ${totalLeft} days remaining`
            : 'Emergency leave always available'
        }
      />

      <main className="space-y-5 px-4 py-4 sm:px-6 sm:py-6">

        {/* Success banner */}
        {successMsg && (
          <div className="flex items-center gap-3 rounded-xl border border-emerald/20 bg-emerald/5 px-4 py-3">
            <Check className="size-5 shrink-0 text-emerald" />
            <p className="flex-1 text-sm text-ink-muted">{successMsg}</p>
            <button type="button" onClick={() => setSuccessMsg(null)} className="text-ink-soft hover:text-ink"><X className="size-4" /></button>
          </div>
        )}

        {/* ── Leave Balance Card ── */}
        <div className="overflow-hidden rounded-2xl border border-border bg-surface shadow-card">
          <div className="flex items-center justify-between border-b border-border px-5 py-4">
            <div>
              <h2 className="text-base font-semibold">Leave Balance</h2>
              <p className="text-xs text-ink-soft">Based on your company leave policy · {new Date().getFullYear()}</p>
            </div>
            {/* Apply button is ALWAYS visible */}
            <button
              type="button"
              onClick={() => setApplying(true)}
              className="inline-flex h-9 items-center gap-1.5 rounded-xl bg-brand px-4 text-sm font-medium text-brand-foreground shadow-sm hover:opacity-90"
            >
              <PlusCircle className="size-4" /> Apply for Leave
            </button>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="size-5 animate-spin text-brand" />
            </div>
          ) : policies.length === 0 ? (
            /* No configured policies — but emergency is always available */
            <div className="space-y-3 px-5 py-6">
              <div className="flex items-start gap-3 rounded-xl border border-amber/20 bg-amber/5 px-4 py-3">
                <Info className="mt-0.5 size-4 shrink-0 text-amber" />
                <p className="text-sm text-ink-muted">
                  No leave policies are configured yet. Contact your admin to set up leave entitlements.
                </p>
              </div>
              {/* Emergency leave is always available */}
              <div className="flex items-center gap-4 rounded-xl border border-red-200 bg-red-50/50 px-4 py-3 dark:border-red-900/40 dark:bg-red-950/20">
                <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-red-100 dark:bg-red-900/30">
                  <AlertTriangle className="size-5 text-red-500" />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold text-red-700 dark:text-red-400">Emergency Leave — Always Available</p>
                  <p className="text-xs text-red-600/70 dark:text-red-400/60">
                    Tap "Apply for Leave" to submit an emergency request. These days will be deducted from your salary.
                  </p>
                </div>
                {emergencyPending > 0 && (
                  <span className="rounded-full bg-red-500 px-2 py-0.5 text-xs font-bold text-white">{emergencyPending}</span>
                )}
              </div>
            </div>
          ) : (
            <>
              {/* Dynamic balance grid */}
              <div className={cn(
                'grid gap-5 px-5 py-5',
                policies.length === 1 ? 'grid-cols-1 max-w-xs' :
                policies.length === 2 ? 'grid-cols-2' :
                policies.length <= 4  ? 'sm:grid-cols-2 lg:grid-cols-4' :
                'sm:grid-cols-3 lg:grid-cols-6'
              )}>
                {policies.map((bal) => {
                  const ts        = TYPE_STYLE[bal.leave_type] ?? TYPE_STYLE.other
                  const pct       = bal.total_days > 0 ? Math.min(Math.round((bal.used_days / bal.total_days) * 100), 100) : 0
                  const isMonthly = bal.accrual_type === 'monthly'
                  return (
                    <div key={bal.leave_type} className="space-y-2">
                      <div className="flex items-center justify-between text-xs">
                        <span className={cn('rounded-full px-2 py-0.5 text-[10px] font-semibold', ts.chip)}>{ts.label}</span>
                        <span className="text-ink-soft">
                          <span className="font-semibold text-ink">{bal.remaining}</span>/{bal.total_days}
                        </span>
                      </div>
                      <div className="h-2 w-full rounded-full bg-surface-2">
                        <div className={cn('h-full rounded-full transition-all', ts.bar)} style={{ width: `${pct}%` }} />
                      </div>
                      <p className="text-[10px] text-ink-soft">
                        {bal.used_days} used · {isMonthly ? `${new Date().getMonth() + 1}/12 mo` : `${bal.total_days} days/yr`}
                      </p>
                    </div>
                  )
                })}
              </div>

              {/* Emergency leave info strip */}
              <div className="mx-5 mb-4 flex items-center gap-3 rounded-xl border border-red-100 bg-red-50/40 px-4 py-2.5 dark:border-red-900/30 dark:bg-red-950/10">
                <AlertTriangle className="size-3.5 shrink-0 text-red-400" />
                <p className="text-xs text-red-600/70 dark:text-red-400/60">
                  <strong className="text-red-700 dark:text-red-400">Emergency Leave</strong> is also available — tap "Apply for Leave". These days will be salary-deducted.
                </p>
              </div>

              {/* Stats strip */}
              <div className="grid grid-cols-3 divide-x divide-border border-t border-border">
                {[
                  { label: 'Pending Review', value: pending,   accent: 'text-amber'   },
                  { label: 'Approved (yr)',  value: approved,  accent: 'text-emerald' },
                  { label: 'Days Taken',     value: totalUsed, accent: 'text-brand'   },
                ].map((s) => (
                  <div key={s.label} className="py-3 text-center">
                    <p className={cn('text-xl font-bold', s.accent)}>{s.value}</p>
                    <p className="text-[11px] text-ink-soft">{s.label}</p>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>

        {/* ── Request history ── */}
        <div className="overflow-hidden rounded-2xl border border-border bg-surface shadow-card">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border px-5 py-4">
            <div>
              <h2 className="text-base font-semibold">My Requests</h2>
              <p className="text-xs text-ink-soft">{visible.length} request{visible.length !== 1 ? 's' : ''}</p>
            </div>
            <div className="flex items-center gap-2">
              <div className="flex gap-1 rounded-xl border border-border bg-surface-2/40 p-1">
                {([
                  { key: 'all',       label: 'All'       },
                  { key: 'pending',   label: 'Pending'   },
                  { key: 'approved',  label: 'Approved'  },
                  { key: 'rejected',  label: 'Rejected'  },
                  { key: 'cancelled', label: 'Cancelled' },
                ] as { key: LeaveStatus | 'all'; label: string }[]).map((f) => (
                  <button key={f.key} type="button" onClick={() => setStatusFilter(f.key)}
                    className={cn('whitespace-nowrap rounded-lg px-3 py-1.5 text-xs font-medium transition-colors',
                      statusFilter === f.key ? 'bg-surface text-ink shadow-sm' : 'text-ink-soft hover:text-ink'
                    )}>
                    {f.label}
                  </button>
                ))}
              </div>
              <button type="button" onClick={load} className="grid size-8 place-items-center rounded-lg border border-border text-ink-soft hover:bg-surface-2">
                <RefreshCcw className="size-3.5" />
              </button>
            </div>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-16"><Loader2 className="size-5 animate-spin text-brand" /></div>
          ) : visible.length === 0 ? (
            <div className="py-16 text-center">
              <CalendarOff className="mx-auto mb-3 size-10 text-ink-soft/30" />
              <p className="text-sm font-medium text-ink-muted">No requests found.</p>
              <button type="button" onClick={() => setApplying(true)}
                className="mt-4 inline-flex items-center gap-1.5 rounded-xl bg-brand px-4 py-2 text-sm font-medium text-brand-foreground shadow-sm hover:opacity-90">
                <PlusCircle className="size-4" /> Apply for Leave
              </button>
            </div>
          ) : (
            <ul className="divide-y divide-border">
              {visible.map((req) => {
                const sm         = STATUS_META[req.status]
                const ts         = TYPE_STYLE[req.type] ?? TYPE_STYLE.other
                const StatusIcon = sm.icon
                const isEmergency = req.type === 'emergency'
                return (
                  <li key={req.id}
                    className="group flex cursor-pointer items-start gap-4 px-5 py-4 transition-colors hover:bg-surface-2/50"
                    onClick={() => setSelected(req)}>
                    <span className={cn('mt-0.5 grid size-10 shrink-0 place-items-center rounded-xl', ts.chip)}>
                      {isEmergency ? <AlertTriangle className="size-5" /> : <CalendarOff className="size-5" />}
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-start gap-2">
                        <p className="flex-1 text-sm font-semibold">
                          {ts.label} Leave
                          <span className="ml-2 text-xs font-normal text-ink-soft">· {req.days} day{req.days !== 1 ? 's' : ''}</span>
                        </p>
                        {isEmergency && (
                          <span className="rounded-full bg-red-100 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-red-600">
                            Salary Deductible
                          </span>
                        )}
                        <span className={cn('inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold', sm.chip)}>
                          <StatusIcon className="size-3" />{sm.label}
                        </span>
                      </div>
                      <p className="mt-0.5 text-xs text-ink-soft">
                        <Calendar className="mr-1 inline size-3" />
                        {fmtDateRange(req.from_date, req.to_date)}
                      </p>
                      {req.reason && (
                        <p className="mt-1 line-clamp-1 text-xs italic text-ink-soft">&quot;{req.reason}&quot;</p>
                      )}
                      {req.admin_note && (
                        <p className={cn('mt-1 text-xs font-medium', req.status === 'approved' ? 'text-emerald' : 'text-coral')}>
                          Admin: {req.admin_note}
                        </p>
                      )}
                    </div>
                    <div className="shrink-0 text-right">
                      <p className="text-[10px] text-ink-soft">{timeAgo(req.created_at)}</p>
                      <ChevronRight className="mt-2 size-4 text-ink-soft/40 group-hover:text-brand" />
                    </div>
                  </li>
                )
              })}
            </ul>
          )}
        </div>
      </main>

      {applying && (
        <ApplyForm
          employeeId={employee.id}
          activePolicies={policies}
          onSubmitted={onSubmitted}
          onClose={() => setApplying(false)}
        />
      )}

      {selected && (
        <RequestDetail req={selected} onClose={() => setSelected(null)} onCancelled={onCancelled} />
      )}
    </>
  )
}

// ── Sub-components ────────────────────────────────────────────────────────────

function ReviewRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-start justify-between gap-4 px-5 py-3">
      <span className="shrink-0 text-xs font-medium text-ink-soft">{label}</span>
      <div className="text-right">{children}</div>
    </div>
  )
}

function DetailRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between rounded-xl border border-border bg-surface-2/30 px-4 py-3">
      <span className="text-xs font-semibold text-ink-soft">{label}</span>
      {children}
    </div>
  )
}
