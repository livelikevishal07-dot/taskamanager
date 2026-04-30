'use client'

import * as React from 'react'
import {
  CalendarRange,
  Check,
  ChevronRight,
  Clock,
  Loader2,
  MessageSquare,
  Pencil,
  Save,
  Trash2,
  User,
  X,
} from 'lucide-react'

import { Drawer } from '@/components/ui/drawer'
import { Avatar } from '@/components/ui/avatar'
import { cn } from '@/lib/utils'
import type { LeaveRequestWithEmployee, LeaveStatus, LeaveType } from '@/lib/db/leave-requests'

// ── Constants ──────────────────────────────────────────────────────────────

export const LEAVE_TYPE_META: Record<LeaveType, { label: string; chip: string; dot: string }> = {
  casual:     { label: 'Casual',     chip: 'bg-sky/15 text-sky',         dot: 'bg-sky' },
  sick:       { label: 'Sick',       chip: 'bg-coral/15 text-coral',     dot: 'bg-coral' },
  annual:     { label: 'Annual',     chip: 'bg-emerald/15 text-emerald', dot: 'bg-emerald' },
  maternity:  { label: 'Maternity',  chip: 'bg-violet/15 text-violet',   dot: 'bg-violet' },
  paternity:  { label: 'Paternity',  chip: 'bg-indigo/15 text-indigo',   dot: 'bg-indigo' },
  unpaid:     { label: 'Unpaid',     chip: 'bg-amber/15 text-amber',     dot: 'bg-amber' },
  other:      { label: 'Other',      chip: 'bg-ink-soft/15 text-ink-muted', dot: 'bg-ink-soft' },
}

export const STATUS_META: Record<LeaveStatus, {
  label: string; chip: string; dot: string
  activeChip: string; icon: React.ElementType
}> = {
  pending:   { label: 'Pending',   dot: 'bg-amber',   chip: 'border-border bg-surface text-ink-muted', activeChip: 'border-amber/40 bg-amber/10 text-amber',   icon: Clock },
  approved:  { label: 'Approved',  dot: 'bg-emerald', chip: 'border-border bg-surface text-ink-muted', activeChip: 'border-emerald/40 bg-emerald/10 text-emerald', icon: Check },
  rejected:  { label: 'Rejected',  dot: 'bg-coral',   chip: 'border-border bg-surface text-ink-muted', activeChip: 'border-coral/40 bg-coral/10 text-coral',   icon: X },
  cancelled: { label: 'Cancelled', dot: 'bg-ink-soft', chip: 'border-border bg-surface text-ink-muted', activeChip: 'border-ink-soft/40 bg-ink-soft/10 text-ink-muted', icon: X },
}

// ── Helpers ────────────────────────────────────────────────────────────────

function formatDate(iso: string) {
  return new Intl.DateTimeFormat(undefined, { day: 'numeric', month: 'short', year: 'numeric' })
    .format(new Date(`${iso}T12:00:00`))
}

