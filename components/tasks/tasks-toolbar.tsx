'use client'

import * as React from 'react'
import {
  ChevronDown,
  Eye,
  EyeOff,
  Plus,
  Search,
  User,
} from 'lucide-react'

import { cn } from '@/lib/utils'
import type { Company, Employee } from '@/lib/db/types'
import type { TaskWithDetails } from '@/lib/db/tasks'

export interface TaskFilters {
  query: string
  company_id: string
  priority: string
  status: string
  employee_id: string
}

interface Props {
  companies: Company[]
  employees: Employee[]
  tasks: TaskWithDetails[]
  filters: TaskFilters
  onFiltersChange: (f: TaskFilters) => void
  onNew: () => void
  showActive: boolean
  onToggleActive: () => void
}

export function TasksToolbar({
  companies,
  employees,
  tasks,
  filters,
  onFiltersChange,
  onNew,
  showActive,
  onToggleActive,
}: Props) {
  function set(key: keyof TaskFilters, value: string) {
    onFiltersChange({ ...filters, [key]: value })
  }

  // Count tasks per employee (across all tasks, before active filter)
  const employeeTaskCount = React.useMemo(() => {
    const map = new Map<string, number>()
    for (const t of tasks) {
      for (const a of t.assignments) {
        map.set(a.employee_id, (map.get(a.employee_id) ?? 0) + 1)
      }
    }
    return map
  }, [tasks])

  return (
    <div className="rounded-2xl border border-border bg-surface p-3 shadow-card">
      <div className="flex flex-wrap items-center gap-2">
        {/* Search */}
        <div className="relative min-w-[200px] flex-1">
          <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-ink-soft" />
          <input
            type="search"
            value={filters.query}
            onChange={(e) => set('query', e.target.value)}
            placeholder="Search tasks…"
            className="h-10 w-full rounded-xl border border-transparent bg-surface-2 pl-9 pr-4 text-sm placeholder:text-ink-soft focus:border-brand focus:bg-surface focus:outline-none focus:ring-2 focus:ring-brand/20"
          />
        </div>

        {/* Company */}
        <FilterSelect
          label="Company"
          value={filters.company_id}
          onChange={(v) => set('company_id', v)}
        >
          <option value="">All companies</option>
          {companies.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </FilterSelect>

        {/* Priority */}
        <FilterSelect
          label="Priority"
          value={filters.priority}
          onChange={(v) => set('priority', v)}
        >
          <option value="">All priorities</option>
          <option value="urgent">Urgent</option>
          <option value="high">High</option>
          <option value="medium">Medium</option>
          <option value="low">Low</option>
        </FilterSelect>

        {/* Status */}
        <FilterSelect
          label="Status"
          value={filters.status}
          onChange={(v) => set('status', v)}
        >
          <option value="">All statuses</option>
          <option value="todo">To do</option>
          <option value="in_progress">In progress</option>
          <option value="review">In review</option>
          <option value="done">Done</option>
          <option value="blocked">Blocked</option>
        </FilterSelect>

        {/* Assignee */}
        <div className="relative">
          <User className="pointer-events-none absolute left-3 top-1/2 size-3.5 -translate-y-1/2 text-ink-soft" />
          <select
            value={filters.employee_id}
            aria-label="Assignee"
            onChange={(e) => set('employee_id', e.target.value)}
            className="h-10 appearance-none rounded-xl border border-border bg-surface pl-8 pr-9 text-sm font-medium text-ink hover:bg-surface-2 focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/20"
          >
            <option value="">All assignees</option>
            {employees.map((emp) => {
              const count = employeeTaskCount.get(emp.id) ?? 0
              return (
                <option key={emp.id} value={emp.id}>
                  {emp.full_name}{count > 0 ? ` (${count})` : ''}
                </option>
              )
            })}
          </select>
          <ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 size-4 -translate-y-1/2 text-ink-soft" />
        </div>

        {/* Active-only toggle */}
        <button
          type="button"
          onClick={onToggleActive}
          title={showActive ? 'Showing active tasks only — click to show all including done' : 'Showing all tasks — click to hide completed tasks'}
          className={cn(
            'inline-flex h-10 items-center gap-1.5 rounded-xl border px-3 text-sm font-medium transition-colors',
            showActive
              ? 'border-brand/30 bg-brand/10 text-brand'
              : 'border-border bg-surface text-ink-muted hover:bg-surface-2'
          )}
        >
          {showActive ? <Eye className="size-4" /> : <EyeOff className="size-4" />}
          <span className="hidden sm:inline">Active only</span>
        </button>

        {/* New task */}
        <button
          type="button"
          onClick={onNew}
          className="ml-auto inline-flex h-10 items-center gap-1.5 rounded-xl bg-brand px-4 text-sm font-medium text-brand-foreground shadow-sm hover:opacity-90"
        >
          <Plus className="size-4" />
          New task
        </button>
      </div>
    </div>
  )
}

function FilterSelect({
  label,
  value,
  onChange,
  children,
}: {
  label: string
  value: string
  onChange: (v: string) => void
  children: React.ReactNode
}) {
  return (
    <div className="relative">
      <select
        value={value}
        aria-label={label}
        onChange={(e) => onChange(e.target.value)}
        className="h-10 appearance-none rounded-xl border border-border bg-surface pl-3 pr-9 text-sm font-medium text-ink hover:bg-surface-2 focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/20"
      >
        {children}
      </select>
      <ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 size-4 -translate-y-1/2 text-ink-soft" />
    </div>
  )
}

