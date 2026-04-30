'use client'

import * as React from 'react'
import {
  Activity,
  CalendarDays,
  Clock,
  Download,
  Filter,
  Pencil,
  Plus,
  Save,
  Trash2,
  UserCheck,
  UserX,
  X,
} from 'lucide-react'

import { Avatar } from '@/components/ui/avatar'
import type {
  AttendanceStatus,
  AttendanceWithEmployee,
} from '@/lib/db/attendance'
import type { Employee } from '@/lib/db/types'
import { cn } from '@/lib/utils'

type RangeKey = 'week' | 'month' | 'six_months' | 'custom'

interface Props {
  employees: Employee[]
  initialRows: AttendanceWithEmployee[]
  databaseError?: string | null
}

type Draft = {
  id?: string
  employee_id: string
  date: string
  login_time: string
  logout_time: string
  status: AttendanceStatus
  notes: string
}

const emptyDraft: Draft = {
  employee_id: '',
  date: isoDate(new Date()),
  login_time: '09:00',
  logout_time: '18:00',
  status: 'present' as AttendanceStatus,
  notes: '',
}

const STATUS_META: Record<
  AttendanceStatus,
  { label: string; dot: string; chip: string; soft: string }
> = {
  present: {
    label: 'Present',
    dot: 'bg-emerald',
    chip: 'bg-emerald/15 text-emerald',
    soft: 'bg-emerald/10',
  },
  late: {
    label: 'Late',
    dot: 'bg-amber',
    chip: 'bg-amber/15 text-amber',
    soft: 'bg-amber/10',
  },
  absent: {
    label: 'Absent',
    dot: 'bg-coral',
    chip: 'bg-coral/15 text-coral',
    soft: 'bg-coral/10',
  },
  half_day: {
    label: 'Half Day',
    dot: 'bg-sky',
    chip: 'bg-sky/15 text-sky',
    soft: 'bg-sky/10',
  },
  leave: {
    label: 'Leave',
    dot: 'bg-violet',
    chip: 'bg-violet/15 text-violet',
    soft: 'bg-violet/10',
  },
  holiday: {
    label: 'Holiday',
    dot: 'bg-indigo',
    chip: 'bg-indigo/15 text-indigo',
    soft: 'bg-indigo/10',
  },
}

