import { Calendar } from 'lucide-react'

import { AvatarStack } from '@/components/ui/avatar'
import { PriorityPill, priorityBar } from './priority-pill'
import { cn } from '@/lib/utils'
import type { TaskWithDetails } from '@/lib/db/tasks'

const COLOR_CHIP: Record<string, string> = {
  violet: 'bg-violet/12 text-violet',
  sky: 'bg-sky/12 text-sky',
  indigo: 'bg-indigo/12 text-indigo',
  coral: 'bg-coral/12 text-coral',
  emerald: 'bg-emerald/12 text-emerald',
  amber: 'bg-amber/15 text-amber',
}

const COLOR_DOT: Record<string, string> = {
  violet: 'bg-violet',
  sky: 'bg-sky',
  indigo: 'bg-indigo',
  coral: 'bg-coral',
  emerald: 'bg-emerald',
  amber: 'bg-amber',
}

function formatDeadline(value: string | null): string {
  if (!value) return '—'
  const d = new Date(value)
  const now = new Date()
  const diffMs = d.getTime() - now.getTime()
  const diffDays = Math.ceil(diffMs / 86_400_000)

  if (diffDays < 0) return `Overdue ${Math.abs(diffDays)}d`
  if (diffDays === 0) return 'Due today'
  if (diffDays === 1) return 'Due tomorrow'
  if (diffDays <= 7) return `Due in ${diffDays}d`
  return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })
}

interface Props {
  task: TaskWithDetails
  onClick?: () => void
}

export function TaskCard({ task, onClick }: Props) {
  const isDone = task.status === 'done'
  const assigneeNames = task.assignments
    .map((a) => a.employee?.full_name ?? '')
    .filter(Boolean)

  const isOverdue =
    !isDone && task.deadline && new Date(task.deadline) < new Date()

  return (
    <article
      onClick={onClick}
      className={cn(
        'group relative cursor-pointer overflow-hidden rounded-xl border border-border bg-surface p-4 shadow-card transition-shadow hover:shadow-pop',
        isDone && 'opacity-80'
      )}
    >
      <span
        className={cn(
          'absolute left-0 top-0 h-full w-1',
          priorityBar(task.priority)
        )}
      />

      {task.company && (
        <div className="mb-2 flex flex-wrap items-center gap-1.5">
          <span
            className={cn(
              'inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold tracking-wide',
              COLOR_CHIP[task.company.color] ?? 'bg-surface-2 text-ink-muted'
            )}
          >
            <span
              className={cn(
                'size-1.5 rounded-full',
                COLOR_DOT[task.company.color] ?? 'bg-ink-soft'
              )}
            />
            {task.company.name}
          </span>
        </div>
      )}

      <h3
        className={cn(
          'text-sm font-semibold leading-snug text-ink',
          isDone && 'line-through decoration-1'
        )}
      >
        {task.title}
      </h3>
      {task.description && (
        <p className="mt-1 line-clamp-2 text-xs text-ink-muted">
          {task.description}
        </p>
      )}

      <div className="mt-3 flex items-center justify-between gap-2">
        <PriorityPill priority={task.priority} />
        {assigneeNames.length > 0 && (
          <AvatarStack names={assigneeNames} size="sm" />
        )}
      </div>

      {task.items && task.items.length > 0 && (
        <div className="mt-2">
          <div className="h-1 w-full rounded-full bg-surface-2">
            <div
              className="h-full rounded-full bg-brand transition-all duration-300"
              style={{
                width: `${(task.items.filter((i) => i.completed).length / task.items.length) * 100}%`,
              }}
            />
          </div>
          <p className="mt-1 text-[10px] text-ink-soft">
            {task.items.filter((i) => i.completed).length}/{task.items.length} done
          </p>
        </div>
      )}

      <div className="mt-3 flex items-center justify-between border-t border-border pt-3 text-xs text-ink-muted">
        <span
          className={cn(
            'inline-flex items-center gap-1',
            isOverdue && 'font-medium text-coral'
          )}
        >
          <Calendar className="size-3.5" />
          {formatDeadline(task.deadline)}
        </span>
        <span className="text-[10px] text-ink-soft">
          {task.assignments.length} assignee{task.assignments.length !== 1 ? 's' : ''}
        </span>
      </div>
    </article>
  )
}
