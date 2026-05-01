import { Topbar } from '@/components/topbar'
import { ReportsPage } from '@/components/reports/reports-page'
import { listEmployees } from '@/lib/db/employees'

export const dynamic = 'force-dynamic'

export default async function ReportsPageRoute() {
  const { rows: employees } = await listEmployees({ status: 'active', limit: 500 })

  return (
    <>
      <Topbar
        title="Reports"
        breadcrumb={[{ label: 'Home' }, { label: 'Reports' }]}
      />
      <main className="space-y-5 px-4 py-4 sm:px-8 sm:py-6">
        <ReportsPage employees={employees} />
      </main>
    </>
  )
}
