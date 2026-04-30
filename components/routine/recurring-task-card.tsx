'use client'

import {
  CheckCircle2,
  Circle,
  Pencil,
  RefreshCw,
  ToggleLeft,
  ToggleRight,
  Users,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { Avatar } from '@/components/ui/avatar'
import {
  isActiveToday,
  recurrenceLabel,
  type RecurringTaskBase as RecurringTask,
} from '@/lib/recurring-tasks-shared'

const PRIORITY_CONFIG = {
  urgent: { bar: 'bg-coral',   chip: 'bg-coral/10 text-coral',   label: 'Urgent' },
  high:   { bar: 'bg-amber',   chip: 'bg-amber/10 text-amber',   label: 'High'   },
  medium: { bar: 'bg-brand',   chip: 'bg-brand/10 text-brand',   label: 'Medium' },
  low:    { bar: 'bg-ink-soft',chip: 'bg-surface-2 text-ink-soft',label: 'Low'   },
} as const

interface Props {
  task: RecurringTask
  onEdit: () => void
  onToggleActive: () => void
  toggling?: boolean
  /**
   * Employee IDs (from `task.assignments`) who have completed this recurring
   * task today. Empty array = nobody yet, undefined = data not loaded.
   */
  completedAssigneeIds?: string[]
}

export function RecurringTaskCard({
  task,
  onEdit,
  onToggleActive,
  toggling,
  completedAssigneeIds = [],
}: Props) {
  const pc = PRIORITY_CONFIG[task.priority as keyof typeof PRIORITY_CONFIG] ?? PRIORITY_CONFIG.medium

  const assignees = task.assignments
    .map((a) => a.employee?.full_name)
    .filter(Boolean) as string[]

  const totalAssignees = task.assignments.length
  const doneCount = completedAssigneeIds.length
  const showCompletion = task.is_active && isActiveToday(task) && totalAssignees > 0
  const allDone = showCompletion && doneCount === totalAssignees
  const completionPct = totalAssignees === 0 ? 0 : Math.round((doneCount / totalAssignees) * 100)

  return (
    <div className={cn(
      'group relative flex flex-col rounded-2xl border border-border bg-surface p-5 shadow-card transition-all hover:shadow-md',
      !task.is_active && 'opacity-60'
    )}>
      <div className={cn('absolute left-0 top-4 bottom-4 w-1 rounded-r-full', pc.bar)} />

      <div className="flex items-start gap-2 pl-2">
        <div className="flex-1 min-w-0">
          <p className="truncate font-semibold text-ink leading-snug">{task.title}</p>
          {task.description && (
            <p className="mt-0.5 line-clamp-2 text-xs text-ink-soft">{task.description}</p>
          )}
        </div>
        <button
          type="button"
          onClick={onEdit}
          className="shrink-0 hidden size-7 place-items-center rounded-lg text-ink-soft hover:bg-surface-2 hover:text-ink group-hover:grid"
          title="Edit"
        >
          <Pencil className="size-3.5" />
        </button>
      </div>

      <div className="mt-3 pl-2 flex flex-wrap gap-2">
        <span className={cn('inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold', pc.chip)}>
          <span className={cn('size-1.5 rounded-full', pc.bar)} />
          {pc.label}
        </span>
        <span className="inline-flex items-center gap-1 rounded-full bg-surface-2 px-2 py-0.5 text-[10px] font-semibold text-ink-muted">
          <RefreshCw className="size-2.5" />
          {recurrenceLabel(task)}
        </span>
        {task.company && (
          <span className="rounded-full bg-surface-2 px-2 py-0.5 text-[10px] font-semibold text-ink-muted">
            {task.company.name}
          </span>
        )}
      </div>

      {/* Today's completion progress — shown when the task runs today */}
      {showCompletion && (
        <div className="mt-3 pl-2">
          <div className="flex items-center justify-between text-[11px]">
            <span
              className={cn(
                'inline-flex items-center gap-1 font-medium',
                allDone ? 'text-emerald' : 'text-ink-muted'
              )}
            >
              {allDone ? (
                <CheckCircle2 className="size-3.5" />
              ) : (
                <Circle className="size-3.5" />
              )}
              {allDone ? 'All done today' : 'Done today'}
            </span>
            <span className="font-semibold tabular-nums text-ink">
              {doneCount}/{totalAssignees}
            </span>
          </div>
          <div className="mt-1 h-1 w-full overflow-hidden rounded-full bg-surface-2">
            <div
              className={cn(
                'h-full rounded-full transition-all duration-300',
                allDone ? 'bg-emerald' : 'bg-brand'
              )}
              style={{ width: `${completionPct}%` }}
            />
          </div>
        </div>
      )}

      <div className="mt-4 pl-2 flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          {assignees.length > 0 ? (
            <Avatar name={assignees[0]} size="sm" />
          ) : (
            <Users className="size-4 text-ink-soft/50" />
          )}
          {assignees.length > 1 && (
            <span className="text-[11px] text-ink-soft">+{assignees.length - 1} more</span>
          )}
          {assignees.length === 0 && (
            <span className="text-[11px] text-ink-soft">No assignees</span>
          )}
        </div>

        <button
          type="button"
          onClick={onToggleActive}
          disabled={toggling}
          className={cn(
            'inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition-colors',
            task.is_active
              ? 'bg-emerald/10 text-emerald hover:bg-coral/10 hover:text-coral'
              : 'bg-surface-2 text-ink-soft hover:bg-emerald/10 hover:text-emerald'
          )}
          title={task.is_active ? 'Revoke (disable)' : 'Activate'}
        >
          {task.is_active
            ? <><ToggleRight className="size-3.5" /> Active</>
            : <><ToggleLeft  className="size-3.5" /> Inactive</>}
        </button>
      </div>
    </div>
  )
}
