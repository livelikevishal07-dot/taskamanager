import { Topbar } from '@/components/topbar'
import { PerformanceStats } from '@/components/performance/performance-stats'
import { PerformanceTrend } from '@/components/performance/performance-trend'
import { Leaderboard } from '@/components/performance/leaderboard'
import { DepartmentBreakdown } from '@/components/performance/department-breakdown'

export const dynamic = 'force-dynamic'

export default function PerformancePage() {
  return (
    <>
      <Topbar
        title="Performance"
        breadcrumb={[{ label: 'Home' }, { label: 'Performance' }]}
      />
      <main className="space-y-5 px-4 py-4 sm:px-8 sm:py-6">
        <PerformanceStats />

        <div className="grid gap-5 lg:grid-cols-3">
          <div className="lg:col-span-2">
            <PerformanceTrend />
          </div>
          <DepartmentBreakdown />
        </div>

        <Leaderboard />
      </main>
    </>
  )
}
