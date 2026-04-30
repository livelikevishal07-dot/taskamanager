import { Topbar } from '@/components/topbar'
import { AdminBookingsAnalysis } from '@/components/bookings/admin-bookings-analysis'
import { listEmployees } from '@/lib/db/employees'

export const dynamic = 'force-dynamic'

export default async function BookingsAnalysisPage() {
  const { rows } = await listEmployees({ limit: 500 })

  const salesOps = rows
    .filter(e => {
      const dept = (e.department as any)?.name ?? ''
      return dept === 'Sales' || dept === 'Operations'
    })
    .map(e => ({ id: e.id, full_name: e.full_name }))

  return (
    <>
      <Topbar
        title="Bookings — Analysis"
        breadcrumb={[{ label: 'Home' }, { label: 'Bookings' }, { label: 'Analysis' }]}
      />
      <main className="space-y-6 px-4 py-4 sm:px-8 sm:py-6">
        <AdminBookingsAnalysis employees={salesOps} />
      </main>
    </>
  )
}
