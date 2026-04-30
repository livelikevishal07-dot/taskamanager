import { Pencil, Plus } from 'lucide-react'

import { ACTIVITY } from '@/lib/mock-data'

export function ActivityTable() {
  return (
    <div className="rounded-2xl border border-border bg-surface shadow-card">
      <div className="flex items-center justify-between px-5 py-4">
        <h2 className="text-base font-semibold">Activity</h2>
        <div className="flex items-center gap-2">
          <button className="grid size-9 place-items-center rounded-full bg-violet/15 text-violet hover:bg-violet/25" aria-label="Edit">
            <Pencil className="size-4" />
          </button>
          <button className="grid size-9 place-items-center rounded-full bg-brand text-brand-foreground hover:opacity-90" aria-label="Add">
            <Plus className="size-4" />
          </button>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-y border-border bg-surface-2 text-xs uppercase tracking-wide text-ink-soft">
              <Th>Case ID</Th>
              <Th>Employee</Th>
              <Th>Date &amp; Time</Th>
              <Th>Activity</Th>
              <Th>Assigned to</Th>
              <Th>Comment</Th>
            </tr>
          </thead>
          <tbody>
            {ACTIVITY.map((row) => (
              <tr
                key={row.id}
                className="border-b border-border last:border-0 hover:bg-surface-2/60"
              >
                <Td className="font-medium text-brand">{row.id}</Td>
                <Td>{row.employee}</Td>
                <Td className="text-ink-muted">{row.timestamp}</Td>
                <Td>{row.activity}</Td>
                <Td>{row.assignedTo}</Td>
                <Td className="text-ink-muted">{row.comment}</Td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

function Th({ children }: { children: React.ReactNode }) {
  return <th className="px-5 py-3 text-left font-medium">{children}</th>
}

function Td({
  children,
  className = '',
}: {
  children: React.ReactNode
  className?: string
}) {
  return <td className={`px-5 py-4 align-top ${className}`}>{children}</td>
}
