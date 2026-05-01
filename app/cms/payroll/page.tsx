import { Topbar } from '@/components/topbar'
import { PayrollSection } from '@/components/payroll/payroll-section'
import { listEmployees } from '@/lib/db/employees'

export const dynamic = 'force-dynamic'

export default async function PayrollPage() {
  const { rows: employees } = await listEmployees({ limit: 200 })

  return (
    <>
      <Topbar
        title="Payroll"
        breadcrumb={[{ label: 'Home' }, { label: 'Payroll' }]}
      />
      <main className="space-y-5 px-4 py-4 sm:px-8 sm:py-6">
        <PayrollSection employees={employees} />
      </main>
    </>
  )
}
