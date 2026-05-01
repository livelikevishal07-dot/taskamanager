-- Migration 014: Add emergency leave type + payslip columns

-- 1. Drop old type check constraint and re-add with 'emergency'
ALTER TABLE public.leave_requests DROP CONSTRAINT IF EXISTS leave_requests_type_check;
ALTER TABLE public.leave_requests ADD CONSTRAINT leave_requests_type_check
  CHECK (type IN ('casual', 'sick', 'annual', 'maternity', 'paternity', 'unpaid', 'other', 'emergency'));

-- 2. Add emergency leave tracking columns to payslips
ALTER TABLE public.payslips
  ADD COLUMN IF NOT EXISTS emergency_leave_days integer NOT NULL DEFAULT 0;

ALTER TABLE public.payslips
  ADD COLUMN IF NOT EXISTS emergency_deduction numeric(12,2) NOT NULL DEFAULT 0;
