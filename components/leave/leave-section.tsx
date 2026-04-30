'use client'

import * as React from 'react'
import {
  CalendarCheck,
  CalendarRange,
  Check,
  ChevronDown,
  Clock,
  Download,
  Plus,
  Search,
  X,
} from 'lucide-react'

import { Avatar } from '@/components/ui/avatar'
import { LeaveDetailDrawer, LEAVE_TYPE_META, STATUS_META } from './leave-detail-drawer'
import { LeaveFormDrawer } from './leave-form-drawer'
import { cn } from '@/lib/utils'
import type { LeaveRequestWithEmployee, LeaveStatus, LeaveType } from '@/lib/db/leave-requests'
import type { Employee } from '@/lib/db/types'

// ── Helpers ────────────────────────────────────────────────────────────────

function isoToday() {
  return new Date().toISOString().slice(0, 10)
}

function isoDate(d: Date) {
  return d.toISOString().slice(0, 10)
}

function formatDate(iso: string) {
  return new Intl.DateTimeFormat(undefined, { day: 'numeric', month: 'short', year: 'numeric' })
    .format(new Date(`${iso}T12:00:00`))
}

function formatDateShort(iso: string) {
  return new Intl.DateTimeFormat(undefined, { day: 'numeric', month: 'short' })
    .format(new Date(`${iso}T12:00:00`))
}

function timeAgo(iso: string) {
  const diff = Date.now() - new Date(iso).getTime()
  const mins = Math.floor(diff / 60_000)
  if (mins < 60) return `${Math.max(mins, 1)}m ago`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs}h ago`
  return `${Math.floor(hrs / 24)}d ago`
}

function exportCsv(rows: LeaveRequestWithEmployee[]) {
  const headers = ['Employee', 'Department', 'Type', 'From', 'To', 'Days', 'Status', 'Reason', 'Admin Note', 'Reviewed By']
  const lines = rows.map((r) => [
    r.employee?.full_name ?? '',
    r.employee?.department?.name ?? '',
    LEAVE_TYPE_META[r.type].label,
    r.from_date,
    r.to_date,
    r.days,
    STATUS_META[r.status].label,
    r.reason ?? '',
    r.admin_note ?? '',
    r.reviewed_by ?? '',
  ].map((v) => `"${String(v).replace(/"/g, '""')}"`).join(','))
  const blob = new Blob([[headers.join(','), ...lines].join('\n')], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a'); a.href = url; a.download = `leave-requests-${isoToday()}.csv`; a.click()
  URL.revokeObjectURL(url)
}

type RangeKey = 'all' | 'this_month' | 'last_month' | 'this_quarter' | 'upcoming'

function rangeBounds(range: RangeKey): { from: string; to: string } | null {
  const now = new Date()
  if (range === 'all') return null
  if (range === 'this_month') {
    return {
      from: isoDate(new Date(now.getFullYear(), now.getMonth(), 1)),
      to: isoDate(new Date(now.getFullYear(), now.getMonth() + 1, 0)),
    }
  }
  if (range === 'last_month') {
    return {
      from: isoDate(new Date(now.getFullYear(), now.getMonth() - 1, 1)),
      to: isoDate(new Date(now.getFullYear(), now.getMonth(), 0)),
    }
  }
  if (range === 'this_quarter') {
    const q = Math.floor(now.getMonth() / 3)
    return {
      from: isoDate(new Date(now.getFullYear(), q * 3, 1)),
      to: isoDate(new Date(now.getFullYear(), q * 3 + 3, 0)),
    }
  }
  if (range === 'upcoming') {
    return { from: isoToday(), to: isoDate(new Date(now.getFullYear(), now.getMonth() + 3, now.getDate())) }
  }
  return null
}

// ── Props ──────────────────────────────────────────────────────────────────

interface Props {
  employees: Employee[]
  initialRequests: LeaveRequestWithEmployee[]
}

// ── Component ──────────────────────────────────────────────────────────────

