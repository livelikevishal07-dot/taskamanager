import type { ReactNode } from 'react'

import { LogIn, LogOut, Clock } from 'lucide-react'

import type { AttendanceRow } from '@/lib/db/attendance'
import { cn } from '@/lib/utils'

const STATUS: Record<
  AttendanceRow['status'],
  { dot: string; bg: string; text: string; label: string }
> = {
  present: { dot: 'bg-emerald', bg: 'bg-emerald/10', text: 'text-emerald', label: 'Present' },
  late: { dot: 'bg-amber', bg: 'bg-amber/15', text: 'text-amber', label: 'Late' },
  absent: { dot: 'bg-coral', bg: 'bg-coral/10', text: 'text-coral', label: 'Absent' },
  half_day: { dot: 'bg-sky', bg: 'bg-sky/15', text: 'text-sky', label: 'Half Day' },
  leave: { dot: 'bg-violet', bg: 'bg-violet/15', text: 'text-violet', label: 'Leave' },
  holiday: { dot: 'bg-indigo', bg: 'bg-indigo/15', text: 'text-indigo', label: 'Holiday' },
}

function fmtTime(t: string | null) {
  if (!t) return '—'
  const d = new Date(t)
  if (Number.isNaN(d.getTime())) return '—'
  return d.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })
}

function fmtDate(d: string) {
  const [year, month, day] = d.split('-').map(Number)
  const dt = new Date(year, month - 1, day)
  return dt.toLocaleDateString('en-GB', {
    weekday: 'short',
    day: '2-digit',
    month: 'short',
  })
}

function fmtMinutes(m: number | null) {
  if (m == null) return '—'
  const h = Math.floor(m / 60)
  const min = m % 60
  return `${h}h ${min.toString().padStart(2, '0')}m`
}

// Detect late punch-in: login after expected start time (default 09:00 if unavailable)
function latePunchLabel(row: AttendanceRow): string | null {
  if (row.status !== 'late' || !row.login_at) return null
  return `Late: ${fmtTime(row.login_at)}`
}

export function AttendanceLog({ rows }: { rows: AttendanceRow[] }) {
  // Show last 30 days, newest first
  const todayStr = new Date().toISOString().slice(0, 10)
  const cutoff = new Date()
  cutoff.setDate(cutoff.getDate() - 29)
  const cutoffStr = cutoff.toISOString().slice(0, 10)

  const sorted = [...rows]
    .filter((r) => r.date >= cutoffStr)
    .sort((a, b) => b.date.localeCompare(a.date))

  return (
    <div className="rounded-2xl border border-border bg-surface shadow-card">
      <header className="flex items-center justify-between px-5 py-4">
        <div>
          <h2 className="text-base font-semibold">Attendance &amp; sessions</h2>
          <p className="text-xs text-ink-soft">Last 30 days</p>
        </div>
        <div className="flex items-center gap-1.5 text-xs text-ink-soft">
          <Clock className="size-3.5" />
          {sorted.filter((r) => r.status === 'late').length} late check-in
          {sorted.filter((r) => r.status === 'late').length !== 1 ? 's' : ''}
        </div>
      </header>

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-y border-border bg-surface-2 text-xs uppercase tracking-wide text-ink-soft">
              <Th>Date</Th>
              <Th>Check-in</Th>
              <Th>Check-out</Th>
              <Th>Hours</Th>
              <Th>Status</Th>
            </tr>
          </thead>
          <tbody>
            {sorted.length === 0 && (
              <tr>
                <td colSpan={5} className="py-10 text-center text-sm text-ink-soft">
                  No attendance recorded yet.
                </td>
              </tr>
            )}
            {sorted.map((r) => {
              const s = STATUS[r.status]
              const late = latePunchLabel(r)
              const isToday = r.date === todayStr
              return (
                <tr
                  key={r.id}
                  className={cn(
                    'border-b border-border last:border-0',
                    isToday && 'bg-brand/5'
                  )}
                >
                  <Td className="font-medium">
                    <span className="flex items-center gap-1.5">
                      {fmtDate(r.date)}
                      {isToday && (
                        <span className="rounded-full bg-brand/15 px-1.5 py-0.5 text-[10px] font-semibold text-brand">
                          today
                        </span>
                      )}
                    </span>
                  </Td>
                  <Td>
                    <span
                      className={cn(
                        'inline-flex items-center gap-1.5',
                        r.status === 'late' && 'font-medium text-amber'
                      )}
                    >
                      <LogIn className="size-3.5 text-ink-soft" />
                      {fmtTime(r.login_at)}
                      {late && (
                        <span className="rounded-full bg-amber/15 px-1.5 text-[10px] text-amber">
                          late
                        </span>
                      )}
                    </span>
                  </Td>
                  <Td>
                    <span className="inline-flex items-center gap-1.5">
                      <LogOut className="size-3.5 text-ink-soft" />
                      {fmtTime(r.logout_at)}
                    </span>
                  </Td>
                  <Td className="font-medium tabular-nums">{fmtMinutes(r.total_minutes)}</Td>
                  <Td>
                    <span
                      className={cn(
                        'inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium',
                        s.bg,
                        s.text
                      )}
                    >
                      <span className={cn('size-1.5 rounded-full', s.dot)} />
                      {s.label}
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

function Th({ children }: { children: ReactNode }) {
  return <th className="px-5 py-3 text-left font-medium">{children}</th>
}

function Td({
  children,
  className = '',
}: {
  children: ReactNode
  className?: string
}) {
  return <td className={`px-5 py-3 align-middle ${className}`}>{children}</td>
}