export function AttendanceManagement({ employees, initialRows, databaseError }: Props) {
  const [rows, setRows] = React.useState(initialRows)
  const [range, setRange] = React.useState<RangeKey>('month')
  const [employeeId, setEmployeeId] = React.useState('all')
  const [status, setStatus] = React.useState<'all' | AttendanceStatus>('all')
  const [query, setQuery] = React.useState('')
  const [customFrom, setCustomFrom] = React.useState(isoDate(addDays(new Date(), -30)))
  const [customTo, setCustomTo] = React.useState(isoDate(new Date()))
  const [draft, setDraft] = React.useState<Draft>({
    ...emptyDraft,
    employee_id: employees[0]?.id ?? '',
  })
  const [formOpen, setFormOpen] = React.useState(false)
  const [saving, setSaving] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)

  const bounds = React.useMemo(
    () => getRangeBounds(range, customFrom, customTo),
    [range, customFrom, customTo]
  )

  const filtered = React.useMemo(() => {
    const q = query.trim().toLowerCase()
    return rows
      .filter((row) => {
        if (row.date < bounds.from || row.date > bounds.to) return false
        if (employeeId !== 'all' && row.employee_id !== employeeId) return false
        if (status !== 'all' && row.status !== status) return false
        if (!q) return true
        const employee = row.employee?.full_name ?? ''
        const dept = row.employee?.department?.name ?? ''
        const role = row.employee?.role?.name ?? ''
        return `${employee} ${dept} ${role} ${row.notes ?? ''}`
          .toLowerCase()
          .includes(q)
      })
      .sort((a, b) => b.date.localeCompare(a.date))
  }, [bounds, employeeId, query, rows, status])

  const stats = React.useMemo(() => deriveStats(filtered, employees.length), [filtered, employees.length])
  const employeeSummaries = React.useMemo(
    () => deriveEmployeeSummaries(filtered, employees),
    [filtered, employees]
  )
  const gridDays = React.useMemo(() => buildGridDays(bounds.from, bounds.to), [bounds])

  function openCreate() {
    setDraft({
      ...emptyDraft,
      employee_id: employeeId !== 'all' ? employeeId : employees[0]?.id ?? '',
      date: isoDate(new Date()),
    })
    setFormOpen(true)
  }

  function openEdit(row: AttendanceWithEmployee) {
    setDraft({
      id: row.id,
      employee_id: row.employee_id,
      date: row.date,
      login_time: toTimeInput(row.login_at),
      logout_time: toTimeInput(row.logout_at),
      status: row.status,
      notes: row.notes ?? '',
    })
    setFormOpen(true)
  }

  async function save(e: React.FormEvent) {
    e.preventDefault()
    if (!draft.employee_id || !draft.date) return
    setSaving(true)
    setError(null)
    try {
      const payload = {
        employee_id: draft.employee_id,
        date: draft.date,
        login_at:
          draft.status === 'absent' || draft.status === 'leave' || draft.status === 'holiday'
            ? null
            : toIsoDateTime(draft.date, draft.login_time),
        logout_at:
          draft.status === 'absent' || draft.status === 'leave' || draft.status === 'holiday'
            ? null
            : toIsoDateTime(draft.date, draft.logout_time),
        status: draft.status,
        notes: draft.notes.trim() || null,
      }
      const saved = draft.id
        ? await request<AttendanceWithEmployee>(`/api/attendance/${draft.id}`, {
            method: 'PATCH',
            body: JSON.stringify(payload),
          })
        : await request<AttendanceWithEmployee>('/api/attendance', {
            method: 'POST',
            body: JSON.stringify(payload),
          })

      setRows((prev) => {
        const without = prev.filter(
          (row) =>
            row.id !== saved.id &&
            !(row.employee_id === saved.employee_id && row.date === saved.date)
        )
        return [saved, ...without]
      })
      setFormOpen(false)
    } catch (err) {
      setError(messageFrom(err))
    } finally {
      setSaving(false)
    }
  }

  async function remove(row: AttendanceWithEmployee) {
    if (!window.confirm(`Delete attendance log for ${row.employee?.full_name ?? 'employee'} on ${formatDate(row.date)}?`)) {
      return
    }
    setError(null)
    try {
      await request(`/api/attendance/${row.id}`, { method: 'DELETE' })
      setRows((prev) => prev.filter((item) => item.id !== row.id))
    } catch (err) {
      setError(messageFrom(err))
    }
  }

  return (
    <div className="space-y-5">
      <section className="rounded-2xl border border-border bg-surface p-5 shadow-card">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-base font-semibold">Attendance management</h2>
            <p className="text-sm text-ink-muted">
              Filter logs, review working hours, and update daily attendance.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => exportCsv(filtered)}
              className="inline-flex h-10 items-center gap-1.5 rounded-xl border border-border bg-surface px-4 text-sm font-medium text-ink-muted hover:bg-surface-2"
            >
              <Download className="size-4" />
              Export
            </button>
            <button
              type="button"
              onClick={openCreate}
              className="inline-flex h-10 items-center gap-1.5 rounded-xl bg-brand px-4 text-sm font-medium text-brand-foreground shadow-sm hover:opacity-90"
            >
              <Plus className="size-4" />
              Add log
            </button>
          </div>
        </div>

        <div className="grid gap-3 lg:grid-cols-[1.1fr_1fr_1fr_1fr]">
          <label className="relative">
            <Filter className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-ink-soft" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search employee, role, notes"
              className="h-10 w-full rounded-xl border border-border bg-surface pl-9 pr-3 text-sm focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/20"
            />
          </label>
          <Select value={range} onChange={(e) => setRange(e.target.value as RangeKey)}>
            <option value="week">This week</option>
            <option value="month">This month</option>
            <option value="six_months">Last 6 months</option>
            <option value="custom">Custom range</option>
          </Select>
          <Select value={employeeId} onChange={(e) => setEmployeeId(e.target.value)}>
            <option value="all">All employees</option>
            {employees.map((emp) => (
              <option key={emp.id} value={emp.id}>
                {emp.full_name}
              </option>
            ))}
          </Select>
          <Select
            value={status}
            onChange={(e) => setStatus(e.target.value as 'all' | AttendanceStatus)}
          >
            <option value="all">All statuses</option>
            {Object.entries(STATUS_META).map(([key, meta]) => (
              <option key={key} value={key}>
                {meta.label}
              </option>
            ))}
          </Select>
        </div>

        {range === 'custom' && (
          <div className="mt-3 flex flex-wrap items-center gap-3">
            <Field label="From">
              <Input type="date" value={customFrom} onChange={(e) => setCustomFrom(e.target.value)} />
            </Field>
            <Field label="To">
              <Input type="date" value={customTo} onChange={(e) => setCustomTo(e.target.value)} />
            </Field>
          </div>
        )}
      </section>

      {databaseError && (
        <Notice tone="danger">
          Attendance database is not ready: {databaseError}. Apply
          supabase/migrations/002_tasks_attendance.sql, then refresh this page.
        </Notice>
      )}
      {error && <Notice tone="danger">{error}</Notice>}

      {formOpen && (
        <section className="rounded-2xl border border-border bg-surface p-5 shadow-card">
          <form onSubmit={save}>
            <div className="mb-4 flex items-center justify-between gap-3">
              <div>
                <h3 className="text-base font-semibold">
                  {draft.id ? 'Edit attendance log' : 'Add attendance log'}
                </h3>
                <p className="text-sm text-ink-muted">
                  Logs are unique per employee and date.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setFormOpen(false)}
                className="grid size-9 place-items-center rounded-lg text-ink-muted hover:bg-surface-2"
                aria-label="Close form"
              >
                <X className="size-4" />
              </button>
            </div>

            <div className="grid gap-4 md:grid-cols-3">
              <Field label="Employee">
                <Select
                  value={draft.employee_id}
                  onChange={(e) =>
                    setDraft((current) => ({ ...current, employee_id: e.target.value }))
                  }
                >
                  {employees.map((emp) => (
                    <option key={emp.id} value={emp.id}>
                      {emp.full_name}
                    </option>
                  ))}
                </Select>
              </Field>
              <Field label="Date">
                <Input
                  type="date"
                  value={draft.date}
                  onChange={(e) => setDraft((current) => ({ ...current, date: e.target.value }))}
                />
              </Field>
              <Field label="Status">
                <Select
                  value={draft.status}
                  onChange={(e) =>
                    setDraft((current) => ({
                      ...current,
                      status: e.target.value as AttendanceStatus,
                    }))
                  }
                >
                  {Object.entries(STATUS_META).map(([key, meta]) => (
                    <option key={key} value={key}>
                      {meta.label}
                    </option>
                  ))}
                </Select>
              </Field>
              <Field label="Login">
                <Input
                  type="time"
                  value={draft.login_time}
                  disabled={isNoWorkStatus(draft.status)}
                  onChange={(e) =>
                    setDraft((current) => ({ ...current, login_time: e.target.value }))
                  }
                />
              </Field>
              <Field label="Logout">
                <Input
                  type="time"
                  value={draft.logout_time}
                  disabled={isNoWorkStatus(draft.status)}
                  onChange={(e) =>
                    setDraft((current) => ({ ...current, logout_time: e.target.value }))
                  }
                />
              </Field>
              <Field label="Notes">
                <Input
                  value={draft.notes}
                  onChange={(e) => setDraft((current) => ({ ...current, notes: e.target.value }))}
                  placeholder="Optional"
                />
              </Field>
            </div>

            <div className="mt-5 flex justify-end">
              <button
                type="submit"
                disabled={saving}
                className="inline-flex h-10 items-center gap-1.5 rounded-xl bg-brand px-4 text-sm font-medium text-brand-foreground shadow-sm hover:opacity-90 disabled:opacity-60"
              >
                <Save className="size-4" />
                {saving ? 'Saving...' : 'Save attendance'}
              </button>
            </div>
          </form>
        </section>
      )}

      <StatsGrid stats={stats} />

      <div className="grid gap-5 xl:grid-cols-[1fr_380px]">
        <AttendanceTable rows={filtered} onEdit={openEdit} onDelete={(row) => void remove(row)} />
        <WorkingHoursPanel summaries={employeeSummaries} />
      </div>

      <AttendanceGrid days={gridDays} employees={employees} rows={filtered} />
    </div>
  )
}