export function LeaveSection({ employees, initialRequests }: Props) {
  const [requests, setRequests] = React.useState(initialRequests)
  const [search, setSearch] = React.useState('')
  const [statusFilter, setStatusFilter] = React.useState<'all' | LeaveStatus>('all')
  const [typeFilter, setTypeFilter] = React.useState<'all' | LeaveType>('all')
  const [employeeFilter, setEmployeeFilter] = React.useState('all')
  const [rangeFilter, setRangeFilter] = React.useState<RangeKey>('all')

  // Detail drawer
  const [detailReq, setDetailReq] = React.useState<LeaveRequestWithEmployee | null>(null)
  const [detailOpen, setDetailOpen] = React.useState(false)

  // Form drawer
  const [formReq, setFormReq] = React.useState<LeaveRequestWithEmployee | null>(null)
  const [formOpen, setFormOpen] = React.useState(false)

  // ── Stats ──
  const stats = React.useMemo(() => {
    const today = isoToday()
    const pending = requests.filter((r) => r.status === 'pending').length
    const approvedTotal = requests.filter((r) => r.status === 'approved').length
    const onLeaveToday = requests.filter(
      (r) => r.status === 'approved' && r.from_date <= today && r.to_date >= today
    ).length
    const upcomingApproved = requests.filter(
      (r) => r.status === 'approved' && r.from_date > today
    ).length
    const thisMonthDays = requests
      .filter((r) => r.status === 'approved' && r.from_date.slice(0, 7) === today.slice(0, 7))
      .reduce((s, r) => s + r.days, 0)
    return { pending, approvedTotal, onLeaveToday, upcomingApproved, thisMonthDays }
  }, [requests])

  // ── Filter ──
  const filtered = React.useMemo(() => {
    const q = search.trim().toLowerCase()
    const bounds = rangeBounds(rangeFilter)
    return requests.filter((r) => {
      if (statusFilter !== 'all' && r.status !== statusFilter) return false
      if (typeFilter !== 'all' && r.type !== typeFilter) return false
      if (employeeFilter !== 'all' && r.employee_id !== employeeFilter) return false
      if (bounds) {
        // Check overlap: request overlaps range if from_date <= bounds.to AND to_date >= bounds.from
        if (r.from_date > bounds.to || r.to_date < bounds.from) return false
      }
      if (q) {
        const hay = [
          r.employee?.full_name ?? '',
          r.employee?.department?.name ?? '',
          r.employee?.role?.name ?? '',
          LEAVE_TYPE_META[r.type].label,
          r.reason ?? '',
          r.admin_note ?? '',
        ].join(' ').toLowerCase()
        if (!hay.includes(q)) return false
      }
      return true
    }).sort((a, b) => b.created_at.localeCompare(a.created_at))
  }, [requests, search, statusFilter, typeFilter, employeeFilter, rangeFilter])

  function handleSaved(saved: LeaveRequestWithEmployee) {
    setRequests((prev) => {
      const without = prev.filter((r) => r.id !== saved.id)
      return [saved, ...without]
    })
    if (detailReq?.id === saved.id) setDetailReq(saved)
  }

  function handleDeleted(id: string) {
    setRequests((prev) => prev.filter((r) => r.id !== id))
    if (detailReq?.id === id) { setDetailOpen(false); setDetailReq(null) }
  }

  function openDetail(req: LeaveRequestWithEmployee) {
    setDetailReq(req)
    setDetailOpen(true)
  }

  function openEdit(req: LeaveRequestWithEmployee) {
    setFormReq(req)
    setDetailOpen(false)
    setFormOpen(true)
  }

  function openCreate() {
    setFormReq(null)
    setFormOpen(true)
  }

  const pendingList = filtered.filter((r) => r.status === 'pending')
  const otherList = filtered.filter((r) => r.status !== 'pending')

  return (
    <div className="space-y-5">

      {/* ── Stats ── */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-5">
        <StatCard label="Pending Approval" value={stats.pending} hint="Awaiting review" icon={Clock} accent="amber" alert={stats.pending > 0} />
        <StatCard label="On Leave Today" value={stats.onLeaveToday} hint="Currently on approved leave" icon={CalendarCheck} accent="emerald" />
        <StatCard label="Upcoming" value={stats.upcomingApproved} hint="Approved future leaves" icon={CalendarRange} accent="indigo" />
        <StatCard label="Approved Total" value={stats.approvedTotal} hint="All time approved" icon={Check} accent="sky" />
        <StatCard label="Days This Month" value={stats.thisMonthDays} hint="Approved leave days" icon={CalendarRange} accent="violet" />
      </div>

      {/* ── Toolbar ── */}
      <div className="rounded-2xl border border-border bg-surface p-3 shadow-card">
        <div className="flex flex-wrap items-center gap-2">
          {/* Search */}
          <div className="relative min-w-[200px] flex-1">
            <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-ink-soft" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search employee, type, reason…"
              className="h-10 w-full rounded-xl border border-transparent bg-surface-2 pl-9 pr-4 text-sm placeholder:text-ink-soft focus:border-brand focus:bg-surface focus:outline-none focus:ring-2 focus:ring-brand/20"
            />
          </div>

          {/* Status */}
          <FilterSelect value={statusFilter} onChange={(v) => setStatusFilter(v as LeaveStatus | 'all')}>
            <option value="all">All statuses</option>
            {(Object.entries(STATUS_META) as [LeaveStatus, typeof STATUS_META[LeaveStatus]][]).map(([k, m]) => (
              <option key={k} value={k}>{m.label}</option>
            ))}
          </FilterSelect>

          {/* Leave type */}
          <FilterSelect value={typeFilter} onChange={(v) => setTypeFilter(v as LeaveType | 'all')}>
            <option value="all">All types</option>
            {(Object.entries(LEAVE_TYPE_META) as [LeaveType, typeof LEAVE_TYPE_META[LeaveType]][]).map(([k, m]) => (
              <option key={k} value={k}>{m.label}</option>
            ))}
          </FilterSelect>

          {/* Employee */}
          <FilterSelect value={employeeFilter} onChange={setEmployeeFilter}>
            <option value="all">All employees</option>
            {employees.map((emp) => (
              <option key={emp.id} value={emp.id}>{emp.full_name}</option>
            ))}
          </FilterSelect>

          {/* Range */}
          <FilterSelect value={rangeFilter} onChange={(v) => setRangeFilter(v as RangeKey)}>
            <option value="all">All time</option>
            <option value="upcoming">Upcoming</option>
            <option value="this_month">This month</option>
            <option value="last_month">Last month</option>
            <option value="this_quarter">This quarter</option>
          </FilterSelect>

          {/* Actions */}
          <div className="ml-auto flex items-center gap-2">
            <button type="button" onClick={() => exportCsv(filtered)}
              className="inline-flex h-10 items-center gap-1.5 rounded-xl border border-border px-3 text-sm font-medium text-ink-muted hover:bg-surface-2"
            >
              <Download className="size-4" />
              <span className="hidden sm:inline">Export</span>
            </button>
            <button type="button" onClick={openCreate}
              className="inline-flex h-10 items-center gap-1.5 rounded-xl bg-brand px-4 text-sm font-medium text-brand-foreground shadow-sm hover:opacity-90"
            >
              <Plus className="size-4" />
              New Request
            </button>
          </div>
        </div>
      </div>

      {/* ── Pending requests (highlighted) ── */}
      {pendingList.length > 0 && (
        <div>
          <div className="mb-3 flex items-center gap-2">
            <span className="inline-flex size-5 items-center justify-center rounded-full bg-amber text-[10px] font-bold text-white">
              {pendingList.length}
            </span>
            <h2 className="text-sm font-semibold text-ink">Pending Approval</h2>
          </div>
          <div className="space-y-3">
            {pendingList.map((req) => (
              <LeaveCard key={req.id} req={req} onView={openDetail} onApprove={handleSaved} onReject={handleSaved} highlight />
            ))}
          </div>
        </div>
      )}

      {/* ── All other requests ── */}
      <div>
        {pendingList.length > 0 && otherList.length > 0 && (
          <h2 className="mb-3 text-sm font-semibold text-ink-muted">All Requests ({filtered.length})</h2>
        )}
        {filtered.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-border py-20 text-center text-sm text-ink-soft">
            No leave requests match the current filters.
          </div>
        ) : (
          <div className="overflow-hidden rounded-2xl border border-border bg-surface shadow-card">
            <table className="w-full min-w-[760px] text-sm">
              <thead>
                <tr className="border-b border-border bg-surface-2 text-xs uppercase tracking-wide text-ink-soft">
                  <Th>Employee</Th>
                  <Th>Type</Th>
                  <Th>Duration</Th>
                  <Th>Dates</Th>
                  <Th>Reason</Th>
                  <Th>Applied</Th>
                  <Th>Status</Th>
                </tr>
              </thead>
              <tbody>
                {otherList.map((req) => {
                  const typeMeta = LEAVE_TYPE_META[req.type]
                  const sMeta = STATUS_META[req.status]
                  return (
                    <tr
                      key={req.id}
                      onClick={() => openDetail(req)}
                      className="group cursor-pointer border-b border-border last:border-0 hover:bg-surface-2/50"
                    >
                      <Td>
                        <div className="flex items-center gap-2.5">
                          <Avatar name={req.employee?.full_name ?? '?'} size="sm" />
                          <div>
                            <p className="font-medium">{req.employee?.full_name ?? '—'}</p>
                            <p className="text-xs text-ink-soft">{req.employee?.department?.name ?? '—'}</p>
                          </div>
                        </div>
                      </Td>
                      <Td>
                        <span className={cn('inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold', typeMeta.chip)}>
                          <span className={cn('size-1.5 rounded-full', typeMeta.dot)} />
                          {typeMeta.label}
                        </span>
                      </Td>
                      <Td className="font-medium">
                        {req.days} day{req.days !== 1 ? 's' : ''}
                      </Td>
                      <Td className="text-ink-muted">
                        {formatDateShort(req.from_date)}
                        {req.from_date !== req.to_date ? ` – ${formatDateShort(req.to_date)}` : ''}
                      </Td>
                      <Td className="max-w-[200px]">
                        {req.reason ? (
                          <span className="truncate block text-ink-muted" title={req.reason}>{req.reason}</span>
                        ) : (
                          <span className="text-ink-soft">—</span>
                        )}
                      </Td>
                      <Td className="text-ink-soft text-xs">{timeAgo(req.created_at)}</Td>
                      <Td>
                        <span className={cn('inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold', sMeta.activeChip, 'border')}>
                          <span className={cn('size-1.5 rounded-full', sMeta.dot)} />
                          {sMeta.label}
                        </span>
                      </Td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ── Drawers ── */}
      <LeaveDetailDrawer
        open={detailOpen}
        onClose={() => { setDetailOpen(false); setDetailReq(null) }}
        request={detailReq}
        onUpdated={handleSaved}
        onDeleted={handleDeleted}
        onEdit={openEdit}
      />

      <LeaveFormDrawer
        open={formOpen}
        onClose={() => { setFormOpen(false); setFormReq(null) }}
        request={formReq}
        employees={employees}
        onSaved={handleSaved}
        onDeleted={handleDeleted}
      />
    </div>
  )
}

// ── Leave Card (for pending) ───────────────────────────────────────────────

function LeaveCard({
  req, onView, onApprove, onReject, highlight,
}: {
  req: LeaveRequestWithEmployee
  onView: (r: LeaveRequestWithEmployee) => void
  onApprove: (r: LeaveRequestWithEmployee) => void
  onReject: (r: LeaveRequestWithEmployee) => void
  highlight?: boolean
}) {
  const [actioning, setActioning] = React.useState<'approve' | 'reject' | null>(null)
  const typeMeta = LEAVE_TYPE_META[req.type]

  async function quickAction(action: 'approve' | 'reject') {
    setActioning(action)
    try {
      const res = await fetch(`/api/leave-requests/${req.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: action === 'approve' ? 'approved' : 'rejected',
          reviewed_at: new Date().toISOString(),
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data?.error)
      action === 'approve' ? onApprove(data) : onReject(data)
    } catch {
      // silently ignore
    } finally {
      setActioning(null)
    }
  }

  return (
    <div className={cn(
      'rounded-2xl border bg-surface p-4 shadow-card transition-colors hover:border-brand/30',
      highlight ? 'border-amber/30 bg-amber/5' : 'border-border'
    )}>
      <div className="flex flex-wrap items-start gap-4">
        {/* Left: employee + leave info */}
        <div className="flex items-center gap-3 min-w-0 flex-1">
          <Avatar name={req.employee?.full_name ?? '?'} size="md" className="shrink-0" />
          <div className="min-w-0">
            <p className="font-semibold text-ink">{req.employee?.full_name ?? 'Unknown'}</p>
            <p className="text-xs text-ink-soft">{req.employee?.department?.name ?? ''}</p>
          </div>
        </div>

        {/* Type badge */}
        <span className={cn('inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-sm font-semibold', typeMeta.chip)}>
          <span className={cn('size-2 rounded-full', typeMeta.dot)} />
          {typeMeta.label}
        </span>
      </div>

      {/* Date + duration */}
      <div className="mt-3 flex flex-wrap items-center gap-4 text-sm">
        <span className="flex items-center gap-1.5 text-ink-muted">
          <CalendarRange className="size-4 text-ink-soft" />
          {formatDate(req.from_date)}
          {req.from_date !== req.to_date && <> → {formatDate(req.to_date)}</>}
        </span>
        <span className="font-medium text-ink">{req.days} day{req.days !== 1 ? 's' : ''}</span>
        <span className="text-xs text-ink-soft">{timeAgo(req.created_at)}</span>
      </div>

      {/* Reason */}
      {req.reason && (
        <p className="mt-2 rounded-lg bg-surface-2 px-3 py-2 text-sm text-ink-muted italic">
          "{req.reason}"
        </p>
      )}

      {/* Actions */}
      <div className="mt-4 flex items-center gap-2 border-t border-border pt-3">
        <button type="button" onClick={() => quickAction('approve')} disabled={!!actioning}
          className="inline-flex h-9 flex-1 items-center justify-center gap-1.5 rounded-xl bg-emerald/15 text-sm font-semibold text-emerald hover:bg-emerald/25 disabled:opacity-60"
        >
          {actioning === 'approve' ? <span className="h-4 w-4 animate-spin rounded-full border-2 border-emerald border-t-transparent" /> : <Check className="size-4" />}
          Approve
        </button>
        <button type="button" onClick={() => quickAction('reject')} disabled={!!actioning}
          className="inline-flex h-9 flex-1 items-center justify-center gap-1.5 rounded-xl bg-coral/10 text-sm font-semibold text-coral hover:bg-coral/20 disabled:opacity-60"
        >
          {actioning === 'reject' ? <span className="h-4 w-4 animate-spin rounded-full border-2 border-coral border-t-transparent" /> : <X className="size-4" />}
          Reject
        </button>
        <button type="button" onClick={() => onView(req)}
          className="inline-flex h-9 items-center gap-1.5 rounded-xl border border-border px-3 text-sm font-medium text-ink-muted hover:bg-surface-2"
        >
          View
        </button>
      </div>
    </div>
  )
}

// ── Sub-components ─────────────────────────────────────────────────────────

function StatCard({ label, value, hint, icon: Icon, accent, alert }: {
  label: string; value: number; hint: string
  icon: React.ElementType
  accent: 'amber' | 'emerald' | 'indigo' | 'sky' | 'violet'
  alert?: boolean
}) {
  const tone: Record<string, string> = {
    amber: 'bg-amber/15 text-amber',
    emerald: 'bg-emerald/15 text-emerald',
    indigo: 'bg-indigo/15 text-indigo',
    sky: 'bg-sky/15 text-sky',
    violet: 'bg-violet/15 text-violet',
  }
  return (
    <div className={cn('rounded-2xl border bg-surface p-4 shadow-card', alert && value > 0 ? 'border-amber/40' : 'border-border')}>
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs text-ink-muted">{label}</p>
          <p className={cn('mt-1.5 text-2xl font-semibold tracking-tight', alert && value > 0 ? 'text-amber' : '')}>{value}</p>
        </div>
        <span className={cn('grid size-9 place-items-center rounded-xl', tone[accent])}>
          <Icon className="size-4" />
        </span>
      </div>
      <p className="mt-2 text-xs text-ink-soft">{hint}</p>
    </div>
  )
}

function FilterSelect({ value, onChange, children }: {
  value: string
  onChange: (v: string) => void
  children: React.ReactNode
}) {
  return (
    <div className="relative">
      <select value={value} onChange={(e) => onChange(e.target.value)}
        className="h-10 appearance-none rounded-xl border border-border bg-surface pl-3 pr-9 text-sm font-medium text-ink hover:bg-surface-2 focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/20"
      >
        {children}
      </select>
      <ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 size-4 -translate-y-1/2 text-ink-soft" />
    </div>
  )
}

function Th({ children }: { children: React.ReactNode }) {
  return <th className="px-5 py-3 text-left font-medium">{children}</th>
}

function Td({ children, className, colSpan }: {
  children: React.ReactNode; className?: string; colSpan?: number
}) {
  return <td className={cn('px-5 py-3.5 align-middle', className)} colSpan={colSpan}>{children}</td>
}
