'use client'

import * as React from 'react'
import { Monitor, Save, Trash2 } from 'lucide-react'

import type {
  AdminSession,
  NotificationSetting,
  WorkspaceSettings,
} from '@/lib/db/settings'
import { cn } from '@/lib/utils'

type GeneralDraft = Pick<
  WorkspaceSettings,
  | 'workspace_name'
  | 'owner_name'
  | 'timezone'
  | 'week_starts_on'
  | 'working_hours_start'
  | 'working_hours_end'
>

export function GeneralPanel() {
  const [draft, setDraft] = React.useState<GeneralDraft | null>(null)
  const [saved, setSaved] = React.useState<GeneralDraft | null>(null)
  const [loading, setLoading] = React.useState(true)
  const [saving, setSaving] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)
  const [success, setSuccess] = React.useState<string | null>(null)

  React.useEffect(() => {
    async function load() {
      setLoading(true)
      setError(null)
      try {
        const settings = await request<WorkspaceSettings>('/api/settings/general')
        const next = normalizeGeneral(settings)
        setDraft(next)
        setSaved(next)
      } catch (err) {
        setError(messageFrom(err))
      } finally {
        setLoading(false)
      }
    }
    void load()
  }, [])

  async function save() {
    if (!draft) return
    setSaving(true)
    setError(null)
    setSuccess(null)
    try {
      const settings = await request<WorkspaceSettings>('/api/settings/general', {
        method: 'PATCH',
        body: JSON.stringify({
          workspace_name: draft.workspace_name,
          timezone: draft.timezone,
          week_starts_on: draft.week_starts_on,
          working_hours_start: draft.working_hours_start,
          working_hours_end: draft.working_hours_end,
        }),
      })
      const next = normalizeGeneral(settings)
      setDraft(next)
      setSaved(next)
      setSuccess('General settings saved.')
    } catch (err) {
      setError(messageFrom(err))
    } finally {
      setSaving(false)
    }
  }

  return (
    <PanelShell title="General" subtitle="Workspace name, branding, and time settings.">
      {error && <Notice tone="danger">{error}</Notice>}
      {success && <Notice tone="success">{success}</Notice>}
      {loading || !draft ? (
        <Notice>Loading general settings...</Notice>
      ) : (
        <>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Workspace name">
              <Input
                value={draft.workspace_name}
                onChange={(e) =>
                  setDraft((d) => d && { ...d, workspace_name: e.target.value })
                }
              />
            </Field>
            <Field label="Owner">
              <Input value={draft.owner_name} disabled />
            </Field>
            <Field label="Default timezone">
              <Select
                value={draft.timezone}
                onChange={(e) =>
                  setDraft((d) => d && { ...d, timezone: e.target.value })
                }
              >
                <option>Asia/Kolkata</option>
                <option>Asia/Dubai</option>
                <option>Europe/London</option>
                <option>America/New_York</option>
              </Select>
            </Field>
            <Field label="Week starts on">
              <Select
                value={draft.week_starts_on}
                onChange={(e) =>
                  setDraft(
                    (d) =>
                      d && {
                        ...d,
                        week_starts_on: e.target.value as 'Sunday' | 'Monday',
                      }
                  )
                }
              >
                <option>Sunday</option>
                <option>Monday</option>
              </Select>
            </Field>
            <Field label="Working hours" className="sm:col-span-2">
              <div className="flex flex-wrap items-center gap-2">
                <Input
                  className="w-32"
                  type="time"
                  value={draft.working_hours_start}
                  onChange={(e) =>
                    setDraft(
                      (d) => d && { ...d, working_hours_start: e.target.value }
                    )
                  }
                />
                <span className="text-ink-soft">to</span>
                <Input
                  className="w-32"
                  type="time"
                  value={draft.working_hours_end}
                  onChange={(e) =>
                    setDraft(
                      (d) => d && { ...d, working_hours_end: e.target.value }
                    )
                  }
                />
              </div>
            </Field>
          </div>
          <SaveBar
            saving={saving}
            onDiscard={() => saved && setDraft(saved)}
            onSave={() => void save()}
          />
        </>
      )}
    </PanelShell>
  )
}