function StatsGrid({ stats }: { stats: ReturnType<typeof deriveStats> }) {
  return (
    <div className="grid grid-cols-2 gap-4 lg:grid-cols-5">
      <StatCard label="Present" value={stats.present} hint={`${stats.attendancePercent}% attendance`} icon={UserCheck} accent="emerald" />
      <StatCard label="Late" value={stats.late} hint="Late check-ins" icon={Clock} accent="amber" />
      <StatCard label="Absent" value={stats.absent} hint="No work log" icon={UserX} accent="coral" />
      <StatCard label="Leave" value={stats.leave} hint="Approved or planned" icon={CalendarDays} accent="violet" />
      <StatCard label="Avg. hours" value={`${stats.avgHours}h`} hint="Per worked day" icon={Activity} accent="indigo" />
    </div>
  )
}

function StatCard({
  label,
  value,
  hint,
  icon: Icon,
  accent,
}: {
  label: string
  value: string | number
  hint: string
  icon: typeof Activity
  accent: 'emerald' | 'amber' | 'coral' | 'violet' | 'indigo'
}) {
  const tone = {
    emerald: 'bg-emerald/15 text-emerald',
    amber: 'bg-amber/15 text-amber',
    coral: 'bg-coral/15 text-coral',
    violet: 'bg-violet/15 text-violet',
    indigo: 'bg-indigo/15 text-indigo',
  }[accent]
  return (
    <div className="rounded-2xl border border-border bg-surface p-5 shadow-card">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm text-ink-muted">{label}</p>
          <p className="mt-2 text-2xl font-semibold tracking-tight">{value}</p>
        </div>
        <span className={cn('grid size-10 place-items-center rounded-xl', tone)}>
          <Icon className="size-5" />
        </span>
      </div>
      <p className="mt-3 text-xs text-ink-muted">{hint}</p>
    </div>
  )
}

