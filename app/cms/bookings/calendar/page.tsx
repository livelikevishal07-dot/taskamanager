import { Topbar } from '@/components/topbar'
import { AdminBookingsCalendar } from '@/components/bookings/admin-bookings-calendar'
import { listEmployees } from '@/lib/db/employees'

export const dynamic = 'force-dynamic'

export default async function BookingsCalendarPage() {
  const { rows } = await listEmployees({ limit: 500 })

  const salesOps = rows
    .filter(e => {
      const dept = (e.department as { name?: string } | null)?.name ?? ''
      return dept === 'Sales' || dept === 'Operations'
    })
    .map(e => ({ id: e.id, full_name: e.full_name }))

  return (
    <>
      <Topbar
        title="Bookings — Calendar"
        breadcrumb={[{ label: 'Home' }, { label: 'Bookings' }, { label: 'Calendar' }]}
      />
      <main className="space-y-6 px-4 py-4 sm:px-8 sm:py-6">
        <AdminBookingsCalendar employees={salesOps} />
      </main>
    </>
  )
}
