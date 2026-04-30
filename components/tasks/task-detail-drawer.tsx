'use client'

import * as React from 'react'
import {
  Calendar,
  Check,
  ChevronRight,
  Loader2,
  MessageCircle,
  Pencil,
  Plus,
  Trash2,
  X,
} from 'lucide-react'

import { Drawer } from '@/components/ui/drawer'
import { Avatar } from '@/components/ui/avatar'
import { PriorityPill } from './priority-pill'
import { cn } from '@/lib/utils'
import type { TaskWithDetails, TaskItem } from '@/lib/db/tasks'

// ── Types ──────────────────────────────────────────────────────────────────

interface Comment {
  id: string
  task_id: string
  author_name: string
  content: string
  created_at: string
}

interface Props {
  task: TaskWithDetails | null
  open: boolean
  onClose: () => void
  onUpdated: (task: TaskWithDetails) => void
  onEdit: (task: TaskWithDetails) => void
}

// ── Helpers ────────────────────────────────────────────────────────────────

async function apiRequest<T = unknown>(url: string, init?: RequestInit): Promise<T> {
  const res = await fetch(url, {
    ...init,
    headers: { 'Content-Type': 'application/json', ...(init?.headers ?? {}) },
  })
  const data = await res.json().catch(() => null)
  if (!res.ok) throw new Error((data as { error?: string } | null)?.error ?? 'Request failed')
  return data as T
}

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime()
  const mins = Math.floor(diff / 60_000)
  if (mins < 1) return 'just now'
  if (mins < 60) return `${mins}m ago`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs}h ago`
  const days = Math.floor(hrs / 24)
  if (days < 7) return `${days}d ago`
  return new Date(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })
}

function formatDeadline(value: string | null): string {
  if (!value) return '—'
  const d = new Date(value)
  const diffDays = Math.ceil((d.getTime() - Date.now()) / 86_400_000)
  if (diffDays < 0) return `Overdue ${Math.abs(diffDays)}d`
  if (diffDays === 0) return 'Due today'
  if (diffDays === 1) return 'Due tomorrow'
  if (diffDays <= 7) return `Due in ${diffDays}d`
  return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
}

const STATUS_CONFIG: Record<
  string,
  { label: string; dot: string; chip: string; activeChip: string }
> = {
  todo:        { label: 'To do',       dot: 'bg-ink-soft',  chip: 'border-border bg-surface text-ink-muted', activeChip: 'border-ink-soft/40 bg-ink-soft/10 text-ink' },
  in_progress: { label: 'In progress', dot: 'bg-indigo',    chip: 'border-border bg-surface text-ink-muted', activeChip: 'border-indigo/40 bg-indigo/10 text-indigo' },
  review:      { label: 'In review',   dot: 'bg-amber',     chip: 'border-border bg-surface text-ink-muted', activeChip: 'border-amber/40 bg-amber/15 text-amber' },
  done:        { label: 'Done',        dot: 'bg-emerald',   chip: 'border-border bg-surface text-ink-muted', activeChip: 'border-emerald/40 bg-emerald/10 text-emerald' },
  blocked:     { label: 'Blocked',     dot: 'bg-coral',     chip: 'border-border bg-surface text-ink-muted', activeChip: 'border-coral/40 bg-coral/10 text-coral' },
}

const COLOR_CHIP: Record<string, string> = {
  violet: 'bg-violet/12 text-violet',
  sky: 'bg-sky/12 text-sky',
  indigo: 'bg-indigo/12 text-indigo',
  coral: 'bg-coral/12 text-coral',
  emerald: 'bg-emerald/12 text-emerald',
  amber: 'bg-amber/15 text-amber',
}

// ── Component ──────────────────────────────────────────────────────────────

export function TaskDetailDrawer({ task, open, onClose, onUpdated, onEdit }: Props) {
  const [localTask, setLocalTask] = React.useState<TaskWithDetails | null>(task)
  const [items, setItems] = React.useState<TaskItem[]>(task?.items ?? [])
  const [comments, setComments] = React.useState<Comment[]>([])
  const [commentsLoaded, setCommentsLoaded] = React.useState(false)
  const [newItemTitle, setNewItemTitle] = React.useState('')
  const [editingItemId, setEditingItemId] = React.useState<string | null>(null)
  const [editingItemTitle, setEditingItemTitle] = React.useState('')
  const [authorName, setAuthorName] = React.useState('Admin')
  const [commentText, setCommentText] = React.useState('')
  const [postingComment, setPostingComment] = React.useState(false)
  const [updatingStatus, setUpdatingStatus] = React.useState(false)
  const [addingItem, setAddingItem] = React.useState(false)

  // Sync when task prop changes
  React.useEffect(() => {
    if (task) {
      setLocalTask(task)
      setItems(task.items ?? [])
    }
  }, [task])

  // Load comments when drawer opens
  React.useEffect(() => {
    if (!open || !task) return
    setCommentsLoaded(false)
    setComments([])
    fetch(`/api/tasks/${task.id}/comments`)
      .then((r) => r.json())
      .then((data: Comment[]) => { setComments(data); setCommentsLoaded(true) })
      .catch(() => setCommentsLoaded(true))
  }, [open, task])

  // ── Handlers ────────────────────────────────────────────────────────────

  async function handleStatusChange(status: string) {
    if (!localTask || updatingStatus) return
    setUpdatingStatus(true)
    try {
      const updated = await apiRequest<TaskWithDetails>(`/api/tasks/${localTask.id}`, {
        method: 'PATCH',
        body: JSON.stringify({ status }),
      })
      // Preserve local items (they come from localTask state, not re-fetched)
      const withItems = { ...updated, items }
      setLocalTask(withItems)
      onUpdated(withItems)
    } catch {
      // silently ignore
    } finally {
      setUpdatingStatus(false)
    }
  }

  async function handleCheckItem(item: TaskItem) {
    if (!localTask) return
    const optimistic = items.map((i) =>
      i.id === item.id ? { ...i, completed: !i.completed } : i
    )
    setItems(optimistic)
    try {
      await apiRequest(`/api/tasks/${localTask.id}/items/${item.id}`, {
        method: 'PATCH',
        body: JSON.stringify({ completed: !item.completed }),
      })
      // Notify parent about progress change
      const updated = { ...localTask, items: optimistic }
      setLocalTask(updated)
      onUpdated(updated)
    } catch {
      setItems(items) // rollback
    }
  }

  async function handleAddItem(e: React.FormEvent | React.KeyboardEvent) {
    e.preventDefault()
    if (!localTask || !newItemTitle.trim() || addingItem) return
    setAddingItem(true)
    try {
      const maxOrder = items.length > 0 ? Math.max(...items.map((i) => i.sort_order)) : 0
      const created = await apiRequest<TaskItem>(`/api/tasks/${localTask.id}/items`, {
        method: 'POST',
        body: JSON.stringify({ title: newItemTitle.trim(), sort_order: maxOrder + 1 }),
      })
      const next = [...items, created]
      setItems(next)
      setNewItemTitle('')
      const updated = { ...localTask, items: next }
      setLocalTask(updated)
      onUpdated(updated)
    } catch {
      // silently ignore
    } finally {
      setAddingItem(false)
    }
  }

  async function handleDeleteItem(itemId: string) {
    if (!localTask) return
    const next = items.filter((i) => i.id !== itemId)
    setItems(next)
    try {
      await apiRequest(`/api/tasks/${localTask.id}/items/${itemId}`, { method: 'DELETE' })
      const updated = { ...localTask, items: next }
      setLocalTask(updated)
      onUpdated(updated)
    } catch {
      setItems(items)
    }
  }

  async function handleSaveEditItem(itemId: string) {
    if (!localTask || !editingItemTitle.trim()) {
      setEditingItemId(null)
      return
    }
    const prev = items
    const next = items.map((i) =>
      i.id === itemId ? { ...i, title: editingItemTitle.trim() } : i
    )
    setItems(next)
    setEditingItemId(null)
    try {
      await apiRequest(`/api/tasks/${localTask.id}/items/${itemId}`, {
        method: 'PATCH',
        body: JSON.stringify({ title: editingItemTitle.trim() }),
      })
      const updated = { ...localTask, items: next }
      setLocalTask(updated)
      onUpdated(updated)
    } catch {
      setItems(prev)
    }
  }

  async function handlePostComment(e: React.FormEvent) {
    e.preventDefault()
    if (!localTask || !authorName.trim() || !commentText.trim() || postingComment) return
    setPostingComment(true)
    try {
      const comment = await apiRequest<Comment>(`/api/tasks/${localTask.id}/comments`, {
        method: 'POST',
        body: JSON.stringify({ author_name: authorName.trim(), content: commentText.trim() }),
      })
      setComments((prev) => [...prev, comment])
      setCommentText('')
    } catch {
      // silently ignore
    } finally {
      setPostingComment(false)
    }
  }

  // ── Render ──────────────────────────────────────────────────────────────

  if (!localTask) return null

  const completedCount = items.filter((i) => i.completed).length
  const totalCount = items.length
  const progressPct = totalCount > 0 ? (completedCount / totalCount) * 100 : 0

  const sortedItems = [...items].sort((a, b) => a.sort_order - b.sort_order)
  const assigneeNames = localTask.assignments
    .map((a) => a.employee?.full_name ?? '')
    .filter(Boolean)

  const footer = (
    <div className="flex w-full items-center justify-between">
      <button
        type="button"
        onClick={onClose}
        className="inline-flex h-10 items-center rounded-xl border border-border px-4 text-sm font-medium text-ink-muted hover:bg-surface-2"
      >
        Close
      </button>
      <button
        type="button"
        onClick={() => onEdit(localTask)}
        className="inline-flex h-10 items-center gap-1.5 rounded-xl bg-brand px-4 text-sm font-medium text-brand-foreground shadow-sm hover:opacity-90"
      >
        Edit task
        <ChevronRight className="size-4" />
      </button>
    </div>
  )

  return (
    <Drawer
      open={open}
      onClose={onClose}
      title={localTask.title}
      size="lg"
      footer={footer}
    >
      <div className="space-y-6">

        {/* ── Status chips ── */}
        <Section label="Status">
          <div className="flex flex-wrap gap-2">
            {(Object.entries(STATUS_CONFIG) as [string, typeof STATUS_CONFIG[string]][]).map(([key, cfg]) => {
              const isActive = localTask.status === key
              return (
                <button
                  key={key}
                  type="button"
                  disabled={updatingStatus}
                  onClick={() => handleStatusChange(key)}
                  className={cn(
                    'inline-flex h-8 items-center gap-1.5 rounded-lg border px-3 text-xs font-semibold transition-colors disabled:opacity-60',
                    isActive ? cfg.activeChip : cn(cfg.chip, 'hover:bg-surface-2')
                  )}
                >
                  <span className={cn('size-1.5 rounded-full', cfg.dot)} />
                  {cfg.label}
                  {isActive && updatingStatus && (
                    <Loader2 className="size-3 animate-spin" />
                  )}
                </button>
              )
            })}
          </div>
        </Section>

        {/* ── Info row ── */}
        <div className="flex flex-wrap items-center gap-3 rounded-xl border border-border bg-surface-2/40 px-4 py-3">
          <PriorityPill priority={localTask.priority} />

          {localTask.company && (
            <span
              className={cn(
                'inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-semibold',
                COLOR_CHIP[localTask.company.color] ?? 'bg-surface-2 text-ink-muted'
              )}
            >
              {localTask.company.name}
            </span>
          )}

          <span
            className={cn(
              'inline-flex items-center gap-1 text-xs',
              !localTask.deadline
                ? 'text-ink-soft'
                : new Date(localTask.deadline) < new Date() && localTask.status !== 'done'
                  ? 'font-medium text-coral'
                  : 'text-ink-muted'
            )}
          >
            <Calendar className="size-3.5" />
            {formatDeadline(localTask.deadline)}
          </span>

          {assigneeNames.length > 0 && (
            <div className="flex items-center gap-1.5">
              {assigneeNames.map((name) => (
                <span
                  key={name}
                  className="inline-flex items-center gap-1 rounded-full border border-border bg-surface px-2 py-0.5 text-xs"
                >
                  <Avatar name={name} size="sm" className="size-4 text-[8px]" />
                  {name}
                </span>
              ))}
            </div>
          )}
        </div>

        {/* ── Description ── */}
        {localTask.description && (
          <Section label="Description">
            <p className="whitespace-pre-wrap text-sm text-ink-muted leading-relaxed">
              {localTask.description}
            </p>
          </Section>
        )}

        {/* ── Task list / Sub-tasks ── */}
        <Section
          label="Task List"
          right={
            totalCount > 0 ? (
              <span className="text-xs text-ink-soft">
                {completedCount}/{totalCount} done
              </span>
            ) : undefined
          }
        >
          {/* Progress bar */}
          {totalCount > 0 && (
            <div className="mb-3">
              <div className="h-1.5 w-full rounded-full bg-surface-2">
                <div
                  className="h-full rounded-full bg-brand transition-all duration-300"
                  style={{ width: `${progressPct}%` }}
                />
              </div>
            </div>
          )}

          {/* Items */}
          <ul className="space-y-1">
            {sortedItems.map((item, idx) => (
              <li
                key={item.id}
                className="group flex items-center gap-2 rounded-lg px-2 py-1.5 hover:bg-surface-2"
              >
                <span className="w-5 shrink-0 text-center text-xs text-ink-soft">
                  {idx + 1}.
                </span>
                <button
                  type="button"
                  onClick={() => handleCheckItem(item)}
                  className={cn(
                    'grid size-4 shrink-0 place-items-center rounded border transition-colors',
                    item.completed
                      ? 'border-emerald bg-emerald text-white'
                      : 'border-border bg-surface hover:border-brand'
                  )}
                  aria-label={item.completed ? 'Mark incomplete' : 'Mark complete'}
                >
                  {item.completed && <Check className="size-2.5" strokeWidth={3} />}
                </button>

                {editingItemId === item.id ? (
                  <input
                    autoFocus
                    className="flex-1 rounded-lg border border-brand bg-surface px-2 py-0.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand/20"
                    value={editingItemTitle}
                    onChange={(e) => setEditingItemTitle(e.target.value)}
                    onBlur={() => handleSaveEditItem(item.id)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') { e.preventDefault(); handleSaveEditItem(item.id) }
                      if (e.key === 'Escape') { setEditingItemId(null) }
                    }}
                  />
                ) : (
                  <span
                    className={cn(
                      'flex-1 text-sm leading-snug',
                      item.completed ? 'text-ink-soft line-through decoration-1' : 'text-ink'
                    )}
                  >
                    {item.title}
                  </span>
                )}

                <div className="flex items-center gap-1 opacity-0 transition-opacity group-hover:opacity-100">
                  <button
                    type="button"
                    aria-label="Edit item"
                    onClick={() => {
                      setEditingItemId(item.id)
                      setEditingItemTitle(item.title)
                    }}
                    className="grid size-6 place-items-center rounded text-ink-soft hover:bg-surface hover:text-ink"
                  >
                    <Pencil className="size-3" />
                  </button>
                  <button
                    type="button"
                    aria-label="Delete item"
                    onClick={() => handleDeleteItem(item.id)}
                    className="grid size-6 place-items-center rounded text-ink-soft hover:bg-coral/10 hover:text-coral"
                  >
                    <Trash2 className="size-3" />
                  </button>
                </div>
              </li>
            ))}
          </ul>

          {/* Add item */}
          <form
            onSubmit={handleAddItem}
            className="mt-2 flex items-center gap-2"
          >
            <input
              type="text"
              value={newItemTitle}
              onChange={(e) => setNewItemTitle(e.target.value)}
              placeholder="Add item…"
              className="h-8 flex-1 rounded-lg border border-dashed border-border bg-transparent px-3 text-sm placeholder:text-ink-soft focus:border-brand focus:bg-surface focus:outline-none focus:ring-2 focus:ring-brand/20"
              onKeyDown={(e) => {
                if (e.key === 'Enter') { e.preventDefault(); handleAddItem(e) }
              }}
            />
            <button
              type="submit"
              disabled={!newItemTitle.trim() || addingItem}
              aria-label="Add item"
              className="grid size-8 shrink-0 place-items-center rounded-lg border border-border bg-surface text-ink-soft hover:border-brand hover:text-brand disabled:opacity-40"
            >
              {addingItem ? <Loader2 className="size-3.5 animate-spin" /> : <Plus className="size-3.5" />}
            </button>
          </form>
        </Section>

        {/* ── Comments ── */}
        <Section
          label="Comments"
          right={
            <MessageCircle className="size-4 text-ink-soft" />
          }
        >
          {!commentsLoaded ? (
            <div className="flex items-center justify-center py-6">
              <Loader2 className="size-5 animate-spin text-ink-soft" />
            </div>
          ) : (
            <>
              {comments.length === 0 && (
                <p className="py-3 text-sm text-ink-soft">No comments yet. Be the first to add one.</p>
              )}
              <div className="space-y-4">
                {comments.map((c) => (
                  <div key={c.id} className="flex gap-3">
                    <Avatar name={c.author_name} size="sm" className="mt-0.5 shrink-0" />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-baseline gap-2">
                        <span className="text-sm font-semibold text-ink">
                          {c.author_name}
                        </span>
                        <span className="text-xs text-ink-soft">{timeAgo(c.created_at)}</span>
                      </div>
                      <p className="mt-1 whitespace-pre-wrap text-sm text-ink-muted leading-relaxed">
                        {c.content}
                      </p>
                    </div>
                  </div>
                ))}
              </div>

              {/* Add comment form */}
              <form onSubmit={handlePostComment} className="mt-5 space-y-3 rounded-xl border border-border bg-surface-2/40 p-4">
                <input
                  type="text"
                  value={authorName}
                  onChange={(e) => setAuthorName(e.target.value)}
                  placeholder="Your name"
                  aria-label="Comment author name"
                  className="h-9 w-full rounded-xl border border-border bg-surface px-3 text-sm placeholder:text-ink-soft focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/20"
                />
                <textarea
                  value={commentText}
                  onChange={(e) => setCommentText(e.target.value)}
                  placeholder="Add a comment…"
                  rows={3}
                  className="w-full resize-none rounded-xl border border-border bg-surface px-3 py-2.5 text-sm placeholder:text-ink-soft focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/20"
                />
                <button
                  type="submit"
                  disabled={!authorName.trim() || !commentText.trim() || postingComment}
                  className="inline-flex h-9 items-center gap-1.5 rounded-xl bg-brand px-4 text-sm font-medium text-brand-foreground shadow-sm hover:opacity-90 disabled:opacity-50"
                >
                  {postingComment ? (
                    <><Loader2 className="size-3.5 animate-spin" /> Posting…</>
                  ) : (
                    'Post Comment'
                  )}
                </button>
              </form>
            </>
          )}
        </Section>

      </div>
    </Drawer>
  )
}

// ── Section helper ────────────────────────────────────────────────────────

function Section({
  label,
  right,
  children,
}: {
  label: string
  right?: React.ReactNode
  children: React.ReactNode
}) {
  return (
    <div>
      <div className="mb-3 flex items-center justify-between">
        <h3 className="text-xs font-semibold uppercase tracking-wider text-ink-soft">
          {label}
        </h3>
        {right && <div>{right}</div>}
      </div>
      {children}
    </div>
  )
}

// ── X icon re-export for parent usage ─────────────────────────────────────
export { X }
