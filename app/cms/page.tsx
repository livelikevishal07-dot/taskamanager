import { Topbar } from '@/components/topbar'
import { AdminDashboard } from '@/components/dashboard/admin-dashboard'
import { getDashboardSnapshot } from '@/lib/db/dashboard'

export const dynamic = 'force-dynamic'

export default async function AdminDashboardPage() {
  const snapshot = await getDashboardSnapshot()
  return (
    <>
      <Topbar
        title="Dashboard"
        breadcrumb={[{ label: 'Home' }, { label: 'Dashboard' }]}
      />
      <main className="space-y-5 px-4 py-4 sm:px-8 sm:py-6">
        <AdminDashboard initial={snapshot} />
      </main>
    </>
  )
}
