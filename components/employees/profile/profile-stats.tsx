import {
  CheckCircle2,
  Activity,
  Clock,
  Target,
  type LucideIcon,
} from 'lucide-react'

import type { AttendanceMetrics } from '@/lib/db/attendance'
import type {
  CombinedTaskMetrics,
  MonthlyAttendance,
} from '@/lib/db/employee-profile'
import { cn } from '@/lib/utils'

const ACCENT = {
  emerald: 'bg-emerald/15 text-emerald',
  violet: 'bg-violet/15 text-violet',
  indigo: 'bg-indigo/15 text-indigo',
  amber: 'bg-amber/15 text-amber',
} as const

interface CardProps {
  label: string
  value: string | number
  hint: string
  icon: LucideIcon
  accent: keyof typeof ACCENT
}

function Card({ label, value, hint, icon: Icon, accent }: CardProps) {
  return (
    <div className="rounded-2xl border border-border bg-surface p-5 shadow-card">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm text-ink-muted">{label}</p>
          <p className="mt-2 text-2xl font-semibold tracking-tight">{value}</p>
        </div>
        <span className={cn('grid size-10 place-items-center rounded-xl', ACCENT[accent])}>
          <Icon className="size-5" />
        </span>
      </div>
      <p className="mt-3 text-xs text-ink-muted">{hint}</p>
    </div>
  )
}

export function ProfileStats({
  task,
  attendance,
  monthly,
}: {
  task: CombinedTaskMetrics
  attendance: AttendanceMetrics
  monthly: MonthlyAttendance
}) {
  const monthName = new Date().toLocaleDateString('en-GB', { month: 'long' })

  // "Tasks completed this month" combines regular assignment completions with
  // daily/recurring routine completions — both count as work done.
  const completedHint =
    task.recurringDoneThisMonth > 0
      ? `${task.doneThisMonth} project · ${task.recurringDoneThisMonth} routine`
      : `${task.doneThisQuarter} this quarter · ${task.done} total`

  return (
    <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
      <Card
        label="Tasks completed"
        value={task.totalDoneThisMonth}
        hint={completedHint}
        icon={CheckCircle2}
        accent="emerald"
      />
      <Card
        label="In progress"
        value={task.inProgress}
        hint={`${task.todo} to do · ${task.total} total assigned`}
        icon={Activity}
        accent="indigo"
      />
      <Card
        label="Deadline hit rate"
        value={`${task.deadlineHitRate}%`}
        hint={`${task.hoursThisMonth}h logged in ${monthName}`}
        icon={Target}
        accent="violet"
      />
      <Card
        label={`${monthName} attendance`}
        value={`${monthly.monthAttendancePercent}%`}
        hint={`${monthly.late} late · ${monthly.absent} absent · ${monthly.workingDaysTracked} days`}
        icon={Clock}
        accent="amber"
      />
    </div>
  )
}
