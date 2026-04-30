import { Pencil, Play } from 'lucide-react'

import { AvatarStack } from '@/components/ui/avatar'
import { cn } from '@/lib/utils'
import type { TaskTemplate } from '@/lib/db/task-templates'

const PRIORITY_CONFIG = {
  low:    { label: 'Low',    bar: 'bg-ink-soft',  chip: 'border-ink-soft/30 bg-ink-soft/10 text-ink-muted' },
  medium: { label: 'Medium', bar: 'bg-sky',        chip: 'border-sky/30 bg-sky/10 text-sky' },
  high:   { label: 'High',   bar: 'bg-amber',      chip: 'border-amber/30 bg-amber/10 text-amber' },
  urgent: { label: 'Urgent', bar: 'bg-coral',      chip: 'border-coral/30 bg-coral/10 text-coral' },
} as const

const COLOR_CHIP: Record<string, string> = {
  violet:  'bg-violet/12 text-violet',
  sky:     'bg-sky/12 text-sky',
  indigo:  'bg-indigo/12 text-indigo',
  coral:   'bg-coral/12 text-coral',
  emerald: 'bg-emerald/12 text-emerald',
  amber:   'bg-amber/15 text-amber',
}

interface Props {
  template: TaskTemplate
  onRun: () => void
  onEdit: () => void
}

export function TemplateCard({ template, onRun, onEdit }: Props) {
  const p = PRIORITY_CONFIG[template.priority as keyof typeof PRIORITY_CONFIG] ?? PRIORITY_CONFIG.medium
  const assigneeNames = template.employee_assignments
    .map((a) => a.employee?.full_name ?? '')
    .filter(Boolean)

  return (
    <article className="group relative overflow-hidden rounded-2xl border border-border bg-surface shadow-card transition-shadow hover:shadow-pop">
      {/* Priority bar */}
      <span className={cn('absolute left-0 top-0 h-full w-1', p.bar)} />

      <div className="p-5 pl-6">
        {/* Top row */}
        <div className="mb-3 flex items-start justify-between gap-2">
          <span
            className={cn(
              'inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-0.5 text-xs font-semibold',
              p.chip
            )}
          >
            <span className={cn('size-1.5 rounded-full', p.bar)} />
            {p.label}
          </span>
          <button
            type="button"
            onClick={onEdit}
            className="grid size-7 place-items-center rounded-lg text-ink-soft opacity-0 transition-opacity hover:bg-surface-2 hover:text-ink group-hover:opacity-100"
            aria-label="Edit template"
          >
            <Pencil className="size-3.5" />
          </button>
        </div>

        {/* Title */}
        <h3 className="text-base font-semibold leading-snug">{template.title}</h3>

        {/* Description */}
        {template.description && (
          <p className="mt-1.5 line-clamp-2 text-sm text-ink-muted">
            {template.description}
          </p>
        )}

        {/* Meta row: company + assignees */}
        {(template.company || assigneeNames.length > 0) && (
          <div className="mt-3 flex flex-wrap items-center gap-2">
            {template.company && (
              <span
                className={cn(
                  'inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium',
                  COLOR_CHIP[template.company.color] ?? 'bg-surface-2 text-ink-muted'
                )}
              >
                <span className="size-1.5 rounded-full bg-current opacity-80" />
                {template.company.name}
              </span>
            )}
            {assigneeNames.length > 0 && (
              <AvatarStack names={assigneeNames} size="sm" />
            )}
          </div>
        )}

        {/* Run task button */}
        <div className="mt-4 border-t border-border pt-4">
          <button
            type="button"
            onClick={onRun}
            className="inline-flex w-full h-9 items-center justify-center gap-2 rounded-xl bg-brand px-4 text-sm font-medium text-brand-foreground shadow-sm hover:opacity-90 active:scale-[0.98] transition-all"
          >
            <Play className="size-3.5" />
            Run task
          </button>
        </div>
      </div>
    </article>
  )
}
