'use client'

import { Mail, Phone, MoreHorizontal } from 'lucide-react'

import { Avatar } from '@/components/ui/avatar'
import { StatusPill } from '@/components/ui/status-pill'
import type { Employee } from '@/lib/db/types'

interface Props {
  employees: Employee[]
  onCardClick: (employee: Employee) => void
}

export function EmployeesGrid({ employees, onCardClick }: Props) {
  if (employees.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-border bg-surface py-12 text-center text-sm text-ink-soft">
        No employees yet. Click <span className="font-semibold">Add employee</span> to create the first one.
      </div>
    )
  }
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
      {employees.map((e) => (
        <button
          key={e.id}
          onClick={() => onCardClick(e)}
          className="group relative rounded-2xl border border-border bg-surface p-5 text-left shadow-card transition-shadow hover:shadow-pop"
        >
          <span
            aria-label="More"
            className="absolute right-3 top-3 grid size-8 place-items-center rounded-lg text-ink-soft opacity-0 transition-opacity hover:bg-surface-2 hover:text-ink group-hover:opacity-100"
          >
            <MoreHorizontal className="size-4" />
          </span>

          <div className="flex items-center gap-3">
            <Avatar name={e.full_name} size="lg" />
            <div className="min-w-0">
              <h3 className="truncate font-semibold">{e.full_name}</h3>
              <p className="text-xs text-ink-soft">
                {e.role?.name ?? 'No role'} · {e.department?.name ?? 'No dept'}
              </p>
            </div>
          </div>

          <dl className="mt-4 space-y-2 text-sm">
            <div className="flex items-center gap-2 text-ink-muted">
              <Mail className="size-3.5 shrink-0 text-ink-soft" />
              <dd className="truncate">{e.email ?? '—'}</dd>
            </div>
            <div className="flex items-center gap-2 text-ink-muted">
              <Phone className="size-3.5 shrink-0 text-ink-soft" />
              <dd>{e.phone ?? '—'}</dd>
            </div>
          </dl>

          <div className="mt-4 flex items-center justify-between border-t border-border pt-3">
            <StatusPill status={e.status} />
            <div className="text-right">
              <p className="text-xs text-ink-soft">Performance</p>
              <p className="text-sm font-semibold">{e.performance}%</p>
            </div>
          </div>
        </button>
      ))}
    </div>
  )
}
