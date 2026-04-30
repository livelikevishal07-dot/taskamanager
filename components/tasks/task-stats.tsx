import { ListTodo, Activity, CheckCheck, AlertTriangle } from 'lucide-react'

import { cn } from '@/lib/utils'
import type { TaskStats } from '@/lib/db/tasks'

const ACCENT_BG = {
  violet: 'bg-violet/15 text-violet',
  indigo: 'bg-indigo/15 text-indigo',
  emerald: 'bg-emerald/15 text-emerald',
  coral: 'bg-coral/15 text-coral',
} as const

type Accent = keyof typeof ACCENT_BG

interface CardProps {
  label: string
  value: number
  hint: string
  icon: typeof ListTodo
  accent: Accent
}

function Card({ label, value, hint, icon: Icon, accent }: CardProps) {
  return (
    <div className="rounded-2xl border border-border bg-surface p-5 shadow-card">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm text-ink-muted">{label}</p>
          <p className="mt-2 text-2xl font-semibold tracking-tight">{value}</p>
        </div>
        <span className={cn('grid size-10 place-items-center rounded-xl', ACCENT_BG[accent])}>
          <Icon className="size-5" />
        </span>
      </div>
      <p className="mt-3 text-xs text-ink-muted">{hint}</p>
    </div>
  )
}

export function TaskStats({ stats }: { stats: TaskStats }) {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
      <Card
        label="Total tasks"
        value={stats.total}
        hint="Across all companies"
        icon={ListTodo}
        accent="violet"
      />
      <Card
        label="In progress"
        value={stats.inProgress}
        hint="Currently active"
        icon={Activity}
        accent="indigo"
      />
      <Card
        label="Completed today"
        value={stats.completedToday}
        hint="Finished today"
        icon={CheckCheck}
        accent="emerald"
      />
      <Card
        label="Overdue"
        value={stats.overdue}
        hint="Past deadline"
        icon={AlertTriangle}
        accent="coral"
      />
    </div>
  )
}
