'use client'

import * as React from 'react'
import { CalendarDays, ClipboardList, Settings2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import { LeaveSection } from './leave-section'
import { HolidaysSection } from './holidays-section'
import { PolicySection } from './policy-section'
import type { LeaveRequestWithEmployee } from '@/lib/db/leave-requests'
import type { Employee } from '@/lib/db/types'

// ── Types (minimal, client-safe) ──────────────────────────────────────────────

interface CompanyHoliday {
  id: string
  name: string
  date: string
  type: 'public' | 'company' | 'optional'
  recurring: boolean
  created_at: string
}

interface LeavePolicy {
  id: string
  leave_type: string
  accrual_type: 'fixed' | 'monthly'
  days_per_period: number
  max_carryover: number
  updated_at: string
}

// ── Tab config ────────────────────────────────────────────────────────────────

const TABS = [
  { id: 'requests', label: 'Leave Requests', icon: ClipboardList },
  { id: 'holidays', label: 'Holidays',       icon: CalendarDays   },
  { id: 'policy',   label: 'Leave Policy',   icon: Settings2      },
] as const

type TabId = typeof TABS[number]['id']

// ── Props ─────────────────────────────────────────────────────────────────────

interface Props {
  employees:        Employee[]
  initialRequests:  LeaveRequestWithEmployee[]
  initialHolidays:  CompanyHoliday[]
  initialPolicies:  LeavePolicy[]
  initialYear:      number
}

// ── Component ─────────────────────────────────────────────────────────────────

export function AdminLeaveManagement({
  employees,
  initialRequests,
  initialHolidays,
  initialPolicies,
  initialYear,
}: Props) {
  const [activeTab, setActiveTab] = React.useState<TabId>('requests')

  return (
    <div className="space-y-5">
      {/* Tab bar */}
      <div className="flex gap-1 rounded-2xl border border-border bg-surface p-1 shadow-card">
        {TABS.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            type="button"
            onClick={() => setActiveTab(id)}
            className={cn(
              'flex flex-1 items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold transition-all',
              activeTab === id
                ? 'bg-brand text-brand-foreground shadow-sm'
                : 'text-ink-soft hover:bg-surface-2 hover:text-ink'
            )}
          >
            <Icon className="size-4" />
            <span className="hidden sm:inline">{label}</span>
          </button>
        ))}
      </div>

      {/* Tab panels */}
      {activeTab === 'requests' && (
        <LeaveSection
          employees={employees}
          initialRequests={initialRequests}
        />
      )}
      {activeTab === 'holidays' && (
        <HolidaysSection
          initialHolidays={initialHolidays as any}
          initialYear={initialYear}
        />
      )}
      {activeTab === 'policy' && (
        <PolicySection
          initialPolicies={initialPolicies as any}
        />
      )}
    </div>
  )
}
