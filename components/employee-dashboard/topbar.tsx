'use client'

import * as React from 'react'
import { ChevronDown, LogOut, Menu } from 'lucide-react'
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
  const [menuOpen, setMenuOpen] = React.useState(false)
  const [signingOut, setSigningOut] = React.useState(false)
  const menuRef = React.useRef<HTMLDivElement>(null)

  React.useEffect(() => {
    if (!menuOpen) return
    function onClick(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setMenuOpen(false)
    }
    function onEsc(e: KeyboardEvent) { if (e.key === 'Escape') setMenuOpen(false) }
    document.addEventListener('mousedown', onClick)
    document.addEventListener('keydown', onEsc)
    return () => {
      document.removeEventListener('mousedown', onClick)
      document.removeEventListener('keydown', onEsc)
    }
  }, [menuOpen])

  async function handleSignOut() {
    setSigningOut(true)
    try {
      await fetch('/api/employee-auth/logout', { method: 'POST' })
    } finally {
      window.location.replace('/employee-login')
    }
  }

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

          <div ref={menuRef} className="relative">
            <button
              type="button"
              onClick={() => setMenuOpen((o) => !o)}
              aria-haspopup="menu"
              aria-expanded={menuOpen}
              className="inline-flex items-center gap-2 rounded-full border border-border bg-surface py-1 pl-1 pr-2 text-sm hover:bg-surface-2 sm:pr-3"
            >
              <Avatar name={employee.full_name} size="sm" />
              <span className="hidden font-medium sm:inline">{employee.full_name.split(' ')[0]}</span>
              <ChevronDown className="hidden size-4 text-ink-soft sm:block" />
            </button>

            {menuOpen && (
              <div
                role="menu"
                className="absolute right-0 top-full z-40 mt-2 w-56 overflow-hidden rounded-xl border border-border bg-surface shadow-lg"
              >
                <div className="flex items-center gap-2.5 border-b border-border px-3 py-2.5">
                  <Avatar name={employee.full_name} size="sm" />
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-ink">{employee.full_name}</p>
                    <p className="truncate text-[11px] text-ink-soft">
                      {employee.role ?? employee.department ?? 'Employee'}
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  role="menuitem"
                  onClick={handleSignOut}
                  disabled={signingOut}
                  className="flex w-full items-center gap-2.5 px-3 py-2.5 text-sm font-medium text-ink-muted transition-colors hover:bg-surface-2 hover:text-coral disabled:opacity-60"
                >
                  <LogOut className="size-4 opacity-70" />
                  {signingOut ? 'Signing out…' : 'Sign Out'}
                </button>
              </div>
            )}
          </div>
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
