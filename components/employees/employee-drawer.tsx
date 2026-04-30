'use client'

import * as React from 'react'
import { Save, Trash2 } from 'lucide-react'

import { Drawer } from '@/components/ui/drawer'
import {
  EmployeeForm,
  emptyEmployeeValues,
  valuesFromEmployee,
  valuesToPayload,
  type EmployeeFormValues,
} from './employee-form'
import type { Department, Employee, Role } from '@/lib/db/types'
import { cn } from '@/lib/utils'

interface Props {
  open: boolean
  onClose: () => void
  mode: 'create' | 'edit'
  employee?: Employee | null
  departments: Department[]
  roles: Role[]
  onSaved?: (employee: Employee) => void
  onDeleted?: (id: string) => void
}

export function EmployeeDrawer({
  open,
  onClose,
  mode,
  employee,
  departments,
  roles,
  onSaved,
  onDeleted,
}: Props) {
  const [values, setValues] = React.useState<EmployeeFormValues>(
    () => emptyEmployeeValues()
  )
  const [submitting, setSubmitting] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)
  const [fieldErrors, setFieldErrors] = React.useState<Record<string, string[]>>({})

  React.useEffect(() => {
    if (!open) return
    setError(null)
    setFieldErrors({})
    if (mode === 'edit' && employee) {
      setValues(valuesFromEmployee(employee))
    } else {
      setValues(emptyEmployeeValues())
    }
  }, [open, mode, employee])

  async function handleSubmit() {
    setSubmitting(true)
    setError(null)
    setFieldErrors({})
    try {
      const url =
        mode === 'create'
          ? '/api/employees'
          : `/api/employees/${employee!.id}`
      const method = mode === 'create' ? 'POST' : 'PATCH'
      const res = await fetch(url, {
        method,
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(valuesToPayload(values)),
      })
      const json = await res.json().catch(() => ({}))
      if (!res.ok) {
        setError(json?.error ?? 'Something went wrong')
        const flat = json?.details?.fieldErrors
        if (flat && typeof flat === 'object') setFieldErrors(flat)
        return
      }
      onSaved?.(json as Employee)
      onClose()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Network error')
    } finally {
      setSubmitting(false)
    }
  }

  async function handleDelete() {
    if (!employee) return
    if (!confirm(`Delete ${employee.full_name}? This cannot be undone.`)) return
    setSubmitting(true)
    try {
      const res = await fetch(`/api/employees/${employee.id}`, { method: 'DELETE' })
      if (!res.ok) {
        const json = await res.json().catch(() => ({}))
        setError(json?.error ?? 'Failed to delete')
        return
      }
      onDeleted?.(employee.id)
      onClose()
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Drawer
      open={open}
      onClose={onClose}
      title={mode === 'create' ? 'Add new employee' : 'Edit employee'}
      description={
        mode === 'create'
          ? 'Fill in the details below. Required fields are marked with *.'
          : `Update details for ${employee?.full_name ?? ''}.`
      }
      size="lg"
      footer={
        <>
          {mode === 'edit' && (
            <button
              type="button"
              onClick={handleDelete}
              disabled={submitting}
              className="mr-auto inline-flex h-10 items-center gap-1.5 rounded-xl border border-coral/30 bg-coral/5 px-4 text-sm font-medium text-coral hover:bg-coral/10 disabled:opacity-50"
            >
              <Trash2 className="size-4" />
              Delete
            </button>
          )}
          <button
            type="button"
            onClick={onClose}
            className="inline-flex h-10 items-center rounded-xl border border-border bg-surface px-4 text-sm font-medium text-ink-muted hover:bg-surface-2"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={submitting}
            className={cn(
              'inline-flex h-10 items-center gap-1.5 rounded-xl bg-brand px-4 text-sm font-medium text-brand-foreground shadow-sm hover:opacity-90 disabled:opacity-60'
            )}
          >
            <Save className="size-4" />
            {submitting
              ? 'Saving…'
              : mode === 'create'
                ? 'Create employee'
                : 'Save changes'}
          </button>
        </>
      }
    >
      {error && (
        <div className="mb-4 rounded-lg border border-coral/30 bg-coral/10 px-3 py-2 text-sm text-coral">
          {error}
        </div>
      )}
      <EmployeeForm
        values={values}
        onChange={setValues}
        departments={departments}
        roles={roles}
        fieldErrors={fieldErrors}
      />
    </Drawer>
  )
}
