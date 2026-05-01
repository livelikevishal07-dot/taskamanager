import { Topbar } from '@/components/topbar'
import { EmployeesSection } from '@/components/employees/employees-section'
import { listEmployees } from '@/lib/db/employees'
import { listDepartments } from '@/lib/db/departments'
import { listRoles } from '@/lib/db/roles'
import { listCompanies } from '@/lib/db/companies'

export const dynamic = 'force-dynamic'

export default async function EmployeesPage() {
  const [employeesResult, departments, roles, companies] = await Promise.all([
    listEmployees({ limit: 200 }),
    listDepartments(),
    listRoles(),
    listCompanies(),
  ])

  return (
    <>
      <Topbar
        title="Employees"
        breadcrumb={[{ label: 'Home' }, { label: 'Employees' }]}
      />

      <main className="space-y-5 px-4 py-4 sm:px-8 sm:py-6">
        <EmployeesSection
          employees={employeesResult.rows}
          departments={departments}
          roles={roles}
          companies={companies}
        />
      </main>
    </>
  )
}
