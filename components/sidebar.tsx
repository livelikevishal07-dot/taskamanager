'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  LayoutDashboard,
  Users,
  CheckSquare,
  CalendarDays,
  CalendarOff,
  Settings,
  FileText,
  BarChart3,
  Repeat2,
  UserCircle,
  Megaphone,
  BookOpen,
  PieChart,
  ListOrdered,
  LogOut,
  X,
  type LucideIcon,
} from 'lucide-react'

import { cn } from '@/lib/utils'
import { ThemeToggle } from './theme-toggle'
import { useAdminMobileMenu } from '@/app/cms/mobile-menu-context'

const APP_NAME = 'Officely'

interface NavItem {
  href:      string
  label:     string
  icon:      LucideIcon
  children?: NavItem[]
}

const PRIMARY: NavItem[] = [
  { href: '/cms',               label: 'Dashboard',     icon: LayoutDashboard },
  { href: '/cms/employees',     label: 'Employees',     icon: Users },
  { href: '/cms/tasks',         label: 'Tasks',         icon: CheckSquare },
  { href: '/cms/routine',       label: 'Routine',       icon: Repeat2 },
  { href: '/cms/announcements', label: 'Announcements', icon: Megaphone },
  {
    href: '/cms/bookings', label: 'Bookings', icon: BookOpen,
    children: [
      { href: '/cms/bookings/analysis', label: 'Analysis',    icon: PieChart },
      { href: '/cms/bookings/list',     label: 'All Entries', icon: ListOrdered },
    ],
  },
]

const SECONDARY: NavItem[] = [
  { href: '/cms/performance',  label: 'Performance',      icon: BarChart3 },
  { href: '/cms/attendance',   label: 'Attendance',       icon: CalendarDays },
  { href: '/cms/leave',        label: 'Leave Management', icon: CalendarOff },
  { href: '/cms/reports',      label: 'Reports',          icon: FileText },
  { href: '/cms/settings',     label: 'Settings',         icon: Settings },
  { href: '/employee/dashboard', label: 'Employee Portal', icon: UserCircle },
]

export function Sidebar() {
  const pathname = usePathname()
  const { closeMenu } = useAdminMobileMenu()

  async function handleSignOut() {
    await fetch('/api/admin-auth/logout', { method: 'POST' })
    window.location.replace('/admin-login')
  }

  return (
    <aside className="flex h-full w-64 shrink-0 flex-col border-r border-border bg-surface">
      {/* Logo + close button */}
      <div className="flex items-center justify-between gap-2 px-6 py-5">
        <div className="flex min-w-0 items-center gap-2">
          <div className="grid size-8 shrink-0 place-items-center rounded-full bg-brand text-brand-foreground shadow-sm">
            <span className="text-sm font-bold">O</span>
          </div>
          <div className="min-w-0">
            <span className="block text-base font-semibold leading-tight tracking-tight">{APP_NAME}</span>
            <span className="block text-[10px] font-medium uppercase tracking-wider text-ink-soft">Admin Portal</span>
          </div>
        </div>
        <button
          type="button"
          onClick={closeMenu}
          aria-label="Close menu"
          className="lg:hidden grid size-8 shrink-0 place-items-center rounded-lg text-ink-soft hover:bg-surface-2 hover:text-ink"
        >
          <X className="size-4" />
        </button>
      </div>

      <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-2">
        <NavGroup items={PRIMARY}   pathname={pathname} onNavClick={closeMenu} />
        <div className="mx-3 my-3 border-t border-border" />
        <NavGroup items={SECONDARY} pathname={pathname} onNavClick={closeMenu} />
      </nav>

      <div className="space-y-1 border-t border-border p-3">
        <ThemeToggle />
        <button
          type="button"
          onClick={handleSignOut}
          className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-ink-muted transition-colors hover:bg-surface-2 hover:text-coral"
        >
          <LogOut className="size-[18px] opacity-70" />
          Sign Out
        </button>
      </div>
    </aside>
  )
}

function NavGroup({
  items,
  pathname,
  onNavClick,
}: {
  items: NavItem[]
  pathname: string
  onNavClick: () => void
}) {
  return (
    <ul className="space-y-1">
      {items.map((item) => (
        <NavRow key={item.href} item={item} pathname={pathname} onNavClick={onNavClick} />
      ))}
    </ul>
  )
}

function NavRow({
  item,
  pathname,
  onNavClick,
}: {
  item: NavItem
  pathname: string
  onNavClick: () => void
}) {
  const { href, label, icon: Icon, children } = item

  // Parent considered "in section" if pathname starts with its href
  const inSection = href === '/cms' ? pathname === href : pathname.startsWith(href)

  // Direct active = path exactly matches OR (parent without children AND startsWith match)
  const directActive = children
    ? pathname === href
    : inSection

  return (
    <li>
      <Link
        href={href}
        onClick={onNavClick}
        className={cn(
          'group flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors',
          directActive
            ? 'bg-brand text-brand-foreground shadow-sm'
            : inSection && children
              ? 'bg-surface-2 text-ink'
              : 'text-ink-muted hover:bg-surface-2 hover:text-ink'
        )}
      >
        <Icon
          className={cn(
            'size-[18px]',
            directActive ? 'opacity-100' : 'opacity-80 group-hover:opacity-100'
          )}
        />
        <span>{label}</span>
      </Link>

      {/* Children — render only when in this section */}
      {children && inSection && (
        <ul className="mt-1 ml-3 space-y-0.5 border-l border-border pl-3">
          {children.map((child) => {
            const ChildIcon = child.icon
            const childActive = pathname.startsWith(child.href)
            return (
              <li key={child.href}>
                <Link
                  href={child.href}
                  onClick={onNavClick}
                  className={cn(
                    'group flex items-center gap-2.5 rounded-lg px-3 py-2 text-[13px] font-medium transition-colors',
                    childActive
                      ? 'bg-brand/10 text-brand'
                      : 'text-ink-muted hover:bg-surface-2 hover:text-ink'
                  )}
                >
                  <ChildIcon
                    className={cn(
                      'size-[15px]',
                      childActive ? 'opacity-100' : 'opacity-70 group-hover:opacity-100'
                    )}
                  />
                  <span>{child.label}</span>
                </Link>
              </li>
            )
          })}
        </ul>
      )}
    </li>
  )
}
