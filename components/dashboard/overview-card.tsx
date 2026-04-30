import { MoreHorizontal } from 'lucide-react'

import { OVERVIEW } from '@/lib/mock-data'
import { cn } from '@/lib/utils'

export function OverviewCard() {
  return (
    <div className="flex h-full flex-col rounded-2xl border border-border bg-surface p-5 shadow-card">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-base font-semibold">Overview</h2>
        <button className="rounded-full p-1 text-ink-soft hover:bg-surface-2 hover:text-ink" aria-label="More">
          <MoreHorizontal className="size-4" />
        </button>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <BigStat label={OVERVIEW.primary.label} value={OVERVIEW.primary.value} />
        <BigStat label={OVERVIEW.secondary.label} value={OVERVIEW.secondary.value} />
      </div>

      <div className="mt-5 space-y-4">
        {OVERVIEW.bars.map((b) => (
          <ProgressRow key={b.label} {...b} />
        ))}
      </div>
    </div>
  )
}

function BigStat({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-xl border border-border bg-surface-2 p-4 text-center">
      <p className="text-2xl font-semibold tracking-tight">{value}</p>
      <p className="mt-0.5 text-xs text-ink-muted">{label}</p>
    </div>
  )
}

function ProgressRow({
  label,
  value,
  max,
  color,
}: {
  label: string
  value: number
  max: number
  color: string
}) {
  const pct = Math.min(100, Math.round((value / max) * 100))
  return (
    <div>
      <div className="mb-1.5 flex items-center justify-between text-sm">
        <span className="text-ink-muted">{label}</span>
        <span className="font-semibold">{value}</span>
      </div>
      <div className="h-2 w-full overflow-hidden rounded-full bg-surface-2">
        <div
          className={cn('h-full rounded-full transition-[width]', color)}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  )
}
