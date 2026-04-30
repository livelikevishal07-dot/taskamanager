-- ── Company Holidays ──────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.company_holidays (
  id         uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  name       text        NOT NULL,
  date       date        NOT NULL,
  type       text        NOT NULL DEFAULT 'public'
               CHECK (type IN ('public','company','optional')),
  recurring  boolean     NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'company_holidays_updated_at') THEN
    CREATE TRIGGER company_holidays_updated_at
      BEFORE UPDATE ON public.company_holidays
      FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
  END IF;
END $$;

ALTER TABLE public.company_holidays DISABLE ROW LEVEL SECURITY;

-- ── Leave Policy ──────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.leave_policy (
  id              uuid         PRIMARY KEY DEFAULT gen_random_uuid(),
  leave_type      text         NOT NULL UNIQUE
                    CHECK (leave_type IN ('casual','sick','annual','maternity','paternity','unpaid','other')),
  accrual_type    text         NOT NULL DEFAULT 'fixed'
                    CHECK (accrual_type IN ('fixed','monthly')),
  days_per_period numeric(5,1) NOT NULL DEFAULT 0,
  max_carryover   integer      NOT NULL DEFAULT 0,
  created_at      timestamptz  NOT NULL DEFAULT now(),
  updated_at      timestamptz  NOT NULL DEFAULT now()
);

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'leave_policy_updated_at') THEN
    CREATE TRIGGER leave_policy_updated_at
      BEFORE UPDATE ON public.leave_policy
      FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
  END IF;
END $$;

ALTER TABLE public.leave_policy DISABLE ROW LEVEL SECURITY;

INSERT INTO public.leave_policy (leave_type, accrual_type, days_per_period) VALUES
  ('sick','monthly',1),('casual','fixed',12),('annual','fixed',15),
  ('maternity','fixed',90),('paternity','fixed',14),('unpaid','fixed',0),('other','fixed',5)
ON CONFLICT (leave_type) DO NOTHING;

INSERT INTO public.company_holidays (name, date, type, recurring) VALUES
  ('New Year''s Day','2026-01-01','public',true),
  ('Republic Day','2026-01-26','public',true),
  ('Holi','2026-03-05','public',false),
  ('Good Friday','2026-04-03','public',false),
  ('Independence Day','2026-08-15','public',true),
  ('Gandhi Jayanti','2026-10-02','public',true),
  ('Durga Puja (Saptami)','2026-10-15','company',false),
  ('Durga Puja (Ashtami)','2026-10-16','company',false),
  ('Durga Puja (Navami)','2026-10-17','company',false),
  ('Durga Puja (Dashami)','2026-10-18','company',false),
  ('Diwali (Dhanteras)','2026-11-07','company',false),
  ('Diwali','2026-11-08','public',false),
  ('Christmas Day','2026-12-25','public',true),
  ('New Year''s Eve','2026-12-31','company',false)
ON CONFLICT DO NOTHING;
