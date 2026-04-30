import { Clock, UserCheck, UserX, Plane, Activity } from 'lucide-react'

import { ATTENDANCE_STATS } from '@/lib/mock-data'
import { cn } from '@/lib/utils'

const ACCENT_BG = {
  emerald: 'bg-emerald/15 text-emerald',
  amber: 'bg-amber/15 text-amber',
  coral: 'bg-coral/15 text-coral',
  violet: 'bg-violet/15 text-violet',
  indigo: 'bg-indigo/15 text-indigo',
} as const

interface CardProps {
  label: string
  value: string | number
  hint: string
  icon: typeof Clock
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

export function AttendanceStats() {
  return (
    <div className="grid grid-cols-2 gap-4 lg:grid-cols-5">
      <Card label="Present today" value={ATTENDANCE_STATS.present} hint="Out of 30 employees" icon={UserCheck} accent="emerald" />
      <Card label="Late check-ins" value={ATTENDANCE_STATS.late} hint="Past 9:30 AM" icon={Clock} accent="amber" />
      <Card label="Absent" value={ATTENDANCE_STATS.absent} hint="No leave applied" icon={UserX} accent="coral" />
      <Card label="On leave" value={ATTENDANCE_STATS.onLeave} hint="Approved" icon={Plane} accent="violet" />
      <Card label="Avg. hours" value={`${ATTENDANCE_STATS.avgHours}h`} hint="This week" icon={Activity} accent="indigo" />
    </div>
  )
}
