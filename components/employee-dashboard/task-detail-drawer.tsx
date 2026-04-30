'use client'

import * as React from 'react'
import {
  AlertCircle, Building2, Calendar, Check, CheckCircle2, ChevronDown,
  Circle, Clock, Edit2, Loader2, MessageSquare, Plus, RefreshCcw,
  Send, Tag, Trash2, Users, X, Zap,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { Avatar, AvatarStack } from '@/components/ui/avatar'
import { useEmployee } from '@/app/employee/context'

// ── Types ─────────────────────────────────────────────────────────────────────

type Priority   = 'urgent' | 'high' | 'medium' | 'low'
type TaskStatus = 'todo' | 'in_progress' | 'review' | 'done' | 'blocked'

interface TeamMember { id: string; full_name: string }

export interface TaskDetail {
  id: string
  title: string
  description: string | null
  priority: Priority
  status: TaskStatus
  deadline: string | null
  completed_at: string | null
  created_at: string
  company: { id: string; name: string; color: string } | null
  assignments: Array<{ id: string; employee_id: string; employee: TeamMember | null }>
  items: Array<{ id: string; title: string; completed: boolean; sort_order: number }>
}

interface Comment {
  id: string
  task_id: string
  author_name: string
  content: string
  created_at: string
}

// ── Meta ──────────────────────────────────────────────────────────────────────

const PRIORITY_META: Record<Priority, { label: string; chip: string; dot: string; bg: string }> = {
  urgent: { label: 'Urgent', chip: 'bg-coral/10 text-coral',     dot: 'bg-coral',   bg: 'bg-coral/5' },
  high:   { label: 'High',   chip: 'bg-amber/10 text-amber',     dot: 'bg-amber',   bg: 'bg-amber/5' },
  medium: { label: 'Medium', chip: 'bg-sky/10 text-sky',         dot: 'bg-sky',     bg: '' },
  low:    { label: 'Low',    chip: 'bg-surface-2 text-ink-soft', dot: 'bg-ink-soft', bg: '' },
}

const STATUS_OPTIONS: { value: TaskStatus; label: string; chip: string }[] = [
  { value: 'todo',        label: 'To Do',       chip: 'bg-surface-2 text-ink-muted' },
  { value: 'in_progress', label: 'In Progress', chip: 'bg-brand/10 text-brand' },
  { value: 'review',      label: 'In Review',   chip: 'bg-violet/10 text-violet' },
  { value: 'done',        label: 'Done',        chip: 'bg-emerald/10 text-emerald' },
  { value: 'blocked',     label: 'Blocked',     chip: 'bg-coral/10 text-coral' },
]

// ── Helpers ───────────────────────────────────────────────────────────────────

function fmtDate(iso: string | null) {
  if (!iso) return '—'
  return new Date(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
}

function timeAgo(iso: string) {
  const diff = Math.floor((Date.now() - new Date(iso).getTime()) / 1000)
  if (diff < 60)    return 'just now'
  if (diff < 3600)  return `${Math.floor(diff / 60)}m ago`
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`
  return fmtDate(iso)
}

function deadlineUrgency(createdAt: string, deadline: string | null, status: TaskStatus) {
  if (!deadline || status === 'done') return null
  const created     = new Date(createdAt).getTime()
  const due         = new Date(deadline).getTime()
  const now         = Date.now()
  const total       = Math.max(due - created, 1)
  const remaining   = due - now
  const remainPct   = Math.max(0, Math.min(100, Math.round((remaining / total) * 100)))
  const days        = Math.ceil(remaining / 86_400_000)

  if (remaining < 0) return { remainPct: 0, barColor: 'bg-coral', textColor: 'text-coral', label: `${Math.abs(days)}d overdue`, urgent: true }
  if (days === 0)    return { remainPct, barColor: 'bg-coral',  textColor: 'text-coral',  label: 'Due today!', urgent: true }
  if (remainPct <= 25) return { remainPct, barColor: 'bg-coral',  textColor: 'text-coral',  label: `${days}d left`, urgent: true }
  if (remainPct <= 50) return { remainPct, barColor: 'bg-amber',  textColor: 'text-amber',  label: `${days}d left`, urgent: false }
  return { remainPct, barColor: 'bg-emerald', textColor: 'text-emerald', label: `${days}d left`, urgent: false }
}

// ── Component ─────────────────────────────────────────────────────────────────

interface Props {
  task: TaskDetail | null
  open: boolean
  onClose: () => void
  onEdit: (task: TaskDetail) => void
  onTaskUpdated: (task: TaskDetail) => void
}

export function TaskDetailDrawer({ task, open, onClose, onEdit, onTaskUpdated }: Props) {
  const employee = useEmployee()

  // Local task state (so status changes reflect immediately)
  const [localTask, setLocalTask] = React.useState<TaskDetail | null>(task)
  React.useEffect(() => { setLocalTask(task) }, [task])

  // Comments
  const [comments,      setComments]      = React.useState<Comment[]>([])
  const [commLoading,   setCommLoading]   = React.useState(false)
  const [commError,     setCommError]     = React.useState<string | null>(null)
  const [commentText,   setCommentText]   = React.useState('')
  const [posting,       setPosting]       = React.useState(false)
  const commentEndRef = React.useRef<HTMLDivElement>(null)

  // Sub-task
  const [newItemText, setNewItemText] = React.useState('')
  const [addingItem,  setAddingItem]  = React.useState(false)

  // Status dropdown
  const [statusOpen, setStatusOpen] = React.useState(false)

  // ── Load comments whenever task ID changes OR drawer opens ───────────────
  const taskId = task?.id
  const loadComments = React.useCallback(async () => {
    if (!taskId) return
    setCommLoading(true)
    setCommError(null)
    try {
      const r = await fetch(`/api/tasks/${taskId}/comments`)
      if (!r.ok) throw new Error(`Server error ${r.status}`)
      const d = await r.json()
      setComments(Array.isArray(d) ? d : [])
    } catch (e) {
      setCommError(e instanceof Error ? e.message : 'Failed to load comments')
      setComments([])
    } finally {
      setCommLoading(false)
    }
  }, [taskId])

  // Re-fetch when task changes (new task selected)
  React.useEffect(() => {
    setComments([])
    setCommentText('')
    loadComments()
  }, [loadComments])

  // Also re-fetch whenever the drawer is opened (same task, fresh comments)
  React.useEffect(() => {
    if (open) loadComments()
  }, [open, loadComments])

  // Scroll to bottom when new comments arrive
  React.useEffect(() => {
    commentEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [comments.length])

  if (!open || !localTask) return null

  // Narrowed reference — safe to use without null checks in event handlers below
  // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
  const lt = localTask!

  const pm            = PRIORITY_META[localTask.priority]
  const currentStatus = STATUS_OPTIONS.find((s) => s.value === localTask.status)!
  const urg           = deadlineUrgency(localTask.created_at, localTask.deadline, localTask.status)
  const itemsDone     = localTask.items.filter((i) => i.completed).length
  const itemsTotal    = localTask.items.length
  const subPct        = itemsTotal > 0 ? Math.round((itemsDone / itemsTotal) * 100) : null

  const teammates = localTask.assignments.filter((a) => a.employee?.full_name)

  // ── Mutations ───────────────────────────────────────────────────────────────

  async function changeStatus(next: TaskStatus) {
    setStatusOpen(false)
    setLocalTask((t) => t && { ...t, status: next })
    try {
      const r = await fetch(`/api/tasks/${lt.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: next }),
      })
      const updated: TaskDetail = await r.json()
      setLocalTask(updated)
      onTaskUpdated(updated)
    } catch { setLocalTask(lt) }
  }

  async function toggleItem(item: { id: string; completed: boolean }) {
    const next = !item.completed
    const updatedItems = lt.items.map((i) => i.id === item.id ? { ...i, completed: next } : i)
    const optimistic = { ...lt, items: updatedItems }
    setLocalTask(optimistic)
    onTaskUpdated(optimistic)
    try {
      await fetch(`/api/tasks/${lt.id}/items/${item.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ completed: next }),
      })
    } catch {
      // Rollback both local and parent on failure
      setLocalTask(lt)
      onTaskUpdated(lt)
    }
  }

  async function addItem() {
    const title = newItemText.trim()
    if (!title) return
    setAddingItem(true)
    try {
      const r = await fetch(`/api/tasks/${lt.id}/items`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, sort_order: lt.items.length }),
      })
      if (!r.ok) throw new Error(`Failed (${r.status})`)
      const item = await r.json()
      const updated = { ...lt, items: [...lt.items, item] }
      setLocalTask(updated)
      onTaskUpdated(updated)
      setNewItemText('')
    } catch {} finally { setAddingItem(false) }
  }

  async function deleteItem(itemId: string) {
    const updated = { ...lt, items: lt.items.filter((i) => i.id !== itemId) }
    setLocalTask(updated)
    onTaskUpdated(updated)
    await fetch(`/api/tasks/${lt.id}/items/${itemId}`, { method: 'DELETE' }).catch(() => {})
  }

  async function postComment() {
    const content = commentText.trim()
    if (!content || posting) return
    setPosting(true)
    try {
      const r = await fetch(`/api/tasks/${lt.id}/comments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ author_name: employee.full_name, content }),
      })
      if (!r.ok) throw new Error(`Failed (${r.status})`)
      const c: Comment = await r.json()
      setComments((prev) => [...prev, c])
      setCommentText('')
    } catch (e) {
      setCommError(e instanceof Error ? e.message : 'Failed to post comment')
    } finally {
      setPosting(false)
    }
  }

  // ── Render ──────────────────────────────────────────────────────────────────

  return (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 z-40 bg-black/30 backdrop-blur-[2px]" onClick={onClose} />

      {/* Drawer */}
      <aside className="fixed inset-y-0 right-0 z-50 flex w-full flex-col border-l border-border bg-surface shadow-2xl sm:max-w-xl">

        {/* ── Top bar ── */}
        <div className={cn('border-b border-border px-6 py-4', pm.bg)}>
          <div className="flex items-center justify-between">
            <div className="flex flex-wrap items-center gap-2">
              {/* Priority */}
              <span className={cn('inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-bold', pm.chip)}>
                <span className={cn('size-1.5 rounded-full', pm.dot)} />{pm.label}
              </span>
              {/* Status dropdown */}
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setStatusOpen((o) => !o)}
                  className={cn('inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-bold transition-opacity hover:opacity-80', currentStatus.chip)}
                >
                  {currentStatus.label}
                  <ChevronDown className="size-3" />
                </button>
                {statusOpen && (
                  <div className="absolute left-0 top-full z-20 mt-1 min-w-[140px] overflow-hidden rounded-xl border border-border bg-surface shadow-card">
                    {STATUS_OPTIONS.map((s) => (
                      <button key={s.value} type="button" onClick={() => changeStatus(s.value)}
                        className={cn('flex w-full items-center gap-2.5 px-3 py-2.5 text-xs hover:bg-surface-2', localTask.status === s.value && 'bg-surface-2')}
                      >
                        {localTask.status === s.value && <Check className="size-3 text-brand" />}
                        <span className={cn('rounded-full px-2 py-0.5 text-[10px] font-semibold', s.chip)}>{s.label}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
              {/* Urgent badge */}
              {urg?.urgent && localTask.status !== 'done' && (
                <span className="inline-flex items-center gap-1 rounded-full bg-coral/10 px-2 py-0.5 text-[10px] font-bold text-coral">
                  <Zap className="size-2.5" />{urg.label}
                </span>
              )}
            </div>
            <div className="flex items-center gap-1">
              <button type="button" onClick={() => onEdit(localTask)}
                className="grid size-8 place-items-center rounded-lg text-ink-soft hover:bg-surface-2/60 hover:text-ink"
                title="Edit task"
              >
                <Edit2 className="size-4" />
              </button>
              <button type="button" onClick={onClose}
                className="grid size-8 place-items-center rounded-lg text-ink-soft hover:bg-surface-2/60 hover:text-ink"
              >
                <X className="size-4" />
              </button>
            </div>
          </div>
        </div>

        {/* ── Scrollable body ── */}
        <div className="flex-1 overflow-y-auto">
          <div className="space-y-5 p-4 sm:p-6">

            {/* ── Title + description ── */}
            <div>
              <h2 className="text-lg font-bold leading-snug tracking-tight">{localTask.title}</h2>
              {localTask.description && (
                <p className="mt-2 text-sm leading-relaxed text-ink-muted">{localTask.description}</p>
              )}
            </div>

            {/* ── Deadline urgency bar (prominent) ── */}
            {urg && localTask.status !== 'done' && (
              <div className={cn(
                'rounded-2xl border p-4 space-y-2',
                urg.urgent ? 'border-coral/20 bg-coral/5' : urg.barColor === 'bg-amber' ? 'border-amber/20 bg-amber/5' : 'border-emerald/20 bg-emerald/5'
              )}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <Clock className={cn('size-3.5', urg.textColor)} />
                    <span className={cn('text-xs font-semibold', urg.textColor)}>
                      {urg.urgent ? '⚠ ' : ''}{urg.label}
                      {localTask.deadline && (
                        <span className="ml-1.5 font-normal text-ink-soft">
                          · Due {fmtDate(localTask.deadline)}
                        </span>
                      )}
                    </span>
                  </div>
                  <span className={cn('text-xs font-bold', urg.textColor)}>{urg.remainPct}% remaining</span>
                </div>
                {/* Depleting bar */}
                <div className="h-3 w-full overflow-hidden rounded-full bg-surface-2">
                  <div
                    className={cn('h-full rounded-full transition-all duration-700', urg.barColor, urg.urgent && 'animate-pulse')}
                    style={{ width: `${urg.remainPct}%` }}
                  />
                </div>
                <p className="text-[10px] text-ink-soft">
                  Bar depletes as deadline approaches — complete the task to stop the clock.
                </p>
              </div>
            )}

            {/* Completed banner */}
            {localTask.status === 'done' && (
              <div className="flex items-center gap-3 rounded-2xl border border-emerald/20 bg-emerald/5 px-4 py-3">
                <CheckCircle2 className="size-5 shrink-0 text-emerald" />
                <div>
                  <p className="text-sm font-semibold text-emerald">Task completed!</p>
                  {localTask.completed_at && (
                    <p className="text-xs text-ink-soft">Completed {timeAgo(localTask.completed_at)}</p>
                  )}
                </div>
              </div>
            )}

            {/* ── Meta grid ── */}
            <div className="grid grid-cols-1 gap-3 xs:grid-cols-2 sm:grid-cols-2">
              <InfoBox icon={Calendar} label="Deadline">
                <span className={cn('text-sm font-medium', urg?.urgent ? 'text-coral' : 'text-ink')}>
                  {localTask.deadline ? fmtDate(localTask.deadline) : '—'}
                </span>
              </InfoBox>
              <InfoBox icon={Building2} label="Company">
                {localTask.company
                  ? <span className="text-sm font-medium">{localTask.company.name}</span>
                  : <span className="text-ink-soft text-sm">—</span>}
              </InfoBox>
              <InfoBox icon={Tag} label="Created">
                <span className="text-sm text-ink-muted">{fmtDate(localTask.created_at)}</span>
              </InfoBox>
              <InfoBox icon={CheckCircle2} label="Completed">
                <span className="text-sm text-ink-muted">
                  {localTask.completed_at ? fmtDate(localTask.completed_at) : '—'}
                </span>
              </InfoBox>
            </div>

            {/* ── Team members ── */}
            {teammates.length > 0 && (
              <Section title={`Team Members (${teammates.length})`} icon={Users}>
                <div className="flex flex-wrap gap-2">
                  {teammates.map((a) => (
                    <div key={a.id} className={cn(
                      'flex items-center gap-2.5 rounded-xl border px-3 py-2',
                      a.employee_id === employee.id ? 'border-brand/30 bg-brand/5' : 'border-border bg-surface-2/30'
                    )}>
                      <Avatar name={a.employee!.full_name} size="sm" />
                      <div>
                        <p className="text-xs font-semibold leading-tight">{a.employee!.full_name}</p>
                        {a.employee_id === employee.id
                          ? <p className="text-[10px] text-brand font-medium">You</p>
                          : <p className="text-[10px] text-ink-soft">Team member</p>}
                      </div>
                    </div>
                  ))}
                </div>
              </Section>
            )}

            {/* ── Sub-tasks ── */}
            <Section title={`Sub-tasks${itemsTotal > 0 ? ` · ${itemsDone}/${itemsTotal} done` : ''}`} icon={CheckCircle2}>
              {itemsTotal > 0 && (
                <div className="mb-3 space-y-1">
                  <div className="flex items-center justify-between text-[10px] text-ink-soft">
                    <span>Progress</span>
                    <span className="font-semibold">{subPct}%</span>
                  </div>
                  <div className="h-2 w-full rounded-full bg-surface-2">
                    <div
                      className={cn('h-full rounded-full transition-all', subPct === 100 ? 'bg-emerald' : 'bg-brand')}
                      style={{ width: `${subPct ?? 0}%` }}
                    />
                  </div>
                </div>
              )}
              {itemsTotal > 0 && (
                <ul className="mb-2 space-y-1">
                  {localTask.items
                    .slice()
                    .sort((a, b) => a.sort_order - b.sort_order)
                    .map((item) => (
                      <li key={item.id}
                        className="group flex items-center gap-2.5 rounded-lg px-3 py-2 hover:bg-surface-2/50"
                      >
                        <button type="button" onClick={() => toggleItem(item)} className="shrink-0">
                          {item.completed
                            ? <CheckCircle2 className="size-4 text-emerald" />
                            : <Circle className="size-4 text-border hover:text-brand" />}
                        </button>
                        <span className={cn('flex-1 text-sm', item.completed && 'line-through text-ink-soft')}>
                          {item.title}
                        </span>
                        <button type="button" onClick={() => deleteItem(item.id)}
                          className="hidden size-6 place-items-center rounded text-ink-soft hover:text-coral group-hover:grid"
                        >
                          <Trash2 className="size-3" />
                        </button>
                      </li>
                    ))}
                </ul>
              )}
              {/* Add sub-task */}
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  placeholder="Add a sub-task and press Enter…"
                  value={newItemText}
                  onChange={(e) => setNewItemText(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && addItem()}
                  className="h-9 flex-1 rounded-lg border border-border bg-surface-2/50 px-3 text-sm outline-none placeholder:text-ink-soft focus:border-brand/50 focus:ring-1 focus:ring-brand/20"
                />
                <button type="button" onClick={addItem}
                  disabled={!newItemText.trim() || addingItem}
                  className="grid size-9 shrink-0 place-items-center rounded-lg border border-border bg-surface-2/50 text-ink-soft hover:border-brand/30 hover:text-brand disabled:opacity-40"
                >
                  {addingItem ? <Loader2 className="size-4 animate-spin" /> : <Plus className="size-4" />}
                </button>
              </div>
            </Section>

            {/* ── Comments ── */}
            <Section
              title={`Comments${comments.length > 0 ? ` (${comments.length})` : ''}`}
              icon={MessageSquare}
              action={
                <button type="button" onClick={loadComments}
                  className="grid size-6 place-items-center rounded-md text-ink-soft hover:bg-surface-2 hover:text-ink"
                  title="Refresh comments"
                >
                  <RefreshCcw className="size-3" />
                </button>
              }
            >
              {/* Loading state */}
              {commLoading && (
                <div className="flex items-center justify-center py-6">
                  <Loader2 className="size-5 animate-spin text-brand" />
                  <span className="ml-2 text-sm text-ink-soft">Loading comments…</span>
                </div>
              )}

              {/* Error state */}
              {commError && !commLoading && (
                <div className="mb-3 flex items-start gap-3 rounded-xl border border-coral/20 bg-coral/5 px-4 py-3">
                  <AlertCircle className="mt-0.5 size-4 shrink-0 text-coral" />
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-medium text-coral">Could not load comments</p>
                    <p className="text-[10px] text-ink-soft">{commError}</p>
                  </div>
                  <button type="button" onClick={loadComments}
                    className="shrink-0 text-xs font-medium text-brand hover:underline"
                  >
                    Retry
                  </button>
                </div>
              )}

              {/* Comment list */}
              {!commLoading && comments.length === 0 && !commError && (
                <div className="mb-3 rounded-xl border border-dashed border-border px-4 py-5 text-center">
                  <MessageSquare className="mx-auto mb-1.5 size-6 text-ink-soft/40" />
                  <p className="text-xs text-ink-soft">No comments yet. Start the conversation below.</p>
                </div>
              )}

              {!commLoading && comments.length > 0 && (
                <ul className="mb-4 space-y-4">
                  {comments.map((c, idx) => (
                    <li key={c.id} className="flex gap-3">
                      <Avatar name={c.author_name} size="sm" className="mt-0.5 shrink-0" />
                      <div className={cn(
                        'min-w-0 flex-1 rounded-2xl px-4 py-3',
                        c.author_name === employee.full_name
                          ? 'bg-brand/5 border border-brand/15'
                          : 'bg-surface-2/50 border border-border'
                      )}>
                        <div className="mb-1 flex items-baseline justify-between gap-2">
                          <span className={cn('text-xs font-semibold', c.author_name === employee.full_name ? 'text-brand' : 'text-ink')}>
                            {c.author_name === employee.full_name ? 'You' : c.author_name}
                          </span>
                          <span className="shrink-0 text-[10px] text-ink-soft">{timeAgo(c.created_at)}</span>
                        </div>
                        <p className="text-sm leading-relaxed text-ink-muted">{c.content}</p>
                      </div>
                    </li>
                  ))}
                  <div ref={commentEndRef} />
                </ul>
              )}

              {/* New comment input */}
              <div className="flex items-end gap-3">
                <Avatar name={employee.full_name} size="sm" className="mb-0.5 shrink-0" />
                <div className="flex min-w-0 flex-1 flex-col gap-2">
                  <textarea
                    rows={2}
                    placeholder="Write a comment… (Ctrl+Enter to send)"
                    value={commentText}
                    onChange={(e) => setCommentText(e.target.value)}
                    onKeyDown={(e) => { if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) postComment() }}
                    className="w-full resize-none rounded-xl border border-border bg-surface-2/50 px-3 py-2.5 text-sm leading-relaxed outline-none placeholder:text-ink-soft focus:border-brand/50 focus:ring-1 focus:ring-brand/20"
                  />
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] text-ink-soft">Ctrl+Enter to send</span>
                    <button
                      type="button"
                      onClick={postComment}
                      disabled={!commentText.trim() || posting}
                      className="inline-flex items-center gap-1.5 rounded-xl bg-brand px-3 py-1.5 text-xs font-semibold text-brand-foreground shadow-sm hover:opacity-90 disabled:opacity-40"
                    >
                      {posting ? <Loader2 className="size-3 animate-spin" /> : <Send className="size-3" />}
                      Send
                    </button>
                  </div>
                </div>
              </div>
            </Section>

          </div>
        </div>
      </aside>
    </>
  )
}

// ── Sub-components ────────────────────────────────────────────────────────────

function Section({
  title, icon: Icon, children, action,
}: {
  title: string
  icon?: React.ElementType
  children: React.ReactNode
  action?: React.ReactNode
}) {
  return (
    <div>
      <div className="mb-3 flex items-center gap-2">
        {Icon && <Icon className="size-3.5 text-ink-soft" />}
        <p className="flex-1 text-xs font-bold uppercase tracking-wider text-ink-soft">{title}</p>
        {action}
      </div>
      {children}
    </div>
  )
}

function InfoBox({ icon: Icon, label, children }: { icon: React.ElementType; label: string; children: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-border bg-surface-2/30 p-3">
      <div className="mb-1.5 flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wider text-ink-soft">
        <Icon className="size-3" />{label}
      </div>
      {children}
    </div>
  )
}
