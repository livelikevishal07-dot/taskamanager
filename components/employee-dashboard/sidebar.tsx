'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import {
  BookOpen,
  CalendarDays,
  CalendarOff,
  LayoutDashboard,
  CheckSquare,
  LogOut,
  StickyNote,
  X,
  type LucideIcon,
} from 'lucide-react'

import { Avatar }       from '@/components/ui/avatar'
import { ThemeToggle }  from '@/components/theme-toggle'
import { cn }           from '@/lib/utils'
import { useEmployee }  from '@/app/employee/context'
import { useMobileMenu } from '@/app/employee/mobile-menu-context'

interface NavItem {
  href:  string
  label: string
  icon:  LucideIcon
}

const PRIMARY: NavItem[] = [
  { href: '/employee/dashboard',  label: 'Dashboard', icon: LayoutDashboard },
  { href: '/employee/tasks',      label: 'My Tasks',  icon: CheckSquare },
  { href: '/employee/attendance', label: 'Attendance',icon: CalendarDays },
  { href: '/employee/leave',      label: 'Leave',     icon: CalendarOff },
  { href: '/employee/notes',      label: 'My Notes',  icon: StickyNote },
]

const BOOKING_DEPARTMENTS = ['Sales', 'Operations']

export function EmployeeSidebar() {
  const pathname = usePathname()
  const router   = useRouter()
  const employee = useEmployee()
  const { closeMenu } = useMobileMenu()

  const showBookings = Boolean(
    employee.department && BOOKING_DEPARTMENTS.includes(employee.department),
  )
  const primaryNav = showBookings
    ? [...PRIMARY, { href: '/employee/bookings', label: 'Bookings', icon: BookOpen }]
    : PRIMARY

  async function handleSignOut() {
    await fetch('/api/employee-auth/logout', { method: 'POST' })
    window.location.replace('/employee-login')
  }

  // Close drawer on nav click (mobile)
  function handleNavClick() {
    closeMenu()
  }

  return (
    <aside className="flex h-screen w-64 shrink-0 flex-col border-r border-border bg-surface sticky top-0">

      {/* ── Logo + mobile close button ── */}
      <div className="flex items-center gap-2.5 px-6 py-5">
        <div className="grid size-8 place-items-center rounded-full bg-brand text-brand-foreground shadow-sm">
          <span className="text-sm font-bold">O</span>
        </div>
        <div className="min-w-0 flex-1">
          <span className="block text-base font-semibold tracking-tight leading-tight">Officely</span>
          <span className="block text-[10px] font-medium text-ink-soft uppercase tracking-wider">Employee Portal</span>
        </div>
        {/* Close button — visible on mobile only */}
        <button
          type="button"
          onClick={closeMenu}
          aria-label="Close menu"
          className="grid size-7 place-items-center rounded-lg text-ink-soft hover:bg-surface-2 hover:text-ink lg:hidden"
        >
          <X className="size-4" />
        </button>
      </div>

      {/* ── Employee card ── */}
      <div className="mx-3 mb-3 rounded-xl border border-border bg-surface-2/60 px-3 py-2.5">
        <div className="flex items-center gap-2.5">
          <Avatar name={employee.full_name} size="sm" />
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold">{employee.full_name}</p>
            <p className="truncate text-[11px] text-ink-soft">
              {employee.role ?? employee.department ?? 'Employee'}
            </p>
          </div>
        </div>
      </div>

      {/* ── Nav ── */}
      <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-1">
        <NavGroup items={primaryNav} pathname={pathname} onNavClick={handleNavClick} />
      </nav>

      {/* ── Bottom: theme + sign out ── */}
      <div className="border-t border-border p-3 space-y-1">
        <ThemeToggle />
        <button
          type="button"
          onClick={handleSignOut}
          className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-ink-muted hover:bg-surface-2 hover:text-coral transition-colors"
        >
          <LogOut className="size-[18px] opacity-70" />
          Sign Out
        </button>
      </div>
    </aside>
  )
}

function NavGroup({
  items, pathname, onNavClick,
}: {
  items: NavItem[]
  pathname: string
  onNavClick: () => void
}) {
  return (
    <ul className="space-y-0.5">
      {items.map(({ href, label, icon: Icon }) => {
        const active = href === '/employee/dashboard'
          ? pathname === href
          : pathname.startsWith(href)
        return (
          <li key={href}>
            <Link
              href={href}
              onClick={onNavClick}
              className={cn(
                'group flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors',
                active
                  ? 'bg-brand text-brand-foreground shadow-sm'
                  : 'text-ink-muted hover:bg-surface-2 hover:text-ink',
              )}
            >
              <Icon className={cn('size-[18px]', active ? 'opacity-100' : 'opacity-70 group-hover:opacity-100')} />
              {label}
            </Link>
          </li>
        )
      })}
    </ul>
  )
}
