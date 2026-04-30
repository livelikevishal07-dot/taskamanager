'use client'

import * as React from 'react'
import { Copy, Eye, EyeOff, RefreshCw } from 'lucide-react'

import { cn } from '@/lib/utils'
import type { Department, Employee, EmployeeStatus, Role } from '@/lib/db/types'

const DAYS = [
  { v: 1, label: 'M' },
  { v: 2, label: 'T' },
  { v: 3, label: 'W' },
  { v: 4, label: 'T' },
  { v: 5, label: 'F' },
  { v: 6, label: 'S' },
  { v: 7, label: 'S' },
] as const

export interface EmployeeFormValues {
  full_name: string
  email: string
  phone: string
  address: string
  birthday: string
  joining_date: string
  role_id: string
  department_id: string
  working_hours_start: string
  working_hours_end: string
  working_days: number[]
  status: EmployeeStatus
  performance: number
  username: string
  password: string
}

export function emptyEmployeeValues(): EmployeeFormValues {
  return {
    full_name: '',
    email: '',
    phone: '',
    address: '',
    birthday: '',
    joining_date: '',
    role_id: '',
    department_id: '',
    working_hours_start: '09:00',
    working_hours_end: '18:00',
    working_days: [1, 2, 3, 4, 5],
    status: 'active',
    performance: 0,
    username: '',
    password: '',
  }
}

export function valuesFromEmployee(e: Employee): EmployeeFormValues {
  return {
    full_name: e.full_name ?? '',
    email: e.email ?? '',
    phone: e.phone ?? '',
    address: e.address ?? '',
    birthday: e.birthday ?? '',
    joining_date: e.joining_date ?? '',
    role_id: e.role_id ?? '',
    department_id: e.department_id ?? '',
    working_hours_start: (e.working_hours_start ?? '09:00').slice(0, 5),
    working_hours_end: (e.working_hours_end ?? '18:00').slice(0, 5),
    working_days: e.working_days ?? [1, 2, 3, 4, 5],
    status: e.status,
    performance: e.performance ?? 0,
    username: e.username ?? '',
    // Plain-text passwords are admin-visible by design — pre-fill so the
    // admin can see and copy the current password.
    password: e.password ?? '',
  }
}

export function valuesToPayload(v: EmployeeFormValues) {
  return {
    full_name: v.full_name.trim(),
    email: v.email.trim() || null,
    phone: v.phone.trim() || null,
    address: v.address.trim() || null,
    birthday: v.birthday || null,
    joining_date: v.joining_date || null,
    role_id: v.role_id || null,
    department_id: v.department_id || null,
    working_hours_start: v.working_hours_start || null,
    working_hours_end: v.working_hours_end || null,
    working_days: v.working_days,
    status: v.status,
    performance: Number.isFinite(v.performance) ? v.performance : 0,
    username: v.username.trim() ? v.username.trim().toLowerCase() : null,
    ...(v.password.trim() ? { password: v.password } : {}),
  }
}

interface Props {
  values: EmployeeFormValues
  onChange: (next: EmployeeFormValues) => void
  departments: Department[]
  roles: Role[]
  fieldErrors?: Record<string, string[]>
}

