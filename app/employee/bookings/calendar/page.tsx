import { BookOpen } from 'lucide-react'

import { EmployeeTopbar } from '@/components/employee-dashboard/topbar'
import { AdminBookingsCalendar } from '@/components/bookings/admin-bookings-calendar'
import { listEmployees, getEmployee } from '@/lib/db/employees'
import { getSessionEmployeeId } from '@/lib/auth'
import { redirect } from 'next/navigation'

export const dynamic = 'force-dynamic'

const ALLOWED_DEPARTMENTS = ['Sales', 'Operations']

export default async function EmployeeBookingsCalendarPage() {
  const sessionId = getSessionEmployeeId()
  if (!sessionId) redirect('/employee-login')

  const me = await getEmployee(sessionId).catch(() => null)
  const myDept = me?.department?.name ?? null

  if (!myDept || !ALLOWED_DEPARTMENTS.includes(myDept)) {
    return (
      <>
        <EmployeeTopbar
          title="Booking Calendar"
          breadcrumb={[{ label: 'Home' }, { label: 'Booking Calendar' }]}
        />
        <main className="flex flex-col items-center justify-center gap-4 py-32">
          <div className="grid size-16 place-items-center rounded-2xl bg-surface-2">
            <BookOpen className="size-8 text-ink-soft/40" />
          </div>
          <p className="text-sm font-medium text-ink">Access Restricted</p>
          <p className="text-xs text-ink-soft">The booking calendar is only available for Sales and Operations teams.</p>
        </main>
      </>
    )
  }

  const { rows } = await listEmployees({ limit: 500 })
  const salesOps = rows
    .filter(e => {
      const dept = (e.department as { name?: string } | null)?.name ?? ''
      return dept === 'Sales' || dept === 'Operations'
    })
    .map(e => ({ id: e.id, full_name: e.full_name }))

  return (
    <>
      <EmployeeTopbar
        title="Booking Calendar"
        breadcrumb={[{ label: 'Home' }, { label: 'Booking Calendar' }]}
        subtitle="Orders scheduled by event date — same view as admin"
      />
      <main className="space-y-6 px-4 py-4 sm:px-6 sm:py-6">
        <AdminBookingsCalendar employees={salesOps} hideAmounts />
      </main>
    </>
  )
}
