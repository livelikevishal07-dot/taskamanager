import { TeamCard } from './team-card'
import { TEAMS } from '@/lib/mock-data'

export function TeamsGrid() {
  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
      {TEAMS.map((t) => (
        <TeamCard key={t.id} team={t} />
      ))}
    </div>
  )
}
