import { redirect } from 'next/navigation'

import { getSessionEmployeeId } from '@/lib/auth'
import { LoginForm } from './login-form'

export const dynamic = 'force-dynamic'

export default function EmployeeLoginPage() {
  if (getSessionEmployeeId()) redirect('/employee/dashboard')

  return (
    <div className="employee-theme flex min-h-screen items-center justify-center bg-canvas px-4">
      <div className="w-full max-w-md rounded-2xl border border-border bg-surface p-8 shadow-sm">
        <div className="mb-6 text-center">
          <h1 className="text-2xl font-semibold text-ink">Employee sign in</h1>
          <p className="mt-1 text-sm text-ink-muted">
            Use the credentials provided by your admin.
          </p>
        </div>
        <LoginForm />
      </div>
    </div>
  )
}
