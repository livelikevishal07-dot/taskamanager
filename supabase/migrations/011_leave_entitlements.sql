-- Leave entitlements: how many days each employee is allocated per leave type per year
CREATE TABLE IF NOT EXISTS public.leave_entitlements (
  id           uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id  uuid        NOT NULL REFERENCES public.employees(id) ON DELETE CASCADE,
  leave_type   text        NOT NULL CHECK (leave_type IN ('casual','sick','annual','maternity','paternity','unpaid','other')),
  total_days   integer     NOT NULL DEFAULT 0 CHECK (total_days >= 0),
  year         integer     NOT NULL DEFAULT EXTRACT(YEAR FROM CURRENT_DATE)::integer,
  created_at   timestamptz NOT NULL DEFAULT now(),
  updated_at   timestamptz NOT NULL DEFAULT now(),
  UNIQUE(employee_id, leave_type, year)
);

-- Auto-update updated_at
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END;
$$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger
    WHERE tgname = 'leave_entitlements_updated_at'
  ) THEN
    CREATE TRIGGER leave_entitlements_updated_at
      BEFORE UPDATE ON public.leave_entitlements
      FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
  END IF;
END $$;

ALTER TABLE public.leave_entitlements DISABLE ROW LEVEL SECURITY;
