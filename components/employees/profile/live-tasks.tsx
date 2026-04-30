import { Calendar, Clock, ExternalLink } from 'lucide-react'

import type { AssignmentRow } from '@/lib/db/tasks'
import { cn } from '@/lib/utils'

const PRIORITY: Record<string, { bg: string; text: string; bar: string }> = {
  low: { bg: 'bg-ink-soft/10', text: 'text-ink-muted', bar: 'bg-ink-soft' },
  medium: { bg: 'bg-sky/10', text: 'text-sky', bar: 'bg-sky' },
  high: { bg: 'bg-amber/15', text: 'text-amber', bar: 'bg-amber' },
  urgent: { bg: 'bg-coral/10', text: 'text-coral', bar: 'bg-coral' },
}

const COMPANY_TONE: Record<string, string> = {
  violet: 'bg-violet/12 text-violet',
  sky: 'bg-sky/12 text-sky',
  indigo: 'bg-indigo/12 text-indigo',
  coral: 'bg-coral/12 text-coral',
  emerald: 'bg-emerald/12 text-emerald',
  amber: 'bg-amber/15 text-amber',
}

function formatDeadline(d: string | null) {
  if (!d) return null
  const dt = new Date(d)
  const now = new Date()
  const diffMs = dt.getTime() - now.getTime()
  const diffDays = Math.round(diffMs / 86_400_000)
  const overdue = diffMs < 0
  const label =
    Math.abs(diffDays) === 0
      ? 'today'
      : Math.abs(diffDays) === 1
        ? '1 day'
        : `${Math.abs(diffDays)} days`
  return {
    text: overdue ? `${label} overdue` : `in ${label}`,
    overdue,
    abs: dt.toLocaleString('en-GB', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }),
  }
}

export function LiveTasks({ assignments }: { assignments: AssignmentRow[] }) {
  const live = assignments.filter((a) => a.status === 'in_progress')

  return (
    <div className="rounded-2xl border border-border bg-surface p-5 shadow-card">
      <header className="mb-4 flex items-center justify-between">
        <div>
          <h2 className="text-base font-semibold">Live tasks</h2>
          <p className="text-xs text-ink-soft">
            {live.length} in progress right now
          </p>
        </div>
      </header>

      {live.length === 0 ? (
        <p className="rounded-xl border border-dashed border-border py-8 text-center text-sm text-ink-soft">
          No live tasks. Nothing currently being worked on.
        </p>
      ) : (
        <ul className="space-y-3">
          {live.map((a) => {
            const p = PRIORITY[a.task.priority] ?? PRIORITY.medium
            const dl = formatDeadline(a.task.deadline)
            return (
              <li
                key={a.id}
                className="group relative overflow-hidden rounded-xl border border-border bg-surface-2/40 p-4"
              >
                <span className={cn('absolute left-0 top-0 h-full w-1', p.bar)} />
                <div className="flex flex-wrap items-center gap-2 pb-1.5">
                  {a.task.company && (
                    <span
                      className={cn(
                        'inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold tracking-wide',
                        COMPANY_TONE[a.task.company.color] ?? COMPANY_TONE.violet
                      )}
                    >
                      <span
                        className="size-1.5 rounded-full"
                        style={{ background: 'currentColor' }}
                      />
                      {a.task.company.name}
                    </span>
                  )}
                  <span
                    className={cn(
                      'inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide',
                      p.bg,
                      p.text
                    )}
                  >
                    {a.task.priority}
                  </span>
                </div>

                <h3 className="font-medium leading-snug">{a.task.title}</h3>
                {a.task.description && (
                  <p className="mt-0.5 line-clamp-1 text-sm text-ink-muted">
                    {a.task.description}
                  </p>
                )}

                <div className="mt-2 flex flex-wrap items-center gap-3 text-xs text-ink-muted">
                  {dl && (
                    <span
                      className={cn(
                        'inline-flex items-center gap-1',
                        dl.overdue && 'text-coral'
                      )}
                    >
                      <Calendar className="size-3.5" />
                      {dl.abs} · {dl.text}
                    </span>
                  )}
                  <span className="inline-flex items-center gap-1">
                    <Clock className="size-3.5" />
                    {Number(a.hours_logged).toFixed(1)}h logged
                  </span>
                  <ExternalLink className="ml-auto size-3.5 text-ink-soft opacity-0 transition-opacity group-hover:opacity-100" />
                </div>
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}