export function EmployeeForm({
  values,
  onChange,
  departments,
  roles,
  fieldErrors,
}: Props) {
  function set<K extends keyof EmployeeFormValues>(
    key: K,
    val: EmployeeFormValues[K]
  ) {
    onChange({ ...values, [key]: val })
  }

  function toggleDay(d: number) {
    const has = values.working_days.includes(d)
    const next = has
      ? values.working_days.filter((x) => x !== d)
      : [...values.working_days, d].sort((a, b) => a - b)
    set('working_days', next)
  }

  return (
    <div className="space-y-5">
      <SectionTitle>Personal</SectionTitle>
      <Row>
        <Field label="Full name *" error={err(fieldErrors, 'full_name')}>
          <Input
            value={values.full_name}
            onChange={(e) => set('full_name', e.target.value)}
            placeholder="e.g. Ralph Edwards"
          />
        </Field>
        <Field label="Email" error={err(fieldErrors, 'email')}>
          <Input
            type="email"
            value={values.email}
            onChange={(e) => set('email', e.target.value)}
            placeholder="ralph@officely.io"
          />
        </Field>
      </Row>

      <Row>
        <Field label="Phone number">
          <Input
            value={values.phone}
            onChange={(e) => set('phone', e.target.value)}
            placeholder="+91 98201 11042"
          />
        </Field>
        <Field label="Birthday" error={err(fieldErrors, 'birthday')}>
          <Input
            type="date"
            value={values.birthday}
            onChange={(e) => set('birthday', e.target.value)}
          />
        </Field>
      </Row>

      <Field label="Address">
        <textarea
          rows={2}
          value={values.address}
          onChange={(e) => set('address', e.target.value)}
          placeholder="Street, city, state"
          className="w-full rounded-lg border border-border bg-surface p-3 text-sm focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/20"
        />
      </Field>

      <SectionTitle>Job</SectionTitle>
      <Row>
        <Field label="Role">
          <Select
            value={values.role_id}
            onChange={(e) => set('role_id', e.target.value)}
          >
            <option value="">— Unassigned —</option>
            {roles.map((r) => (
              <option key={r.id} value={r.id}>
                {r.name}
              </option>
            ))}
          </Select>
        </Field>
        <Field label="Department">
          <Select
            value={values.department_id}
            onChange={(e) => set('department_id', e.target.value)}
          >
            <option value="">— Unassigned —</option>
            {departments.map((d) => (
              <option key={d.id} value={d.id}>
                {d.name}
              </option>
            ))}
          </Select>
        </Field>
      </Row>

      <Row>
        <Field label="Joining date" error={err(fieldErrors, 'joining_date')}>
          <Input
            type="date"
            value={values.joining_date}
            onChange={(e) => set('joining_date', e.target.value)}
          />
        </Field>
        <Field label="Status">
          <Select
            value={values.status}
            onChange={(e) =>
              set('status', e.target.value as EmployeeFormValues['status'])
            }
          >
            <option value="active">Active</option>
            <option value="on_leave">On leave</option>
            <option value="inactive">Inactive</option>
            <option value="terminated">Terminated</option>
          </Select>
        </Field>
      </Row>

      <SectionTitle>Working schedule</SectionTitle>
      <Row>
        <Field label="Start time">
          <Input
            type="time"
            value={values.working_hours_start}
            onChange={(e) => set('working_hours_start', e.target.value)}
          />
        </Field>
        <Field label="End time">
          <Input
            type="time"
            value={values.working_hours_end}
            onChange={(e) => set('working_hours_end', e.target.value)}
          />
        </Field>
      </Row>

      <Field label="Working days">
        <div className="flex flex-wrap gap-2">
          {DAYS.map((d, i) => {
            const active = values.working_days.includes(d.v)
            return (
              <button
                key={i}
                type="button"
                onClick={() => toggleDay(d.v)}
                className={cn(
                  'h-10 w-10 rounded-lg border text-sm font-semibold transition-colors',
                  active
                    ? 'border-brand bg-brand text-brand-foreground shadow-sm'
                    : 'border-border bg-surface text-ink-muted hover:bg-surface-2'
                )}
                aria-pressed={active}
              >
                {d.label}
              </button>
            )
          })}
        </div>
        <p className="mt-1 text-xs text-ink-soft">
          {values.working_days.length} day{values.working_days.length === 1 ? '' : 's'}{' '}
          per week
        </p>
      </Field>

      <SectionTitle>Login credentials</SectionTitle>
      <Row>
        <Field label="Username" error={err(fieldErrors, 'username')}>
          <Input
            value={values.username}
            onChange={(e) => set('username', e.target.value)}
            placeholder="e.g. ralph.edwards"
            autoComplete="off"
          />
        </Field>
        <Field label="Password" error={err(fieldErrors, 'password')}>
          <PasswordField
            value={values.password}
            onChange={(v) => set('password', v)}
          />
        </Field>
      </Row>
      <p className="-mt-3 text-xs text-ink-soft">
        Used by the employee to sign in. Stored as plain text — admin can
        view, copy, or replace it at any time.
      </p>
    </div>
  )
}

