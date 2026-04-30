'use client'

import { EmployeeSidebar } from './sidebar'
import { useMobileMenu }   from '@/app/employee/mobile-menu-context'
import { cn }              from '@/lib/utils'

/**
 * Client wrapper that manages the responsive sidebar drawer.
 * Receives server-rendered children (pages) as a React prop — this is safe
 * because Next.js allows server components to be passed as children to client
 * components without turning them into client components themselves.
 */
export function EmployeeShell({ children }: { children: React.ReactNode }) {
  const { open, closeMenu } = useMobileMenu()

  return (
    <div className="employee-theme flex min-h-screen bg-canvas">

      {/* ── Backdrop overlay (mobile only) ── */}
      <div
        aria-hidden="true"
        onClick={closeMenu}
        className={cn(
          'fixed inset-0 z-40 bg-black/50 backdrop-blur-sm transition-opacity duration-300 lg:hidden',
          open ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none',
        )}
      />

      {/* ── Sidebar ── */}
      {/* Mobile: fixed drawer that slides in from the left          */}
      {/* Desktop (lg+): static flex item that sticks during scroll   */}
      <div
        className={cn(
          'fixed inset-y-0 left-0 z-50 transition-transform duration-300 ease-in-out',
          'lg:static lg:inset-auto lg:z-auto lg:transition-none',
          open ? 'translate-x-0' : '-translate-x-full lg:translate-x-0',
        )}
      >
        <EmployeeSidebar />
      </div>

      {/* ── Page content ── */}
      <div className="flex min-w-0 flex-1 flex-col overflow-x-hidden">
        {children}
      </div>
    </div>
  )
}
