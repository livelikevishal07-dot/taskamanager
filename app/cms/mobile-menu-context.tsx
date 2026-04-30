'use client'

import * as React from 'react'

interface MobileMenuCtx {
  open: boolean
  openMenu: () => void
  closeMenu: () => void
}

const Ctx = React.createContext<MobileMenuCtx>({
  open: false,
  openMenu: () => {},
  closeMenu: () => {},
})

export function AdminMobileMenuProvider({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = React.useState(false)
  const value = React.useMemo<MobileMenuCtx>(
    () => ({ open, openMenu: () => setOpen(true), closeMenu: () => setOpen(false) }),
    [open],
  )
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>
}

export function useAdminMobileMenu() {
  return React.useContext(Ctx)
}
