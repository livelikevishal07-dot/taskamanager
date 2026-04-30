'use client'

import * as React from 'react'
import { cn } from '@/lib/utils'
import { Sidebar } from '@/components/sidebar'
import { useAdminMobileMenu } from '@/app/cms/mobile-menu-context'

export function AdminShell({ children }: { children: React.ReactNode }) {
  const { open, closeMenu } = useAdminMobileMenu()

  return (
    <div className="flex min-h-screen bg-canvas">
      {/* Backdrop — mobile only */}
      <div
        onClick={closeMenu}
        className={cn(
          'fixed inset-0 z-40 bg-black/50 backdrop-blur-sm transition-opacity duration-300 lg:hidden',
          open ? 'pointer-events-auto opacity-100' : 'pointer-events-none opacity-0',
        )}
      />

      {/* Sidebar drawer */}
      <div
        className={cn(
          'fixed inset-y-0 left-0 z-50 transition-transform duration-300 ease-in-out',
          'lg:static lg:inset-auto lg:z-auto lg:transition-none',
          open ? 'translate-x-0' : '-translate-x-full lg:translate-x-0',
        )}
      >
        <Sidebar />
      </div>

      {/* Main content */}
      <div className="flex min-w-0 flex-1 flex-col overflow-x-hidden">{children}</div>
    </div>
  )
}
