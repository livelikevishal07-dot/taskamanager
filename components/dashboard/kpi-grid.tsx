import { Briefcase, CheckCircle2, Clock, AlertCircle } from 'lucide-react'

import { KpiCard, type Accent } from './kpi-card'
import { KPIS } from '@/lib/mock-data'

const ICONS = [Briefcase, CheckCircle2, Clock, AlertCircle]

export function KpiGrid() {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
      {KPIS.map((k, i) => (
        <KpiCard
          key={k.label}
          period={k.period}
          label={k.label}
          value={k.value}
          accent={k.accent as Accent}
          icon={ICONS[i]}
        />
      ))}
    </div>
  )
}
