import { cn } from '@/lib/utils'
import type { EmployeeStatus } from '@/lib/db/types'

const STYLES: Record<
  EmployeeStatus,
  { dot: string; bg: string; text: string; label: string }
> = {
  active: {
    dot: 'bg-emerald',
    bg: 'bg-emerald/10',
    text: 'text-emerald',
    label: 'Active',
  },
  on_leave: {
    dot: 'bg-amber',
    bg: 'bg-amber/10',
    text: 'text-amber',
    label: 'On leave',
  },
  inactive: {
    dot: 'bg-ink-soft',
    bg: 'bg-ink-soft/15',
    text: 'text-ink-muted',
    label: 'Inactive',
  },
  terminated: {
    dot: 'bg-coral',
    bg: 'bg-coral/10',
    text: 'text-coral',
    label: 'Terminated',
  },
}

export function StatusPill({ status }: { status: EmployeeStatus }) {
  const s = STYLES[status]
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium',
        s.bg,
        s.text
      )}
    >
      <span className={cn('size-1.5 rounded-full', s.dot)} />
      {s.label}
    </span>
  )
}
