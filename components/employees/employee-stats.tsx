import {
  Users,
  UserCheck,
  Plane,
  UserX,
  type LucideIcon,
} from 'lucide-react'

import { cn } from '@/lib/utils'

const ACCENT_BG = {
  violet: 'bg-violet/15 text-violet',
  emerald: 'bg-emerald/15 text-emerald',
  amber: 'bg-amber/15 text-amber',
  coral: 'bg-coral/15 text-coral',
} as const

interface CardProps {
  label: string
  value: number | string
  hint: string
  icon: LucideIcon
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
        <span
          className={cn(
            'grid size-10 place-items-center rounded-xl',
            ACCENT_BG[accent]
          )}
        >
          <Icon className="size-5" />
        </span>
      </div>
      <p className="mt-3 text-xs text-ink-muted">{hint}</p>
    </div>
  )
}

export interface EmployeeStatsData {
  total: number
  active: number
  onLeave: number
  inactive: number
}

export function EmployeeStats({ stats }: { stats: EmployeeStatsData }) {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
      <Card
        label="Total employees"
        value={stats.total}
        icon={Users}
        accent="violet"
        hint="Across all departments"
      />
      <Card
        label="Currently active"
        value={stats.active}
        icon={UserCheck}
        accent="emerald"
        hint={`${stats.active} of ${stats.total} working`}
      />
      <Card
        label="On leave"
        value={stats.onLeave}
        icon={Plane}
        accent="amber"
        hint="Approved time off"
      />
      <Card
        label="Inactive"
        value={stats.inactive}
        icon={UserX}
        accent="coral"
        hint="Archived accounts"
      />
    </div>
  )
}
