'use client'

import { createContext, useContext, useState, useCallback } from 'react'

interface MobileMenuCtx {
  open:      boolean
  openMenu:  () => void
  closeMenu: () => void
}

const Ctx = createContext<MobileMenuCtx>({
  open:      false,
  openMenu:  () => {},
  closeMenu: () => {},
})

export function MobileMenuProvider({ children }: { children: React.ReactNode }) {
  const [open, setOpen]  = useState(false)
  const openMenu         = useCallback(() => setOpen(true),  [])
  const closeMenu        = useCallback(() => setOpen(false), [])
  return <Ctx.Provider value={{ open, openMenu, closeMenu }}>{children}</Ctx.Provider>
}

export function useMobileMenu() {
  return useContext(Ctx)
}
