import { ArrowRight, MoreHorizontal } from 'lucide-react'

import { Avatar, AvatarStack } from '@/components/ui/avatar'
import { cn } from '@/lib/utils'
import type { Team, TeamAccent } from '@/lib/mock-data'

const ACCENT: Record<TeamAccent, { bar: string; ring: string; soft: string; text: string; bg: string }> = {
  violet: {
    bar: 'from-violet to-violet-soft',
    ring: 'ring-violet/30',
    soft: 'bg-violet/10',
    text: 'text-violet',
    bg: 'bg-violet',
  },
  sky: {
    bar: 'from-sky to-sky-soft',
    ring: 'ring-sky/30',
    soft: 'bg-sky/10',
    text: 'text-sky',
    bg: 'bg-sky',
  },
  indigo: {
    bar: 'from-indigo to-indigo-soft',
    ring: 'ring-indigo/30',
    soft: 'bg-indigo/10',
    text: 'text-indigo',
    bg: 'bg-indigo',
  },
  coral: {
    bar: 'from-coral to-coral-soft',
    ring: 'ring-coral/30',
    soft: 'bg-coral/10',
    text: 'text-coral',
    bg: 'bg-coral',
  },
  emerald: {
    bar: 'from-emerald to-emerald',
    ring: 'ring-emerald/30',
    soft: 'bg-emerald/10',
    text: 'text-emerald',
    bg: 'bg-emerald',
  },
  amber: {
    bar: 'from-amber to-amber',
    ring: 'ring-amber/40',
    soft: 'bg-amber/15',
    text: 'text-amber',
    bg: 'bg-amber',
  },
}

export function TeamCard({ team }: { team: Team }) {
  const a = ACCENT[team.accent]
  const completion = Math.round((team.completed / team.totalTasks) * 100)

  return (
    <article className="group relative overflow-hidden rounded-2xl border border-border bg-surface shadow-card transition-shadow hover:shadow-pop">
      {/* accent strip */}
      <div className={cn('h-1.5 w-full bg-gradient-to-r', a.bar)} />

      <div className="p-5">
        <div className="mb-4 flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <span
              className={cn(
                'grid size-11 place-items-center rounded-xl font-bold text-white',
                a.bg
              )}
            >
              {team.name.split(' ').map((w) => w[0]).slice(0, 2).join('')}
            </span>
            <div className="min-w-0">
              <h3 className="truncate font-semibold">{team.name}</h3>
              <p className="text-xs text-ink-soft">
                {team.members.length} members · Lead {team.lead}
              </p>
            </div>
          </div>
          <button
            aria-label="More"
            className="grid size-8 place-items-center rounded-lg text-ink-soft opacity-0 transition-opacity hover:bg-surface-2 hover:text-ink group-hover:opacity-100"
          >
            <MoreHorizontal className="size-4" />
          </button>
        </div>

        <p className="text-sm text-ink-muted">{team.description}</p>

        <div className="mt-4 grid grid-cols-3 gap-2 text-center">
          <Stat label="Total" value={team.totalTasks} />
          <Stat label="Done" value={team.completed} accent="emerald" />
          <Stat label="Overdue" value={team.overdue} accent="coral" />
        </div>

        <div className="mt-4">
          <div className="mb-1.5 flex items-center justify-between text-xs">
            <span className="text-ink-muted">Completion</span>
            <span className="font-semibold">{completion}%</span>
          </div>
          <div className="h-1.5 w-full overflow-hidden rounded-full bg-surface-2">
            <div
              className={cn('h-full rounded-full', a.bg)}
              style={{ width: `${completion}%` }}
            />
          </div>
        </div>

        <div className="mt-4 flex items-center justify-between border-t border-border pt-4">
          <AvatarStack names={team.members} max={4} size="sm" />
          <button
            className={cn(
              'inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-semibold transition-colors',
              a.soft,
              a.text,
              'hover:opacity-90'
            )}
          >
            View team
            <ArrowRight className="size-3.5" />
          </button>
        </div>
      </div>
    </article>
  )
}

function Stat({
  label,
  value,
  accent,
}: {
  label: string
  value: number
  accent?: 'emerald' | 'coral'
}) {
  const tone =
    accent === 'emerald'
      ? 'text-emerald'
      : accent === 'coral'
        ? 'text-coral'
        : 'text-ink'
  return (
    <div className="rounded-lg border border-border bg-surface-2 px-2 py-2">
      <p className={cn('text-base font-semibold', tone)}>{value}</p>
      <p className="text-[10px] uppercase tracking-wide text-ink-soft">{label}</p>
    </div>
  )
}

// Avoid unused-import warning when only types from above are referenced
export const _ref = Avatar
