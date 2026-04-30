'use client'

import * as React from 'react'
import { Bell, ChevronDown, LogOut, Mail, Menu, Search, ShieldCheck } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useAdminMobileMenu } from '@/app/cms/mobile-menu-context'

interface Props {
  title: string
  breadcrumb?: { label: string; href?: string }[]
}

export function Topbar({ title, breadcrumb = [] }: Props) {
  const [menuOpen, setMenuOpen] = React.useState(false)
  const menuRef = React.useRef<HTMLDivElement>(null)
  const { openMenu } = useAdminMobileMenu()

  // Close on outside click
  React.useEffect(() => {
    if (!menuOpen) return
    function handler(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [menuOpen])

  async function handleSignOut() {
    await fetch('/api/admin-auth/logout', { method: 'POST' })
    window.location.replace('/admin-login')
  }

  return (
    <header className="sticky top-0 z-30 border-b border-border bg-canvas/60 backdrop-blur">
      <div className="flex items-center justify-between gap-4 px-4 py-4 sm:px-8">
        {/* Left: hamburger + title */}
        <div className="flex min-w-0 items-center gap-3">
          <button
            type="button"
            onClick={openMenu}
            aria-label="Open menu"
            className="lg:hidden grid size-9 shrink-0 place-items-center rounded-lg border border-border bg-surface text-ink-muted hover:bg-surface-2"
          >
            <Menu className="size-5" />
          </button>
          <h1 className="truncate text-xl font-semibold tracking-tight">{title}</h1>
        </div>

        <div className="hidden flex-1 max-w-md md:block">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-ink-soft" />
            <input
              type="search"
              placeholder="Search"
              className="h-9 w-full rounded-full border border-border bg-surface pl-9 pr-4 text-sm placeholder:text-ink-soft focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/20"
            />
          </div>
        </div>

        <div className="flex items-center gap-2">
          <IconBtn label="Inbox">
            <Mail className="size-[18px]" />
            <span className="absolute right-1.5 top-1.5 size-1.5 rounded-full bg-coral" />
          </IconBtn>
          <IconBtn label="Notifications">
            <Bell className="size-[18px]" />
          </IconBtn>

          {/* Admin user menu */}
          <div ref={menuRef} className="relative ml-1">
            <button
              type="button"
              onClick={() => setMenuOpen((o) => !o)}
              className={cn(
                'inline-flex items-center gap-2 rounded-full border border-border bg-surface py-1 pl-1 pr-3 text-sm transition-colors hover:bg-surface-2',
                menuOpen && 'bg-surface-2',
              )}
            >
              <span className="grid size-7 place-items-center rounded-full bg-violet/15 text-violet font-semibold text-xs">
                SA
              </span>
              <span className="hidden font-medium sm:inline">Super Admin</span>
              <ChevronDown className={cn('size-4 text-ink-soft transition-transform', menuOpen && 'rotate-180')} />
            </button>

            {/* Dropdown */}
            {menuOpen && (
              <div className="absolute right-0 top-full z-50 mt-2 w-52 overflow-hidden rounded-xl border border-border bg-surface shadow-lg">
                {/* Header */}
                <div className="flex items-center gap-2.5 border-b border-border px-4 py-3">
                  <span className="grid size-8 shrink-0 place-items-center rounded-full bg-violet/15 text-violet font-semibold text-xs">
                    SA
                  </span>
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold">Super Admin</p>
                    <div className="flex items-center gap-1 text-[10px] text-ink-soft">
                      <ShieldCheck className="size-3 text-emerald" />
                      Full access
                    </div>
                  </div>
                </div>

                {/* Sign out */}
                <div className="p-1.5">
                  <button
                    type="button"
                    onClick={handleSignOut}
                    className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium text-coral hover:bg-coral/10 transition-colors"
                  >
                    <LogOut className="size-4" />
                    Sign out
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {breadcrumb.length > 0 && (
        <div className="flex items-center justify-between px-4 pb-3 sm:px-8 text-sm text-ink-muted">
          <nav className="flex items-center gap-1.5 overflow-x-auto">
            {breadcrumb.map((b, i) => (
              <span key={i} className="flex shrink-0 items-center gap-1.5">
                {i > 0 && <span className="text-ink-soft">›</span>}
                <span className={i === breadcrumb.length - 1 ? 'text-ink' : ''}>
                  {b.label}
                </span>
              </span>
            ))}
          </nav>
          <button className="ml-4 inline-flex shrink-0 items-center gap-1.5 rounded-full border border-border bg-surface px-3 py-1 text-xs font-medium hover:bg-surface-2">
            28 Dec 23 – 10 Jan 24
            <ChevronDown className="size-3.5 text-ink-soft" />
          </button>
        </div>
      )}
    </header>
  )
}

function IconBtn({
  children,
  label,
}: {
  children: React.ReactNode
  label: string
}) {
  return (
    <button
      type="button"
      aria-label={label}
      className="relative grid size-9 place-items-center rounded-full border border-border bg-surface text-ink-muted hover:bg-surface-2 hover:text-ink"
    >
      {children}
    </button>
  )
}