export function NotificationsPanel() {
  const [items, setItems] = React.useState<NotificationSetting[]>([])
  const [saved, setSaved] = React.useState<NotificationSetting[]>([])
  const [loading, setLoading] = React.useState(true)
  const [saving, setSaving] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)
  const [success, setSuccess] = React.useState<string | null>(null)

  React.useEffect(() => {
    async function load() {
      setLoading(true)
      setError(null)
      try {
        const settings = await request<NotificationSetting[]>(
          '/api/settings/notifications'
        )
        setItems(settings)
        setSaved(settings)
      } catch (err) {
        setError(messageFrom(err))
      } finally {
        setLoading(false)
      }
    }
    void load()
  }, [])

  async function save() {
    setSaving(true)
    setError(null)
    setSuccess(null)
    try {
      const settings = await request<NotificationSetting[]>(
        '/api/settings/notifications',
        {
          method: 'PATCH',
          body: JSON.stringify({
            settings: items.map((item) => ({
              event_key: item.event_key,
              email_enabled: item.email_enabled,
              app_enabled: item.app_enabled,
            })),
          }),
        }
      )
      setItems(settings)
      setSaved(settings)
      setSuccess('Notification settings saved.')
    } catch (err) {
      setError(messageFrom(err))
    } finally {
      setSaving(false)
    }
  }

  function toggle(eventKey: string, key: 'email_enabled' | 'app_enabled') {
    setItems((prev) =>
      prev.map((item) =>
        item.event_key === eventKey ? { ...item, [key]: !item[key] } : item
      )
    )
  }

  return (
    <PanelShell title="Notifications" subtitle="Decide what gets sent and where.">
      {error && <Notice tone="danger">{error}</Notice>}
      {success && <Notice tone="success">{success}</Notice>}
      {loading ? (
        <Notice>Loading notification settings...</Notice>
      ) : (
        <>
          <div className="overflow-hidden rounded-xl border border-border">
            <div className="grid grid-cols-[1fr_80px_80px] gap-4 border-b border-border bg-surface-2 px-4 py-2.5 text-xs font-medium uppercase tracking-wide text-ink-soft">
              <span>Event</span>
              <span className="text-center">Email</span>
              <span className="text-center">In-app</span>
            </div>
            <ul>
              {items.map((item) => (
                <li
                  key={item.event_key}
                  className="grid grid-cols-[1fr_80px_80px] items-center gap-4 border-b border-border px-4 py-3 last:border-0"
                >
                  <div>
                    <p className="text-sm font-medium">{item.label}</p>
                    <p className="text-xs text-ink-soft">{item.hint}</p>
                  </div>
                  <div className="text-center">
                    <Toggle
                      on={item.email_enabled}
                      onClick={() => toggle(item.event_key, 'email_enabled')}
                    />
                  </div>
                  <div className="text-center">
                    <Toggle
                      on={item.app_enabled}
                      onClick={() => toggle(item.event_key, 'app_enabled')}
                    />
                  </div>
                </li>
              ))}
            </ul>
          </div>
          <SaveBar
            saving={saving}
            onDiscard={() => setItems(saved)}
            onSave={() => void save()}
          />
        </>
      )}
    </PanelShell>
  )
}

