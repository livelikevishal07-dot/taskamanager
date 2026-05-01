-- 013_payroll.sql
-- Payroll management: add salary/company to employees, create payslips table

-- ── Extend employees ──────────────────────────────────────────────────────────
ALTER TABLE public.employees
  ADD COLUMN IF NOT EXISTS monthly_salary  NUMERIC(12, 2),
  ADD COLUMN IF NOT EXISTS company_id      UUID REFERENCES public.companies(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS employees_company_id_idx ON public.employees (company_id);

-- ── Payslips ──────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.payslips (
  id                  UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id         UUID         NOT NULL REFERENCES public.employees(id) ON DELETE CASCADE,
  month               SMALLINT     NOT NULL CHECK (month BETWEEN 1 AND 12),
  year                SMALLINT     NOT NULL CHECK (year >= 2020),

  -- Snapshot of salary at generation time
  monthly_salary      NUMERIC(12, 2) NOT NULL,
  company_name        TEXT         NOT NULL DEFAULT '',

  -- Attendance summary (all non-Sunday days in the month)
  total_working_days  SMALLINT     NOT NULL DEFAULT 0,
  present_days        SMALLINT     NOT NULL DEFAULT 0,  -- present + late + half_day
  paid_leave_days     SMALLINT     NOT NULL DEFAULT 0,  -- approved leave
  absent_days         SMALLINT     NOT NULL DEFAULT 0,  -- absent (deducted)

  -- Computed salary components (based on full monthly salary)
  per_day_salary      NUMERIC(12, 2) NOT NULL DEFAULT 0,
  base_pay            NUMERIC(12, 2) NOT NULL DEFAULT 0,   -- 60 % of monthly_salary
  da                  NUMERIC(12, 2) NOT NULL DEFAULT 0,   -- 25 % of monthly_salary
  travel_allowance    NUMERIC(12, 2) NOT NULL DEFAULT 0,   -- 15 % of monthly_salary
  gross_salary        NUMERIC(12, 2) NOT NULL DEFAULT 0,   -- = monthly_salary
  deduction           NUMERIC(12, 2) NOT NULL DEFAULT 0,   -- absent_days * per_day_salary
  net_salary          NUMERIC(12, 2) NOT NULL DEFAULT 0,   -- gross - deduction

  -- Admin can override the final net or add a note
  override_net_salary NUMERIC(12, 2),
  admin_note          TEXT,

  status              TEXT         NOT NULL DEFAULT 'draft'
                        CHECK (status IN ('draft', 'published')),

  created_at          TIMESTAMPTZ  NOT NULL DEFAULT now(),
  updated_at          TIMESTAMPTZ  NOT NULL DEFAULT now(),

  UNIQUE (employee_id, month, year)
);

CREATE INDEX IF NOT EXISTS payslips_employee_id_idx  ON public.payslips (employee_id);
CREATE INDEX IF NOT EXISTS payslips_year_month_idx   ON public.payslips (year, month DESC);

-- Auto-update updated_at
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger
    WHERE tgname = 'set_payslips_updated_at'
  ) THEN
    CREATE TRIGGER set_payslips_updated_at
      BEFORE UPDATE ON public.payslips
      FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
  END IF;
END;
$$;
