import { CheckCircle2, Calendar } from 'lucide-react'

import type { AssignmentRow } from '@/lib/db/tasks'
import { cn } from '@/lib/utils'

function relTime(d: string | null) {
  if (!d) return ''
  const dt = new Date(d)
  const diff = Date.now() - dt.getTime()
  const days = Math.floor(diff / 86_400_000)
  if (days === 0) return 'today'
  if (days === 1) return 'yesterday'
  if (days < 7) return `${days} days ago`
  const weeks = Math.floor(days / 7)
  return weeks === 1 ? 'a week ago' : `${weeks} weeks ago`
}

export function CompletedTasks({
  assignments,
}: {
  assignments: AssignmentRow[]
}) {
  const done = assignments
    .filter((a) => a.status === 'done' && a.completed_at)
    .sort((a, b) => (b.completed_at ?? '').localeCompare(a.completed_at ?? ''))
    .slice(0, 6)

  return (
    <div className="rounded-2xl border border-border bg-surface p-5 shadow-card">
      <header className="mb-4 flex items-center justify-between">
        <div>
          <h2 className="text-base font-semibold">Recent completions</h2>
          <p className="text-xs text-ink-soft">{done.length} latest finished tasks</p>
        </div>
      </header>

      {done.length === 0 ? (
        <p className="rounded-xl border border-dashed border-border py-8 text-center text-sm text-ink-soft">
          No completed tasks yet.
        </p>
      ) : (
        <ul className="space-y-2">
          {done.map((a) => {
            const onTime =
              a.task.deadline &&
              a.completed_at &&
              new Date(a.completed_at) <= new Date(a.task.deadline)
            return (
              <li
                key={a.id}
                className="flex items-start gap-3 rounded-xl px-2 py-2 hover:bg-surface-2"
              >
                <span className="mt-0.5 grid size-7 place-items-center rounded-full bg-emerald/15 text-emerald">
                  <CheckCircle2 className="size-3.5" />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate font-medium">{a.task.title}</p>
                  <p className="text-xs text-ink-soft">
                    {a.task.company?.name ?? 'No company'} ·{' '}
                    {Number(a.hours_logged).toFixed(1)}h logged
                  </p>
                </div>
                <div className="text-right text-xs">
                  <p className="text-ink-muted">{relTime(a.completed_at)}</p>
                  {a.task.deadline && (
                    <p
                      className={cn(
                        'mt-0.5 inline-flex items-center gap-1',
                        onTime ? 'text-emerald' : 'text-coral'
                      )}
                    >
                      <Calendar className="size-3" />
                      {onTime ? 'on time' : 'late'}
                    </p>
                  )}
                </div>
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}