function timeAgo(iso: string) {
  const diff = Date.now() - new Date(iso).getTime()
  const mins = Math.floor(diff / 60_000)
  if (mins < 1) return 'just now'
  if (mins < 60) return `${mins}m ago`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs}h ago`
  return `${Math.floor(hrs / 24)}d ago`
}

// ── Props ──────────────────────────────────────────────────────────────────

interface Props {
  open: boolean
  onClose: () => void
  request: LeaveRequestWithEmployee | null
  onUpdated: (req: LeaveRequestWithEmployee) => void
  onDeleted: (id: string) => void
  onEdit: (req: LeaveRequestWithEmployee) => void
}

// ── Component ──────────────────────────────────────────────────────────────

export function LeaveDetailDrawer({ open, onClose, request, onUpdated, onDeleted, onEdit }: Props) {
  const [adminNote, setAdminNote] = React.useState('')
  const [reviewedBy, setReviewedBy] = React.useState('')
  const [updatingStatus, setUpdatingStatus] = React.useState<LeaveStatus | null>(null)

  React.useEffect(() => {
    if (request) {
      setAdminNote(request.admin_note ?? '')
      setReviewedBy(request.reviewed_by ?? '')
    }
  }, [request])

  if (!request) return null

  const typeMeta = LEAVE_TYPE_META[request.type]
  const statusMeta = STATUS_META[request.status]

  async function handleStatusChange(status: LeaveStatus) {
    if (updatingStatus) return
    setUpdatingStatus(status)
    try {
      const res = await fetch(`/api/leave-requests/${request!.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status,
          admin_note: adminNote.trim() || null,
          reviewed_by: reviewedBy.trim() || null,
          reviewed_at: new Date().toISOString(),
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data?.error ?? 'Failed')
      onUpdated(data as LeaveRequestWithEmployee)
    } catch {
      // silently ignore
    } finally {
      setUpdatingStatus(null)
    }
  }

  async function handleDelete() {
    if (!window.confirm(`Delete this leave request from ${request!.employee?.full_name ?? 'employee'}?`)) return
    try {
      await fetch(`/api/leave-requests/${request!.id}`, { method: 'DELETE' })
      onDeleted(request!.id)
      onClose()
    } catch {
      // silently ignore
    }
  }

  const isPending = request.status === 'pending'

  const footer = (
    <div className="flex w-full items-center justify-between">
      <button type="button" onClick={handleDelete}
        className="inline-flex h-10 items-center gap-1.5 rounded-xl border border-coral/30 px-3 text-sm font-medium text-coral hover:bg-coral/10"
      >
        <Trash2 className="size-4" />
        Delete
      </button>
      <div className="flex gap-2">
        <button type="button" onClick={onClose}
          className="inline-flex h-10 items-center rounded-xl border border-border px-4 text-sm font-medium text-ink-muted hover:bg-surface-2"
        >
          Close
        </button>
        <button type="button" onClick={() => onEdit(request)}
          className="inline-flex h-10 items-center gap-1.5 rounded-xl bg-brand px-4 text-sm font-medium text-brand-foreground shadow-sm hover:opacity-90"
        >
          <Pencil className="size-4" />
          Edit
        </button>
      </div>
    </div>
  )

  return (
    <Drawer open={open} onClose={onClose} title="Leave Request" size="lg" footer={footer}>
      <div className="space-y-6">

        {/* ── Employee info ── */}
        <div className="flex items-center gap-4 rounded-2xl border border-border bg-surface-2/40 p-4">
          <Avatar name={request.employee?.full_name ?? '?'} size="lg" className="size-14 text-lg shrink-0" />
          <div className="min-w-0 flex-1">
            <p className="text-base font-semibold">{request.employee?.full_name ?? 'Unknown'}</p>
            <p className="text-sm text-ink-muted">
              {request.employee?.department?.name ?? 'No department'}
              {request.employee?.role?.name ? ` · ${request.employee.role.name}` : ''}
            </p>
            <p className="mt-1 text-xs text-ink-soft">{request.employee?.email ?? ''}</p>
          </div>
          {/* Leave type badge */}
          <span className={cn('shrink-0 inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-sm font-semibold', typeMeta.chip)}>
            <span className={cn('size-2 rounded-full', typeMeta.dot)} />
            {typeMeta.label} Leave
          </span>
        </div>

        {/* ── Leave details ── */}
        <Section label="Leave Details">
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <InfoBox label="From" value={formatDate(request.from_date)} icon={CalendarRange} />
            <InfoBox label="To" value={formatDate(request.to_date)} icon={CalendarRange} />
            <InfoBox label="Duration" value={`${request.days} day${request.days !== 1 ? 's' : ''}`} icon={Clock} />
            <InfoBox label="Applied" value={timeAgo(request.created_at)} icon={User} />
          </div>
        </Section>

        {/* ── Reason ── */}
        {request.reason && (
          <Section label="Reason">
            <div className="rounded-xl border border-border bg-surface-2/40 px-4 py-3">
              <p className="whitespace-pre-wrap text-sm text-ink-muted leading-relaxed">{request.reason}</p>
            </div>
          </Section>
        )}

        {/* ── Status ── */}
        <Section label="Status">
          <div className="flex flex-wrap gap-2">
            {(Object.entries(STATUS_META) as [LeaveStatus, typeof STATUS_META[LeaveStatus]][]).map(([key, cfg]) => {
              const isActive = request.status === key
              const Icon = cfg.icon
              return (
                <button key={key} type="button"
                  disabled={!!updatingStatus || key === 'cancelled'}
                  onClick={() => handleStatusChange(key)}
                  className={cn(
                    'inline-flex h-9 items-center gap-1.5 rounded-xl border px-3 text-sm font-semibold transition-colors disabled:opacity-50',
                    isActive ? cfg.activeChip : cn(cfg.chip, 'hover:bg-surface-2')
                  )}
                >
                  <span className={cn('size-2 rounded-full', cfg.dot)} />
                  {cfg.label}
                  {isActive && updatingStatus === key && <Loader2 className="size-3.5 animate-spin" />}
                </button>
              )
            })}
          </div>
        </Section>

        {/* ── Admin review ── */}
        <Section label="Admin Review" right={
          request.reviewed_at ? (
            <span className="text-xs text-ink-soft">Reviewed {timeAgo(request.reviewed_at)}</span>
          ) : undefined
        }>
          <div className="space-y-3">
            <div>
              <label className="mb-1 block text-xs font-medium text-ink-muted">Reviewed by</label>
              <input
                type="text"
                value={reviewedBy}
                onChange={(e) => setReviewedBy(e.target.value)}
                placeholder="Your name…"
                className="h-9 w-full rounded-xl border border-border bg-surface px-3 text-sm placeholder:text-ink-soft focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/20"
              />
            </div>
            <div>
              <label className="mb-1 flex items-center gap-1.5 text-xs font-medium text-ink-muted">
                <MessageSquare className="size-3.5" /> Admin note (optional)
              </label>
              <textarea
                value={adminNote}
                onChange={(e) => setAdminNote(e.target.value)}
                rows={3}
                placeholder="Add a note for the employee…"
                className="w-full resize-none rounded-xl border border-border bg-surface px-3 py-2.5 text-sm placeholder:text-ink-soft focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/20"
              />
            </div>

            {/* Quick approve/reject */}
            {isPending && (
              <div className="flex gap-2">
                <button type="button" onClick={() => handleStatusChange('approved')} disabled={!!updatingStatus}
                  className="inline-flex flex-1 h-10 items-center justify-center gap-1.5 rounded-xl bg-emerald/15 font-medium text-emerald hover:bg-emerald/25 disabled:opacity-60 text-sm"
                >
                  {updatingStatus === 'approved' ? <Loader2 className="size-4 animate-spin" /> : <Check className="size-4" />}
                  Approve
                </button>
                <button type="button" onClick={() => handleStatusChange('rejected')} disabled={!!updatingStatus}
                  className="inline-flex flex-1 h-10 items-center justify-center gap-1.5 rounded-xl bg-coral/10 font-medium text-coral hover:bg-coral/20 disabled:opacity-60 text-sm"
                >
                  {updatingStatus === 'rejected' ? <Loader2 className="size-4 animate-spin" /> : <X className="size-4" />}
                  Reject
                </button>
              </div>
            )}
          </div>
        </Section>

        {/* ── Previous admin note (read-only if already reviewed) ── */}
        {!isPending && request.admin_note && (
          <div className="rounded-xl border border-border bg-surface-2/40 px-4 py-3">
            <p className="mb-1 text-xs font-semibold text-ink-soft uppercase tracking-wider">Admin Note</p>
            <p className="text-sm text-ink-muted leading-relaxed">{request.admin_note}</p>
            {request.reviewed_by && (
              <p className="mt-2 text-xs text-ink-soft">— {request.reviewed_by}</p>
            )}
          </div>
        )}

        {/* ── Timeline ── */}
        <Section label="Timeline">
          <ol className="space-y-3">
            <TimelineItem
              label="Request submitted"
              time={request.created_at}
              dot="bg-brand"
            />
            {request.reviewed_at && (
              <TimelineItem
                label={`${STATUS_META[request.status].label} by ${request.reviewed_by ?? 'admin'}`}
                time={request.reviewed_at}
                dot={STATUS_META[request.status].dot}
              />
            )}
          </ol>
        </Section>

      </div>
    </Drawer>
  )
}