function AttendanceTable({
  rows,
  onEdit,
  onDelete,
}: {
  rows: AttendanceWithEmployee[]
  onEdit: (row: AttendanceWithEmployee) => void
  onDelete: (row: AttendanceWithEmployee) => void
}) {
  return (
    <div className="overflow-hidden rounded-2xl border border-border bg-surface shadow-card">
      <header className="flex items-center justify-between border-b border-border px-5 py-4">
        <div>
          <h2 className="text-base font-semibold">Attendance logs</h2>
          <p className="text-xs text-ink-soft">{rows.length} records in current filter</p>
        </div>
      </header>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[920px] text-sm">
          <thead>
            <tr className="border-b border-border bg-surface-2 text-xs uppercase tracking-wide text-ink-soft">
              <Th>Employee</Th>
              <Th>Date</Th>
              <Th>Login</Th>
              <Th>Logout</Th>
              <Th>Worked</Th>
              <Th>Expected</Th>
              <Th>Status</Th>
              <Th>Notes</Th>
              <Th>Actions</Th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => {
              const employee = row.employee
              const meta = STATUS_META[row.status]
              return (
                <tr key={row.id} className="border-b border-border last:border-0 hover:bg-surface-2/50">
                  <Td>
                    <div className="flex items-center gap-3">
                      <Avatar name={employee?.full_name ?? 'Unknown'} size="sm" />
                      <div>
                        <p className="font-medium">{employee?.full_name ?? 'Unknown employee'}</p>
                        <p className="text-xs text-ink-soft">
                          {employee?.department?.name ?? 'No department'} - {employee?.role?.name ?? 'No role'}
                        </p>
                      </div>
                    </div>
                  </Td>
                  <Td>{formatDate(row.date)}</Td>
                  <Td>{formatTime(row.login_at)}</Td>
                  <Td>{formatTime(row.logout_at)}</Td>
                  <Td className="font-medium">{minutesToHours(row.total_minutes)}</Td>
                  <Td>{expectedHours(employee)}</Td>
                  <Td>
                    <span className={cn('inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium', meta.chip)}>
                      <span className={cn('size-1.5 rounded-full', meta.dot)} />
                      {meta.label}
                    </span>
                  </Td>
                  <Td className="max-w-[180px] truncate text-ink-muted">{row.notes || '-'}</Td>
                  <Td>
                    <div className="flex items-center gap-1">
                      <IconButton label="Edit" onClick={() => onEdit(row)}>
                        <Pencil className="size-4" />
                      </IconButton>
                      <IconButton label="Delete" tone="danger" onClick={() => onDelete(row)}>
                        <Trash2 className="size-4" />
                      </IconButton>
                    </div>
                  </Td>
                </tr>
              )
            })}
            {rows.length === 0 && (
              <tr>
                <Td className="py-8 text-center text-ink-muted" colSpan={9}>
                  No attendance records match the selected filters.
                </Td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}

function WorkingHoursPanel({
  summaries,
}: {
  summaries: ReturnType<typeof deriveEmployeeSummaries>
}) {
  return (
    <aside className="rounded-2xl border border-border bg-surface p-5 shadow-card">
      <header className="mb-4">
        <h2 className="text-base font-semibold">Employee working hours</h2>
        <p className="text-xs text-ink-soft">Filtered range totals and punctuality</p>
      </header>
      <div className="space-y-3">
        {summaries.slice(0, 8).map((item) => (
          <div key={item.employee.id} className="rounded-xl border border-border bg-surface-2/40 p-3">
            <div className="flex items-center gap-3">
              <Avatar name={item.employee.full_name} size="sm" />
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium">{item.employee.full_name}</p>
                <p className="text-xs text-ink-soft">
                  {timeShort(item.employee.working_hours_start)} - {timeShort(item.employee.working_hours_end)}
                </p>
              </div>
              <span className="text-sm font-semibold">{item.hours}h</span>
            </div>
            <div className="mt-3 grid grid-cols-4 gap-2 text-center text-xs">
              <MiniMetric label="P" value={item.present} tone="text-emerald" />
              <MiniMetric label="L" value={item.late} tone="text-amber" />
              <MiniMetric label="A" value={item.absent} tone="text-coral" />
              <MiniMetric label="%" value={item.attendancePercent} tone="text-brand" />
            </div>
          </div>
        ))}
        {summaries.length === 0 && (
          <p className="rounded-xl border border-border bg-surface-2/40 p-4 text-sm text-ink-muted">
            No employee summaries for this filter.
          </p>
        )}
      </div>
    </aside>
  )
}

function AttendanceGrid({
  days,
  employees,
  rows,
}: {
  days: string[]
  employees: Employee[]
  rows: AttendanceWithEmployee[]
}) {
  const rowsByEmployeeDate = React.useMemo(() => {
    const map = new Map<string, AttendanceWithEmployee>()
    for (const row of rows) map.set(`${row.employee_id}:${row.date}`, row)
    return map
  }, [rows])

  const compactDays = days.length > 45 ? days.filter((_, index) => index % 7 === 0) : days

  return (
    <section className="rounded-2xl border border-border bg-surface p-5 shadow-card">
      <header className="mb-4 flex flex-wrap items-center justify-between gap-2">
        <div>
          <h2 className="text-base font-semibold">Calendar grid</h2>
          <p className="text-xs text-ink-soft">
            {days.length > 45 ? 'Weekly markers shown for long ranges' : 'Daily attendance per employee'}
          </p>
        </div>
        <ul className="flex flex-wrap items-center gap-3 text-xs">
          {Object.entries(STATUS_META).map(([key, meta]) => (
            <li key={key} className="inline-flex items-center gap-1.5 text-ink-muted">
              <span className={cn('size-2 rounded-full', meta.dot)} />
              {meta.label}
            </li>
          ))}
        </ul>
      </header>
      <div className="overflow-x-auto">
        <table className="min-w-[760px] w-full text-sm">
          <thead>
            <tr>
              <th className="sticky left-0 bg-surface px-2 py-2 text-left text-xs font-medium uppercase tracking-wide text-ink-soft">
                Employee
              </th>
              {compactDays.map((day) => (
                <th key={day} className="px-1 py-2 text-center">
                  <div className="text-[10px] uppercase text-ink-soft">{weekday(day)}</div>
                  <div className="text-xs font-semibold text-ink">{day.slice(8, 10)}</div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {employees.map((employee) => (
              <tr key={employee.id} className="border-t border-border">
                <td className="sticky left-0 bg-surface px-2 py-2.5">
                  <div className="flex items-center gap-2">
                    <Avatar name={employee.full_name} size="sm" />
                    <span className="text-sm font-medium">{employee.full_name}</span>
                  </div>
                </td>
                {compactDays.map((day) => {
                  const row = rowsByEmployeeDate.get(`${employee.id}:${day}`)
                  const meta = row ? STATUS_META[row.status] : null
                  return (
                    <td key={day} className="px-1 py-2.5 text-center">
                      <span
                        className={cn(
                          'mx-auto block size-7 rounded-md border border-border',
                          meta ? meta.soft : 'bg-surface-2/40'
                        )}
                        title={row ? `${STATUS_META[row.status].label} - ${minutesToHours(row.total_minutes)}` : 'No log'}
                      >
                        <span
                          className={cn(
                            'mx-auto mt-2.5 block size-2 rounded-full',
                            meta ? meta.dot : 'bg-ink-soft/30'
                          )}
                        />
                      </span>
                    </td>
                  )
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  )
}

function Field({
  label,
  children,
}: {
  label: string
  children: React.ReactNode
}) {
  return (
    <label className="block">
      <span className="mb-1 block text-xs font-medium text-ink-muted">{label}</span>
      {children}
    </label>
  )
}

function Select(props: React.SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select
      {...props}
      className={cn(
        'h-10 w-full rounded-xl border border-border bg-surface px-3 text-sm focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/20',
        props.className
      )}
    />
  )
}

function Input(props: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      {...props}
      className={cn(
        'h-10 w-full rounded-xl border border-border bg-surface px-3 text-sm focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/20 disabled:opacity-50',
        props.className
      )}
    />
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
        'rounded-xl border border-border bg-surface px-4 py-3 text-sm text-ink-muted shadow-card',
        tone === 'danger' && 'border-coral/30 bg-coral/10 text-coral'
      )}
    >
      {children}
    </div>
  )
}

function IconButton({
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
        'grid size-8 place-items-center rounded-lg text-ink-muted hover:bg-surface-2 hover:text-ink',
        tone === 'danger' && 'hover:bg-coral/10 hover:text-coral'
      )}
    >
      {children}
    </button>
  )
}

function MiniMetric({ label, value, tone }: { label: string; value: number; tone: string }) {
  return (
    <div className="rounded-lg bg-surface px-2 py-1">
      <p className={cn('font-semibold', tone)}>{value}</p>
      <p className="text-[10px] text-ink-soft">{label}</p>
    </div>
  )
}

function Th({ children }: { children: React.ReactNode }) {
  return <th className="px-5 py-3 text-left font-medium">{children}</th>
}

function Td({
  children,
  className,
  colSpan,
}: {
  children: React.ReactNode
  className?: string
  colSpan?: number
}) {
  return (
    <td className={cn('px-5 py-3 align-middle', className)} colSpan={colSpan}>
      {children}
    </td>
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

function deriveStats(rows: AttendanceWithEmployee[], employeeCount: number) {
  const present = rows.filter((row) => row.status === 'present').length
  const late = rows.filter((row) => row.status === 'late').length
  const absent = rows.filter((row) => row.status === 'absent').length
  const leave = rows.filter((row) => row.status === 'leave').length
  const holiday = rows.filter((row) => row.status === 'holiday').length
  const minutes = rows.reduce((sum, row) => sum + Number(row.total_minutes ?? 0), 0)
  const workedDays = rows.filter((row) => row.total_minutes != null).length
  const eligible = rows.length - holiday
  return {
    employeeCount,
    present,
    late,
    absent,
    leave,
    holiday,
    attendancePercent: eligible === 0 ? 0 : Math.round(((present + late) / eligible) * 100),
    avgHours: workedDays === 0 ? 0 : Math.round((minutes / workedDays / 60) * 10) / 10,
  }
}

function deriveEmployeeSummaries(rows: AttendanceWithEmployee[], employees: Employee[]) {
  return employees
    .map((employee) => {
      const own = rows.filter((row) => row.employee_id === employee.id)
      const present = own.filter((row) => row.status === 'present').length
      const late = own.filter((row) => row.status === 'late').length
      const absent = own.filter((row) => row.status === 'absent').length
      const holiday = own.filter((row) => row.status === 'holiday').length
      const minutes = own.reduce((sum, row) => sum + Number(row.total_minutes ?? 0), 0)
      const eligible = own.length - holiday
      return {
        employee,
        present,
        late,
        absent,
        hours: Math.round((minutes / 60) * 10) / 10,
        attendancePercent:
          eligible === 0 ? 0 : Math.round(((present + late) / eligible) * 100),
      }
    })
    .filter((item) => item.present + item.late + item.absent + item.hours > 0)
    .sort((a, b) => b.hours - a.hours)
}

function getRangeBounds(range: RangeKey, customFrom: string, customTo: string) {
  const now = new Date()
  if (range === 'week') {
    const day = now.getDay() || 7
    return { from: isoDate(addDays(now, 1 - day)), to: isoDate(now) }
  }
  if (range === 'month') {
    return {
      from: isoDate(new Date(now.getFullYear(), now.getMonth(), 1)),
      to: isoDate(now),
    }
  }
  if (range === 'six_months') {
    const from = new Date(now)
    from.setMonth(from.getMonth() - 6)
    return { from: isoDate(from), to: isoDate(now) }
  }
  return { from: customFrom, to: customTo }
}

function buildGridDays(from: string, to: string) {
  const days: string[] = []
  const cursor = parseDate(from)
  const end = parseDate(to)
  while (cursor <= end) {
    days.push(isoDate(cursor))
    cursor.setDate(cursor.getDate() + 1)
  }
  return days
}

function exportCsv(rows: AttendanceWithEmployee[]) {
  const headers = ['Employee', 'Date', 'Login', 'Logout', 'Hours', 'Status', 'Notes']
  const lines = rows.map((row) =>
    [
      row.employee?.full_name ?? '',
      row.date,
      formatTime(row.login_at),
      formatTime(row.logout_at),
      minutesToHours(row.total_minutes),
      STATUS_META[row.status].label,
      row.notes ?? '',
    ]
      .map((value) => `"${String(value).replace(/"/g, '""')}"`)
      .join(',')
  )
  const blob = new Blob([[headers.join(','), ...lines].join('\n')], {
    type: 'text/csv;charset=utf-8;',
  })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = `attendance-${isoDate(new Date())}.csv`
  link.click()
  URL.revokeObjectURL(url)
}

function messageFrom(err: unknown) {
  return err instanceof Error ? err.message : 'Something went wrong'
}

function isNoWorkStatus(status: AttendanceStatus) {
  return status === 'absent' || status === 'leave' || status === 'holiday'
}

function addDays(date: Date, days: number) {
  const next = new Date(date)
  next.setDate(next.getDate() + days)
  return next
}

function isoDate(date: Date) {
  return date.toISOString().slice(0, 10)
}

function parseDate(value: string) {
  return new Date(`${value}T00:00:00`)
}

function toIsoDateTime(date: string, time: string) {
  if (!time) return null
  return new Date(`${date}T${time}:00`).toISOString()
}

function toTimeInput(value: string | null) {
  if (!value) return ''
  return new Date(value).toTimeString().slice(0, 5)
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat(undefined, {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(parseDate(value))
}

function formatTime(value: string | null) {
  if (!value) return '-'
  return new Intl.DateTimeFormat(undefined, {
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(value))
}

function minutesToHours(value: number | null) {
  if (value == null) return '-'
  return `${Math.round((value / 60) * 10) / 10}h`
}

function expectedHours(employee: AttendanceWithEmployee['employee']) {
  if (!employee?.working_hours_start || !employee.working_hours_end) return '-'
  const start = minutesOfDay(employee.working_hours_start)
  const end = minutesOfDay(employee.working_hours_end)
  if (end <= start) return '-'
  return `${Math.round(((end - start) / 60) * 10) / 10}h`
}

function minutesOfDay(value: string) {
  const [h, m] = value.split(':').map(Number)
  return h * 60 + m
}

function timeShort(value: string | null) {
  return value ? value.slice(0, 5) : '--:--'
}

function weekday(value: string) {
  return new Intl.DateTimeFormat(undefined, { weekday: 'short' }).format(parseDate(value))
}
