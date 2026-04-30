'use client'

import * as React from 'react'
import {
  ChevronDown,
  Download,
  LayoutGrid,
  List,
  Plus,
  Search,
} from 'lucide-react'

import { cn } from '@/lib/utils'
import type { Department, Role } from '@/lib/db/types'

export interface EmployeeFilters {
  query: string
  department_id: string
  role_id: string
  status: string
}

interface Props {
  view: 'list' | 'grid'
  onViewChange: (v: 'list' | 'grid') => void
  departments: Department[]
  roles: Role[]
  filters: EmployeeFilters
  onFiltersChange: (f: EmployeeFilters) => void
  onAddClick: () => void
  resultCount: number
  totalCount: number
}

export function EmployeeToolbar({
  view,
  onViewChange,
  departments,
  roles,
  filters,
  onFiltersChange,
  onAddClick,
  resultCount,
  totalCount,
}: Props) {
  function set(key: keyof EmployeeFilters, value: string) {
    onFiltersChange({ ...filters, [key]: value })
  }

  const isFiltered =
    filters.query || filters.department_id || filters.role_id || filters.status

  return (
    <div className="rounded-2xl border border-border bg-surface p-3 shadow-card">
      <div className="flex flex-wrap items-center gap-2">
        {/* Search */}
        <div className="relative min-w-[220px] flex-1">
          <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-ink-soft" />
          <input
            type="search"
            value={filters.query}
            onChange={(e) => set('query', e.target.value)}
            placeholder="Search by name, email, or ID…"
            className="h-10 w-full rounded-xl border border-transparent bg-surface-2 pl-9 pr-4 text-sm placeholder:text-ink-soft focus:border-brand focus:bg-surface focus:outline-none focus:ring-2 focus:ring-brand/20"
          />
        </div>

        {/* Department */}
        <FilterSelect
          label="Department"
          value={filters.department_id}
          onChange={(v) => set('department_id', v)}
        >
          <option value="">All departments</option>
          {departments.map((d) => (
            <option key={d.id} value={d.id}>
              {d.name}
            </option>
          ))}
        </FilterSelect>

        {/* Role */}
        <FilterSelect
          label="Role"
          value={filters.role_id}
          onChange={(v) => set('role_id', v)}
        >
          <option value="">All roles</option>
          {roles.map((r) => (
            <option key={r.id} value={r.id}>
              {r.name}
            </option>
          ))}
        </FilterSelect>

        {/* Status */}
        <FilterSelect
          label="Status"
          value={filters.status}
          onChange={(v) => set('status', v)}
        >
          <option value="">All statuses</option>
          <option value="active">Active</option>
          <option value="on_leave">On leave</option>
          <option value="inactive">Inactive</option>
          <option value="terminated">Terminated</option>
        </FilterSelect>

        {/* Clear filters / result count */}
        {isFiltered && (
          <button
            type="button"
            onClick={() =>
              onFiltersChange({ query: '', department_id: '', role_id: '', status: '' })
            }
            className="inline-flex h-10 items-center gap-1.5 rounded-xl border border-border bg-surface px-3 text-sm font-medium text-ink-muted hover:bg-surface-2 hover:text-coral"
          >
            Clear
            <span className="rounded-full bg-brand/10 px-1.5 py-0.5 text-[10px] font-bold text-brand">
              {resultCount}/{totalCount}
            </span>
          </button>
        )}

        {/* View toggle + Export + Add */}
        <div className="ml-auto flex items-center gap-2">
          <div className="flex h-10 items-center rounded-xl border border-border bg-surface p-1">
            <ViewBtn
              active={view === 'list'}
              onClick={() => onViewChange('list')}
              label="List"
            >
              <List className="size-4" />
            </ViewBtn>
            <ViewBtn
              active={view === 'grid'}
              onClick={() => onViewChange('grid')}
              label="Grid"
            >
              <LayoutGrid className="size-4" />
            </ViewBtn>
          </div>

          <button
            type="button"
            className="inline-flex h-10 items-center gap-1.5 rounded-xl border border-border bg-surface px-3 text-sm font-medium text-ink-muted hover:bg-surface-2"
          >
            <Download className="size-4" />
            Export
          </button>

          <button
            type="button"
            onClick={onAddClick}
            className="inline-flex h-10 items-center gap-1.5 rounded-xl bg-brand px-4 text-sm font-medium text-brand-foreground shadow-sm hover:opacity-90"
          >
            <Plus className="size-4" />
            Add employee
          </button>
        </div>
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

function ViewBtn({
  active,
  onClick,
  label,
  children,
}: {
  active: boolean
  onClick: () => void
  label: string
  children: React.ReactNode
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      aria-pressed={active}
      className={cn(
        'grid h-8 w-8 place-items-center rounded-lg text-ink-muted transition-colors',
        active && 'bg-canvas text-ink shadow-sm'
      )}
    >
      {children}
    </button>
  )
}
