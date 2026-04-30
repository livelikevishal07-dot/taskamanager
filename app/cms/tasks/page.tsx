import { Topbar } from '@/components/topbar'
import { TasksSection } from '@/components/tasks/tasks-section'
import { listTasks, getTaskStats } from '@/lib/db/tasks'
import { listCompanies } from '@/lib/db/companies'
import { listEmployees } from '@/lib/db/employees'
import { listTemplates } from '@/lib/db/task-templates'

export const dynamic = 'force-dynamic'

export default async function TasksPage() {
  const [tasks, stats, companiesResult, employeesResult, templates] = await Promise.all([
    listTasks({ limit: 500 }),
    getTaskStats(),
    listCompanies(),
    listEmployees({ limit: 200 }),
    listTemplates(),
  ])

  return (
    <>
      <Topbar
        title="Tasks"
        breadcrumb={[{ label: 'Home' }, { label: 'Tasks' }]}
      />

      <main className="space-y-5 px-4 py-4 sm:px-8 sm:py-6">
        <TasksSection
          initialTasks={tasks}
          stats={stats}
          companies={companiesResult}
          employees={employeesResult.rows}
          templates={templates}
        />
      </main>
    </>
  )
}
