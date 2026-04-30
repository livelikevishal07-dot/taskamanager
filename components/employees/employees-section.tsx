'use client'

import * as React from 'react'

import { EmployeeStats } from './employee-stats'
import { EmployeeToolbar, type EmployeeFilters } from './employee-toolbar'
import { EmployeesTable } from './employees-table'
import { EmployeesGrid } from './employees-grid'
import { EmployeeDrawer } from './employee-drawer'
import type { Department, Employee, Role } from '@/lib/db/types'

interface Props {
  employees: Employee[]
  departments: Department[]
  roles: Role[]
}

function deriveStats(employees: Employee[]) {
  return {
    total: employees.length,
    active: employees.filter((e) => e.status === 'active').length,
    onLeave: employees.filter((e) => e.status === 'on_leave').length,
    inactive: employees.filter((e) => e.status === 'inactive').length,
  }
}

export function EmployeesSection({
  employees: initialEmployees,
  departments,
  roles,
}: Props) {
  const [employees, setEmployees] = React.useState<Employee[]>(initialEmployees)
  const [view, setView] = React.useState<'list' | 'grid'>('list')
  const [filters, setFilters] = React.useState<EmployeeFilters>({
    query: '',
    department_id: '',
    role_id: '',
    status: '',
  })
  const [drawerOpen, setDrawerOpen] = React.useState(false)
  const [drawerMode, setDrawerMode] = React.useState<'create' | 'edit'>('create')
  const [editing, setEditing] = React.useState<Employee | null>(null)

  const stats = React.useMemo(() => deriveStats(employees), [employees])

  // Client-side filtering
  const filtered = React.useMemo(() => {
    const q = filters.query.trim().toLowerCase()
    return employees.filter((e) => {
      if (filters.department_id && e.department_id !== filters.department_id) return false
      if (filters.role_id && e.role_id !== filters.role_id) return false
      if (filters.status && e.status !== filters.status) return false
      if (q) {
        const hay = [e.full_name, e.email ?? '', e.phone ?? '', e.id]
          .join(' ')
          .toLowerCase()
        if (!hay.includes(q)) return false
      }
      return true
    })
  }, [employees, filters])

  function openCreate() {
    setDrawerMode('create')
    setEditing(null)
    setDrawerOpen(true)
  }

  function openEdit(emp: Employee) {
    setDrawerMode('edit')
    setEditing(emp)
    setDrawerOpen(true)
  }

  function handleSaved(saved: Employee) {
    setEmployees((prev) => {
      const exists = prev.some((e) => e.id === saved.id)
      if (exists) return prev.map((e) => (e.id === saved.id ? saved : e))
      return [saved, ...prev]
    })
  }

  function handleDeleted(id: string) {
    setEmployees((prev) => prev.filter((e) => e.id !== id))
  }

  return (
    <div className="space-y-4">
      <EmployeeStats stats={stats} />

      <EmployeeToolbar
        view={view}
        onViewChange={setView}
        departments={departments}
        roles={roles}
        filters={filters}
        onFiltersChange={setFilters}
        onAddClick={openCreate}
        resultCount={filtered.length}
        totalCount={employees.length}
      />

      {view === 'list' ? (
        <EmployeesTable
          employees={filtered}
          onRowClick={openEdit}
          onStatusChange={handleSaved}
          onDeleted={handleDeleted}
        />
      ) : (
        <EmployeesGrid employees={filtered} onCardClick={openEdit} />
      )}

      <EmployeeDrawer
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        mode={drawerMode}
        employee={editing}
        departments={departments}
        roles={roles}
        onSaved={handleSaved}
        onDeleted={handleDeleted}
      />
    </div>
  )
}
