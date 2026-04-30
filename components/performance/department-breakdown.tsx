import { DEPARTMENT_PERFORMANCE } from '@/lib/mock-data'
import { cn } from '@/lib/utils'

export function DepartmentBreakdown() {
  return (
    <div className="rounded-2xl border border-border bg-surface p-5 shadow-card">
      <header className="mb-4 flex items-center justify-between">
        <h2 className="text-base font-semibold">By department</h2>
        <span className="text-xs text-ink-soft">Avg score</span>
      </header>
      <ul className="space-y-3">
        {DEPARTMENT_PERFORMANCE.map((d) => (
          <li key={d.department}>
            <div className="mb-1.5 flex items-center justify-between text-sm">
              <span className="font-medium">{d.department}</span>
              <span className="text-ink-muted">
                <span className="text-xs">{d.members} members</span>
                <span className="ml-3 font-semibold text-ink">{d.avg}%</span>
              </span>
            </div>
            <div className="h-2 w-full overflow-hidden rounded-full bg-surface-2">
              <div
                className={cn('h-full rounded-full', d.color)}
                style={{ width: `${d.avg}%` }}
              />
            </div>
          </li>
        ))}
      </ul>
    </div>
  )
}
