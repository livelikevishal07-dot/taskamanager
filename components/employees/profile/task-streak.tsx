import { Flame, Zap } from 'lucide-react'

import { cn } from '@/lib/utils'
import type { DayTaskCount } from '@/lib/db/employee-profile'

const DAY_ABBR = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

function cellStyle(count: number) {
  if (count === 0) return 'bg-surface-2 border border-border'
  if (count === 1) return 'bg-brand/25 border border-brand/30'
  if (count <= 3) return 'bg-brand/55 border border-brand/60'
  return 'bg-brand border border-brand'
}

export function TaskStreak({
  last7,
  currentStreak,
}: {
  last7: DayTaskCount[]
  currentStreak: number
}) {
  const todayStr = new Date().toISOString().slice(0, 10)

  return (
    <div className="rounded-2xl border border-border bg-surface p-5 shadow-card">
      <header className="mb-4 flex items-center justify-between">
        <div>
          <h2 className="text-base font-semibold">Task streak</h2>
          <p className="text-xs text-ink-soft">Completions over the last 7 days</p>
        </div>
        <div className="flex items-center gap-1.5 rounded-xl bg-amber/15 px-3 py-1.5">
          <Flame className="size-4 text-amber" />
          <span className="text-sm font-bold text-amber">{currentStreak}</span>
          <span className="text-xs text-amber/80">day{currentStreak !== 1 ? 's' : ''}</span>
        </div>
      </header>

      <div className="flex items-end gap-2">
        {last7.map((d) => {
          // Parse date as local date to get correct day-of-week
          const [year, month, day] = d.date.split('-').map(Number)
          const date = new Date(year, month - 1, day)
          const dayName = DAY_ABBR[date.getDay()]
          const isToday = d.date === todayStr

          return (
            <div key={d.date} className="flex flex-1 flex-col items-center gap-1.5">
              <span className="min-h-[14px] text-[10px] font-semibold text-ink-muted">
                {d.count > 0 ? d.count : ''}
              </span>
              <div
                title={`${d.date}: ${d.count} task${d.count !== 1 ? 's' : ''} completed`}
                className={cn(
                  'h-10 w-full rounded-lg transition-colors',
                  cellStyle(d.count),
                  isToday && 'ring-2 ring-brand ring-offset-2 ring-offset-surface'
                )}
              />
              <span
                className={cn(
                  'text-[10px] font-medium',
                  isToday ? 'text-brand' : 'text-ink-soft'
                )}
              >
                {dayName}
              </span>
            </div>
          )
        })}
      </div>

      {/* Streak message */}
      {currentStreak >= 3 && (
        <div className="mt-4 flex items-center gap-1.5 rounded-xl border border-amber/20 bg-amber/5 px-3 py-2">
          <Zap className="size-3.5 shrink-0 text-amber" />
          <p className="text-xs text-amber">
            {currentStreak >= 7
              ? `Outstanding! ${currentStreak}-day streak — incredible consistency.`
              : currentStreak >= 5
                ? `Great momentum! ${currentStreak} days in a row.`
                : `${currentStreak} days running — keep it going!`}
          </p>
        </div>
      )}

      {currentStreak === 0 && (
        <p className="mt-4 text-center text-xs text-ink-soft">
          Complete a task today to start your streak.
        </p>
      )}
    </div>
  )
}
