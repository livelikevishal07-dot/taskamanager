'use client'

import * as React from 'react'
import { ArrowUpDown, Eye, Pencil, Trash2 } from 'lucide-react'

import { AvatarStack } from '@/components/ui/avatar'
import { PriorityPill } from './priority-pill'
import { cn } from '@/lib/utils'
import type { TaskWithDetails } from '@/lib/db/tasks'

const STATUS_TONE: Record<string, string> = {
  todo: 'bg-ink-soft/10 text-ink-muted',
  in_progress: 'bg-indigo/10 text-indigo',
  review: 'bg-amber/15 text-amber',
  done: 'bg-emerald/10 text-emerald',
  blocked: 'bg-coral/10 text-coral',
}

const STATUS_LABEL: Record<string, string> = {
  todo: 'To do',
  in_progress: 'In progress',
  review: 'In review',
  done: 'Done',
  blocked: 'Blocked',
}

const COLOR_CHIP: Record<string, string> = {
  violet: 'bg-violet/12 text-violet',
  sky: 'bg-sky/12 text-sky',
  indigo: 'bg-indigo/12 text-indigo',
  coral: 'bg-coral/12 text-coral',
  emerald: 'bg-emerald/12 text-emerald',
  amber: 'bg-amber/15 text-amber',
}

const COLOR_DOT: Record<string, string> = {
  violet: 'bg-violet',
  sky: 'bg-sky',
  indigo: 'bg-indigo',
  coral: 'bg-coral',
  emerald: 'bg-emerald',
  amber: 'bg-amber',
}

function formatDeadline(value: string | null): string {
  if (!value) return '—'
  const d = new Date(value)
  const diffMs = d.getTime() - Date.now()
  const diffDays = Math.ceil(diffMs / 86_400_000)
  if (diffDays < 0) return `Overdue ${Math.abs(diffDays)}d`
  if (diffDays === 0) return 'Today'
  if (diffDays === 1) return 'Tomorrow'
  return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })
}

interface Props {
  tasks: TaskWithDetails[]
  onView?: (task: TaskWithDetails) => void
  onEdit?: (task: TaskWithDetails) => void
  onDelete?: (task: TaskWithDetails) => void
}

type SortKey = 'title' | 'deadline' | 'priority' | 'status' | 'created_at'

const PRIORITY_ORDER: Record<string, number> = {
  urgent: 4,
  high: 3,
  medium: 2,
  low: 1,
}

