'use client'

import * as React from 'react'
import { Clock, LogIn, LogOut, MapPin } from 'lucide-react'
import { cn } from '@/lib/utils'

// ── Mock data ──────────────────────────────────────────────────────────────
const EMPLOYEE = {
  name: 'Rajat Kumar',
  role: 'Software Engineer',
  department: 'Engineering',
  avatar_initials: 'RK',
  working_hours: '9:00 AM – 6:00 PM',
}

const TODAY_ATTENDANCE = {
  status: 'present' as 'present' | 'absent' | 'not_marked',
  check_in: '9:07 AM',
  check_out: null as string | null, // null = not yet
  location: 'Office',
}

// ── Greeting helper ────────────────────────────────────────────────────────
function greeting() {
  const h = new Date().getHours()
  if (h < 12) return 'Good morning'
  if (h < 17) return 'Good afternoon'
  return 'Good evening'
}

function todayLabel() {
  return new Intl.DateTimeFormat('en-GB', {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
  }).format(new Date())
}

// ── Component ──────────────────────────────────────────────────────────────
export function HeroBanner() {
  // Initialize to null so server renders a placeholder, then hydrate the
  // real value in useEffect — prevents server clock vs client clock mismatch.
  const [time, setTime] = React.useState<string | null>(null)

  React.useEffect(() => {
    const tick = () =>
      setTime(
        new Date().toLocaleTimeString('en-GB', {
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
        })
      )
    tick()
    const id = setInterval(tick, 1000)
    return () => clearInterval(id)
  }, [])

  const isPresent = TODAY_ATTENDANCE.status === 'present'
  const isAbsent  = TODAY_ATTENDANCE.status === 'absent'

  return (
    <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-brand via-[#5b7fff] to-[#8b5cf6] p-6 text-white shadow-lg sm:p-8">

      {/* Decorative circles */}
      <div className="pointer-events-none absolute -right-16 -top-16 size-64 rounded-full bg-white/5" />
      <div className="pointer-events-none absolute -bottom-10 right-24 size-40 rounded-full bg-white/5" />
      <div className="pointer-events-none absolute bottom-6 right-8 size-20 rounded-full bg-white/8" />

      <div className="relative flex flex-wrap items-start justify-between gap-6">

        {/* Left: greeting + status */}
        <div className="min-w-0">
          <p className="text-white/70 text-sm font-medium">{todayLabel()}</p>
          <h1 className="mt-1 text-2xl font-bold sm:text-3xl">
            {greeting()}, {EMPLOYEE.name.split(' ')[0]}! 👋
          </h1>
          <p className="mt-1 text-white/70">
            {EMPLOYEE.role} &middot; {EMPLOYEE.department}
          </p>

          {/* Attendance status pill */}
          <div className="mt-4 flex flex-wrap items-center gap-3">
            {isPresent && (
              <span className="inline-flex items-center gap-2 rounded-full bg-white/15 px-3 py-1.5 text-sm font-medium backdrop-blur-sm">
                <span className="size-2 rounded-full bg-emerald-300 shadow-[0_0_6px_2px] shadow-emerald-400/60 animate-pulse" />
                Present &middot; In since {TODAY_ATTENDANCE.check_in}
              </span>
            )}
            {isAbsent && (
              <span className="inline-flex items-center gap-2 rounded-full bg-coral/30 px-3 py-1.5 text-sm font-medium">
                <span className="size-2 rounded-full bg-coral-300" />
                Marked Absent
              </span>
            )}
            {TODAY_ATTENDANCE.status === 'not_marked' && (
              <span className="inline-flex items-center gap-2 rounded-full bg-white/15 px-3 py-1.5 text-sm font-medium">
                <span className="size-2 rounded-full bg-amber-300" />
                Not yet checked in
              </span>
            )}

            {TODAY_ATTENDANCE.location && (
              <span className="inline-flex items-center gap-1.5 text-sm text-white/60">
                <MapPin className="size-3.5" />
                {TODAY_ATTENDANCE.location}
              </span>
            )}

            <span className="inline-flex items-center gap-1.5 text-sm text-white/60">
              <Clock className="size-3.5" />
              {EMPLOYEE.working_hours}
            </span>
          </div>
        </div>

        {/* Right: live clock + check-in/out buttons */}
        <div className="flex flex-col items-end gap-3">
          {/* Live clock */}
          <div className="rounded-2xl bg-white/10 px-5 py-3 text-center backdrop-blur-sm">
            <p
              className="text-2xl font-bold tabular-nums tracking-tight"
              suppressHydrationWarning
            >
              {time ?? '——:——:——'}
            </p>
            <p className="mt-0.5 text-xs text-white/60 uppercase tracking-wider">
              {new Intl.DateTimeFormat('en-GB', { timeZoneName: 'short' }).format(new Date()).split(', ')[1]}
            </p>
          </div>

          {/* Action buttons */}
          <div className="flex gap-2">
            {!TODAY_ATTENDANCE.check_in ? (
              <button
                type="button"
                className="inline-flex h-10 items-center gap-2 rounded-xl bg-white px-4 text-sm font-semibold text-brand shadow-sm hover:bg-white/90 transition-colors"
              >
                <LogIn className="size-4" />
                Check In
              </button>
            ) : !TODAY_ATTENDANCE.check_out ? (
              <>
                <div className="inline-flex h-10 items-center gap-2 rounded-xl bg-white/15 px-4 text-sm font-medium backdrop-blur-sm">
                  <LogIn className="size-4" />
                  {TODAY_ATTENDANCE.check_in}
                </div>
                <button
                  type="button"
                  className="inline-flex h-10 items-center gap-2 rounded-xl bg-white px-4 text-sm font-semibold text-brand shadow-sm hover:bg-white/90 transition-colors"
                >
                  <LogOut className="size-4" />
                  Check Out
                </button>
              </>
            ) : (
              <div className="inline-flex h-10 items-center gap-2 rounded-xl bg-white/15 px-4 text-sm font-medium backdrop-blur-sm">
                <LogOut className="size-4" />
                Left at {TODAY_ATTENDANCE.check_out}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
