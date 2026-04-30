import { ArrowUpRight, type LucideIcon } from 'lucide-react'
import { cn } from '@/lib/utils'

const ACCENTS = {
  violet:
    'from-violet to-violet-soft text-white [--decor:theme(colors.white/15%)]',
  sky: 'from-sky to-sky-soft text-white [--decor:theme(colors.white/18%)]',
  indigo:
    'from-indigo to-indigo-soft text-white [--decor:theme(colors.white/15%)]',
  coral:
    'from-coral to-coral-soft text-white [--decor:theme(colors.white/18%)]',
} as const

export type Accent = keyof typeof ACCENTS

interface Props {
  period: string
  label: string
  value: string
  accent: Accent
  icon?: LucideIcon
}

export function KpiCard({ period, label, value, accent, icon: Icon }: Props) {
  return (
    <div
      className={cn(
        'relative overflow-hidden rounded-2xl bg-gradient-to-br p-5 shadow-card',
        ACCENTS[accent]
      )}
    >
      {/* decorative blobs */}
      <div className="pointer-events-none absolute -right-8 -top-10 size-32 rounded-full bg-[var(--decor)]" />
      <div className="pointer-events-none absolute -bottom-12 right-10 size-28 rounded-full bg-[var(--decor)]" />

      <div className="relative flex h-full flex-col">
        <p className="text-sm font-medium opacity-90">{period}</p>
        <p className="mt-0.5 text-xs opacity-75">{label}</p>

        <div className="mt-6 flex items-end justify-between">
          <span className="text-3xl font-semibold tracking-tight">{value}</span>
          <span className="grid size-10 place-items-center rounded-full bg-white/95 text-ink shadow-sm">
            {Icon ? <Icon className="size-5" /> : <ArrowUpRight className="size-5" />}
          </span>
        </div>
      </div>
    </div>
  )
}
