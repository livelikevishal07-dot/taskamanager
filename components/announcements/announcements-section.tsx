'use client'

import * as React from 'react'
import {
  Bell, CalendarDays, Info, Loader2, Megaphone, Pencil,
  Pin, PinOff, Plus, PartyPopper, Search, Trash2, X,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import type { Announcement, AnnouncementType } from '@/lib/db/announcements'

// ── Meta ──────────────────────────────────────────────────────────────────────

const TYPE_META: Record<AnnouncementType, {
  label: string
  icon: React.ElementType
  chip: string
  bg: string
  text: string
}> = {
  announcement: { label: 'Announcement', icon: Megaphone,    chip: 'bg-brand/10 text-brand',      bg: 'bg-brand/10',   text: 'text-brand' },
  event:        { label: 'Event',        icon: PartyPopper,  chip: 'bg-emerald/10 text-emerald',  bg: 'bg-emerald/10', text: 'text-emerald' },
  holiday:      { label: 'Holiday',      icon: CalendarDays, chip: 'bg-indigo/10 text-indigo',    bg: 'bg-indigo/10',  text: 'text-indigo' },
  info:         { label: 'Info',         icon: Info,         chip: 'bg-amber/10 text-amber',      bg: 'bg-amber/15',   text: 'text-amber' },
}

const TYPE_OPTIONS: AnnouncementType[] = ['announcement', 'event', 'holiday', 'info']

// ── Helpers ───────────────────────────────────────────────────────────────────

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime()
  const mins = Math.floor(diff / 60_000)
  if (mins < 1)  return 'just now'
  if (mins < 60) return `${mins}m ago`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24)  return `${hrs}h ago`
  const days = Math.floor(hrs / 24)
  if (days < 7)  return `${days}d ago`
  return new Date(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: '2-digit' })
}

// ── Drawer ────────────────────────────────────────────────────────────────────

interface DrawerProps {
  open: boolean
  announcement: Announcement | null   // null = create mode
  onClose: () => void
  onSaved: (a: Announcement) => void
}

