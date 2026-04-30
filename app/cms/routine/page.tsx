import { Topbar } from '@/components/topbar'
import { RoutineSection } from '@/components/routine/routine-section'
import { listTemplates } from '@/lib/db/task-templates'
import {
  listRecurringTasks,
  listRecurringCompletionsForDate,
} from '@/lib/db/recurring-tasks'
import { listCompanies } from '@/lib/db/companies'
import { listEmployees } from '@/lib/db/employees'

export const dynamic = 'force-dynamic'

export default async function RoutinePage() {
  // Use server local date — same convention as the rest of the app.
  const today = new Date().toISOString().slice(0, 10)

  const [templates, recurringTasks, companies, employeesResult, todayCompletions] =
    await Promise.all([
      listTemplates(),
      listRecurringTasks(),
      listCompanies(),
      listEmployees({ limit: 200 }),
      listRecurringCompletionsForDate(today),
    ])

  // Build a Map<recurring_task_id, Set<employee_id>> so the card can show
  // "X/Y assignees done today" without doing its own fetch.
  const completionsByTask: Record<string, string[]> = {}
  for (const c of todayCompletions) {
    if (!completionsByTask[c.recurring_task_id]) {
      completionsByTask[c.recurring_task_id] = []
    }
    completionsByTask[c.recurring_task_id].push(c.employee_id)
  }

  return (
    <>
      <Topbar
        title="Routine Tasks"
        breadcrumb={[{ label: 'Home' }, { label: 'Routine Tasks' }]}
      />
      <main className="space-y-5 px-4 py-4 sm:px-8 sm:py-6">
        <RoutineSection
          initialTemplates={templates}
          initialRecurringTasks={recurringTasks}
          companies={companies}
          employees={employeesResult.rows}
          todayCompletions={completionsByTask}
        />
      </main>
    </>
  )
}
