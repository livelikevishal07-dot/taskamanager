import { Topbar } from '@/components/topbar'
import { AttendanceSection } from '@/components/attendance/attendance-section'
import { listAttendance } from '@/lib/db/attendance'
import { listEmployees } from '@/lib/db/employees'

export const dynamic = 'force-dynamic'

export default async function AttendancePage() {
  const sixMonthsAgo = new Date()
  sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6)

  const [employeesResult, attendanceRows] = await Promise.all([
    listEmployees({ limit: 200 }),
    listAttendance({
      from: sixMonthsAgo.toISOString().slice(0, 10),
      to: new Date().toISOString().slice(0, 10),
      limit: 10000,
    }).catch(() => []),
  ])

  return (
    <>
      <Topbar
        title="Attendance"
        breadcrumb={[{ label: 'Home' }, { label: 'Attendance' }]}
      />
      <main className="space-y-5 px-4 py-4 sm:px-8 sm:py-6">
        <AttendanceSection
          employees={employeesResult.rows}
          initialRows={attendanceRows}
        />
      </main>
    </>
  )
}
