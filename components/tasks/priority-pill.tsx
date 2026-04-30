import { cn } from '@/lib/utils'

type TaskPriority = 'low' | 'medium' | 'high' | 'urgent'

const STYLES: Record<TaskPriority, { bg: string; text: string; bar: string; label: string }> = {
  low: {
    bg: 'bg-ink-soft/10',
    text: 'text-ink-muted',
    bar: 'bg-ink-soft',
    label: 'Low',
  },
  medium: {
    bg: 'bg-sky/10',
    text: 'text-sky',
    bar: 'bg-sky',
    label: 'Medium',
  },
  high: {
    bg: 'bg-amber/15',
    text: 'text-amber',
    bar: 'bg-amber',
    label: 'High',
  },
  urgent: {
    bg: 'bg-coral/10',
    text: 'text-coral',
    bar: 'bg-coral',
    label: 'Urgent',
  },
}

export function PriorityPill({ priority }: { priority: TaskPriority }) {
  const s = STYLES[priority]
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wide',
        s.bg,
        s.text
      )}
    >
      {s.label}
    </span>
  )
}

export function priorityBar(priority: TaskPriority) {
  return STYLES[priority].bar
}
