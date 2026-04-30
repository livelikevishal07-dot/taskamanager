import { Avatar } from '@/components/ui/avatar'
import {
  ATTENDANCE_STATUS_TONE,
  COMPANY_ACCENT,
  getCompany,
  TODAY_CHECKINS,
} from '@/lib/mock-data'
import { cn } from '@/lib/utils'

export function TodaysTable() {
  return (
    <div className="overflow-hidden rounded-2xl border border-border bg-surface shadow-card">
      <header className="flex items-center justify-between border-b border-border px-5 py-4">
        <div>
          <h2 className="text-base font-semibold">Today&rsquo;s check-ins</h2>
          <p className="text-xs text-ink-soft">Live login &amp; logout activity</p>
        </div>
        <button className="text-sm font-medium text-brand hover:underline">
          View all logs
        </button>
      </header>

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border bg-surface-2 text-xs uppercase tracking-wide text-ink-soft">
              <Th>Employee</Th>
              <Th>Company</Th>
              <Th>Login</Th>
              <Th>Logout</Th>
              <Th>Hours</Th>
              <Th>Status</Th>
            </tr>
          </thead>
          <tbody>
            {TODAY_CHECKINS.map((row) => {
              const tone = ATTENDANCE_STATUS_TONE[row.status]
              const c = getCompany(row.company)
              const cTone = c ? COMPANY_ACCENT[c.accent] : null
              return (
                <tr key={row.employee} className="border-b border-border last:border-0 hover:bg-surface-2/50">
                  <Td>
                    <div className="flex items-center gap-3">
                      <Avatar name={row.employee} size="sm" />
                      <div>
                        <p className="font-medium">{row.employee}</p>
                        <p className="text-xs text-ink-soft">{row.role}</p>
                      </div>
                    </div>
                  </Td>
                  <Td>
                    {c && cTone ? (
                      <span className={cn('inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-xs font-medium', cTone.chip)}>
                        <span className={cn('size-1.5 rounded-full', cTone.bar)} />
                        {c.name}
                      </span>
                    ) : (
                      <span className="text-ink-soft">—</span>
                    )}
                  </Td>
                  <Td>{row.loginAt}</Td>
                  <Td className="text-ink-muted">{row.logoutAt ?? '— still working —'}</Td>
                  <Td className="font-medium">{row.hours}</Td>
                  <Td>
                    <span className={cn('inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium', tone.bg, tone.text)}>
                      <span className={cn('size-1.5 rounded-full', tone.dot)} />
                      {tone.label}
                    </span>
                  </Td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}

function Th({ children }: { children: React.ReactNode }) {
  return <th className="px-5 py-3 text-left font-medium">{children}</th>
}
function Td({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return <td className={`px-5 py-3 align-middle ${className}`}>{children}</td>
}
