'use client'

import { ChevronDown, Menu } from 'lucide-react'
import { Avatar }            from '@/components/ui/avatar'
import { useEmployee }       from '@/app/employee/context'
import { useMobileMenu }     from '@/app/employee/mobile-menu-context'
import { NotificationBell }  from './notification-bell'

interface Props {
  title:      string
  breadcrumb?: { label: string }[]
  subtitle?:  string
}

export function EmployeeTopbar({ title, breadcrumb = [], subtitle }: Props) {
  const employee  = useEmployee()
  const { openMenu } = useMobileMenu()

  return (
    <header className="sticky top-0 z-30 border-b border-border bg-canvas/80 backdrop-blur">
      <div className="flex items-center justify-between gap-3 px-4 py-3 sm:px-6 sm:py-4">

        {/* Left — hamburger (mobile) + title */}
        <div className="flex min-w-0 items-center gap-3">
          {/* Hamburger — only visible below lg breakpoint */}
          <button
            type="button"
            onClick={openMenu}
            aria-label="Open navigation"
            className="grid size-9 shrink-0 place-items-center rounded-lg border border-border bg-surface text-ink-muted hover:bg-surface-2 hover:text-ink lg:hidden"
          >
            <Menu className="size-5" />
          </button>

          <div className="min-w-0">
            <h1 className="truncate text-lg font-semibold tracking-tight sm:text-xl">{title}</h1>
            {subtitle && <p className="truncate text-xs text-ink-muted sm:text-sm">{subtitle}</p>}
          </div>
        </div>

        {/* Right — bell + avatar */}
        <div className="flex shrink-0 items-center gap-2">
          <NotificationBell employeeId={employee.id} />

          <button
            type="button"
            className="inline-flex items-center gap-2 rounded-full border border-border bg-surface py-1 pl-1 pr-2 text-sm hover:bg-surface-2 sm:pr-3"
          >
            <Avatar name={employee.full_name} size="sm" />
            <span className="hidden font-medium sm:inline">{employee.full_name.split(' ')[0]}</span>
            <ChevronDown className="hidden size-4 text-ink-soft sm:block" />
          </button>
        </div>
      </div>

      {/* Breadcrumb */}
      {breadcrumb.length > 0 && (
        <nav className="flex items-center gap-1.5 px-4 pb-2.5 text-xs text-ink-muted sm:px-6 sm:pb-3 sm:text-sm">
          {breadcrumb.map((b, i) => (
            <span key={i} className="flex items-center gap-1.5">
              {i > 0 && <span className="text-ink-soft">›</span>}
              <span className={i === breadcrumb.length - 1 ? 'text-ink' : ''}>{b.label}</span>
            </span>
          ))}
        </nav>
      )}
    </header>
  )
}