export function SessionsPanel() {
  const [items, setItems] = React.useState<AdminSession[]>([])
  const [loading, setLoading] = React.useState(true)
  const [error, setError] = React.useState<string | null>(null)

  const load = React.useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      setItems(await request<AdminSession[]>('/api/settings/sessions'))
    } catch (err) {
      setError(messageFrom(err))
    } finally {
      setLoading(false)
    }
  }, [])

  React.useEffect(() => {
    void load()
  }, [load])

  async function remove(id: string) {
    setError(null)
    try {
      await request(`/api/settings/sessions/${id}`, { method: 'DELETE' })
      setItems((prev) => prev.filter((item) => item.id !== id))
    } catch (err) {
      setError(messageFrom(err))
    }
  }

  async function removeOthers() {
    setError(null)
    try {
      await request('/api/settings/sessions', { method: 'DELETE' })
      setItems((prev) => prev.filter((item) => item.is_current))
    } catch (err) {
      setError(messageFrom(err))
    }
  }

  return (
    <PanelShell title="Sessions" subtitle="Devices currently signed in to your account.">
      {error && <Notice tone="danger">{error}</Notice>}
      {loading ? (
        <Notice>Loading sessions...</Notice>
      ) : (
        <>
          <ul className="divide-y divide-border rounded-xl border border-border">
            {items.map((session) => (
              <li key={session.id} className="flex items-center gap-4 p-4">
                <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-surface-2 text-ink-muted">
                  <Monitor className="size-4" />
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="font-medium">{session.device}</p>
                    {session.is_current && (
                      <span className="rounded-full bg-emerald/15 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-emerald">
                        This device
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-ink-soft">
                    {session.location} - {relativeTime(session.last_seen_at)}
                  </p>
                </div>
                {!session.is_current && (
                  <button
                    type="button"
                    onClick={() => void remove(session.id)}
                    className="grid size-9 place-items-center rounded-lg text-coral hover:bg-coral/10"
                    aria-label="Sign out session"
                  >
                    <Trash2 className="size-4" />
                  </button>
                )}
              </li>
            ))}
          </ul>
          {items.some((item) => !item.is_current) && (
            <div className="mt-4">
              <button
                type="button"
                onClick={() => void removeOthers()}
                className="text-sm font-medium text-coral hover:underline"
              >
                Sign out of all other sessions
              </button>
            </div>
          )}
        </>
      )}
    </PanelShell>
  )
}

function PanelShell({
  title,
  subtitle,
  children,
}: {
  title: string
  subtitle: string
  children: React.ReactNode
}) {
  return (
    <section className="rounded-2xl border border-border bg-surface p-6 shadow-card">
      <header className="mb-5">
        <h2 className="text-lg font-semibold">{title}</h2>
        <p className="mt-1 text-sm text-ink-muted">{subtitle}</p>
      </header>
      {children}
    </section>
  )
}

function Field({
  label,
  children,
  className,
}: {
  label: string
  children: React.ReactNode
  className?: string
}) {
  return (
    <label className={cn('block', className)}>
      <span className="mb-1 block text-xs font-medium text-ink-muted">{label}</span>
      {children}
    </label>
  )
}

function Input({
  className,
  ...props
}: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      {...props}
      className={cn(
        'h-10 w-full rounded-lg border border-border bg-surface px-3 text-sm focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/20 disabled:opacity-60',
        className
      )}
    />
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

function Toggle({ on, onClick }: { on: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'inline-flex h-5 w-9 items-center rounded-full transition-colors',
        on ? 'bg-brand' : 'bg-ink-soft/30'
      )}
      aria-pressed={on}
    >
      <span
        className={cn(
          'inline-block size-4 rounded-full bg-white transition-transform',
          on ? 'translate-x-4' : 'translate-x-0.5'
        )}
      />
    </button>
  )
}

function SaveBar({
  saving,
  onDiscard,
  onSave,
}: {
  saving: boolean
  onDiscard: () => void
  onSave: () => void
}) {
  return (
    <div className="mt-6 flex items-center justify-end gap-2 border-t border-border pt-4">
      <button
        type="button"
        onClick={onDiscard}
        className="inline-flex h-10 items-center rounded-xl border border-border bg-surface px-4 text-sm font-medium text-ink-muted hover:bg-surface-2"
      >
        Discard
      </button>
      <button
        type="button"
        onClick={onSave}
        disabled={saving}
        className="inline-flex h-10 items-center gap-1.5 rounded-xl bg-brand px-4 text-sm font-medium text-brand-foreground shadow-sm hover:opacity-90 disabled:opacity-60"
      >
        <Save className="size-4" />
        {saving ? 'Saving...' : 'Save changes'}
      </button>
    </div>
  )
}

function Notice({
  children,
  tone,
}: {
  children: React.ReactNode
  tone?: 'danger' | 'success'
}) {
  return (
    <div
      className={cn(
        'mb-4 rounded-xl border border-border bg-surface-2/60 px-4 py-3 text-sm text-ink-muted',
        tone === 'danger' && 'border-coral/30 bg-coral/10 text-coral',
        tone === 'success' && 'border-emerald/30 bg-emerald/10 text-emerald'
      )}
    >
      {children}
    </div>
  )
}

async function request<T = unknown>(url: string, init?: RequestInit): Promise<T> {
  const res = await fetch(url, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      ...(init?.headers ?? {}),
    },
  })
  const data = await res.json().catch(() => null)
  if (!res.ok) throw new Error(data?.error ?? 'Request failed')
  return data as T
}

function messageFrom(err: unknown) {
  return err instanceof Error ? err.message : 'Something went wrong'
}

function normalizeGeneral(settings: WorkspaceSettings): GeneralDraft {
  return {
    workspace_name: settings.workspace_name,
    owner_name: settings.owner_name,
    timezone: settings.timezone,
    week_starts_on: settings.week_starts_on,
    working_hours_start: settings.working_hours_start.slice(0, 5),
    working_hours_end: settings.working_hours_end.slice(0, 5),
  }
}

function relativeTime(value: string) {
  const then = new Date(value).getTime()
  const diff = Date.now() - then
  const minutes = Math.round(diff / 60000)
  if (minutes < 1) return 'just now'
  if (minutes < 60) return `${minutes} min ago`
  const hours = Math.round(minutes / 60)
  if (hours < 24) return `${hours} hr ago`
  const days = Math.round(hours / 24)
  return `${days} day${days === 1 ? '' : 's'} ago`
}
