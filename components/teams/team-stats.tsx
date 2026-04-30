import { Building2, Users, ListChecks, TrendingUp } from 'lucide-react'

import { TEAM_STATS } from '@/lib/mock-data'
import { cn } from '@/lib/utils'

const ACCENT_BG = {
  violet: 'bg-violet/15 text-violet',
  sky: 'bg-sky/15 text-sky',
  emerald: 'bg-emerald/15 text-emerald',
  indigo: 'bg-indigo/15 text-indigo',
} as const

interface CardProps {
  label: string
  value: number | string
  hint: string
  icon: typeof Users
  accent: keyof typeof ACCENT_BG
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

export function TeamStats() {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
      <Card
        label="Total teams"
        value={TEAM_STATS.total}
        hint="Across the organization"
        icon={Building2}
        accent="violet"
      />
      <Card
        label="Members"
        value={TEAM_STATS.members}
        hint="Across all teams"
        icon={Users}
        accent="sky"
      />
      <Card
        label="Active tasks"
        value={TEAM_STATS.activeTasks}
        hint="Open or in progress"
        icon={ListChecks}
        accent="indigo"
      />
      <Card
        label="Avg. completion"
        value={`${TEAM_STATS.avgCompletion}%`}
        hint="Past 30 days"
        icon={TrendingUp}
        accent="emerald"
      />
    </div>
  )
}
