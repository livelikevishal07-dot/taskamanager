import { Topbar } from '@/components/topbar'
import { AdminLeaveManagement } from '@/components/leave/admin-leave-management'
import { listLeaveRequests } from '@/lib/db/leave-requests'
import { listEmployees } from '@/lib/db/employees'
import { listHolidays } from '@/lib/db/holidays'
import { getLeavePolicy } from '@/lib/db/leave-policy'

export const dynamic = 'force-dynamic'

export default async function LeavePage() {
  const year = new Date().getFullYear()

  const [employeesResult, requests, holidays, policies] = await Promise.all([
    listEmployees({ limit: 200 }),
    listLeaveRequests({ limit: 2000 }),
    listHolidays({ year }),
    getLeavePolicy(),
  ])

  return (
    <>
      <Topbar
        title="Leave Management"
        breadcrumb={[{ label: 'Home' }, { label: 'Leave Management' }]}
      />
      <main className="space-y-5 px-4 py-4 sm:px-8 sm:py-6">
        <AdminLeaveManagement
          employees={employeesResult.rows}
          initialRequests={requests}
          initialHolidays={holidays}
          initialPolicies={policies}
          initialYear={year}
        />
      </main>
    </>
  )
}
