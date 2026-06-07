import { z } from 'zod';

export const departmentSchema = z.object({
  id: z.string().uuid(),
  name: z.string(),
  code: z.string(),
  prefix: z.string().length(1),
  description: z.string().nullable(),
  icon: z.string().nullable(),
  color: z.string().nullable(),
  is_active: z.boolean(),
  display_order: z.number(),
  created_at: z.string(),
});

export const departmentListSchema = z.object({
  data: z.array(departmentSchema),
  count: z.number().nullable(),
});

export const counterSchema = z.object({
  id: z.string().uuid(),
  department_id: z.string().uuid(),
  counter_number: z.number(),
  label: z.string().nullable(),
  is_active: z.boolean(),
});

export const departmentScheduleSchema = z.object({
  id: z.string().uuid(),
  department_id: z.string().uuid(),
  day_of_week: z.number().min(0).max(6),
  open_time: z.string(),
  close_time: z.string(),
  is_open: z.boolean(),
});

export type Department = z.infer<typeof departmentSchema>;
export type Counter = z.infer<typeof counterSchema>;
export type DepartmentSchedule = z.infer<typeof departmentScheduleSchema>;
