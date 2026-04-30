'use client'

import * as React from 'react'
import { Plus, Trash2, StickyNote, Loader2, X, Check, Pencil } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useEmployee } from '@/app/employee/context'
import { EmployeeTopbar } from '@/components/employee-dashboard/topbar'

// ── Types ─────────────────────────────────────────────────────────────────────

interface Note {
  id:         string
  title:      string | null
  content:    string
  color:      string
  created_at: string
  updated_at: string
}

// ── Color palette ─────────────────────────────────────────────────────────────

const COLORS = [
  { id: 'default', dot: 'bg-ink-soft/30',  card: '',                                                                              ring: 'ring-ink-soft/40'  },
  { id: 'yellow',  dot: 'bg-amber-400',     card: 'bg-amber-50 border-amber-200 dark:bg-amber-950/30 dark:border-amber-800',      ring: 'ring-amber-400'    },
  { id: 'green',   dot: 'bg-emerald-500',   card: 'bg-emerald-50 border-emerald-200 dark:bg-emerald-950/30 dark:border-emerald-800', ring: 'ring-emerald-500' },
  { id: 'blue',    dot: 'bg-blue-500',      card: 'bg-blue-50 border-blue-200 dark:bg-blue-950/30 dark:border-blue-800',          ring: 'ring-blue-500'     },
  { id: 'pink',    dot: 'bg-pink-500',      card: 'bg-pink-50 border-pink-200 dark:bg-pink-950/30 dark:border-pink-800',          ring: 'ring-pink-500'     },
  { id: 'purple',  dot: 'bg-purple-500',    card: 'bg-purple-50 border-purple-200 dark:bg-purple-950/30 dark:border-purple-800',  ring: 'ring-purple-500'   },
] as const

type ColorId = typeof COLORS[number]['id']

function getColor(id: string) {
  return COLORS.find((c) => c.id === id) ?? COLORS[0]
}

// ── Date helpers ──────────────────────────────────────────────────────────────

function fullDate(iso: string) {
  return new Date(iso).toLocaleString('en-IN', {
    day:    'numeric',
    month:  'short',
    year:   'numeric',
    hour:   '2-digit',
    minute: '2-digit',
  })
}

function wasEdited(note: Note) {
  return (new Date(note.updated_at).getTime() - new Date(note.created_at).getTime()) > 5000
}

// ── Colour picker (memoised — same palette every render) ──────────────────────

const ColorPicker = React.memo(function ColorPicker({
  value, onChange,
}: {
  value: ColorId
  onChange: (c: ColorId) => void
}) {
  return (
    <div className="flex items-center gap-1.5">
      {COLORS.map((c) => (
        <button
          key={c.id}
          type="button"
          onClick={() => onChange(c.id)}
          title={c.id}
          className={cn(
            'size-5 rounded-full border-2 transition-transform hover:scale-110',
            c.dot,
            value === c.id
              ? `scale-125 border-ink/40 ring-2 ring-offset-1 ${c.ring}`
              : 'border-transparent',
          )}
        />
      ))}
    </div>
  )
})

// ── New Note Input ────────────────────────────────────────────────────────────

