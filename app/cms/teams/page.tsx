import { Topbar } from '@/components/topbar'
import { TeamStats } from '@/components/teams/team-stats'
import { TeamsToolbar } from '@/components/teams/teams-toolbar'
import { TeamsGrid } from '@/components/teams/teams-grid'

export default function TeamsPage() {
  return (
    <>
      <Topbar
        title="Teams"
        breadcrumb={[{ label: 'Home' }, { label: 'Teams' }]}
      />

      <main className="space-y-5 px-4 py-4 sm:px-8 sm:py-6">
        <TeamStats />
        <TeamsToolbar />
        <TeamsGrid />
      </main>
    </>
  )
}
