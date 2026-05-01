'use client'

import * as React from 'react'
import type { Payslip } from '@/lib/db/types'

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

function inWords(n: number): string {
  // Simple implementation for amounts up to 99,99,999
  const ones = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine',
    'Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen',
    'Seventeen', 'Eighteen', 'Nineteen']
  const tens = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety']

  function twoDigits(num: number): string {
    if (num < 20) return ones[num]
    return (tens[Math.floor(num / 10)] + (num % 10 !== 0 ? ' ' + ones[num % 10] : '')).trim()
  }

  function threeDigits(num: number): string {
    if (num === 0) return ''
    if (num < 100) return twoDigits(num)
    return ones[Math.floor(num / 100)] + ' Hundred' + (num % 100 !== 0 ? ' ' + twoDigits(num % 100) : '')
  }

  const amount = Math.round(n)
  if (amount === 0) return 'Zero'

  const crore = Math.floor(amount / 10000000)
  const lakh  = Math.floor((amount % 10000000) / 100000)
  const thou  = Math.floor((amount % 100000) / 1000)
  const rem   = amount % 1000

  const parts: string[] = []
  if (crore) parts.push(threeDigits(crore) + ' Crore')
  if (lakh)  parts.push(threeDigits(lakh)  + ' Lakh')
  if (thou)  parts.push(threeDigits(thou)  + ' Thousand')
  if (rem)   parts.push(threeDigits(rem))

  return parts.join(' ') + ' Only'
}

interface Props {
  payslip: Payslip
}

export function PayslipTemplate({ payslip }: Props) {
  const netPay = payslip.override_net_salary ?? payslip.net_salary

  const rows: { label: string; earning?: number; deduction?: number }[] = [
    { label: 'Basic Pay',          earning: payslip.base_pay },
    { label: 'Dearness Allowance', earning: payslip.da },
    { label: 'Travel Allowance',   earning: payslip.travel_allowance },
    { label: 'Absent Deduction',   deduction: payslip.deduction },
  ]

  if (payslip.override_net_salary != null) {
    const diff = payslip.override_net_salary - payslip.net_salary
    if (diff > 0)  rows.push({ label: 'Admin Adjustment', earning: diff })
    if (diff < 0)  rows.push({ label: 'Admin Adjustment', deduction: Math.abs(diff) })
  }

  const totalEarnings  = rows.reduce((s, r) => s + (r.earning  ?? 0), 0)
  const totalDeductions = rows.reduce((s, r) => s + (r.deduction ?? 0), 0)

  return (
    <div
      id="payslip-print"
      className="mx-auto w-full max-w-3xl bg-white p-8 text-sm text-gray-800 print:p-6"
    >
      {/* Header */}
      <div className="flex items-start justify-between border-b-2 border-violet-600 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <div className="flex size-10 items-center justify-center rounded-full bg-violet-600 text-white">
              <span className="text-base font-bold">W</span>
            </div>
            <div>
              <h1 className="text-xl font-bold text-violet-700">
                {payslip.company_name || 'Workly'}
              </h1>
              <p className="text-xs text-gray-500">Payslip</p>
            </div>
          </div>
        </div>
        <div className="text-right">
          <p className="text-base font-semibold text-gray-700">
            {MONTHS[payslip.month]} {payslip.year}
          </p>
          <p className="text-xs text-gray-400">Payslip #{payslip.id.slice(0, 8).toUpperCase()}</p>
        </div>
      </div>

      {/* Employee info */}
      <div className="my-4 grid grid-cols-2 gap-4 rounded-lg bg-gray-50 p-4">
        <div>
          <p className="text-xs text-gray-400">Employee Name</p>
          <p className="font-semibold">{payslip.employee?.full_name ?? '—'}</p>
        </div>
        <div>
          <p className="text-xs text-gray-400">Department</p>
          <p className="font-semibold">{payslip.employee?.department?.name ?? '—'}</p>
        </div>
        <div>
          <p className="text-xs text-gray-400">Pay Period</p>
          <p className="font-semibold">{MONTHS[payslip.month]} {payslip.year}</p>
        </div>
        <div>
          <p className="text-xs text-gray-400">Monthly CTC</p>
          <p className="font-semibold">₹ {fmt(payslip.monthly_salary)}</p>
        </div>
      </div>

      {/* Attendance summary */}
      <div className="mb-4 grid grid-cols-4 gap-2 text-center">
        {[
          { label: 'Working Days', value: payslip.total_working_days },
          { label: 'Days Present', value: payslip.present_days },
          { label: 'Paid Leave',   value: payslip.paid_leave_days },
          { label: 'Days Absent',  value: payslip.absent_days },
        ].map(({ label, value }) => (
          <div key={label} className="rounded-lg border border-gray-200 py-2">
            <p className="text-lg font-bold text-violet-700">{value}</p>
            <p className="text-[11px] text-gray-500">{label}</p>
          </div>
        ))}
      </div>

      {/* Earnings / Deductions table */}
      <table className="w-full border-collapse text-sm">
        <thead>
          <tr className="bg-violet-600 text-white">
            <th className="px-3 py-2 text-left font-semibold">Earnings</th>
            <th className="px-3 py-2 text-right font-semibold">Amount (₹)</th>
            <th className="px-3 py-2 text-left font-semibold">Deductions</th>
            <th className="px-3 py-2 text-right font-semibold">Amount (₹)</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => (
            <tr key={i} className={i % 2 === 0 ? 'bg-gray-50' : 'bg-white'}>
              <td className="px-3 py-2">{row.earning  != null ? row.label : ''}</td>
              <td className="px-3 py-2 text-right">{row.earning  != null ? fmt(row.earning)  : ''}</td>
              <td className="px-3 py-2">{row.deduction != null ? row.label : ''}</td>
              <td className="px-3 py-2 text-right">{row.deduction != null ? fmt(row.deduction) : ''}</td>
            </tr>
          ))}
          <tr className="border-t-2 border-violet-200 bg-violet-50 font-semibold">
            <td className="px-3 py-2">Total Earnings</td>
            <td className="px-3 py-2 text-right text-violet-700">₹ {fmt(totalEarnings)}</td>
            <td className="px-3 py-2">Total Deductions</td>
            <td className="px-3 py-2 text-right text-red-600">₹ {fmt(totalDeductions)}</td>
          </tr>
        </tbody>
      </table>

      {/* Net Pay */}
      <div className="mt-4 flex items-center justify-between rounded-lg bg-violet-600 px-5 py-3 text-white">
        <div>
          <p className="text-xs opacity-80">Net Pay</p>
          <p className="text-xl font-bold">₹ {fmt(netPay)}</p>
          <p className="mt-0.5 text-[11px] italic opacity-70">
            {inWords(Math.round(netPay))}
          </p>
        </div>
        <div className="text-right text-xs opacity-70">
          <p>Generated by Workly</p>
          <p>This is a computer-generated payslip</p>
        </div>
      </div>

      {/* Admin note */}
      {payslip.admin_note && (
        <div className="mt-3 rounded border border-amber-200 bg-amber-50 px-4 py-2 text-xs text-amber-800">
          <strong>Note:</strong> {payslip.admin_note}
        </div>
      )}

      {/* Footer */}
      <p className="mt-6 text-center text-[10px] text-gray-400">
        {payslip.company_name} · {MONTHS[payslip.month]} {payslip.year} ·
        Payslip ID: {payslip.id.slice(0, 8).toUpperCase()}
      </p>
    </div>
  )
}
