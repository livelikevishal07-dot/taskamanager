'use client'

import * as React from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  Bell,
  CalendarDays,
  CheckSquare,
  ChevronDown,
  LayoutDashboard,
  LogOut,
  Settings,
  User,
} from 'lucide-react'

import { Avatar } from '@/components/ui/avatar'
import { cn } from '@/lib/utils'
import { useEmployee } from '@/app/employee/context'

const NAV_LINKS = [
  { href: '/employee/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/employee/tasks',     label: 'My Tasks',  icon: CheckSquare },
  { href: '/employee/leave',     label: 'Leave',     icon: CalendarDays },
]

export function EmployeeNavbar() {
  const pathname   = usePathname()
  const employee   = useEmployee()
  const [profileOpen, setProfileOpen] = React.useState(false)
  const ref = React.useRef<HTMLDivElement>(null)

  React.useEffect(() => {
    if (!profileOpen) return
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setProfileOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [profileOpen])

  return (
    <header className="sticky top-0 z-30 border-b border-border bg-surface/80 backdrop-blur-md">
      <div className="mx-auto flex max-w-7xl items-center gap-6 px-4 sm:px-6 lg:px-8">

        {/* Logo */}
        <Link href="/employee/dashboard" className="flex items-center gap-2 py-3.5 shrink-0">
          <div className="grid size-8 place-items-center rounded-full bg-brand text-brand-foreground shadow-sm">
            <span className="text-sm font-bold">W</span>
          </div>
          <span className="hidden text-base font-semibold tracking-tight sm:block">Workly</span>
        </Link>

        {/* Nav links */}
        <nav className="flex flex-1 items-center gap-1">
          {NAV_LINKS.map(({ href, label, icon: Icon }) => {
            const active = href === '/employee/dashboard'
              ? pathname === href
              : pathname.startsWith(href)
            return (
              <Link
                key={href}
                href={href}
                className={cn(
                  'inline-flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                  active
                    ? 'bg-brand/10 text-brand'
                    : 'text-ink-muted hover:bg-surface-2 hover:text-ink'
                )}
              >
                <Icon className="size-4" />
                <span className="hidden sm:block">{label}</span>
              </Link>
            )
          })}
        </nav>

        {/* Right side */}
        <div className="flex items-center gap-2 shrink-0">

          {/* Notifications bell */}
          <button
            type="button"
            className="relative grid size-9 place-items-center rounded-xl text-ink-muted hover:bg-surface-2 hover:text-ink"
          >
            <Bell className="size-5" />
            {false && (
              <span className="absolute right-1.5 top-1.5 flex size-4 items-center justify-center rounded-full bg-coral text-[9px] font-bold text-white">
                {0}
              </span>
            )}
          </button>

          {/* Profile dropdown */}
          <div ref={ref} className="relative">
            <button
              type="button"
              onClick={() => setProfileOpen((v) => !v)}
              className="flex items-center gap-2 rounded-xl border border-border bg-surface py-1.5 pl-1.5 pr-3 text-sm hover:bg-surface-2"
            >
              <Avatar name={employee.full_name} size="sm" />
              <span className="hidden font-medium sm:block">{employee.full_name.split(' ')[0]}</span>
              <ChevronDown className={cn('size-3.5 text-ink-soft transition-transform', profileOpen && 'rotate-180')} />
            </button>

            {profileOpen && (
              <div className="absolute right-0 top-full z-50 mt-2 w-56 rounded-2xl border border-border bg-surface py-2 shadow-pop">
                {/* Employee info */}
                <div className="px-4 pb-3 pt-1">
                  <p className="font-semibold text-ink">{employee.full_name}</p>
                  <p className="text-xs text-ink-soft">{employee.role} · {employee.department}</p>
                </div>
                <div className="mx-2 mb-2 border-t border-border" />

                <DropdownItem icon={User} label="My Profile" href="/employee/profile" />
                <DropdownItem icon={Settings} label="Settings" href="/employee/settings" />
                <div className="mx-2 my-1.5 border-t border-border" />
                <DropdownItem icon={LogOut} label="Switch to Admin" href="/cms" danger />
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  )
}

function DropdownItem({
  icon: Icon, label, href, danger,
}: {
  icon: React.ElementType; label: string; href: string; danger?: boolean
}) {
  return (
    <Link
      href={href}
      className={cn(
        'flex items-center gap-2.5 rounded-lg mx-1 px-3 py-2 text-sm transition-colors',
        danger
          ? 'text-coral hover:bg-coral/10'
          : 'text-ink-muted hover:bg-surface-2 hover:text-ink'
      )}
    >
      <Icon className="size-4" />
      {label}
    </Link>
  )
}
