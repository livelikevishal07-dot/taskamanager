import { TrendingUp, Crown, Sparkles, ClipboardList } from 'lucide-react'

import { PERFORMANCE_STATS } from '@/lib/mock-data'
import { cn } from '@/lib/utils'

const ACCENT_BG = {
  violet: 'bg-violet/15 text-violet',
  emerald: 'bg-emerald/15 text-emerald',
  amber: 'bg-amber/15 text-amber',
  sky: 'bg-sky/15 text-sky',
} as const

interface CardProps {
  label: string
  value: string | number
  hint: string
  icon: typeof TrendingUp
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

export function PerformanceStats() {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
      <Card label="Average score" value={`${PERFORMANCE_STATS.avgScore}%`} hint="All employees, this quarter" icon={TrendingUp} accent="violet" />
      <Card label="Top performer" value={PERFORMANCE_STATS.topPerformer} hint="94% — Sales" icon={Crown} accent="amber" />
      <Card label="Improvement" value={`+${PERFORMANCE_STATS.improvement}%`} hint="vs last quarter" icon={Sparkles} accent="emerald" />
      <Card label="Reviews due" value={PERFORMANCE_STATS.reviewsDue} hint="This week" icon={ClipboardList} accent="sky" />
    </div>
  )
}