export function TasksTable({ tasks, onView, onEdit, onDelete }: Props) {
  const [sortKey, setSortKey] = React.useState<SortKey>('created_at')
  const [sortAsc, setSortAsc] = React.useState(false)

  function toggleSort(key: SortKey) {
    if (key === sortKey) setSortAsc((a) => !a)
    else { setSortKey(key); setSortAsc(true) }
  }

  const sorted = React.useMemo(() => {
    return [...tasks].sort((a, b) => {
      let cmp = 0
      if (sortKey === 'title') cmp = a.title.localeCompare(b.title)
      else if (sortKey === 'created_at') {
        cmp = a.created_at.localeCompare(b.created_at)
      } else if (sortKey === 'deadline') {
        if (!a.deadline && !b.deadline) cmp = 0
        else if (!a.deadline) cmp = 1
        else if (!b.deadline) cmp = -1
        else cmp = a.deadline.localeCompare(b.deadline)
      } else if (sortKey === 'priority') {
        cmp = (PRIORITY_ORDER[b.priority] ?? 0) - (PRIORITY_ORDER[a.priority] ?? 0)
      } else if (sortKey === 'status') {
        cmp = a.status.localeCompare(b.status)
      }
      return sortAsc ? cmp : -cmp
    })
  }, [tasks, sortKey, sortAsc])

  return (
    <div className="overflow-hidden rounded-2xl border border-border bg-surface shadow-card">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[940px] text-sm">
          <thead>
            <tr className="border-b border-border bg-surface-2 text-xs uppercase tracking-wide text-ink-soft">
              <Th>
                <SortHeader active={sortKey === 'title'} asc={sortAsc} onClick={() => toggleSort('title')}>
                  Task
                </SortHeader>
              </Th>
              <Th>Company</Th>
              <Th>
                <SortHeader active={sortKey === 'priority'} asc={sortAsc} onClick={() => toggleSort('priority')}>
                  Priority
                </SortHeader>
              </Th>
              <Th>
                <SortHeader active={sortKey === 'status'} asc={sortAsc} onClick={() => toggleSort('status')}>
                  Status
                </SortHeader>
              </Th>
              <Th>
                <SortHeader active={sortKey === 'deadline'} asc={sortAsc} onClick={() => toggleSort('deadline')}>
                  Deadline
                </SortHeader>
              </Th>
              <Th>
                <SortHeader active={sortKey === 'created_at'} asc={sortAsc} onClick={() => toggleSort('created_at')}>
                  Created
                </SortHeader>
              </Th>
              <Th>Assignees</Th>
              <Th className="pr-5 text-right">Actions</Th>
            </tr>
          </thead>
          <tbody>
            {sorted.map((t) => {
              const assigneeNames = t.assignments
                .map((a) => a.employee?.full_name ?? '')
                .filter(Boolean)
              const isOverdue =
                t.status !== 'done' &&
                t.deadline &&
                new Date(t.deadline) < new Date()

              return (
                <tr
                  key={t.id}
                  onClick={() => onView?.(t)}
                  className={cn(
                    'group border-b border-border last:border-0 hover:bg-surface-2/50',
                    onView && 'cursor-pointer'
                  )}
                >
                  <Td>
                    <p className="font-medium leading-snug">{t.title}</p>
                    {t.description && (
                      <p className="mt-0.5 max-w-[280px] truncate text-xs text-ink-soft">
                        {t.description}
                      </p>
                    )}
                  </Td>
                  <Td>
                    {t.company ? (
                      <span
                        className={cn(
                          'inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-xs font-medium',
                          COLOR_CHIP[t.company.color] ?? 'bg-surface-2 text-ink-muted'
                        )}
                      >
                        <span
                          className={cn(
                            'size-1.5 rounded-full',
                            COLOR_DOT[t.company.color] ?? 'bg-ink-soft'
                          )}
                        />
                        {t.company.name}
                      </span>
                    ) : (
                      <span className="text-ink-soft">—</span>
                    )}
                  </Td>
                  <Td>
                    <PriorityPill priority={t.priority} />
                  </Td>
                  <Td>
                    <span
                      className={cn(
                        'inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium',
                        STATUS_TONE[t.status]
                      )}
                    >
                      {STATUS_LABEL[t.status]}
                    </span>
                  </Td>
                  <Td
                    className={cn(
                      'text-ink-muted',
                      isOverdue && 'font-medium text-coral'
                    )}
                  >
                    {formatDeadline(t.deadline)}
                  </Td>
                  <Td className="text-xs text-ink-soft">
                    {new Date(t.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: '2-digit' })}
                  </Td>
                  <Td>
                    {assigneeNames.length > 0 ? (
                      <AvatarStack names={assigneeNames} />
                    ) : (
                      <span className="text-xs text-ink-soft">Unassigned</span>
                    )}
                  </Td>
                  <Td className="pr-5 text-right">
                    <div className="flex items-center justify-end gap-1">
                      {onView && (
                        <button
                          type="button"
                          aria-label="View task details"
                          title="View details"
                          onClick={(e) => { e.stopPropagation(); onView(t) }}
                          className="grid size-8 place-items-center rounded-lg text-ink-muted transition-colors hover:bg-brand/10 hover:text-brand"
                        >
                          <Eye className="size-4" />
                        </button>
                      )}
                      {onEdit && (
                        <button
                          type="button"
                          aria-label="Edit task"
                          title="Edit task"
                          onClick={(e) => { e.stopPropagation(); onEdit(t) }}
                          className="grid size-8 place-items-center rounded-lg text-ink-muted transition-colors hover:bg-surface-2 hover:text-ink"
                        >
                          <Pencil className="size-4" />
                        </button>
                      )}
                      {onDelete && (
                        <button
                          type="button"
                          aria-label="Delete task"
                          title="Delete task"
                          onClick={(e) => { e.stopPropagation(); onDelete(t) }}
                          className="grid size-8 place-items-center rounded-lg text-ink-muted opacity-60 transition-all hover:bg-coral/10 hover:text-coral hover:opacity-100"
                        >
                          <Trash2 className="size-4" />
                        </button>
                      )}
                    </div>
                  </Td>
                </tr>
              )
            })}
            {sorted.length === 0 && (
              <tr>
                <Td className="py-8 text-center text-ink-muted" colSpan={8}>
                  No tasks match the current filters.
                </Td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}

function SortHeader({
  children,
  active,
  asc,
  onClick,
}: {
  children: React.ReactNode
  active: boolean
  asc: boolean
  onClick: () => void
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'inline-flex items-center gap-1.5 text-xs font-medium uppercase tracking-wide hover:text-ink',
        active ? 'text-ink' : 'text-ink-soft'
      )}
    >
      {children}
      <ArrowUpDown className={cn('size-3', active ? 'opacity-100' : 'opacity-60')} />
    </button>
  )
}

function Th({
  children,
  className = '',
}: {
  children: React.ReactNode
  className?: string
}) {
  return <th className={`px-5 py-3 text-left font-medium ${className}`}>{children}</th>
}

function Td({
  children,
  className = '',
  colSpan,
}: {
  children: React.ReactNode
  className?: string
  colSpan?: number
}) {
  return (
    <td className={`px-5 py-3 align-middle ${className}`} colSpan={colSpan}>
      {children}
    </td>
  )
}