function NewNoteInput({ onSave }: { onSave: (n: { title: string; content: string; color: string }) => Promise<void> }) {
  const [expanded, setExpanded] = React.useState(false)
  const [title,    setTitle]    = React.useState('')
  const [content,  setContent]  = React.useState('')
  const [color,    setColor]    = React.useState<ColorId>('default')
  const [saving,   setSaving]   = React.useState(false)
  const wrapRef    = React.useRef<HTMLDivElement>(null)
  const contentRef = React.useRef<HTMLTextAreaElement>(null)

  const reset = React.useCallback(() => {
    setExpanded(false); setTitle(''); setContent(''); setColor('default')
  }, [])

  const handleSave = React.useCallback(async () => {
    const c = content.trim(); const t = title.trim()
    if (!c && !t) { reset(); return }
    setSaving(true)
    await onSave({ title: t, content: c || t, color })
    setSaving(false)
    reset()
  }, [content, title, color, onSave, reset])

  const handleClose = React.useCallback(() => {
    if (content.trim() || title.trim()) handleSave()
    else reset()
  }, [content, title, handleSave, reset])

  React.useEffect(() => {
    if (!expanded) return
    function handler(e: MouseEvent) {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) handleClose()
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [expanded, handleClose])

  function handleExpand() {
    setExpanded(true)
    setTimeout(() => contentRef.current?.focus(), 50)
  }

  const cardColor = getColor(color)

  return (
    <div ref={wrapRef} className="mx-auto mb-8 max-w-lg">
      {!expanded ? (
        <button
          type="button"
          onClick={handleExpand}
          className="flex w-full items-center gap-3 rounded-2xl border border-border bg-surface px-5 py-3.5 text-left shadow-card transition-shadow hover:shadow-md"
        >
          <Plus className="size-5 shrink-0 text-ink-soft" />
          <span className="text-sm text-ink-soft">Take a note…</span>
        </button>
      ) : (
        <div className={cn('overflow-hidden rounded-2xl border shadow-lg', cardColor.card || 'border-border bg-surface')}>
          <input
            type="text"
            placeholder="Title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full bg-transparent px-5 pt-4 pb-1 text-sm font-semibold text-ink placeholder:text-ink-soft/50 focus:outline-none"
          />
          <textarea
            ref={contentRef}
            placeholder="Write your note here…"
            value={content}
            onChange={(e) => setContent(e.target.value)}
            rows={4}
            className="w-full resize-none bg-transparent px-5 py-2 text-sm text-ink placeholder:text-ink-soft/50 focus:outline-none"
          />
          <div className="flex items-center justify-between px-4 pb-3 pt-1">
            <ColorPicker value={color} onChange={setColor} />
            <div className="flex items-center gap-2">
              <button type="button" onClick={reset} className="rounded-lg px-3 py-1.5 text-xs font-medium text-ink-soft hover:bg-black/5 dark:hover:bg-white/5">
                Discard
              </button>
              <button
                type="button"
                onClick={handleSave}
                disabled={saving || (!content.trim() && !title.trim())}
                className="flex items-center gap-1.5 rounded-lg bg-brand px-3 py-1.5 text-xs font-semibold text-brand-foreground transition-opacity hover:opacity-90 disabled:opacity-50"
              >
                {saving ? <Loader2 className="size-3 animate-spin" /> : <Check className="size-3" />}
                Save
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// ── Note Card (memoised — re-renders only when its note prop changes) ─────────

const NoteCard = React.memo(function NoteCard({
  note,
  onDelete,
  onUpdate,
}: {
  note:     Note
  onDelete: (id: string) => void
  onUpdate: (id: string, patch: { title: string | null; content: string; color: string }) => Promise<void>
}) {
  const [editing,    setEditing]    = React.useState(false)
  const [editTitle,  setEditTitle]  = React.useState(note.title ?? '')
  const [editContent,setEditContent]= React.useState(note.content)
  const [editColor,  setEditColor]  = React.useState<ColorId>((note.color as ColorId) ?? 'default')
  const [saving,     setSaving]     = React.useState(false)
  const [confirming, setConfirming] = React.useState(false)
  const [deleting,   setDeleting]   = React.useState(false)
  const wrapRef     = React.useRef<HTMLDivElement>(null)
  const contentRef  = React.useRef<HTMLTextAreaElement>(null)
  const cardColor   = getColor(editing ? editColor : note.color)

  // Keep edit fields in sync if note prop changes (e.g. after save)
  React.useEffect(() => {
    if (!editing) {
      setEditTitle(note.title ?? '')
      setEditContent(note.content)
      setEditColor((note.color as ColorId) ?? 'default')
    }
  }, [note, editing])

  const cancelEdit = React.useCallback(() => {
    setEditing(false)
    setEditTitle(note.title ?? '')
    setEditContent(note.content)
    setEditColor((note.color as ColorId) ?? 'default')
  }, [note])

  const handleSaveEdit = React.useCallback(async () => {
    const t = editTitle.trim(); const c = editContent.trim()
    if (t === (note.title ?? '') && c === note.content && editColor === note.color) {
      setEditing(false); return
    }
    if (!c && !t) { cancelEdit(); return }
    setSaving(true)
    await onUpdate(note.id, { title: t || null, content: c || t, color: editColor })
    setSaving(false)
    setEditing(false)
  }, [editTitle, editContent, editColor, note, onUpdate, cancelEdit])

  // Close edit on outside click
  React.useEffect(() => {
    if (!editing) return
    function handler(e: MouseEvent) {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) handleSaveEdit()
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [editing, handleSaveEdit])

  // Auto-reset delete confirm
  React.useEffect(() => {
    if (!confirming) return
    const t = setTimeout(() => setConfirming(false), 3000)
    return () => clearTimeout(t)
  }, [confirming])

  function startEdit() {
    setEditing(true)
    setTimeout(() => contentRef.current?.focus(), 50)
  }

  async function handleDelete() {
    if (!confirming) { setConfirming(true); return }
    setDeleting(true)
    onDelete(note.id)
  }

  const edited = wasEdited(note)

  // ── Edit mode ───────────────────────────────────────────────────────────────
  if (editing) {
    return (
      <div
        ref={wrapRef}
        className={cn(
          'mb-4 break-inside-avoid overflow-hidden rounded-2xl border shadow-lg',
          cardColor.card || 'border-border bg-surface',
        )}
      >
        <input
          type="text"
          placeholder="Title"
          value={editTitle}
          onChange={(e) => setEditTitle(e.target.value)}
          className="w-full bg-transparent px-5 pt-4 pb-1 text-sm font-semibold text-ink placeholder:text-ink-soft/50 focus:outline-none"
        />
        <textarea
          ref={contentRef}
          placeholder="Write your note here…"
          value={editContent}
          onChange={(e) => setEditContent(e.target.value)}
          rows={Math.max(3, editContent.split('\n').length + 1)}
          className="w-full resize-none bg-transparent px-5 py-2 text-sm text-ink placeholder:text-ink-soft/50 focus:outline-none"
        />
        <div className="flex items-center justify-between px-4 pb-3 pt-1">
          <ColorPicker value={editColor} onChange={setEditColor} />
          <div className="flex items-center gap-2">
            <button type="button" onClick={cancelEdit} className="rounded-lg px-3 py-1.5 text-xs font-medium text-ink-soft hover:bg-black/5 dark:hover:bg-white/5">
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSaveEdit}
              disabled={saving}
              className="flex items-center gap-1.5 rounded-lg bg-brand px-3 py-1.5 text-xs font-semibold text-brand-foreground transition-opacity hover:opacity-90 disabled:opacity-50"
            >
              {saving ? <Loader2 className="size-3 animate-spin" /> : <Check className="size-3" />}
              Save
            </button>
          </div>
        </div>
      </div>
    )
  }

  // ── View mode ───────────────────────────────────────────────────────────────
  return (
    <div
      ref={wrapRef}
      className={cn(
        'group relative mb-4 break-inside-avoid overflow-hidden rounded-2xl border p-4 transition-shadow hover:shadow-md',
        cardColor.card || 'border-border bg-surface',
        deleting && 'scale-95 opacity-50 transition-all duration-300',
      )}
    >
      {/* Action buttons — appear on hover */}
      <div className="absolute right-3 top-3 flex items-center gap-1 opacity-0 transition-opacity group-hover:opacity-100">
        {/* Edit */}
        <button
          type="button"
          onClick={startEdit}
          className="grid size-7 place-items-center rounded-full bg-black/5 text-ink-soft hover:bg-brand/10 hover:text-brand dark:bg-white/10"
          title="Edit note"
        >
          <Pencil className="size-3.5" />
        </button>

        {/* Delete */}
        <button
          type="button"
          onClick={handleDelete}
          disabled={deleting}
          className={cn(
            'grid size-7 place-items-center rounded-full transition-all',
            confirming
              ? 'bg-coral text-white'
              : 'bg-black/5 text-ink-soft hover:bg-coral/10 hover:text-coral dark:bg-white/10',
          )}
          title={confirming ? 'Click again to confirm' : 'Delete note'}
        >
          {deleting ? <Loader2 className="size-3.5 animate-spin" /> : <Trash2 className="size-3.5" />}
        </button>
      </div>

      {/* Delete confirm hint */}
      {confirming && (
        <p className="mb-1.5 text-[10px] font-semibold text-coral">Tap again to confirm delete</p>
      )}

      {/* Title */}
      {note.title && (
        <p className="mb-1.5 pr-16 text-sm font-semibold leading-snug text-ink">{note.title}</p>
      )}

      {/* Content */}
      <p className={cn('whitespace-pre-wrap text-sm leading-relaxed text-ink', !note.title && 'pr-16')}>
        {note.content}
      </p>

      {/* Date footer */}
      <div className="mt-3 flex items-center gap-1.5">
        <p className="text-[10px] font-medium text-ink-soft/70">{fullDate(note.created_at)}</p>
        {edited && (
          <span className="rounded-full bg-black/5 px-1.5 py-px text-[9px] font-semibold text-ink-soft dark:bg-white/10">
            edited
          </span>
        )}
      </div>
    </div>
  )
})

// ── Main Page ─────────────────────────────────────────────────────────────────

export default function NotesPage() {
  const employee = useEmployee()
  const [notes,   setNotes]   = React.useState<Note[]>([])
  const [loading, setLoading] = React.useState(true)
  const [apiErr,  setApiErr]  = React.useState<string | null>(null)

  React.useEffect(() => {
    if (!employee.id) return
    setLoading(true)
    fetch(`/api/notes?employee_id=${employee.id}`)
      .then((r) => r.json())
      .then((d) => setNotes(Array.isArray(d) ? d : []))
      .catch(() => setApiErr('Failed to load notes'))
      .finally(() => setLoading(false))
  }, [employee.id])

  const handleCreate = React.useCallback(async (input: { title: string; content: string; color: string }) => {
    setApiErr(null)
    try {
      const r = await fetch('/api/notes', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ employee_id: employee.id, title: input.title || null, content: input.content, color: input.color }),
      })
      if (!r.ok) throw new Error((await r.json().catch(() => ({}))).error ?? 'Failed to save')
      const created = await r.json()
      setNotes((prev) => [created, ...prev])
    } catch (err) {
      setApiErr(err instanceof Error ? err.message : 'Failed to save note')
    }
  }, [employee.id])

  const handleUpdate = React.useCallback(async (id: string, patch: { title: string | null; content: string; color: string }) => {
    // Optimistic update
    setNotes((prev) => prev.map((n) => n.id === id ? { ...n, ...patch, updated_at: new Date().toISOString() } : n))
    try {
      const r = await fetch(`/api/notes/${id}`, {
        method: 'PATCH', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ employee_id: employee.id, ...patch }),
      })
      if (!r.ok) throw new Error('Failed to update')
      const updated = await r.json()
      setNotes((prev) => prev.map((n) => n.id === id ? updated : n))
    } catch {
      // Revert on error
      const r2 = await fetch(`/api/notes?employee_id=${employee.id}`).catch(() => null)
      if (r2) { const d = await r2.json(); setNotes(Array.isArray(d) ? d : []) }
    }
  }, [employee.id])

  const handleDelete = React.useCallback(async (id: string) => {
    setNotes((prev) => prev.filter((n) => n.id !== id))
    try {
      const r = await fetch(`/api/notes/${id}`, {
        method: 'DELETE', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ employee_id: employee.id }),
      })
      if (!r.ok) {
        const r2 = await fetch(`/api/notes?employee_id=${employee.id}`)
        const d  = await r2.json()
        setNotes(Array.isArray(d) ? d : [])
      }
    } catch {
      const r2 = await fetch(`/api/notes?employee_id=${employee.id}`).catch(() => null)
      if (r2) { const d = await r2.json(); setNotes(Array.isArray(d) ? d : []) }
    }
  }, [employee.id])

  return (
    <>
      <EmployeeTopbar
        title="My Notes"
        breadcrumb={[{ label: 'Home' }, { label: 'Notes' }]}
        subtitle={notes.length > 0 ? `${notes.length} note${notes.length === 1 ? '' : 's'}` : undefined}
      />

      <main className="px-4 py-4 sm:px-6 sm:py-6">
        <NewNoteInput onSave={handleCreate} />

        {apiErr && (
          <div className="mx-auto mb-6 flex max-w-lg items-center justify-between gap-3 rounded-xl border border-coral/20 bg-coral/5 px-4 py-3 text-sm text-coral">
            <span>{apiErr}</span>
            <button type="button" onClick={() => setApiErr(null)}><X className="size-4" /></button>
          </div>
        )}

        {loading && (
          <div className="flex flex-col items-center justify-center gap-3 py-24 text-ink-soft">
            <Loader2 className="size-8 animate-spin" />
            <p className="text-sm">Loading notes…</p>
          </div>
        )}

        {!loading && notes.length === 0 && !apiErr && (
          <div className="flex flex-col items-center justify-center gap-3 py-24">
            <div className="grid size-16 place-items-center rounded-2xl bg-surface-2">
              <StickyNote className="size-8 text-ink-soft/40" />
            </div>
            <p className="text-sm font-medium text-ink">No notes yet</p>
            <p className="text-xs text-ink-soft">Click &quot;Take a note…&quot; above to write your first one</p>
          </div>
        )}

        {!loading && notes.length > 0 && (
          <div className="columns-1 gap-4 sm:columns-2 lg:columns-3 xl:columns-4">
            {notes.map((note) => (
              <NoteCard
                key={note.id}
                note={note}
                onDelete={handleDelete}
                onUpdate={handleUpdate}
              />
            ))}
          </div>
        )}
      </main>
    </>
  )
}