function err(map: Record<string, string[]> | undefined, key: string) {
  return map?.[key]?.[0]
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <h3 className="text-xs font-semibold uppercase tracking-wider text-ink-soft">
      {children}
    </h3>
  )
}

function Row({ children }: { children: React.ReactNode }) {
  return <div className="grid gap-4 sm:grid-cols-2">{children}</div>
}

function Field({
  label,
  children,
  error,
  className,
}: {
  label: string
  children: React.ReactNode
  error?: string
  className?: string
}) {
  return (
    <label className={cn('block', className)}>
      <span className="mb-1 block text-xs font-medium text-ink-muted">{label}</span>
      {children}
      {error && <span className="mt-1 block text-xs text-coral">{error}</span>}
    </label>
  )
}

function Input(props: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      {...props}
      className="h-10 w-full rounded-lg border border-border bg-surface px-3 text-sm focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/20"
    />
  )
}

/**
 * Plain-text password field with show/hide toggle, copy-to-clipboard, and a
 * "generate random" button. Per product decision, passwords are not hashed
 * so admins always see the current value.
 */
function PasswordField({
  value,
  onChange,
}: {
  value: string
  onChange: (v: string) => void
}) {
  const [reveal, setReveal] = React.useState(false)
  const [copied, setCopied] = React.useState(false)

  function generate() {
    // Readable, no-ambiguous-chars random password (10 chars).
    const chars = 'abcdefghjkmnpqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ23456789'
    let out = ''
    for (let i = 0; i < 10; i++) {
      out += chars[Math.floor(Math.random() * chars.length)]
    }
    onChange(out)
    setReveal(true)
  }

  async function copy() {
    if (!value) return
    try {
      await navigator.clipboard.writeText(value)
      setCopied(true)
      setTimeout(() => setCopied(false), 1200)
    } catch {
      // Fallback: select+execCommand would go here. Silently ignore.
    }
  }

  return (
    <div className="flex items-stretch gap-1.5">
      <div className="relative flex-1">
        <input
          type={reveal ? 'text' : 'password'}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="Set a password"
          autoComplete="new-password"
          spellCheck={false}
          className="h-10 w-full rounded-lg border border-border bg-surface pl-3 pr-10 font-mono text-sm tracking-wide focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/20"
        />
        <button
          type="button"
          onClick={() => setReveal((s) => !s)}
          aria-label={reveal ? 'Hide password' : 'Show password'}
          className="absolute right-1 top-1/2 grid size-8 -translate-y-1/2 place-items-center rounded-md text-ink-soft hover:bg-surface-2 hover:text-ink"
        >
          {reveal ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
        </button>
      </div>
      <button
        type="button"
        onClick={copy}
        disabled={!value}
        title={copied ? 'Copied!' : 'Copy password'}
        className={cn(
          'grid size-10 shrink-0 place-items-center rounded-lg border border-border bg-surface text-ink-muted transition-colors hover:bg-surface-2 hover:text-ink disabled:opacity-40 disabled:hover:bg-surface',
          copied && 'border-emerald/40 bg-emerald/10 text-emerald hover:bg-emerald/10 hover:text-emerald'
        )}
      >
        <Copy className="size-4" />
      </button>
      <button
        type="button"
        onClick={generate}
        title="Generate random password"
        className="grid size-10 shrink-0 place-items-center rounded-lg border border-border bg-surface text-ink-muted hover:bg-surface-2 hover:text-ink"
      >
        <RefreshCw className="size-4" />
      </button>
    </div>
  )
}

function Select({
  children,
  ...props
}: React.SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select
      {...props}
      className="h-10 w-full rounded-lg border border-border bg-surface px-3 pr-8 text-sm focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/20"
    >
      {children}
    </select>
  )
}
