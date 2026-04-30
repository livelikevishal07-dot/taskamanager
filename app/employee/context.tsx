'use client'

import { createContext, useContext, useMemo } from 'react'

export interface CurrentEmployee {
  id: string
  full_name: string
  avatar_url: string | null
  role: string | null
  department: string | null
  working_hours_start: string
  working_hours_end: string
}

const EmployeeContext = createContext<CurrentEmployee | null>(null)

export function EmployeeProvider({
  value,
  children,
}: {
  value: CurrentEmployee
  children: React.ReactNode
}) {
  // Stabilise the context value so child components that consume it don't
  // re-render on every unrelated parent state update. The value is compared
  // field-by-field; it only changes when the server provides new employee data.
  const stable = useMemo(
    () => value,
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [
      value.id,
      value.full_name,
      value.avatar_url,
      value.role,
      value.department,
      value.working_hours_start,
      value.working_hours_end,
    ],
  )

  return <EmployeeContext.Provider value={stable}>{children}</EmployeeContext.Provider>
}

export function useEmployee(): CurrentEmployee {
  const ctx = useContext(EmployeeContext)
  if (!ctx) throw new Error('useEmployee must be used within EmployeeProvider')
  return ctx
}