function AnnouncementDrawer({ open, announcement, onClose, onSaved }: DrawerProps) {
  const isEdit = Boolean(announcement)

  const [title,   setTitle]   = React.useState('')
  const [body,    setBody]    = React.useState('')
  const [type,    setType]    = React.useState<AnnouncementType>('announcement')
  const [pinned,  setPinned]  = React.useState(false)
  const [saving,  setSaving]  = React.useState(false)
  const [error,   setError]   = React.useState<string | null>(null)

  React.useEffect(() => {
    if (!open) return
    if (announcement) {
      setTitle(announcement.title)
      setBody(announcement.body ?? '')
      setType(announcement.type)
      setPinned(announcement.pinned)
    } else {
      setTitle('')
      setBody('')
      setType('announcement')
      setPinned(false)
    }
    setError(null)
  }, [open, announcement])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!title.trim()) { setError('Title is required'); return }
    setSaving(true)
    setError(null)
    try {
      const payload = {
        title: title.trim(),
        body:  body.trim() || null,
        type,
        pinned,
      }
      const url    = isEdit ? `/api/announcements/${announcement!.id}` : '/api/announcements'
      const method = isEdit ? 'PATCH' : 'POST'
      const r = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      if (!r.ok) {
        const err = await r.json().catch(() => ({}))
        throw new Error((err as { error?: string }).error ?? 'Something went wrong')
      }
      const saved: Announcement = await r.json()
      onSaved(saved)
      onClose()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save')
    } finally {
      setSaving(false)
    }
  }

  if (!open) return null

  return (
    <>
      <div className="fixed inset-0 z-40 bg-black/30 backdrop-blur-[2px]" onClick={onClose} />
      <aside className="fixed inset-y-0 right-0 z-50 flex w-full max-w-lg flex-col border-l border-border bg-surface shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-border px-6 py-4">
          <h2 className="text-base font-semibold">
            {isEdit ? 'Edit Announcement' : 'New Announcement'}
          </h2>
          <button type="button" onClick={onClose}
            className="grid size-8 place-items-center rounded-lg text-ink-soft hover:bg-surface-2"
          >
            <X className="size-4" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="flex flex-1 flex-col overflow-y-auto">
          <div className="space-y-5 p-6">

            {/* Type selector */}
            <div>
              <label className="mb-2 block text-xs font-semibold text-ink-muted">Type</label>
              <div className="flex flex-wrap gap-2">
                {TYPE_OPTIONS.map((t) => {
                  const m = TYPE_META[t]
                  const Icon = m.icon
                  const active = type === t
                  return (
                    <button
                      key={t}
                      type="button"
                      onClick={() => setType(t)}
                      className={cn(
                        'inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-semibold transition-all',
                        active
                          ? cn(m.chip, 'ring-2 ring-offset-1 ring-brand/30 shadow-sm')
                          : 'border-border text-ink-muted opacity-60 hover:opacity-100'
                      )}
                    >
                      <Icon className="size-3.5" />
                      {m.label}
                    </button>
                  )
                })}
              </div>
            </div>

            {/* Title */}
            <div>
              <label className="mb-1.5 block text-xs font-semibold text-ink-muted">
                Title <span className="text-coral">*</span>
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Office closed on Friday"
                autoFocus
                className="h-10 w-full rounded-xl border border-border bg-surface-2/50 px-3 text-sm outline-none placeholder:text-ink-soft focus:border-brand/50 focus:ring-2 focus:ring-brand/20"
              />
            </div>

            {/* Body */}
            <div>
              <label className="mb-1.5 block text-xs font-semibold text-ink-muted">
                Details <span className="text-ink-soft font-normal">(optional)</span>
              </label>
              <textarea
                rows={4}
                value={body}
                onChange={(e) => setBody(e.target.value)}
                placeholder="Add more context or details…"
                className="w-full resize-none rounded-xl border border-border bg-surface-2/50 px-3 py-2.5 text-sm leading-relaxed outline-none placeholder:text-ink-soft focus:border-brand/50 focus:ring-2 focus:ring-brand/20"
              />
            </div>

            {/* Pinned toggle */}
            <div className="flex items-center justify-between rounded-xl border border-border bg-surface-2/30 px-4 py-3">
              <div>
                <p className="text-sm font-medium">Pin this announcement</p>
                <p className="text-xs text-ink-soft">Pinned items always appear at the top of the feed</p>
              </div>
              <button
                type="button"
                onClick={() => setPinned((p) => !p)}
                className={cn(
                  'relative inline-flex h-6 w-11 shrink-0 rounded-full border-2 border-transparent transition-colors focus:outline-none',
                  pinned ? 'bg-brand' : 'bg-border'
                )}
              >
                <span
                  className={cn(
                    'inline-block size-5 rounded-full bg-white shadow-sm transition-transform',
                    pinned ? 'translate-x-5' : 'translate-x-0'
                  )}
                />
              </button>
            </div>

            {/* Error */}
            {error && (
              <div className="rounded-xl border border-coral/20 bg-coral/5 px-4 py-3 text-sm text-coral">
                {error}
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="border-t border-border p-6 pt-4">
            <div className="flex gap-3">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 rounded-xl border border-border py-2.5 text-sm font-medium text-ink-muted hover:bg-surface-2"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={saving || !title.trim()}
                className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-brand py-2.5 text-sm font-medium text-brand-foreground shadow-sm hover:opacity-90 disabled:opacity-50"
              >
                {saving && <Loader2 className="size-4 animate-spin" />}
                {isEdit ? 'Save Changes' : 'Publish'}
              </button>
            </div>
          </div>
        </form>
      </aside>
    </>
  )
}

// ── Main section ──────────────────────────────────────────────────────────────

interface Props {
  initialAnnouncements: Announcement[]
}

export function AnnouncementsSection({ initialAnnouncements }: Props) {
  const [items,        setItems]        = React.useState<Announcement[]>(initialAnnouncements)
  const [search,       setSearch]       = React.useState('')
  const [filterType,   setFilterType]   = React.useState<AnnouncementType | ''>('')
  const [drawerOpen,   setDrawerOpen]   = React.useState(false)
  const [editItem,     setEditItem]     = React.useState<Announcement | null>(null)
  const [deleting,     setDeleting]     = React.useState<string | null>(null)

  // Client-side filter
  const filtered = React.useMemo(() => {
    const q = search.trim().toLowerCase()
    return items.filter((a) => {
      if (filterType && a.type !== filterType) return false
      if (q && !a.title.toLowerCase().includes(q) && !(a.body ?? '').toLowerCase().includes(q)) return false
      return true
    })
  }, [items, search, filterType])

  function openCreate() {
    setEditItem(null)
    setDrawerOpen(true)
  }

  function openEdit(a: Announcement) {
    setEditItem(a)
    setDrawerOpen(true)
  }

  function handleSaved(saved: Announcement) {
    setItems((prev) => {
      const without = prev.filter((a) => a.id !== saved.id)
      // Pinned items first, then by created_at desc
      const next = [saved, ...without]
      return next.sort((a, b) => {
        if (a.pinned !== b.pinned) return a.pinned ? -1 : 1
        return b.created_at.localeCompare(a.created_at)
      })
    })
  }

  async function handleDelete(id: string) {
    if (!window.confirm('Delete this announcement? This cannot be undone.')) return
    setDeleting(id)
    try {
      await fetch(`/api/announcements/${id}`, { method: 'DELETE' })
      setItems((prev) => prev.filter((a) => a.id !== id))
    } catch {
      // silently ignore — item stays in list
    } finally {
      setDeleting(null)
    }
  }

  async function togglePin(a: Announcement) {
    const next = !a.pinned
    // Optimistic
    setItems((prev) =>
      prev
        .map((x) => (x.id === a.id ? { ...x, pinned: next } : x))
        .sort((x, y) => {
          if (x.pinned !== y.pinned) return x.pinned ? -1 : 1
          return y.created_at.localeCompare(x.created_at)
        })
    )
    try {
      await fetch(`/api/announcements/${a.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pinned: next }),
      })
    } catch {
      // Rollback
      setItems((prev) =>
        prev
          .map((x) => (x.id === a.id ? { ...x, pinned: a.pinned } : x))
          .sort((x, y) => {
            if (x.pinned !== y.pinned) return x.pinned ? -1 : 1
            return y.created_at.localeCompare(x.created_at)
          })
      )
    }
  }

  return (
    <div className="space-y-4">

      {/* ── Toolbar ── */}
      <div className="rounded-2xl border border-border bg-surface p-3 shadow-card">
        <div className="flex flex-wrap items-center gap-2">

          {/* Search */}
          <div className="relative min-w-[200px] flex-1">
            <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-ink-soft" />
            <input
              type="search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search announcements…"
              className="h-10 w-full rounded-xl border border-transparent bg-surface-2 pl-9 pr-4 text-sm placeholder:text-ink-soft focus:border-brand focus:bg-surface focus:outline-none focus:ring-2 focus:ring-brand/20"
            />
          </div>

          {/* Type filter */}
          <div className="flex flex-wrap gap-1.5">
            <button
              type="button"
              onClick={() => setFilterType('')}
              className={cn(
                'rounded-lg border px-3 py-1.5 text-xs font-medium transition-colors',
                filterType === ''
                  ? 'border-brand/30 bg-brand/10 text-brand'
                  : 'border-border text-ink-muted hover:bg-surface-2'
              )}
            >
              All
            </button>
            {TYPE_OPTIONS.map((t) => {
              const m = TYPE_META[t]
              return (
                <button
                  key={t}
                  type="button"
                  onClick={() => setFilterType(filterType === t ? '' : t)}
                  className={cn(
                    'rounded-lg border px-3 py-1.5 text-xs font-medium transition-colors',
                    filterType === t
                      ? cn(m.chip, 'border-transparent')
                      : 'border-border text-ink-muted hover:bg-surface-2'
                  )}
                >
                  {m.label}
                </button>
              )
            })}
          </div>

          {/* New button */}
          <button
            type="button"
            onClick={openCreate}
            className="ml-auto inline-flex h-10 items-center gap-1.5 rounded-xl bg-brand px-4 text-sm font-medium text-brand-foreground shadow-sm hover:opacity-90"
          >
            <Plus className="size-4" />
            New Announcement
          </button>
        </div>
      </div>

      {/* ── List ── */}
      <div className="overflow-hidden rounded-2xl border border-border bg-surface shadow-card">
        {filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-3 py-20">
            <div className="grid size-12 place-items-center rounded-2xl bg-surface-2">
              <Bell className="size-6 text-ink-soft" />
            </div>
            <p className="text-sm font-medium text-ink-muted">
              {search || filterType ? 'No announcements match your filters.' : 'No announcements yet.'}
            </p>
            {!search && !filterType && (
              <button
                type="button"
                onClick={openCreate}
                className="inline-flex items-center gap-1.5 rounded-xl bg-brand px-4 py-2 text-sm font-medium text-brand-foreground shadow-sm hover:opacity-90"
              >
                <Plus className="size-4" /> Create your first announcement
              </button>
            )}
          </div>
        ) : (
          <ul className="divide-y divide-border">
            {filtered.map((a) => {
              const m    = TYPE_META[a.type]
              const Icon = m.icon

              return (
                <li
                  key={a.id}
                  className={cn(
                    'group flex items-start gap-4 px-5 py-4 transition-colors hover:bg-surface-2/40',
                    a.pinned && 'bg-brand/[0.03]'
                  )}
                >
                  {/* Icon */}
                  <span className={cn('mt-0.5 grid size-10 shrink-0 place-items-center rounded-xl', m.bg, m.text)}>
                    <Icon className="size-5" />
                  </span>

                  {/* Content */}
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      {a.pinned && (
                        <span className="inline-flex items-center gap-1 rounded-full bg-brand/10 px-2 py-0.5 text-[10px] font-bold text-brand">
                          <Pin className="size-2.5" /> Pinned
                        </span>
                      )}
                      <span className={cn('inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold', m.chip)}>
                        {m.label}
                      </span>
                      <span className="text-[10px] text-ink-soft">{timeAgo(a.created_at)}</span>
                    </div>
                    <p className="mt-1 text-sm font-semibold leading-snug text-ink">{a.title}</p>
                    {a.body && (
                      <p className="mt-0.5 line-clamp-2 text-xs leading-relaxed text-ink-muted">
                        {a.body}
                      </p>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex shrink-0 items-center gap-1 opacity-0 transition-opacity group-hover:opacity-100">
                    {/* Pin/Unpin */}
                    <button
                      type="button"
                      onClick={() => togglePin(a)}
                      title={a.pinned ? 'Unpin' : 'Pin to top'}
                      className="grid size-8 place-items-center rounded-lg text-ink-muted hover:bg-surface-2 hover:text-brand"
                    >
                      {a.pinned ? <PinOff className="size-4" /> : <Pin className="size-4" />}
                    </button>
                    {/* Edit */}
                    <button
                      type="button"
                      onClick={() => openEdit(a)}
                      title="Edit"
                      className="grid size-8 place-items-center rounded-lg text-ink-muted hover:bg-surface-2 hover:text-ink"
                    >
                      <Pencil className="size-4" />
                    </button>
                    {/* Delete */}
                    <button
                      type="button"
                      onClick={() => handleDelete(a.id)}
                      title="Delete"
                      disabled={deleting === a.id}
                      className="grid size-8 place-items-center rounded-lg text-ink-muted opacity-60 transition-all hover:bg-coral/10 hover:text-coral hover:opacity-100 disabled:opacity-30"
                    >
                      {deleting === a.id
                        ? <Loader2 className="size-4 animate-spin" />
                        : <Trash2 className="size-4" />}
                    </button>
                  </div>
                </li>
              )
            })}
          </ul>
        )}
      </div>

      {/* Stats footer */}
      {items.length > 0 && (
        <p className="px-1 text-xs text-ink-soft">
          {items.filter((a) => a.pinned).length} pinned · {items.length} total
        </p>
      )}

      {/* Drawer */}
      <AnnouncementDrawer
        open={drawerOpen}
        announcement={editItem}
        onClose={() => setDrawerOpen(false)}
        onSaved={handleSaved}
      />
    </div>
  )
}
