'use client'

import * as React from 'react'
import { Download, FileText, Loader2, X } from 'lucide-react'
import { useEmployee } from '@/app/employee/context'
import { EmployeeTopbar } from '@/components/employee-dashboard/topbar'
import type { Payslip } from '@/lib/db/types'
import { PayslipTemplate } from './payslip-template'

const MONTHS = [
  '', 'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
]

function fmt(n: number): string {
  return new Intl.NumberFormat('en-IN', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(n)
}

export function EmployeePayslipsSection() {
  const employee = useEmployee()
  const [payslips, setPayslips] = React.useState<Payslip[]>([])
  const [loading,  setLoading]  = React.useState(true)
  const [selected, setSelected] = React.useState<Payslip | null>(null)

  React.useEffect(() => {
    if (!employee.id) return
    setLoading(true)
    fetch(`/api/payroll?employee_id=${employee.id}&status=published`)
      .then((r) => r.json())
      .then((data) => setPayslips(Array.isArray(data) ? data : []))
      .catch(() => setPayslips([]))
      .finally(() => setLoading(false))
  }, [employee.id])

  return (
    <>
      <EmployeeTopbar
        title="My Payslips"
        breadcrumb={[{ label: 'Home' }, { label: 'Payslips' }]}
        subtitle="View and download your monthly salary statements"
      />

      <main className="space-y-5 px-4 py-4 sm:px-6 sm:py-6">
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="size-6 animate-spin text-brand" />
          </div>
        ) : payslips.length === 0 ? (
          <div className="flex flex-col items-center gap-3 rounded-2xl border border-border bg-surface py-20 text-center">
            <FileText className="size-10 text-ink-muted opacity-40" />
            <p className="font-medium text-ink-muted">No payslips yet</p>
            <p className="text-sm text-ink-soft">
              Your payslips will appear here once your admin publishes them.
            </p>
          </div>
        ) : (
          <div className="overflow-hidden rounded-2xl border border-border bg-surface shadow-sm">
            {payslips.map((slip, i) => {
              const netPay = slip.override_net_salary ?? slip.net_salary
              return (
                <div
                  key={slip.id}
                  className={`flex items-center justify-between gap-4 px-5 py-4 ${
                    i < payslips.length - 1 ? 'border-b border-border' : ''
                  }`}
                >
                  <div>
                    <p className="font-semibold">
                      {MONTHS[slip.month]} {slip.year}
                    </p>
                    <p className="text-xs text-ink-soft">
                      {slip.present_days}d present · {slip.paid_leave_days}d leave · {slip.absent_days}d absent
                    </p>
                  </div>

                  <div className="text-right">
                    <p className="text-base font-bold text-emerald-600">
                      ₹{fmt(netPay)}
                    </p>
                    <p className="text-[11px] text-ink-soft">Net Pay</p>
                  </div>

                  <button
                    type="button"
                    onClick={() => setSelected(slip)}
                    className="inline-flex h-9 shrink-0 items-center gap-2 rounded-xl border border-border bg-surface px-3 text-sm font-medium text-ink-muted hover:bg-surface-2 hover:text-ink"
                  >
                    <Download className="size-4" />
                    View
                  </button>
                </div>
              )
            })}
          </div>
        )}
      </main>

      {/* Print modal */}
      {selected && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 print:p-0">
          <div
            className="absolute inset-0 bg-black/50 backdrop-blur-sm print:hidden"
            onClick={() => setSelected(null)}
          />
          <div className="relative flex h-full max-h-[90vh] w-full max-w-3xl flex-col overflow-hidden rounded-2xl border border-border bg-white shadow-xl print:max-h-none print:max-w-none print:rounded-none print:border-0 print:shadow-none">
            {/* Toolbar */}
            <div className="flex items-center justify-between border-b border-gray-200 bg-gray-50 px-5 py-3 print:hidden">
              <p className="text-sm font-medium text-gray-700">
                {MONTHS[selected.month]} {selected.year} Payslip
              </p>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => window.print()}
                  className="inline-flex h-9 items-center gap-2 rounded-lg bg-violet-600 px-4 text-sm font-medium text-white hover:bg-violet-700"
                >
                  <Download className="size-4" />
                  Download PDF
                </button>
                <button
                  type="button"
                  onClick={() => setSelected(null)}
                  className="grid size-9 place-items-center rounded-lg border border-gray-200 text-gray-500 hover:bg-gray-100"
                >
                  <X className="size-4" />
                </button>
              </div>
            </div>
            {/* Payslip content */}
            <div className="flex-1 overflow-y-auto bg-gray-100 p-4 print:overflow-visible print:bg-white print:p-0">
              <PayslipTemplate payslip={selected} />
            </div>
          </div>
        </div>
      )}
    </>
  )
}
