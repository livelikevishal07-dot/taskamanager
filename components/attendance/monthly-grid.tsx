import { Avatar } from '@/components/ui/avatar'
import {
  ATTENDANCE_DAYS,
  ATTENDANCE_GRID,
  ATTENDANCE_STATUS_TONE,
} from '@/lib/mock-data'
import { cn } from '@/lib/utils'

export function MonthlyGrid() {
  return (
    <div className="rounded-2xl border border-border bg-surface p-5 shadow-card">
      <header className="mb-4 flex flex-wrap items-center justify-between gap-2">
        <div>
          <h2 className="text-base font-semibold">Last 14 days</h2>
          <p className="text-xs text-ink-soft">Daily attendance per employee</p>
        </div>
        <ul className="flex flex-wrap items-center gap-3 text-xs">
          {(['present', 'late', 'leave', 'absent', 'weekend'] as const).map((s) => (
            <li key={s} className="inline-flex items-center gap-1.5 text-ink-muted">
              <span className={cn('size-2 rounded-full', ATTENDANCE_STATUS_TONE[s].dot)} />
              {ATTENDANCE_STATUS_TONE[s].label}
            </li>
          ))}
        </ul>
      </header>

      <div className="overflow-x-auto">
        <table className="min-w-[720px] w-full text-sm">
          <thead>
            <tr>
              <th className="sticky left-0 bg-surface px-2 py-2 text-left text-xs font-medium uppercase tracking-wide text-ink-soft">
                Employee
              </th>
              {ATTENDANCE_DAYS.map((d, i) => (
                <th key={i} className="px-1 py-2 text-center">
                  <div className={cn('text-[10px] uppercase', d.isWeekend ? 'text-ink-soft/70' : 'text-ink-soft')}>
                    {d.label}
                  </div>
                  <div className={cn('text-xs font-semibold', d.isWeekend ? 'text-ink-soft/70' : 'text-ink')}>
                    {d.date}
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {ATTENDANCE_GRID.map((row) => (
              <tr key={row.name} className="border-t border-border">
                <td className="sticky left-0 bg-surface px-2 py-2.5">
                  <div className="flex items-center gap-2">
                    <Avatar name={row.name} size="sm" />
                    <span className="text-sm font-medium">{row.name}</span>
                  </div>
                </td>
                {row.days.map((status, i) => {
                  const tone = ATTENDANCE_STATUS_TONE[status]
                  return (
                    <td key={i} className="px-1 py-2.5 text-center">
                      <span
                        className={cn(
                          'mx-auto block size-7 rounded-md',
                          tone.bg
                        )}
                        title={tone.label}
                      >
                        <span className={cn('mx-auto mt-2.5 block size-2 rounded-full', tone.dot)} />
                      </span>
                    </td>
                  )
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
