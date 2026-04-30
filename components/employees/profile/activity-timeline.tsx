import type { ComponentType } from 'react'

import {
  CheckCircle2,
  LogIn,
  LogOut,
  Play,
  AlertTriangle,
} from 'lucide-react'

import type { AssignmentRow } from '@/lib/db/tasks'
import type { AttendanceRow } from '@/lib/db/attendance'
import { cn } from '@/lib/utils'

interface Event {
  at: string
  kind: 'login' | 'logout' | 'task_started' | 'task_completed' | 'late' | 'absent'
  title: string
  meta?: string
}

function buildEvents(
  assignments: AssignmentRow[],
  attendance: AttendanceRow[]
): Event[] {
  const events: Event[] = []

  for (const a of assignments) {
    if (a.started_at) {
      events.push({
        at: a.started_at,
        kind: 'task_started',
        title: `Started "${a.task.title}"`,
        meta: a.task.company?.name,
      })
    }
    if (a.completed_at) {
      events.push({
        at: a.completed_at,
        kind: 'task_completed',
        title: `Completed "${a.task.title}"`,
        meta: `${Number(a.hours_logged).toFixed(1)}h logged${a.task.company ? ` · ${a.task.company.name}` : ''}`,
      })
    }
  }

  for (const r of attendance) {
    if (r.status === 'absent') {
      events.push({
        at: `${r.date}T09:00:00`,
        kind: 'absent',
        title: 'Marked absent',
      })
      continue
    }
    if (r.login_at) {
      events.push({
        at: r.login_at,
        kind: r.status === 'late' ? 'late' : 'login',
        title: r.status === 'late' ? 'Late check-in' : 'Checked in',
      })
    }
    if (r.logout_at) {
      events.push({
        at: r.logout_at,
        kind: 'logout',
        title: 'Checked out',
        meta:
          r.total_minutes != null
            ? `${Math.floor(r.total_minutes / 60)}h ${(r.total_minutes % 60).toString().padStart(2, '0')}m worked`
            : undefined,
      })
    }
  }

  return events.sort((a, b) => b.at.localeCompare(a.at)).slice(0, 25)
}

const ICON: Record<Event['kind'], { icon: ComponentType<{ className?: string }>; tone: string }> = {
  login: { icon: LogIn, tone: 'bg-emerald/15 text-emerald' },
  logout: { icon: LogOut, tone: 'bg-ink-soft/15 text-ink-muted' },
  late: { icon: LogIn, tone: 'bg-amber/15 text-amber' },
  absent: { icon: AlertTriangle, tone: 'bg-coral/15 text-coral' },
  task_started: { icon: Play, tone: 'bg-indigo/15 text-indigo' },
  task_completed: { icon: CheckCircle2, tone: 'bg-emerald/15 text-emerald' },
}

function fmt(at: string) {
  const d = new Date(at)
  return d.toLocaleString('en-GB', {
    day: '2-digit',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  })
}

export function ActivityTimeline({
  assignments,
  attendance,
}: {
  assignments: AssignmentRow[]
  attendance: AttendanceRow[]
}) {
  const events = buildEvents(assignments, attendance)

  return (
    <div className="rounded-2xl border border-border bg-surface p-5 shadow-card">
      <header className="mb-4 flex items-center justify-between">
        <div>
          <h2 className="text-base font-semibold">Activity timeline</h2>
          <p className="text-xs text-ink-soft">
            Recent task &amp; attendance events
          </p>
        </div>
      </header>

      {events.length === 0 ? (
        <p className="rounded-xl border border-dashed border-border py-8 text-center text-sm text-ink-soft">
          No activity yet.
        </p>
      ) : (
        <ol className="relative space-y-3 border-l border-border pl-4">
          {events.map((e, i) => {
            const c = ICON[e.kind]
            const Icon = c.icon
            return (
              <li key={i} className="relative">
                <span
                  className={cn(
                    'absolute -left-[26px] top-0 grid size-7 place-items-center rounded-full ring-4 ring-surface',
                    c.tone
                  )}
                >
                  <Icon className="size-3.5" />
                </span>
                <p className="text-sm font-medium">{e.title}</p>
                <p className="text-xs text-ink-soft">
                  {fmt(e.at)}
                  {e.meta && <span> · {e.meta}</span>}
                </p>
              </li>
            )
          })}
        </ol>
      )}
    </div>
  )
}
