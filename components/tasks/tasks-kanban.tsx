'use client'

import * as React from 'react'
import { Plus } from 'lucide-react'

import { TaskCard } from './task-card'
import { cn } from '@/lib/utils'
import type { TaskWithDetails } from '@/lib/db/tasks'

const COLUMNS: { key: TaskWithDetails['status']; label: string; tone: string }[] = [
  { key: 'todo', label: 'To do', tone: 'bg-ink-soft' },
  { key: 'in_progress', label: 'In progress', tone: 'bg-indigo' },
  { key: 'review', label: 'In review', tone: 'bg-amber' },
  { key: 'done', label: 'Done', tone: 'bg-emerald' },
]

interface Props {
  tasks: TaskWithDetails[]
  onAdd?: (status: TaskWithDetails['status']) => void
  onEdit?: (task: TaskWithDetails) => void
}

export function TasksKanban({ tasks, onAdd, onEdit }: Props) {
  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
      {COLUMNS.map((col) => {
        const items = tasks.filter((t) => t.status === col.key)
        return (
          <section
            key={col.key}
            className="rounded-2xl border border-border bg-surface-2/40 p-3"
          >
            <header className="mb-3 flex items-center justify-between px-1">
              <div className="flex items-center gap-2">
                <span className={cn('size-2 rounded-full', col.tone)} />
                <h3 className="text-sm font-semibold">{col.label}</h3>
                <span className="rounded-full bg-surface px-2 py-0.5 text-xs font-medium text-ink-muted">
                  {items.length}
                </span>
              </div>
              <button
                type="button"
                onClick={() => onAdd?.(col.key)}
                className="grid size-7 place-items-center rounded-lg text-ink-soft hover:bg-surface hover:text-ink"
                aria-label={`Add to ${col.label}`}
              >
                <Plus className="size-4" />
              </button>
            </header>

            <div className="space-y-3">
              {items.map((t) => (
                <TaskCard
                  key={t.id}
                  task={t}
                  onClick={() => onEdit?.(t)}
                />
              ))}
              {items.length === 0 && (
                <div className="rounded-xl border border-dashed border-border py-8 text-center text-xs text-ink-soft">
                  No tasks here
                </div>
              )}
            </div>
          </section>
        )
      })}
    </div>
  )
}