// ── Helpers ────────────────────────────────────────────────────────────────

function Section({ label, right, children }: {
  label: string; right?: React.ReactNode; children: React.ReactNode
}) {
  return (
    <div>
      <div className="mb-3 flex items-center justify-between">
        <h3 className="text-xs font-semibold uppercase tracking-wider text-ink-soft">{label}</h3>
        {right}
      </div>
      {children}
    </div>
  )
}

function InfoBox({ label, value, icon: Icon }: {
  label: string; value: string; icon: React.ElementType
}) {
  return (
    <div className="rounded-xl border border-border bg-surface p-3">
      <div className="mb-1 flex items-center gap-1 text-xs text-ink-soft">
        <Icon className="size-3" /> {label}
      </div>
      <p className="text-sm font-semibold text-ink">{value}</p>
    </div>
  )
}

function TimelineItem({ label, time, dot }: { label: string; time: string; dot: string }) {
  return (
    <li className="flex items-start gap-3">
      <span className={cn('mt-1.5 size-2.5 shrink-0 rounded-full ring-4 ring-surface', dot)} />
      <div>
        <p className="text-sm font-medium text-ink">{label}</p>
        <p className="text-xs text-ink-soft">
          {new Intl.DateTimeFormat(undefined, {
            day: 'numeric', month: 'short', year: 'numeric',
            hour: '2-digit', minute: '2-digit',
          }).format(new Date(time))}
        </p>
      </div>
    </li>
  )
}
