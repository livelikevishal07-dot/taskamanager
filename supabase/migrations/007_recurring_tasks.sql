-- Task templates (create if not yet applied)
CREATE TABLE IF NOT EXISTS task_templates (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title       text NOT NULL,
  description text,
  priority    text NOT NULL DEFAULT 'medium'
                CHECK (priority IN ('low','medium','high','urgent')),
  company_id  uuid REFERENCES companies(id) ON DELETE SET NULL,
  created_at  timestamptz NOT NULL DEFAULT now(),
  updated_at  timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS task_template_employees (
  template_id uuid NOT NULL REFERENCES task_templates(id) ON DELETE CASCADE,
  employee_id uuid NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
  PRIMARY KEY (template_id, employee_id)
);

-- Recurring tasks
CREATE TABLE IF NOT EXISTS recurring_tasks (
  id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title          text NOT NULL,
  description    text,
  priority       text NOT NULL DEFAULT 'medium'
                   CHECK (priority IN ('low','medium','high','urgent')),
  recurrence     text NOT NULL DEFAULT 'daily'
                   CHECK (recurrence IN ('daily','weekdays','weekly')),
  -- 0=Sun 1=Mon 2=Tue 3=Wed 4=Thu 5=Fri 6=Sat (JS convention); only used when recurrence='weekly'
  active_weekday int CHECK (active_weekday BETWEEN 0 AND 6),
  company_id     uuid REFERENCES companies(id) ON DELETE SET NULL,
  created_by     uuid REFERENCES employees(id) ON DELETE SET NULL,
  is_active      boolean NOT NULL DEFAULT true,
  created_at     timestamptz NOT NULL DEFAULT now(),
  updated_at     timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_recurring_tasks_company ON recurring_tasks(company_id);
CREATE INDEX IF NOT EXISTS idx_recurring_tasks_active  ON recurring_tasks(is_active);

CREATE OR REPLACE FUNCTION touch_recurring_task()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END;
$$;

DROP TRIGGER IF EXISTS recurring_tasks_touch ON recurring_tasks;
CREATE TRIGGER recurring_tasks_touch
  BEFORE UPDATE ON recurring_tasks
  FOR EACH ROW EXECUTE FUNCTION touch_recurring_task();

-- Assignments: which employees have a recurring task
CREATE TABLE IF NOT EXISTS recurring_task_assignments (
  recurring_task_id uuid NOT NULL REFERENCES recurring_tasks(id) ON DELETE CASCADE,
  employee_id       uuid NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
  PRIMARY KEY (recurring_task_id, employee_id)
);

CREATE INDEX IF NOT EXISTS idx_rta_employee ON recurring_task_assignments(employee_id);

-- Completions: one row per (task, employee, date) when employee marks it done
CREATE TABLE IF NOT EXISTS recurring_task_completions (
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  recurring_task_id uuid NOT NULL REFERENCES recurring_tasks(id) ON DELETE CASCADE,
  employee_id       uuid NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
  date              date NOT NULL,
  completed_at      timestamptz NOT NULL DEFAULT now(),
  UNIQUE (recurring_task_id, employee_id, date)
);

CREATE INDEX IF NOT EXISTS idx_rtc_employee_date ON recurring_task_completions(employee_id, date);
