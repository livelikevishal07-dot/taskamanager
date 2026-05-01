import { redirect } from 'next/navigation'

import { getEmployee }                    from '@/lib/db/employees'
import { getSessionEmployeeId }           from '@/lib/auth'
import { EmployeeProvider, type CurrentEmployee } from './context'
import { MobileMenuProvider }             from './mobile-menu-context'
import { EmployeeShell }                  from '@/components/employee-dashboard/shell'
import { PwaRegister }                    from '@/components/pwa-register'
import { PwaInstallBanner }               from '@/components/pwa-install-banner'

export default async function EmployeeLayout({ children }: { children: React.ReactNode }) {
  const sessionId = getSessionEmployeeId()
  if (!sessionId) redirect('/employee-login')

  let employee
  try {
    employee = await getEmployee(sessionId)
  } catch {
    redirect('/employee-login')
  }

  if (!employee || employee.status === 'inactive') {
    redirect('/employee-login')
  }

  const me: CurrentEmployee = {
    id:                   employee.id,
    full_name:            employee.full_name,
    avatar_url:           employee.avatar_url,
    role:                 employee.role?.name       ?? null,
    department:           employee.department?.name ?? null,
    working_hours_start:  employee.working_hours_start ?? '09:00',
    working_hours_end:    employee.working_hours_end   ?? '18:00',
  }

  return (
    <EmployeeProvider value={me}>
      <MobileMenuProvider>
        {/* Register service worker + show install banner (client-only, render null on server) */}
        <PwaRegister />
        {/* EmployeeShell is a client component — server-rendered children
            passed as a prop stay server components. */}
        <EmployeeShell>{children}</EmployeeShell>
        {/* Install banner sits outside the shell so it overlays everything */}
        <PwaInstallBanner />
      </MobileMenuProvider>
    </EmployeeProvider>
  )
}
