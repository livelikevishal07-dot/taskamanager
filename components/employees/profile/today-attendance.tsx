import type { ReactNode, ComponentType } from 'react'

import {
  LogIn,
  LogOut,
  Clock,
  AlertTriangle,
  CheckCircle2,
  MinusCircle,
  CalendarX,
  Umbrella,
} from 'lucide-react'

import { cn } from '@/lib/utils'
import type { AttendanceRow } from '@/lib/db/attendance'

const STATUS_CONFIG: Record<
  AttendanceRow['status'],
  {
    label: string
    bg: string
    badgeBg: string
    text: string
    Icon: ComponentType<{ className?: string }>
  }
> = {
  present: {
    label: 'Present',
    bg: 'bg-emerald/5 border-emerald/20',
    badgeBg: 'bg-emerald/15 text-emerald',
    text: 'text-emerald',
    Icon: CheckCircle2,
  },
  late: {
    label: 'Late check-in',
    bg: 'bg-amber/5 border-amber/20',
    badgeBg: 'bg-amber/15 text-amber',
    text: 'text-amber',
    Icon: AlertTriangle,
  },
  absent: {
    label: 'Absent',
    bg: 'bg-coral/5 border-coral/20',
    badgeBg: 'bg-coral/15 text-coral',
    text: 'text-coral',
    Icon: CalendarX,
  },
  half_day: {
    label: 'Half Day',
    bg: 'bg-sky/5 border-sky/20',
    badgeBg: 'bg-sky/15 text-sky',
    text: 'text-sky',
    Icon: Clock,
  },
  leave: {
    label: 'On Leave',
    bg: 'bg-violet/5 border-violet/20',
    badgeBg: 'bg-violet/15 text-violet',
    text: 'text-violet',
    Icon: Umbrella,
  },
  holiday: {
    label: 'Holiday',
    bg: 'bg-indigo/5 border-indigo/20',
    badgeBg: 'bg-indigo/15 text-indigo',
    text: 'text-indigo',
    Icon: MinusCircle,
  },
}

function fmtTime(t: string | null) {
  if (!t) return '—'
  const d = new Date(t)
  if (Number.isNaN(d.getTime())) return '—'
  return d.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })
}

function fmtMinutes(m: number | null) {
  if (m == null) return '—'
  const h = Math.floor(m / 60)
  const min = m % 60
  return `${h}h ${min.toString().padStart(2, '0')}m`
}

function todayLabel() {
  const now = new Date()
  return now.toLocaleDateString('en-GB', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })
}

export function TodayAttendance({ row }: { row: AttendanceRow | null }) {
  const dateLabel = todayLabel()

  if (!row) {
    return (
      <div className="rounded-2xl border border-dashed border-border bg-surface p-5 shadow-card">
        <div className="flex flex-wrap items-center gap-3">
          <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-surface-2">
            <Clock className="size-5 text-ink-soft" />
          </span>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold text-ink">Today's attendance</p>
            <p className="text-xs text-ink-muted">{dateLabel}</p>
          </div>
          <span className="rounded-full bg-surface-2 px-3 py-1 text-xs font-medium text-ink-muted">
            Not recorded yet
          </span>
        </div>
      </div>
    )
  }

  const cfg = STATUS_CONFIG[row.status]
  const { Icon } = cfg

  return (
    <div
      className={cn(
        'rounded-2xl border bg-surface p-5 shadow-card',
        cfg.bg
      )}
    >
      <div className="flex flex-wrap items-center gap-3">
        <span className={cn('grid size-10 shrink-0 place-items-center rounded-xl', cfg.badgeBg)}>
          <Icon className={cn('size-5', cfg.text)} />
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold text-ink">Today's attendance</p>
          <p className="text-xs text-ink-muted">{dateLabel}</p>
        </div>
        <span className={cn('rounded-full px-3 py-1 text-xs font-semibold', cfg.badgeBg)}>
          {cfg.label}
        </span>
      </div>

      {row.status !== 'absent' && row.status !== 'holiday' && (
        <div className="mt-4 grid grid-cols-3 gap-3">
          <TimeCell
            icon={<LogIn className="size-4" />}
            label="Check-in"
            value={fmtTime(row.login_at)}
            accent={row.status === 'late' ? 'text-amber' : ''}
          />
          <TimeCell
            icon={<LogOut className="size-4" />}
            label="Check-out"
            value={fmtTime(row.logout_at)}
          />
          <TimeCell
            icon={<Clock className="size-4" />}
            label="Duration"
            value={fmtMinutes(row.total_minutes)}
          />
        </div>
      )}

      {row.notes && (
        <p className="mt-3 text-xs text-ink-muted">
          <span className="font-medium text-ink">Note: </span>
          {row.notes}
        </p>
      )}
    </div>
  )
}

function TimeCell({
  icon,
  label,
  value,
  accent = '',
}: {
  icon: ReactNode
  label: string
  value: string
  accent?: string
}) {
  return (
    <div className="rounded-xl border border-border/60 bg-surface px-3 py-2.5 text-center">
      <div className="mb-1 flex justify-center text-ink-soft">{icon}</div>
      <p className={cn('text-sm font-semibold tabular-nums text-ink', accent)}>{value}</p>
      <p className="mt-0.5 text-[10px] uppercase tracking-wide text-ink-soft">{label}</p>
    </div>
  )
}

