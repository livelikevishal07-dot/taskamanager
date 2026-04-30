import Link from 'next/link'
import {
  ArrowLeft,
  Mail,
  Phone,
  MapPin,
  Cake,
  CalendarDays,
  Clock,
  Pencil,
} from 'lucide-react'

import { Avatar } from '@/components/ui/avatar'
import { StatusPill } from '@/components/ui/status-pill'
import type { Employee } from '@/lib/db/types'

const ROLE_TONE: Record<string, string> = {
  Admin: 'bg-coral/10 text-coral',
  Manager: 'bg-violet/15 text-violet',
  Senior: 'bg-indigo/15 text-indigo',
  Employee: 'bg-sky/15 text-sky',
  Intern: 'bg-amber/15 text-amber',
}

function formatDate(d: string | null) {
  if (!d) return '—'
  const dt = new Date(d)
  if (Number.isNaN(dt.getTime())) return d
  return dt.toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  })
}

function dayLabels(days: number[]) {
  const map = ['', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
  if (days.length === 7) return 'Every day'
  if (
    days.length === 5 &&
    days.every((d) => [1, 2, 3, 4, 5].includes(d))
  )
    return 'Mon–Fri'
  return days.map((d) => map[d]).join(', ')
}

export function ProfileHeader({ employee }: { employee: Employee }) {
  return (
    <div className="rounded-2xl border border-border bg-surface p-6 shadow-card">
      <div className="mb-4 flex items-center justify-between">
        <Link
          href="/admin/employees"
          className="inline-flex items-center gap-1.5 text-sm font-medium text-ink-muted hover:text-ink"
        >
          <ArrowLeft className="size-4" />
          Back to employees
        </Link>
        <button className="inline-flex h-9 items-center gap-1.5 rounded-xl border border-border bg-surface px-3 text-sm font-medium text-ink-muted hover:bg-surface-2">
          <Pencil className="size-4" />
          Edit
        </button>
      </div>

      <div className="flex flex-wrap items-start gap-5">
        <Avatar name={employee.full_name} size="lg" className="size-16 text-base" />

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="text-2xl font-semibold tracking-tight">
              {employee.full_name}
            </h1>
            <StatusPill status={employee.status} />
            {employee.role && (
              <span
                className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium ${
                  ROLE_TONE[employee.role.name] ?? 'bg-ink-soft/10 text-ink-muted'
                }`}
              >
                {employee.role.name}
              </span>
            )}
            {employee.department && (
              <span className="inline-flex items-center rounded-full bg-surface-2 px-2.5 py-1 text-xs font-medium text-ink-muted">
                {employee.department.name}
              </span>
            )}
          </div>

          <div className="mt-3 grid gap-x-6 gap-y-1.5 text-sm text-ink-muted sm:grid-cols-2 lg:grid-cols-3">
            <Info icon={<Mail />} value={employee.email} />
            <Info icon={<Phone />} value={employee.phone} />
            <Info icon={<MapPin />} value={employee.address} />
            <Info
              icon={<Cake />}
              label="Birthday"
              value={formatDate(employee.birthday)}
            />
            <Info
              icon={<CalendarDays />}
              label="Joined"
              value={formatDate(employee.joining_date)}
            />
            <Info
              icon={<Clock />}
              label="Hours"
              value={
                employee.working_hours_start && employee.working_hours_end
                  ? `${employee.working_hours_start.slice(0, 5)} – ${employee.working_hours_end.slice(0, 5)} · ${dayLabels(employee.working_days)}`
                  : '—'
              }
            />
          </div>
        </div>
      </div>
    </div>
  )
}

function Info({
  icon,
  value,
  label,
}: {
  icon: React.ReactNode
  value: string | null
  label?: string
}) {
  return (
    <div className="flex min-w-0 items-center gap-2">
      <span className="text-ink-soft">
        {React.isValidElement(icon)
          ? React.cloneElement(icon as React.ReactElement<{ className?: string }>, {
              className: 'size-3.5',
            })
          : null}
      </span>
      <span className="truncate">
        {label && <span className="text-ink-soft">{label}: </span>}
        {value || '—'}
      </span>
    </div>
  )
}

import * as React from 'react'
