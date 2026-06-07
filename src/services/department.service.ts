import { supabase } from '@/lib/supabase';
import { departmentSchema, counterSchema, departmentScheduleSchema, type Department, type Counter, type DepartmentSchedule } from '@/schemas/department.schema';
import { AppError } from '@/types/errors';

export const departmentService = {
  async getAllDepartments(): Promise<Department[]> {
    const { data, error } = await (supabase
      .from('departments')
      .select() as any)
      .eq('is_active', true)
      .order('display_order', { ascending: true });

    if (error) throw new AppError(error.message, 'DEPARTMENT_FETCH_ERROR');
    return (data ?? []).map((d: any) => departmentSchema.parse(d));
  },

  async getCounters(departmentId: string): Promise<Counter[]> {
    const { data, error } = await (supabase
      .from('counters')
      .select() as any)
      .eq('department_id', departmentId)
      .eq('is_active', true)
      .order('counter_number', { ascending: true });

    if (error) throw new AppError(error.message, 'COUNTER_FETCH_ERROR');
    return (data ?? []).map((c: any) => counterSchema.parse(c));
  },

  async getSchedule(departmentId: string): Promise<DepartmentSchedule[]> {
    const { data, error } = await (supabase
      .from('department_schedules')
      .select() as any)
      .eq('department_id', departmentId)
      .order('day_of_week', { ascending: true });

    if (error) throw new AppError(error.message, 'SCHEDULE_FETCH_ERROR');
    return (data ?? []).map((s: any) => departmentScheduleSchema.parse(s));
  },

  async getDepartmentStatus(departmentId: string) {
    const today = new Date().toISOString().split('T')[0];

    const [waitingCount, servingTicket] = await Promise.all([
      supabase
        .from('queue_tickets')
        .select(undefined, { count: 'exact', head: true })
        .eq('department_id', departmentId)
        .eq('date', today)
        .eq('status', 'waiting'),
      supabase
        .from('queue_tickets')
        .select('ticket_number')
        .eq('department_id', departmentId)
        .eq('date', today)
        .eq('status', 'serving')
        .order('called_at', { ascending: false })
        .limit(1),
    ]);

    return {
      waitingCount: waitingCount.count ?? 0,
      nowServing: servingTicket.data?.[0]?.ticket_number ?? null,
    };
  },
};
