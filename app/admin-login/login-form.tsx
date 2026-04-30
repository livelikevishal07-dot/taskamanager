'use client'

import * as React from 'react'
import { useRouter } from 'next/navigation'
import { Eye, EyeOff, Loader2, Lock, ShieldCheck } from 'lucide-react'
import { cn } from '@/lib/utils'

export function AdminLoginForm({ from }: { from?: string }) {
  const router = useRouter()
  const [username,   setUsername]   = React.useState('')
  const [password,   setPassword]   = React.useState('')
  const [showPass,   setShowPass]   = React.useState(false)
  const [submitting, setSubmitting] = React.useState(false)
  const [error,      setError]      = React.useState<string | null>(null)
  const [attempts,   setAttempts]   = React.useState(0)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!username.trim() || !password) return
    setSubmitting(true)
    setError(null)

    try {
      const res = await fetch('/api/admin-auth/login', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ username: username.trim(), password }),
      })

      const json = await res.json().catch(() => ({}))

      if (!res.ok) {
        setAttempts((n) => n + 1)
        setError(json?.error ?? 'Invalid credentials')
        setPassword('')
        return
      }

      // Successful login — navigate to the originally requested CMS page or dashboard
      router.replace(from && from.startsWith('/cms') ? from : '/cms')
      router.refresh()
    } catch {
      setError('Network error — please try again')
    } finally {
      setSubmitting(false)
    }
  }

  const locked = attempts >= 5

  return (
    <form onSubmit={handleSubmit} noValidate className="space-y-5">
      {/* Error banner */}
      {error && (
        <div className="flex items-start gap-2.5 rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-3">
          <ShieldCheck className="mt-0.5 size-4 shrink-0 text-red-400" />
          <p className="text-sm text-red-400">{error}</p>
        </div>
      )}

      {/* Username */}
      <div className="space-y-1.5">
        <label htmlFor="admin-username" className="block text-xs font-semibold uppercase tracking-wider text-slate-400">
          Username
        </label>
        <input
          id="admin-username"
          autoFocus
          autoComplete="username"
          spellCheck={false}
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          disabled={submitting || locked}
          className={cn(
            'h-11 w-full rounded-xl border bg-slate-800/60 px-4 text-sm text-slate-100 placeholder:text-slate-600',
            'transition-colors focus:outline-none focus:ring-2 focus:ring-offset-0',
            'border-slate-700 focus:border-indigo-500 focus:ring-indigo-500/20',
            (submitting || locked) && 'cursor-not-allowed opacity-50',
          )}
          placeholder="admin"
        />
      </div>

      {/* Password */}
      <div className="space-y-1.5">
        <label htmlFor="admin-password" className="block text-xs font-semibold uppercase tracking-wider text-slate-400">
          Password
        </label>
        <div className="relative">
          <input
            id="admin-password"
            type={showPass ? 'text' : 'password'}
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            disabled={submitting || locked}
            className={cn(
              'h-11 w-full rounded-xl border bg-slate-800/60 py-0 pl-4 pr-11 text-sm text-slate-100',
              'transition-colors focus:outline-none focus:ring-2 focus:ring-offset-0',
              'border-slate-700 focus:border-indigo-500 focus:ring-indigo-500/20',
              (submitting || locked) && 'cursor-not-allowed opacity-50',
            )}
            placeholder="••••••••"
          />
          <button
            type="button"
            tabIndex={-1}
            onClick={() => setShowPass((v) => !v)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300"
            aria-label={showPass ? 'Hide password' : 'Show password'}
          >
            {showPass ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
          </button>
        </div>
      </div>

      {/* Submit */}
      <button
        type="submit"
        disabled={submitting || locked || !username.trim() || !password}
        className={cn(
          'inline-flex h-11 w-full items-center justify-center gap-2 rounded-xl text-sm font-semibold transition-all',
          'bg-indigo-600 text-white shadow-md shadow-indigo-900/40 hover:bg-indigo-500',
          'disabled:cursor-not-allowed disabled:opacity-50',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-900',
        )}
      >
        {submitting ? (
          <><Loader2 className="size-4 animate-spin" /> Verifying…</>
        ) : locked ? (
          <><Lock className="size-4" /> Too many attempts</>
        ) : (
          'Sign in to Admin'
        )}
      </button>

      {/* Attempt warning */}
      {attempts > 0 && attempts < 5 && (
        <p className="text-center text-xs text-amber-500/80">
          {5 - attempts} attempt{5 - attempts !== 1 ? 's' : ''} remaining before lockout
        </p>
      )}
    </form>
  )
}
