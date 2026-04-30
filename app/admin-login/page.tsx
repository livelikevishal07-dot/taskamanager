import { redirect } from 'next/navigation'
import { ShieldCheck } from 'lucide-react'
import { isAdminAuthenticated } from '@/lib/auth-admin'
import { AdminLoginForm } from './login-form'

export const dynamic = 'force-dynamic'

export default function AdminLoginPage({
  searchParams,
}: {
  searchParams: { from?: string }
}) {
  // Already logged in → straight to CMS
  if (isAdminAuthenticated()) redirect('/cms')

  return (
    <div
      className="flex min-h-screen items-center justify-center px-4"
      style={{
        background: 'radial-gradient(ellipse 80% 60% at 50% -10%, #1e1b4b 0%, #0f172a 55%)',
      }}
    >
      {/* Card */}
      <div className="w-full max-w-sm">
        {/* Header */}
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 grid size-14 place-items-center rounded-2xl bg-indigo-600/20 ring-1 ring-indigo-500/30">
            <ShieldCheck className="size-7 text-indigo-400" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-white">Admin Portal</h1>
          <p className="mt-1.5 text-sm text-slate-400">
            Restricted access · Officely
          </p>
        </div>

        {/* Login card */}
        <div className="rounded-2xl border border-slate-700/60 bg-slate-900/80 p-8 shadow-2xl shadow-black/40 backdrop-blur-sm">
          <AdminLoginForm from={searchParams.from} />
        </div>

        {/* Security notice */}
        <p className="mt-6 text-center text-[11px] text-slate-600">
          Unauthorised access is strictly prohibited and may be subject to legal action.
        </p>
      </div>
    </div>
  )
}
