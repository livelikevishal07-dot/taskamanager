import { z } from 'zod'

const dateString = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, 'Use YYYY-MM-DD')
  .nullable()
  .optional()

const timeString = z
  .string()
  .regex(/^\d{2}:\d{2}(:\d{2})?$/, 'Use HH:MM or HH:MM:SS')
  .nullable()
  .optional()

const optionalString = (max: number) =>
  z
    .string()
    .trim()
    .max(max)
    .nullable()
    .optional()
    .transform((v) => (v === '' ? null : v))

export const employeeStatusSchema = z.enum([
  'active',
  'on_leave',
  'inactive',
  'terminated',
])

export const workingDaysSchema = z
  .array(z.number().int().min(1).max(7))
  .max(7)
  .default([1, 2, 3, 4, 5])

export const usernameSchema = z
  .string()
  .trim()
  .min(3, 'Username must be at least 3 characters')
  .max(50)
  .regex(/^[a-zA-Z0-9._-]+$/, 'Use letters, numbers, dot, underscore or dash')

export const passwordSchema = z
  .string()
  .min(4, 'Password must be at least 4 characters')
  .max(100)

export const createEmployeeSchema = z.object({
  full_name: z.string().trim().min(1, 'Name is required').max(255),
  email: z
    .string()
    .trim()
    .email('Invalid email')
    .nullable()
    .optional()
    .transform((v) => (v === '' ? null : v)),
  phone: optionalString(50),
  address: optionalString(500),
  birthday: dateString,
  joining_date: dateString,
  role_id: z.string().uuid().nullable().optional(),
  department_id: z.string().uuid().nullable().optional(),
  company_id: z.string().uuid().nullable().optional(),
  working_hours_start: timeString,
  working_hours_end: timeString,
  working_days: workingDaysSchema,
  status: employeeStatusSchema.default('active'),
  performance: z.number().int().min(0).max(100).default(0),
  avatar_url: z.string().url().nullable().optional(),
  monthly_salary: z
    .number()
    .nonnegative()
    .nullable()
    .optional()
    .or(z.string().transform((v) => (v === '' ? null : parseFloat(v)))),
  username: usernameSchema
    .nullable()
    .optional()
    .transform((v) => (v === '' || v == null ? null : v.toLowerCase())),
  password: passwordSchema.optional().or(z.literal('').transform(() => undefined)),
})

export const updateEmployeeSchema = createEmployeeSchema.partial()

export const employeeLoginSchema = z.object({
  username: z.string().trim().min(1, 'Username required').max(100),
  password: z.string().min(1, 'Password required').max(100),
})

export type EmployeeLoginInput = z.infer<typeof employeeLoginSchema>

export type CreateEmployeeInput = z.infer<typeof createEmployeeSchema>
export type UpdateEmployeeInput = z.infer<typeof updateEmployeeSchema>
